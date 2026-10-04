import { createSackerlRecipesClient, type SackerlRecipesClient } from '@sackerl/api-client';

import { mobileSupabaseAuthConfig } from './auth';

const mobileRecipesClients = new Map<string, SackerlRecipesClient>();

export function getMobileRecipesClient(calendarTimeZone: string): SackerlRecipesClient {
  let client = mobileRecipesClients.get(calendarTimeZone);

  if (!client) {
    client = createSackerlRecipesClient(mobileSupabaseAuthConfig, { calendarTimeZone });
    mobileRecipesClients.set(calendarTimeZone, client);
  }

  return client;
}
