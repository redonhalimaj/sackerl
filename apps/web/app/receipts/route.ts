import { ApiRequestError, type ReceiptStatus } from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from '../../lib/api-auth';
import { getRequestHousehold } from '../../lib/items';
import { readCreateReceiptBody } from '../../lib/receipt-payload';
import { getWebReceiptsClient, receiptApiErrorResponse } from '../../lib/receipts';

export async function GET(request: Request): Promise<Response> {
  const context = await getRequestAuthContext(request);

  if (context instanceof Response) {
    return context;
  }

  const household = await getRequestHousehold(context);

  if (household instanceof Response) {
    return household;
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const page = readOptionalIntegerParam(searchParams, 'page');
    const pageSize = readOptionalIntegerParam(searchParams, 'page_size');
    const status = searchParams.get('status') || undefined;
    const result = await getWebReceiptsClient().listReceipts(context, {
      householdId: household.id,
      ...(page !== undefined ? { page } : {}),
      ...(pageSize !== undefined ? { pageSize } : {}),
      ...(status !== undefined ? { status: status as ReceiptStatus } : {}),
    });

    return jsonResponse(result);
  } catch (error) {
    return receiptApiErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const context = await getRequestAuthContext(request);

  if (context instanceof Response) {
    return context;
  }

  const household = await getRequestHousehold(context);

  if (household instanceof Response) {
    return household;
  }

  try {
    const body = readCreateReceiptBody(await request.json());
    const receipt = await getWebReceiptsClient().createReceipt(context, {
      ...body,
      householdId: household.id,
    });

    return jsonResponse({ receipt }, 201);
  } catch (error) {
    return receiptApiErrorResponse(error);
  }
}

function readOptionalIntegerParam(params: URLSearchParams, key: string): number | undefined {
  const value = params.get(key);

  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new ApiRequestError(`${key} must be an integer.`, 400);
  }

  return parsed;
}
