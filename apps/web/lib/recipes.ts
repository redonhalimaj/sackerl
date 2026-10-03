import {
  ApiRequestError,
  createSackerlRecipesClient,
  type SackerlRecipesClient,
} from '@sackerl/api-client';

import { jsonResponse } from './api-auth';
import { webSupabaseAuthConfig } from './auth';

let webRecipesClient: SackerlRecipesClient | undefined;

export function getWebRecipesClient(): SackerlRecipesClient {
  webRecipesClient ??= createSackerlRecipesClient(webSupabaseAuthConfig);

  return webRecipesClient;
}

export function recipeApiErrorResponse(error: unknown): Response {
  if (error instanceof ApiRequestError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  throw error;
}
