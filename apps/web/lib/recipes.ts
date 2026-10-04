import {
  ApiRequestError,
  createSackerlRecipesClient,
  defaultHouseholdCalendarTimeZone,
  type SackerlRecipesClient,
} from '@sackerl/api-client';

import { jsonResponse } from './api-auth';
import { webSupabaseAuthConfig } from './auth';

const webRecipesClients = new Map<string, SackerlRecipesClient>();

/**
 * Recipe eligibility compares dates in the household's own calendar (SCKRL-406), so the client is
 * cached per zone. Callers that do not know the household fall back to the original SCKRL-506
 * Europe/Vienna pilot value, which is also the column default, so behaviour is unchanged.
 */
export function getWebRecipesClient(calendarTimeZone?: string): SackerlRecipesClient {
  const zone = calendarTimeZone ?? defaultHouseholdCalendarTimeZone;
  const cached = webRecipesClients.get(zone);

  if (cached) {
    return cached;
  }

  const client = createSackerlRecipesClient(webSupabaseAuthConfig, {
    calendarTimeZone: zone,
  });

  webRecipesClients.set(zone, client);

  return client;
}

export function recipeApiErrorResponse(error: unknown): Response {
  if (error instanceof ApiRequestError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  throw error;
}
