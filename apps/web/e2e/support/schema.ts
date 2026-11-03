import { test } from '@playwright/test';

import { readE2eEnv } from './env';

let placementSchemaPresent: Promise<boolean> | undefined;

/** Probes PostgREST for the SCKRL-311 `receipt_placements` table (anon key, zero rows read). */
async function probePlacementSchema(): Promise<boolean> {
  const env = readE2eEnv();
  if (!env) {
    return false;
  }
  const response = await fetch(`${env.supabaseUrl}/rest/v1/receipt_placements?select=id&limit=0`, {
    headers: { apikey: env.anonKey, Authorization: `Bearer ${env.anonKey}` },
  });
  if (response.ok) {
    return true;
  }
  const body = (await response.json().catch(() => ({}))) as { code?: string };
  // PGRST205 / 42P01: relation missing. Anything else (e.g. RLS 401/403) means it exists.
  return !(response.status === 404 || body.code === 'PGRST205' || body.code === '42P01');
}

/**
 * Marks the current test as expected-blocked (fixme) when the target lacks the SCKRL-311
 * placement migration, instead of failing or silently passing. Call at the start of a test or in
 * a beforeEach.
 */
export async function requirePlacementSchema(): Promise<void> {
  if (!readE2eEnv()) {
    return; // backend fixtures already skip these tests
  }
  placementSchemaPresent ??= probePlacementSchema();
  test.fixme(
    !(await placementSchemaPresent),
    'Expected-blocked: SCKRL-311 placement migration (receipt_placements) is not applied on this target.',
  );
}
