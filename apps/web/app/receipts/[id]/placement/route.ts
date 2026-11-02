import { ApiRequestError, normalizePlacementUuid } from '@sackerl/api-client';

import { jsonResponse } from '../../../../lib/api-auth';
import {
  getPlacementRequestContext,
  receiptPlacementApiErrorResponse,
  withNoStore,
} from '../../../../lib/receipt-placement';
import {
  readReceiptPlacementCommandBody,
  readReceiptPlacementStatusQuery,
} from '../../../../lib/receipt-placement-payload';
import { getWebReceiptsClient } from '../../../../lib/receipts';

type PlacementRouteContext = {
  readonly params: Promise<{ readonly id: string }>;
};

export async function POST(request: Request, context: PlacementRouteContext): Promise<Response> {
  const requestContext = await getPlacementRequestContext(request);
  if (requestContext instanceof Response) {
    return requestContext;
  }

  try {
    const { id } = await context.params;
    const receiptId = normalizePlacementUuid(id, 'receiptId');
    const body = readReceiptPlacementCommandBody(await readJsonBody(request));
    const result = await getWebReceiptsClient().finalizeReceiptPlacement(requestContext.auth, {
      ...body,
      householdId: requestContext.household.id,
      receiptId,
    });
    return withNoStore(jsonResponse(result));
  } catch (error) {
    return withNoStore(receiptPlacementApiErrorResponse(error, true));
  }
}

export async function GET(request: Request, context: PlacementRouteContext): Promise<Response> {
  const requestContext = await getPlacementRequestContext(request);
  if (requestContext instanceof Response) {
    return requestContext;
  }

  try {
    const { id } = await context.params;
    const receiptId = normalizePlacementUuid(id, 'receiptId');
    const idempotencyKey = readReceiptPlacementStatusQuery(new URL(request.url));
    const result = await getWebReceiptsClient().getReceiptPlacement(requestContext.auth, {
      householdId: requestContext.household.id,
      ...(idempotencyKey ? { idempotencyKey } : {}),
      receiptId,
    });
    return withNoStore(jsonResponse(result));
  } catch (error) {
    return withNoStore(receiptPlacementApiErrorResponse(error));
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) {
    throw new ApiRequestError('JSON object body is required.', 400);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError('Invalid JSON body.', 400);
  }
}
