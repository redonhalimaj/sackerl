#!/usr/bin/env node
/* global console, setTimeout, Buffer */
// Sackerl mobile E2E runner ("simdrive"). Usage: node e2e/run.mjs [flow-name ...] [--no-fixture] [--keep-metro]
// Flows live in e2e/flows/*.json and run in filename order. See docs/qa/e2e-mobile.md.
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync, chmodSync } from 'node:fs';
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
const PORT = Number(process.env.E2E_METRO_PORT || 8081);
const DEVICE = process.env.E2E_DEVICE || 'booted';
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

// ---- driver ------------------------------------------------------------------
const driverBin = join(runDir, 'simdrive');
execFileSync('swiftc', ['-O', '-o', driverBin, join(here, 'driver/simdrive.swift')], {
  stdio: 'inherit',
});
const drive = (...args) => spawnSync(driverBin, args, { encoding: 'utf8', timeout: 20_000 });
const simctl = (...args) => execFileSync('xcrun', ['simctl', ...args], { encoding: 'utf8' });
const chk = drive('check');
if (chk.status !== 0) {
  console.error(chk.stderr.trim());
  process.exit(3);
}

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
    ],
    {
      cwd: mobileDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' },
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

// ---- steps -------------------------------------------------------------------
const t = new Date(Date.now() + 86_400_000);
const tomorrow = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; // local date
let vars = { RUN_ID: runId, TOMORROW: tomorrow };
const subst = (s) =>
  String(s).replace(/\$\{(\w+)\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`unknown var ${k}`);
    return vars[k];
  });
async function poll(fn, timeout = 15_000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    last = fn();
    if (last.ok) return last;
    await sleep(400);
  }
  return last;
}
let shotN = 0;
function shot(name) {
  const f = join(
    runDir,
    'shots',
    `${String(++shotN).padStart(3, '0')}-${name.replace(/[^\w.-]/g, '_')}.png`,
  );
  simctl('io', DEVICE, 'screenshot', f);
  return f;
}
function ocr(file) {
  return spawnSync('swift', [join(here, 'driver/ocr.swift'), file], { encoding: 'utf8' }).stdout;
}

const steps = {
  async launch() {
    try {
      simctl('terminate', DEVICE, 'host.exp.Exponent');
    } catch {
      /* best effort */
    }
    await sleep(800);
    simctl('openurl', DEVICE, `exp://127.0.0.1:${PORT}`);
    await sleep(4000);
  },
  async open({ route }) {
    simctl(
      'openurl',
      DEVICE,
      `exp://127.0.0.1:${PORT}/--${route.startsWith('/') ? route : '/' + route}`,
    );
    await sleep(1500);
  },
  async tap({ id, timeout }) {
    const r = await poll(() => {
      const p = drive('tap', subst(id));
      return { ok: p.status === 0, err: p.stderr };
    }, timeout);
    if (!r.ok) throw new Error(`tap ${id}: ${r.err.trim()}`);
    await sleep(500);
  },
  async tapWhenPresent({ id, timeout = 30_000 }) {
    await steps.tap({ id, timeout });
  },
  async tapIfPresent({ id }) {
    if (drive('find', subst(id)).status === 0) {
      drive('tap', subst(id));
      await sleep(500);
    }
  },
  async type({ id, text }) {
    await steps.tap({ id });
    spawnSync('xcrun', ['simctl', 'pbcopy', DEVICE], { input: subst(text) }); // value goes via stdin, never argv
    await sleep(200);
    drive('paste');
    await sleep(400);
  },
  async assertVisible({ id, timeout }) {
    const r = await poll(() => ({ ok: drive('find', subst(id)).status === 0 }), timeout);
    if (!r.ok) throw new Error(`not visible: ${id}`);
  },
  async assertNotVisible({ id, timeout = 5000 }) {
    const r = await poll(() => ({ ok: drive('find', subst(id)).status === 1 }), timeout);
    if (!r.ok) throw new Error(`unexpectedly visible: ${id}`);
  },
  async assertDisabled({ id }) {
    await steps.assertVisible({ id });
    const v = drive('enabled', subst(id)).stdout.trim();
    if (v !== 'false') throw new Error(`expected disabled: ${id} (enabled=${v})`);
  },
  async assertEnabled({ id }) {
    await steps.assertVisible({ id });
    const v = drive('enabled', subst(id)).stdout.trim();
    if (v !== 'true') throw new Error(`expected enabled: ${id}`);
  },
  async assertText({ text, timeout }) {
    const want = subst(text).toLowerCase();
    const r = await poll(() => {
      const f = join(runDir, 'ocr.png');
      simctl('io', DEVICE, 'screenshot', f);
      return { ok: ocr(f).toLowerCase().includes(want) };
    }, timeout || 10_000);
    if (!r.ok) throw new Error(`text not on screen: ${text}`);
  },
  async wait({ ms }) {
    await sleep(ms);
  },
  async screenshot({ name }) {
    shot(name);
  },
  async runFlow({ flow }) {
    await runSteps(
      JSON.parse(readFileSync(join(here, 'flows', flow + '.json'), 'utf8')).steps,
      flow,
    );
  },
};
async function runSteps(list, flowName) {
  for (const [i, s] of list.entries()) {
    if (!steps[s.do]) throw new Error(`unknown step "${s.do}" in ${flowName}#${i}`);
    await steps[s.do](s);
    if (!['screenshot', 'wait', 'runFlow'].includes(s.do)) shot(`${flowName}-${i}-${s.do}`);
  }
}

let shuttingDown = false;
for (const sig of ['SIGINT', 'SIGTERM'])
  process.on(sig, async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`[e2e] ${sig}: cleaning up`);
    if (cfg) {
      try {
        await cleanup(cfg, runDir);
      } catch (e) {
        console.error('[e2e] cleanup failed:', e.message);
      }
    }
    stopMetro();
    process.exit(130);
  });

// ---- main --------------------------------------------------------------------
const results = [];
let cfg = null;
let exitCode = 0;
try {
  const flows = readdirSync(join(here, 'flows'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({
      name: f.replace(/\.json$/, ''),
      ...JSON.parse(readFileSync(join(here, 'flows', f), 'utf8')),
    }))
    .filter((f) => !only.length || only.includes(f.name));
  if (!flows.length) throw new Error('no flows matched ' + only.join(','));
  await startMetro();
  if (useFixture && flows.some((f) => f.needsUser !== false)) {
    cfg = loadConfig(envRoot);
    const login = await provision(cfg, runDir, runId);
    vars = { ...vars, E2E_EMAIL: login.email, E2E_PASSWORD: login.password };
  }
  for (const f of flows) {
    const t0 = Date.now();
    try {
      await runSteps(f.steps, f.name);
      results.push({ flow: f.name, pass: true, ms: Date.now() - t0 });
      log(`PASS ${f.name}`);
    } catch (e) {
      shot(`FAIL-${f.name}`);
      results.push({ flow: f.name, pass: false, ms: Date.now() - t0, error: e.message });
      log(`FAIL ${f.name}: ${e.message}`);
      exitCode = 1;
    }
  }
} catch (e) {
  console.error('[e2e] aborted:', e.message);
  exitCode = 2;
} finally {
  let cleanupResult = { cleaned: true, note: 'no fixture' };
  if (cfg) {
    try {
      cleanupResult = await cleanup(cfg, runDir);
    } catch (e) {
      cleanupResult = { cleaned: false, error: e.message };
      exitCode = exitCode || 4;
    }
  }
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
    shots: join(runDir, 'shots'),
  };
  writeFileSync(join(runDir, 'report.json'), JSON.stringify(report, null, 2));
  log(
    `${passed}/${results.length} flows passed; cleanup ${cleanupResult.cleaned ? 'ok' : 'INCOMPLETE'}; report ${join(runDir, 'report.json')}`,
  );
  process.exit(exitCode);
}
