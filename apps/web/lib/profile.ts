import { createSackerlProfileClient, type SackerlProfileClient } from '@sackerl/api-client';

import { webSupabaseAuthConfig } from './auth';

let webProfileClient: SackerlProfileClient | undefined;

export function getWebProfileClient(): SackerlProfileClient {
  webProfileClient ??= createSackerlProfileClient(webSupabaseAuthConfig);

  return webProfileClient;
}
