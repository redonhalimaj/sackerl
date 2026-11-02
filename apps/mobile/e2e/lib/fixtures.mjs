/* global URL, fetch, AbortSignal */
// Synthetic fixture lifecycle against the remote dev Supabase project.
// Credentials come only from the ignored repo-root .env and apps/mobile/.env.local. They are never printed.
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';

function parseEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.replace(/^['"]|['"]$/g, '')]),
  );
}

export function loadConfig(repoRoot) {
  const root = parseEnv(`${repoRoot}/.env`);
  const mobile = parseEnv(`${repoRoot}/apps/mobile/.env.local`);
  const url = (mobile.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  if (!url || url !== (root.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, ''))
    throw new Error('Supabase origin mismatch between .env and apps/mobile/.env.local');
  const allowed = process.env.E2E_ALLOWED_PROJECT_REF || 'raqqhpeailkxqvubgzir'; // remote dev project only
  if (new URL(url).hostname !== `${allowed}.supabase.co`)
    throw new Error('Supabase URL is not the allowed dev project');
  if (!root.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing fixture admin key in ignored .env');
  return { url, adminKey: root.SUPABASE_SERVICE_ROLE_KEY };
}

async function admin(cfg, path, { method = 'GET', body, query } = {}) {
  const u = new URL(cfg.url + path);
  for (const [k, v] of Object.entries(query || {})) u.searchParams.set(k, v);
  const res = await fetch(u, {
    method,
    signal: AbortSignal.timeout(30_000),
    headers: {
      apikey: cfg.adminKey,
      Authorization: `Bearer ${cfg.adminKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok && res.status !== 404) throw new Error(`${method} ${u.pathname} -> ${res.status}`);
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

/** Creates one fresh confirmed owner user. The login stays in memory only. */
export async function provision(cfg, runDir, runId) {
  const user = {
    id: randomUUID(),
    email: `sackerl-e2e+${runId}@example.test`,
    password: randomBytes(18).toString('base64url'),
  };
  const manifest = { runId, userId: user.id, email: user.email, state: 'planned' };
  const save = () => {
    writeFileSync(`${runDir}/fixture.json`, JSON.stringify(manifest, null, 2));
    chmodSync(`${runDir}/fixture.json`, 0o600);
  };
  save();
  manifest.state = 'attempted';
  save();
  await admin(cfg, '/auth/v1/admin/users', {
    method: 'POST',
    body: {
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      app_metadata: { sackerl_e2e_run: runId },
    },
  });
  manifest.state = 'created';
  save();
  return { email: user.email, password: user.password };
}

/** Deletes exactly the synthetic user, together with its owned households (which cascade to stock, receipts and lists). */
export async function cleanup(cfg, runDir) {
  const path = `${runDir}/fixture.json`;
  if (!existsSync(path)) return { cleaned: true, note: 'nothing provisioned' };
  const m = JSON.parse(readFileSync(path, 'utf8'));
  const { data: user, status } = await admin(cfg, `/auth/v1/admin/users/${m.userId}`);
  if (status !== 404 && user) {
    if (user.email !== m.email || user.app_metadata?.sackerl_e2e_run !== m.runId)
      throw new Error('Refusing cleanup: user identity does not match manifest');
    await admin(cfg, '/rest/v1/households', {
      method: 'DELETE',
      query: { owner_id: `eq.${m.userId}` },
    });
    await admin(cfg, `/auth/v1/admin/users/${m.userId}`, { method: 'DELETE' });
  }
  const after = await admin(cfg, `/auth/v1/admin/users/${m.userId}`);
  const hh = await admin(cfg, '/rest/v1/households', {
    query: { owner_id: `eq.${m.userId}`, select: 'id' },
  });
  const cleaned = after.status === 404 && Array.isArray(hh.data) && hh.data.length === 0;
  m.state = cleaned ? 'cleaned' : 'cleanup-incomplete';
  writeFileSync(path, JSON.stringify(m, null, 2));
  return { cleaned };
}
