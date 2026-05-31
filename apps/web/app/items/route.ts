import { ApiRequestError, type ItemCategoryId } from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from '../../lib/api-auth';
import { readCreateItemBody } from '../../lib/item-payload';
import { getRequestHousehold, getWebItemsClient, itemApiErrorResponse } from '../../lib/items';

export async function GET(request: Request): Promise<Response> {
  const context = await getRequestAuthContext(request);

  if (context instanceof Response) {
    return context;
  }

  const household = await getRequestHousehold(context);

  if (household instanceof Response) {
    return household;
  }

  const searchParams = new URL(request.url).searchParams;

  try {
    const category = searchParams.get('category') || undefined;
    const expiresWithinDays = readOptionalIntegerParam(searchParams, 'expires_within');
    const page = readOptionalIntegerParam(searchParams, 'page');
    const pageSize = readOptionalIntegerParam(searchParams, 'page_size');
    const zone = searchParams.get('zone') || undefined;
    const result = await getWebItemsClient().listItems(context, {
      householdId: household.id,
      ...(category ? { categoryId: category as ItemCategoryId } : {}),
      ...(expiresWithinDays !== undefined ? { expiresWithinDays } : {}),
      ...(searchParams.get('include_removed') === 'true' ? { includeRemoved: true } : {}),
      ...(page !== undefined ? { page } : {}),
      ...(pageSize !== undefined ? { pageSize } : {}),
      ...(zone ? { zone } : {}),
    });

    return jsonResponse(result);
  } catch (error) {
    return itemApiErrorResponse(error);
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
    const body = readCreateItemBody(await request.json());
    const item = await getWebItemsClient().createItem(context, {
      ...body,
      householdId: household.id,
    });

    return jsonResponse({ item }, 201);
  } catch (error) {
    return itemApiErrorResponse(error);
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
