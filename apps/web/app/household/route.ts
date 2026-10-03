import { ApiRequestError } from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from '../../lib/api-auth';
import { getWebProfileClient } from '../../lib/profile';

export async function GET(request: Request): Promise<Response> {
  const context = await getRequestAuthContext(request);

  if (context instanceof Response) {
    return context;
  }

  const household = await getWebProfileClient().getHousehold(context);

  return household
    ? jsonResponse({ household })
    : jsonResponse({ error: 'Household not found.' }, 404);
}

export async function PATCH(request: Request): Promise<Response> {
  const context = await getRequestAuthContext(request);

  if (context instanceof Response) {
    return context;
  }

  const body = (await request.json()) as { readonly name?: unknown };

  if (typeof body.name !== 'string') {
    return jsonResponse({ error: 'Household name is required.' }, 400);
  }

  try {
    const existingHousehold = await getWebProfileClient().getHousehold(context);
    const household = existingHousehold
      ? await getWebProfileClient().updateHousehold(context, { name: body.name })
      : await getWebProfileClient().ensureHousehold(context, { name: body.name });

    return jsonResponse({ household });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    throw error;
  }
}
