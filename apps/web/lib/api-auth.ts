import { assertSupabaseAuthConfig, type AuthenticatedUserContext } from '@sackerl/api-client';

import { webSupabaseAuthConfig } from './auth';

type SupabaseUserResponse = {
  readonly email?: unknown;
  readonly id?: unknown;
};

export function jsonResponse(data: object, status = 200): Response {
  return Response.json(data, { status });
}

export async function getRequestAuthContext(
  request: Request,
): Promise<AuthenticatedUserContext | Response> {
  const accessToken = resolveBearerToken(request.headers.get('authorization'));

  if (!accessToken) {
    return jsonResponse({ error: 'Missing bearer token.' }, 401);
  }

  const config = assertSupabaseAuthConfig(webSupabaseAuthConfig);
  const response = await fetch(`${config.url.replace(/\/+$/, '')}/auth/v1/user`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return jsonResponse({ error: 'Invalid bearer token.' }, 401);
  }

  const user = (await response.json()) as SupabaseUserResponse;

  if (typeof user.id !== 'string') {
    return jsonResponse({ error: 'Invalid auth user.' }, 401);
  }

  return {
    accessToken,
    user: {
      ...(typeof user.email === 'string' ? { email: user.email } : {}),
      id: user.id,
    },
  };
}

function resolveBearerToken(value: string | null): string | undefined {
  const match = value?.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || undefined;
}
