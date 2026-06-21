import { createSackerlRecipesClient, type SackerlRecipesClient } from '@sackerl/api-client';

import { mobileSupabaseAuthConfig } from './auth';

let mobileRecipesClient: SackerlRecipesClient | undefined;

export function getMobileRecipesClient(): SackerlRecipesClient {
  mobileRecipesClient ??= createSackerlRecipesClient(mobileSupabaseAuthConfig);

  return mobileRecipesClient;
}
