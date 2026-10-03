import { ApiRequestError } from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from '../../lib/api-auth';
import { getRequestHousehold } from '../../lib/items';
import { readCreateShoppingListItemBody } from '../../lib/shopping-list-payload';
import { getWebShoppingListClient, shoppingListApiErrorResponse } from '../../lib/shopping-list';

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
    const result = await getWebShoppingListClient().listItems(context, {
      householdId: household.id,
      ...(searchParams.get('include_archived') === 'true' ? { includeArchived: true } : {}),
      ...(page !== undefined ? { page } : {}),
      ...(pageSize !== undefined ? { pageSize } : {}),
    });

    return jsonResponse(result);
  } catch (error) {
    return shoppingListApiErrorResponse(error);
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
    const body = readCreateShoppingListItemBody(await request.json());
    const item = await getWebShoppingListClient().createItem(context, {
      ...body,
      householdId: household.id,
    });

    return jsonResponse({ item }, 201);
  } catch (error) {
    return shoppingListApiErrorResponse(error);
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
