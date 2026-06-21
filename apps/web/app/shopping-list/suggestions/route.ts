import { ApiRequestError } from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from '../../../lib/api-auth';
import { getRequestHousehold } from '../../../lib/items';
import { getWebShoppingListClient, shoppingListApiErrorResponse } from '../../../lib/shopping-list';

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
    const limit = readOptionalIntegerParam(new URL(request.url).searchParams, 'limit');
    const suggestions = await getWebShoppingListClient().listSuggestions(context, {
      householdId: household.id,
      ...(limit !== undefined ? { limit } : {}),
    });

    return jsonResponse({ suggestions });
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
