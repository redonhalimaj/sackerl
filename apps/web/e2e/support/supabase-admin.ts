import type { E2eEnv } from './env';

/** Every synthetic account uses this domain so teardown can never touch a real user. */
export const E2E_EMAIL_DOMAIN = 'sackerl.test';
export const E2E_PASSWORD_PREFIX = 'E2e-pw-';

export type SyntheticUser = {
  readonly id: string;
  readonly email: string;
  readonly accessToken: string;
};

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

export async function createSyntheticUser(
  env: E2eEnv,
  runId: string,
  label: string,
): Promise<SyntheticUser> {
  const email = e2eEmail(runId, label);
  const password = `${E2E_PASSWORD_PREFIX}${runId}-${label}`;
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
  const user = (await created.json()) as { id: string };
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

type AdminUser = { id: string; email?: string; user_metadata?: { e2e_run_id?: string } };

/**
 * Deletes synthetic users. With a runId only that run's users are removed; without one, every
 * leftover `@sackerl.test` user tagged with an e2e run id is removed. Household-owned rows are
 * expected to cascade from the auth user (see docs/qa/e2e-web.md).
 */
export async function deleteSyntheticUsers(env: E2eEnv, runId?: string): Promise<number> {
  let deleted = 0;
  for (let page = 1; page < 50; page += 1) {
    const response = await fetch(
      `${env.supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=200`,
      {
        headers: adminHeaders(env),
      },
    );
    if (!response.ok) {
      throw new Error(`Listing users failed with HTTP ${response.status}.`);
    }
    const { users } = (await response.json()) as { users: AdminUser[] };
    const targets = users.filter(
      (user) =>
        user.email?.endsWith(`@${E2E_EMAIL_DOMAIN}`) &&
        user.email.startsWith('e2e+') &&
        typeof user.user_metadata?.e2e_run_id === 'string' &&
        (runId === undefined || user.user_metadata.e2e_run_id === runId),
    );
    for (const user of targets) {
      const removed = await fetch(`${env.supabaseUrl}/auth/v1/admin/users/${user.id}`, {
        headers: adminHeaders(env),
        method: 'DELETE',
      });
      if (removed.ok) {
        deleted += 1;
      }
    }
    if (users.length < 200) {
      break;
    }
  }
  return deleted;
}
