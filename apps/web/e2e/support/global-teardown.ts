import { readE2eEnv, requireE2eEnv } from './env';
import { deleteLedgerUsers } from './supabase-admin';

/** Backup sweep: removes any of this run's users that per-test cleanup missed. */
export default async function globalTeardown(): Promise<void> {
  const runId = process.env.E2E_RUN_ID;
  if (!readE2eEnv() || !runId || process.env.E2E_KEEP_DATA === '1') {
    return;
  }
  const { deleted, failed } = await deleteLedgerUsers(requireE2eEnv(), runId);
  console.log(
    `[e2e] teardown sweep for run ${runId}: ${deleted} confirmed absent, ${failed} failed.`,
  );
  if (failed > 0) {
    throw new Error(`[e2e] ${failed} synthetic user(s) could not be deleted; see the run ledger.`);
  }
}
