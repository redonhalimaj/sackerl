import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

import type { E2eEnv } from './env';

/** Every synthetic account uses this domain so cleanup can never target a real user. */
export const E2E_EMAIL_DOMAIN = 'sackerl.test';

export type SyntheticUser = {
  readonly id: string;
  readonly email: string;
  readonly accessToken: string;
};

const LEDGER_DIR = path.resolve(__dirname, '..', '.results', 'ledger');

function ledgerFile(runId: string): string {
  return path.join(LEDGER_DIR, `${runId}.jsonl`);
}

function adminHeaders(env: E2eEnv): Record<string, string> {
  return {
    apikey: env.serviceRoleKey,
    Authorization: `Bearer ${env.serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
}

export function e2eEmail(runId: string, label: string): string {
  return `e2e+${runId}-${label}@${E2E_EMAIL_DOMAIN}`;
}

/**
 * Creates a confirmed synthetic user and records its id in this run's ledger *before* signing in,
 * so a later failure can still be cleaned up. Never lists existing users.
 */
export async function createSyntheticUser(
  env: E2eEnv,
  runId: string,
  label: string,
): Promise<SyntheticUser> {
  const email = e2eEmail(runId, label);
  const password = `E2e-${crypto.randomUUID()}`;
  const created = await fetch(`${env.supabaseUrl}/auth/v1/admin/users`, {
    body: JSON.stringify({
      email,
      email_confirm: true,
      password,
      user_metadata: { e2e_run_id: runId },
    }),
    headers: adminHeaders(env),
    method: 'POST',
  });
  if (!created.ok) {
    throw new Error(`createSyntheticUser(${label}) failed with HTTP ${created.status}.`);
  }
  const user = (await created.json()) as { id: string; email?: string };
  mkdirSync(LEDGER_DIR, { recursive: true });
  appendFileSync(ledgerFile(runId), `${JSON.stringify({ email, id: user.id })}\n`);
  const token = await fetch(`${env.supabaseUrl}/auth/v1/token?grant_type=password`, {
    body: JSON.stringify({ email, password }),
    headers: { apikey: env.anonKey, 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!token.ok) {
    throw new Error(`Sign-in for ${label} failed with HTTP ${token.status}.`);
  }
  const session = (await token.json()) as { access_token: string };
  return { accessToken: session.access_token, email, id: user.id };
}

/**
 * Deletes exactly one synthetic user by id. The email is re-checked against the e2e pattern
 * so a wrong id can never remove a real account. 404 (already gone) counts as success.
 */
export async function deleteSyntheticUser(
  env: E2eEnv,
  user: { readonly id: string; readonly email: string },
): Promise<boolean> {
  if (!user.email.startsWith('e2e+') || !user.email.endsWith(`@${E2E_EMAIL_DOMAIN}`)) {
    throw new Error('Refusing to delete a non-synthetic user.');
  }
  const response = await fetch(`${env.supabaseUrl}/auth/v1/admin/users/${user.id}`, {
    headers: adminHeaders(env),
    method: 'DELETE',
  });
  return response.ok || response.status === 404;
}

/** Sweeps the ledger of one run (the backup to per-test fixture cleanup). */
export async function deleteLedgerUsers(
  env: E2eEnv,
  runId: string,
): Promise<{ deleted: number; failed: number }> {
  const file = ledgerFile(runId);
  if (!existsSync(file)) {
    return { deleted: 0, failed: 0 };
  }
  const users = readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { id: string; email: string });
  let deleted = 0;
  let failed = 0;
  for (const user of users) {
    if (await deleteSyntheticUser(env, user)) {
      deleted += 1;
    } else {
      failed += 1;
    }
  }
  if (failed === 0) {
    rmSync(file);
  }
  return { deleted, failed };
}
