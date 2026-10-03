import {
  ApiRequestError,
  createSackerlItemsClient,
  type AuthenticatedUserContext,
  type Household,
  type SackerlItemsClient,
} from '@sackerl/api-client';

import { jsonResponse } from './api-auth';
import { webSupabaseAuthConfig } from './auth';
import { getWebProfileClient } from './profile';

let webItemsClient: SackerlItemsClient | undefined;

export function getWebItemsClient(): SackerlItemsClient {
  webItemsClient ??= createSackerlItemsClient(webSupabaseAuthConfig);

  return webItemsClient;
}

export async function getRequestHousehold(
  context: AuthenticatedUserContext,
): Promise<Household | Response> {
  const household = await getWebProfileClient().getHousehold(context);

  return household ?? jsonResponse({ error: 'Household not found.' }, 404);
}

export function itemApiErrorResponse(error: unknown): Response {
  if (error instanceof ApiRequestError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  throw error;
}
