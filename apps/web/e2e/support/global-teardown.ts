import { readE2eEnv, requireE2eEnv } from './env';
import { deleteSyntheticUsers } from './supabase-admin';

export default async function globalTeardown(): Promise<void> {
  if (!readE2eEnv() || process.env.E2E_KEEP_DATA === '1') {
    return;
  }
  const env = requireE2eEnv();
  const runId = process.env.E2E_RUN_ID;
  const deleted = await deleteSyntheticUsers(env, runId);
  console.log(`[e2e] teardown removed ${deleted} synthetic user(s) for run ${runId ?? 'all'}.`);
}
