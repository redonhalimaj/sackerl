import {
  ApiRequestError,
  createSackerlReceiptsClient,
  type SackerlReceiptsClient,
} from '@sackerl/api-client';

import { jsonResponse } from './api-auth';
import { webSupabaseAuthConfig } from './auth';

let webReceiptsClient: SackerlReceiptsClient | undefined;

export function getWebReceiptsClient(): SackerlReceiptsClient {
  webReceiptsClient ??= createSackerlReceiptsClient(webSupabaseAuthConfig);

  return webReceiptsClient;
}

export function receiptApiErrorResponse(error: unknown): Response {
  if (error instanceof ApiRequestError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  throw error;
}
