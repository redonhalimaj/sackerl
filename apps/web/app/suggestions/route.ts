import { ApiRequestError } from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from '../../lib/api-auth';
import { getRequestHousehold } from '../../lib/items';
import { getWebRecipesClient, recipeApiErrorResponse } from '../../lib/recipes';

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
    const limit = readOptionalIntegerParam(searchParams, 'limit');
    const minScore = readOptionalNumberParam(searchParams, 'min_score');
    const result = await getWebRecipesClient().listSuggestions(context, {
      householdId: household.id,
      ...(limit !== undefined ? { limit } : {}),
      ...(minScore !== undefined ? { minScore } : {}),
    });

    return jsonResponse(result);
  } catch (error) {
    return recipeApiErrorResponse(error);
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

function readOptionalNumberParam(params: URLSearchParams, key: string): number | undefined {
  const value = params.get(key);

  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new ApiRequestError(`${key} must be a number.`, 400);
  }

  return parsed;
}
