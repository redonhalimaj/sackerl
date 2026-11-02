import { readE2eEnv, requireE2eEnv } from './env';
import { deleteLedgerUsers, pendingLedgerRunIds } from './supabase-admin';

/**
 * Backup sweep: removes users that per-test cleanup missed, for this run and any earlier run whose
 * ledger is still on disk. Skipped entirely with E2E_KEEP_DATA=1 (ledgers stay for a later sweep).
 */
export default async function globalTeardown(): Promise<void> {
  if (!readE2eEnv() || process.env.E2E_KEEP_DATA === '1') {
    return;
  }
  const env = requireE2eEnv();
  let totalFailed = 0;
  for (const runId of pendingLedgerRunIds()) {
    const { deleted, failed } = await deleteLedgerUsers(env, runId);
    totalFailed += failed;
    console.log(
      `[e2e] teardown sweep for run ${runId}: ${deleted} confirmed absent, ${failed} failed.`,
    );
  }
  if (totalFailed > 0) {
    throw new Error(
      `[e2e] ${totalFailed} synthetic user(s) could not be deleted; see e2e/.ledger.`,
    );
  }
}
