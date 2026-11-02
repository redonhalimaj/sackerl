import path from 'node:path';

import { config as loadDotenv } from 'dotenv';

/**
 * E2E environment. Values come from `apps/web/e2e/.env.e2e` (ignored by Git) or the shell.
 * See `.env.e2e.example` for names only. Never log these values.
 */
loadDotenv({ path: path.resolve(__dirname, '..', '.env.e2e') });

export type E2eEnv = {
  readonly baseUrl: string;
  readonly supabaseUrl: string;
  readonly anonKey: string;
  readonly serviceRoleKey: string;
  readonly allowedHosts: readonly string[];
};

const DEFAULT_ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'host.docker.internal'];

export function readE2eEnv(): E2eEnv | undefined {
  const supabaseUrl = process.env.E2E_SUPABASE_URL;
  const anonKey = process.env.E2E_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
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
  if (/prod/i.test(host) || /prod/i.test(process.env.E2E_TARGET_LABEL ?? '')) {
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
