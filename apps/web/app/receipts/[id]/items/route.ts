import { getRequestAuthContext, jsonResponse } from '../../../../lib/api-auth';
import { getRequestHousehold } from '../../../../lib/items';
import { getWebReceiptsClient, receiptApiErrorResponse } from '../../../../lib/receipts';

type ReceiptItemsRouteContext = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export async function GET(request: Request, context: ReceiptItemsRouteContext): Promise<Response> {
  const authContext = await getRequestAuthContext(request);

  if (authContext instanceof Response) {
    return authContext;
  }

  const household = await getRequestHousehold(authContext);

  if (household instanceof Response) {
    return household;
  }

  try {
    const { id } = await context.params;
    const items = await getWebReceiptsClient().listReceiptItems(authContext, {
      householdId: household.id,
      receiptId: id,
    });

    return jsonResponse({ items });
  } catch (error) {
    return receiptApiErrorResponse(error);
  }
}
