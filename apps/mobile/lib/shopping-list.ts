import {
  createSackerlShoppingListClient,
  type SackerlShoppingListClient,
} from '@sackerl/api-client';

import { mobileSupabaseAuthConfig } from './auth';

let mobileShoppingListClient: SackerlShoppingListClient | undefined;

export function getMobileShoppingListClient(): SackerlShoppingListClient {
  mobileShoppingListClient ??= createSackerlShoppingListClient(mobileSupabaseAuthConfig);

  return mobileShoppingListClient;
}
