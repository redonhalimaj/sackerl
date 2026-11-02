import { ApiRequestError } from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from '../../lib/api-auth';
import { getWebProfileClient } from '../../lib/profile';
import { readJsonBody } from '../../lib/request-json';

export async function GET(request: Request): Promise<Response> {
  const context = await getRequestAuthContext(request);

  if (context instanceof Response) {
    return context;
  }

  const profile = await getWebProfileClient().ensureMe(context, {
    deviceLocale: request.headers.get('accept-language'),
  });

  return jsonResponse({ profile });
}

export async function PATCH(request: Request): Promise<Response> {
  const context = await getRequestAuthContext(request);

  if (context instanceof Response) {
    return context;
  }

  let body: { readonly locale?: unknown };

  try {
    const parsed = await readJsonBody(request);
    body = typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    throw error;
  }

  if (typeof body.locale !== 'string') {
    return jsonResponse({ error: 'Locale is required.' }, 400);
  }

  try {
    const profile = await getWebProfileClient().updateMe(context, { locale: body.locale });

    return jsonResponse({ profile });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    throw error;
  }
}
