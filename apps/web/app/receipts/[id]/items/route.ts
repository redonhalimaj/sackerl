import { ApiRequestError } from '@sackerl/api-client';
import { getRequestAuthContext, jsonResponse } from '../../../../lib/api-auth';
import { getRequestHousehold } from '../../../../lib/items';
import { readSaveReceiptReviewBody } from '../../../../lib/receipt-review-payload';
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
    const review = await getWebReceiptsClient().getReceiptReview(authContext, {
      householdId: household.id,
      receiptId: id,
    });

    return jsonResponse({ items: review.items, review });
  } catch (error) {
    return receiptApiErrorResponse(error);
  }
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new ApiRequestError('Invalid JSON body.', 400);
  }
}

export async function PUT(request: Request, context: ReceiptItemsRouteContext): Promise<Response> {
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
    const body = readSaveReceiptReviewBody(await readJson(request));
    const review = await getWebReceiptsClient().saveReceiptReview(authContext, {
      ...body,
      householdId: household.id,
      receiptId: id,
    });

    return jsonResponse({ review });
  } catch (error) {
    return receiptApiErrorResponse(error);
  }
}
