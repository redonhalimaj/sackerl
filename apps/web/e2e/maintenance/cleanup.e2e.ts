import { test } from '@playwright/test';

import { readE2eEnv, requireE2eEnv } from '../support/env';
import { deleteSyntheticUsers } from '../support/supabase-admin';

/** Removes leftover synthetic users from every run (e.g. after an aborted run). */
test('remove all leftover synthetic e2e users', async () => {
  test.skip(!readE2eEnv(), 'No E2E Supabase target configured.');
  const deleted = await deleteSyntheticUsers(requireE2eEnv());
  console.log(`[e2e] cleanup removed ${deleted} leftover synthetic user(s).`);
});
