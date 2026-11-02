import { jsonResponse } from '../../../lib/api-auth';
import {
  getPlacementRequestContext,
  receiptPlacementApiErrorResponse,
  withNoStore,
} from '../../../lib/receipt-placement';
import { readReceiptPlacementPageParams } from '../../../lib/receipt-placement-payload';
import { getWebReceiptsClient } from '../../../lib/receipts';

export async function GET(request: Request): Promise<Response> {
  const requestContext = await getPlacementRequestContext(request);
  if (requestContext instanceof Response) {
    return requestContext;
  }

  try {
    const { page, pageSize } = readReceiptPlacementPageParams(new URL(request.url));
    const result = await getWebReceiptsClient().listUnplacedReceiptReviews(requestContext.auth, {
      householdId: requestContext.household.id,
      page,
      pageSize,
    });
    return withNoStore(jsonResponse(result));
  } catch (error) {
    return withNoStore(receiptPlacementApiErrorResponse(error));
  }
}
