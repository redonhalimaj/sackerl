import { createSackerlReceiptsClient, type SackerlReceiptsClient } from '@sackerl/api-client';

import { mobileSupabaseAuthConfig } from './auth';

let mobileReceiptsClient: SackerlReceiptsClient | undefined;

export function getMobileReceiptsClient(): SackerlReceiptsClient {
  mobileReceiptsClient ??= createSackerlReceiptsClient(mobileSupabaseAuthConfig);

  return mobileReceiptsClient;
}
