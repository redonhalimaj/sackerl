import {
  ApiRequestError,
  createSackerlShoppingListClient,
  type SackerlShoppingListClient,
} from '@sackerl/api-client';

import { jsonResponse } from './api-auth';
import { webSupabaseAuthConfig } from './auth';

let webShoppingListClient: SackerlShoppingListClient | undefined;

export function getWebShoppingListClient(): SackerlShoppingListClient {
  webShoppingListClient ??= createSackerlShoppingListClient(webSupabaseAuthConfig);

  return webShoppingListClient;
}

export function shoppingListApiErrorResponse(error: unknown): Response {
  if (error instanceof ApiRequestError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  throw error;
}
