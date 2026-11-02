import path from 'node:path';

import { config as loadDotenv } from 'dotenv';

/**
 * E2E environment, never logged. Precedence (dotenv never overrides): shell, then
 * `apps/web/e2e/.env.e2e`, then `apps/web/.env.local`, then the repo-root `.env` (all ignored).
 * E2E_* names win; the app's NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY are fallbacks.
 * In a git worktree without its own env files, set E2E_ENV_DIR to the main checkout root.
 */
const webDir = path.resolve(__dirname, '..', '..');
const envRoot = process.env.E2E_ENV_DIR
  ? path.resolve(process.env.E2E_ENV_DIR)
  : path.resolve(webDir, '..', '..');
for (const file of [
  path.join(webDir, 'e2e', '.env.e2e'),
  path.join(envRoot, 'apps', 'web', '.env.local'),
  path.join(envRoot, '.env'),
]) {
  loadDotenv({ path: file });
}

export type E2eEnv = {
  readonly baseUrl: string;
  readonly supabaseUrl: string;
  readonly anonKey: string;
  readonly serviceRoleKey: string;
  readonly allowedHosts: readonly string[];
};

const DEFAULT_ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'host.docker.internal'];

/** Backend specs run only with explicit opt-in (E2E_BACKEND=1); otherwise they skip. */
export function readE2eEnv(): E2eEnv | undefined {
  if (process.env.E2E_BACKEND !== '1') {
    return undefined;
  }
  const supabaseUrl = process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.E2E_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey =
    process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return undefined;
  }
  const extra = (process.env.E2E_ALLOWED_SUPABASE_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  return {
    allowedHosts: [...DEFAULT_ALLOWED_HOSTS, ...extra],
    anonKey,
    baseUrl: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100',
    serviceRoleKey,
    supabaseUrl: supabaseUrl.replace(/\/+$/, ''),
  };
}

/**
 * Refuses to run against any Supabase host that is not explicitly allowed. Local hosts are
 * allowed by default; a hosted dev project must be listed in E2E_ALLOWED_SUPABASE_HOSTS after
 * owner approval. Hosts that look like production are always refused.
 */
export function assertSafeTarget(env: E2eEnv): void {
  const host = new URL(env.supabaseUrl).hostname;
  const labels = [
    process.env.E2E_TARGET_LABEL,
    process.env.APP_ENV,
    process.env.NEXT_PUBLIC_APP_ENV,
  ];
  if (/prod/i.test(host) || labels.some((label) => /prod/i.test(label ?? ''))) {
    throw new Error('E2E refuses to run against a production-looking target.');
  }
  if (!env.allowedHosts.includes(host)) {
    throw new Error(
      'E2E target host is not allow-listed. Use local Supabase, or add the approved dev host to ' +
        'E2E_ALLOWED_SUPABASE_HOSTS after owner approval.',
    );
  }
}

export function requireE2eEnv(): E2eEnv {
  const env = readE2eEnv();
  if (!env) {
    throw new Error(
      'E2E env missing: set E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY and ' +
        'E2E_SUPABASE_SERVICE_ROLE_KEY (see apps/web/e2e/.env.e2e.example).',
    );
  }
  assertSafeTarget(env);
  return env;
}
