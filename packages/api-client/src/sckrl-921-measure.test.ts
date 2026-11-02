// SCKRL-921 offline measurement. Skipped unless SCKRL_921_MEASURE=1.
//   SCKRL_921_MEASURE=1 pnpm --filter @sackerl/api-client exec vitest run src/sckrl-921-measure.test.ts
// Corpus defaults to the committed synthetic set; set SCKRL_921_CORPUS to
// ../../.local/receipt-corpus/labels.jsonl for real (never committed) receipts.
import { describe, it } from 'vitest';

import { matchReceiptAlias } from './receipt-aliases';
import { parseReceiptText } from './receipt-parsing';

// The package has no @types/node; type the few Node built-ins used here locally.
type NodeFs = {
  readonly readFileSync: (path: string, encoding: 'utf8') => string;
  readonly writeFileSync: (path: string, data: string) => void;
};
type NodePath = { readonly resolve: (...segments: string[]) => string };
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;
const nodeModule = async <T>(name: string): Promise<T> =>
  (await import(/* @vite-ignore */ `node:${name}`)) as T;

type Row = {
  readonly category_id: string | null;
  readonly chain: string;
  readonly is_product: boolean;
  readonly raw_text: string;
};

type Prediction = { readonly categoryId: string | null; readonly score: number };
type System = (raw: string) => Prediction;

const baseline: System = (raw) => {
  const item = parseReceiptText(raw).items[0];
  return item
    ? { categoryId: item.categoryId, score: item.confidence }
    : { categoryId: null, score: 0 };
};

const seed: System = (raw) => {
  const hit = matchReceiptAlias(raw);
  return { categoryId: hit.categoryId, score: hit.score };
};

const hybrid: System = (raw) => {
  const hit = seed(raw);
  return hit.categoryId ? hit : baseline(raw);
};

export function wilson(successes: number, n: number): readonly [number, number] {
  if (n === 0) {
    return [0, 0];
  }
  const z = 1.96;
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

const fmt = (k: number, n: number): string => {
  if (n === 0) {
    return 'n/a (n=0)';
  }
  const [lo, hi] = wilson(k, n);
  return `${((k / n) * 100).toFixed(1)}% [${(lo * 100).toFixed(1)}–${(hi * 100).toFixed(1)}] (${k}/${n})`;
};

function score(rows: readonly Row[], system: System) {
  let covered = 0;
  let correct = 0;
  const tiers = { 0.65: [0, 0], 0.85: [0, 0] } as Record<'0.65' | '0.85', [number, number]>;
  for (const row of rows) {
    const p = system(row.raw_text);
    if (!p.categoryId) {
      continue;
    }
    covered += 1;
    const ok = p.categoryId === row.category_id;
    if (ok) {
      correct += 1;
    }
    for (const t of ['0.65', '0.85'] as const) {
      if (p.score >= Number(t)) {
        tiers[t][1] += 1;
        if (ok) {
          tiers[t][0] += 1;
        }
      }
    }
  }
  return {
    autoAccept065: fmt(...tiers['0.65']),
    autoAccept085: fmt(...tiers['0.85']),
    coverage: fmt(covered, rows.length),
    coverageRatio: rows.length ? covered / rows.length : 0,
    precision: fmt(correct, covered),
    precisionRatio: covered ? correct / covered : 0,
  };
}

describe.skipIf(env.SCKRL_921_MEASURE !== '1')('SCKRL-921 measurement', () => {
  it('scores baseline vs seed+normalizer', async () => {
    const { readFileSync, writeFileSync } = await nodeModule<NodeFs>('fs');
    const { resolve } = await nodeModule<NodePath>('path');
    const corpusPath = resolve(env.SCKRL_921_CORPUS ?? 'fixtures/sckrl-921-synthetic-corpus.jsonl');
    const rows = readFileSync(corpusPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Row)
      .filter((row) => row.is_product);
    const chains = ['all', ...new Set(rows.map((row) => row.chain))];
    const out: string[] = [`corpus: ${corpusPath} (${rows.length} product lines)`, ''];
    // Leakage disclosure: lines whose full normalized text is itself a seed alias.
    const methods = new Map<string, number>();
    for (const row of rows) {
      const method = matchReceiptAlias(row.raw_text).method;
      methods.set(method, (methods.get(method) ?? 0) + 1);
    }
    out.push(
      `match methods: ${[...methods].map(([m, n]) => `${m}=${n} (${((n / rows.length) * 100).toFixed(0)}%)`).join(', ')}`,
      '',
    );
    const nonExact = rows.filter((row) => matchReceiptAlias(row.raw_text).method !== 'exact');
    for (const [name, system, population] of [
      ['baseline-regex', baseline, rows],
      ['seed+normalizer', seed, rows],
      ['seed+normalizer, EXCLUDING exact-match lines', seed, nonExact],
      ['hybrid (seed, else regex)', hybrid, rows],
    ] as const) {
      out.push(`## ${name}`);
      for (const chain of chains) {
        const subset =
          chain === 'all' ? population : population.filter((row) => row.chain === chain);
        const r = score(subset, system);
        out.push(
          `${chain.padEnd(6)} coverage ${r.coverage} | top-1 precision ${r.precision} | auto@0.65 ${r.autoAccept065} | auto@0.85 ${r.autoAccept085}`,
        );
      }
      out.push('');
    }
    const misses = rows
      .map((row) => ({ row, p: seed(row.raw_text) }))
      .filter(({ row, p }) => p.categoryId !== row.category_id)
      .map(
        ({ row, p }) =>
          `  ${row.chain} | ${row.raw_text} | want ${row.category_id} got ${p.categoryId ?? '-'}`,
      );
    out.push('## seed misses / errors', ...misses);
    const text = out.join('\n');
    console.log(text);
    if (env.SCKRL_921_OUT) {
      writeFileSync(env.SCKRL_921_OUT, text);
    }
  });
});
