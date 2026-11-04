#!/usr/bin/env node
/* global console, setTimeout, Buffer */
// Sackerl mobile E2E runner (Maestro). Usage: node e2e/run.mjs [flow-name ...] [--no-fixture] [--keep-metro]
//   SCKRL-305 fault mode: node e2e/run.mjs --placement-fault (own Metro with the placement fault env;
//   runs e2e/placement-fault.config.yaml = 10, 15 and 56-receipt-placement-unknown-retry).
//   Reap a leaked fixture user: node apps/mobile/e2e/run.mjs --cleanup <runId>
// Flows live in e2e/maestro/*.yaml; order is set in e2e/maestro/config.yaml. See docs/qa/e2e-mobile.md.
import { spawn } from 'node:child_process';
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  chmodSync,
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { loadConfig, provision, cleanup } from './lib/fixtures.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(here, '..');
const repoRoot = resolve(mobileDir, '../..');
const envRoot = process.env.E2E_ENV_ROOT ? resolve(process.env.E2E_ENV_ROOT) : repoRoot;
const argv = process.argv.slice(2);
const only = argv.filter((a) => !a.startsWith('--'));
const useFixture = !argv.includes('--no-fixture');
const placementFault = argv.includes('--placement-fault');
const faultEnv = placementFault
  ? { EXPO_PUBLIC_APP_ENV: 'dev', EXPO_PUBLIC_E2E_PLACEMENT_FAULT: 'drop-first-response' }
  : {};
const PORT = Number(process.env.E2E_METRO_PORT || 8081);
const DEVICE = process.env.E2E_DEVICE; // optional simulator UDID; Maestro picks the booted one otherwise
const MAESTRO = process.env.MAESTRO_BIN || 'maestro';
// ---- reaper: --cleanup <runId> deletes exactly the user recorded in that run's fixture.json ------
const cleanupIdx = argv.indexOf('--cleanup');
if (cleanupIdx !== -1) {
  const id = argv[cleanupIdx + 1];
  if (!id || !/^[\w-]+$/.test(id)) {
    console.error('[e2e] usage: run.mjs --cleanup <runId>');
    process.exit(2);
  }
  const dir = join(repoRoot, '.env.e2e-mobile', id);
  if (!existsSync(join(dir, 'fixture.json'))) {
    console.error(`[e2e] no fixture.json for run ${id}`);
    process.exit(2);
  }
  try {
    const res = await cleanup(loadConfig(envRoot), dir);
    console.log(`[e2e] cleanup ${id}: ${res.cleaned ? 'ok' : 'INCOMPLETE'}`);
    process.exit(res.cleaned ? 0 : 4);
  } catch (e) {
    console.error(`[e2e] cleanup ${id} failed:`, e.message);
    process.exit(4);
  }
}

const runId =
  new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14) +
  '-' +
  Math.random().toString(36).slice(2, 6);
const runDir = join(repoRoot, '.env.e2e-mobile', runId); // .env.* is git-ignored
mkdirSync(join(runDir, 'shots'), { recursive: true });
chmodSync(runDir, 0o700);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[e2e]`, ...a);

// ---- metro -------------------------------------------------------------------
const portBusy = () =>
  new Promise((r) => {
    const s = net.connect(PORT, '127.0.0.1');
    s.on('connect', () => {
      s.destroy();
      r(true);
    });
    s.on('error', () => r(false));
  });
let metro = null;
async function startMetro() {
  if (await portBusy()) {
    // A reused Metro has its own bundle env; the fault flow needs the fault env inlined.
    if (placementFault)
      throw new Error(`--placement-fault needs its own Metro; stop the one on ${PORT} first`);
    log(`reusing Metro already listening on ${PORT}`);
    return;
  }
  metro = spawn(
    'node',
    [
      '--dns-result-order=ipv4first',
      'node_modules/expo/bin/cli',
      'start',
      '--localhost',
      '--port',
      String(PORT),
      ...(placementFault ? ['--clear'] : []),
    ],
    {
      cwd: mobileDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', ...faultEnv },
    },
  );
  const out = [];
  metro.stdout.on('data', (d) => out.push(d));
  metro.stderr.on('data', (d) => out.push(d));
  for (let i = 0; i < 120; i++) {
    if (await portBusy()) {
      writeFileSync(join(runDir, 'metro.log'), Buffer.concat(out));
      return;
    }
    await sleep(1000);
  }
  throw new Error('Metro did not start');
}
function stopMetro() {
  if (metro && !argv.includes('--keep-metro')) {
    try {
      process.kill(-metro.pid, 'SIGTERM');
    } catch {
      /* best effort */
    }
  }
}

// ---- maestro -----------------------------------------------------------------
const t = new Date(Date.now() + 86_400_000);
const tomorrow = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; // local date

let maestroChild = null;
/** Runs Maestro asynchronously so signal handlers can run while it is active. Secrets go through MAESTRO_* process env (Maestro maps them to ${MAESTRO_*}), never argv. */
function runMaestro(secrets) {
  const junit = join(runDir, 'junit.xml');
  const flowArgs = only.length
    ? only.map((n) => join(here, 'maestro', `${n}.yaml`))
    : [join(here, 'maestro')];
  const configArgs = placementFault ? ['--config', join(here, 'placement-fault.config.yaml')] : [];
  const args = [
    ...(DEVICE ? ['--device', DEVICE] : []),
    'test',
    '--format',
    'junit',
    '--output',
    junit,
    '--debug-output',
    join(runDir, 'maestro-debug'),
    '--test-output-dir',
    join(runDir, 'shots'),
    ...configArgs,
    '-e',
    `METRO_URL=exp://127.0.0.1:${PORT}`,
    ...flowArgs,
  ];
  maestroChild = spawn(MAESTRO, args, {
    cwd: join(runDir, 'shots'),
    stdio: 'inherit',
    env: {
      ...process.env,
      MAESTRO_CLI_NO_ANALYTICS: '1',
      MAESTRO_E2E_RUN_ID: runId,
      MAESTRO_E2E_TOMORROW: tomorrow,
      ...secrets,
    },
  });
  return new Promise((res, rej) => {
    maestroChild.on('error', rej);
    maestroChild.on('exit', (code, signal) => {
      maestroChild = null;
      res({ status: signal ? 1 : code, junit });
    });
  });
}

/** Maestro logs typed text verbatim (maestro.log, commands.json, device logs). Redact the password everywhere. */
function scrubSecret(dir, secret) {
  if (!secret) return 0;
  let n = 0;
  for (const name of readdirSync(dir)) {
    const f = join(dir, name);
    const st = statSync(f);
    if (st.isDirectory()) n += scrubSecret(f, secret);
    else if (!/\.(png|jpe?g|mp4|mov)$/i.test(name)) {
      const buf = readFileSync(f);
      if (buf.includes(secret)) {
        writeFileSync(f, buf.toString('latin1').split(secret).join('[redacted]'), 'latin1');
        n++;
      }
    }
  }
  return n;
}

function parseJunit(file) {
  if (!existsSync(file)) return [];
  const xml = readFileSync(file, 'utf8');
  return [...xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)].map((m) => {
    const name = /name="([^"]*)"/.exec(m[1])?.[1];
    const time = Number(/time="([^"]*)"/.exec(m[1])?.[1] || 0);
    const failure = /<(failure|error)\b[^>]*?(?:message="([^"]*)")?/.exec(m[3] || '');
    return {
      flow: name,
      pass: !failure,
      s: time,
      error: failure ? failure[2] || 'failed' : undefined,
    };
  });
}

let cfg = null;
let cleanupOnce = null;
/** Runs fixture cleanup at most once, whether reached from finally or a signal. */
function cleanupFixture() {
  if (!cleanupOnce)
    cleanupOnce = cfg
      ? cleanup(cfg, runDir).catch((e) => ({ cleaned: false, error: e.message }))
      : Promise.resolve({ cleaned: true, note: 'no fixture' });
  return cleanupOnce;
}
let shuttingDown = false;
for (const sig of ['SIGINT', 'SIGTERM'])
  process.on(sig, async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`[e2e] ${sig}: cleaning up`);
    if (maestroChild) {
      try {
        maestroChild.kill('SIGTERM');
      } catch {
        /* best effort */
      }
    }
    const res = await cleanupFixture();
    if (!res.cleaned) console.error('[e2e] cleanup failed:', res.error || 'incomplete');
    stopMetro();
    process.exit(130);
  });

// ---- main --------------------------------------------------------------------
let results = [];
let exitCode = 0;
try {
  await startMetro();
  let secrets = {};
  if (useFixture) {
    cfg = loadConfig(envRoot);
    const login = await provision(cfg, runDir, runId);
    secrets = { MAESTRO_E2E_EMAIL: login.email, MAESTRO_E2E_PASSWORD: login.password };
  }
  let r;
  try {
    r = await runMaestro(secrets);
  } finally {
    const n = scrubSecret(runDir, secrets.MAESTRO_E2E_PASSWORD);
    if (n) log(`redacted the fixture password from ${n} Maestro log file(s)`);
    secrets = null;
  }
  results = parseJunit(r.junit);
  if (r.status !== 0) exitCode = 1;
  for (const x of results)
    log(`${x.pass ? 'PASS' : 'FAIL'} ${x.flow}${x.error ? ': ' + x.error : ''}`);
} catch (e) {
  console.error('[e2e] aborted:', e.message);
  exitCode = 2;
} finally {
  const cleanupResult = await cleanupFixture();
  if (!cleanupResult.cleaned) exitCode = exitCode || 4;
  try {
    rmSync(join(runDir, 'login.json'), { force: true });
  } catch {
    /* best effort */
  }
  stopMetro();
  const passed = results.filter((r) => r.pass).length;
  const report = {
    runId,
    passed,
    failed: results.length - passed,
    results,
    cleanup: cleanupResult,
    junit: join(runDir, 'junit.xml'),
    shots: join(runDir, 'shots'),
  };
  writeFileSync(join(runDir, 'report.json'), JSON.stringify(report, null, 2));
  log(
    `${passed}/${results.length} flows passed; cleanup ${cleanupResult.cleaned ? 'ok' : 'INCOMPLETE'}; report ${join(runDir, 'report.json')}`,
  );
  process.exit(exitCode);
}
