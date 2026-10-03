import { createSackerlProfileClient, type SackerlProfileClient } from '@sackerl/api-client';

import { mobileSupabaseAuthConfig } from './auth';

let mobileProfileClient: SackerlProfileClient | undefined;

export function getMobileProfileClient(): SackerlProfileClient {
  mobileProfileClient ??= createSackerlProfileClient(mobileSupabaseAuthConfig);

  return mobileProfileClient;
}
