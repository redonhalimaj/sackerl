import { createSackerlItemsClient, type SackerlItemsClient } from '@sackerl/api-client';

import { mobileSupabaseAuthConfig } from './auth';

let mobileItemsClient: SackerlItemsClient | undefined;

export function getMobileItemsClient(): SackerlItemsClient {
  mobileItemsClient ??= createSackerlItemsClient(mobileSupabaseAuthConfig);

  return mobileItemsClient;
}
