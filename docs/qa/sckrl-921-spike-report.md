# SCKRL-921 spike report: Austrian receipt-alias categorization (path A)

Worker: w3 (Claude Opus 5.5). Branch `spike/SCKRL-921-retail-aliases`, local only and not pushed.
Date: 2026-11-03.

## Status of deliverables

| # | Deliverable | State |
|---|---|---|
| 1 | `.local/` gitignored before any corpus file | Done (first commit). **Real receipts are still pending from the owner.** |
| 2 | Normalizer in `packages/api-client/src/receipt-aliases.ts` | Done: umlaut/ß folding, price and pack-size stripping, house-brand prefixes as chain hints, abbreviation expansion. Table-driven synthetic fixtures added to `receipt-parsing.test.ts`. |
| 3 | Curated seed | Done as TS data (≥280 unique normalized aliases across the 10 existing category ids). Migration shape below is a **draft only**. Nothing was applied to dev, and no dry run has been done yet. |
| 4 | Offline measurement | Done: `src/sckrl-921-measure.test.ts`, gated by `SCKRL_921_MEASURE=1`. **Results below are on a SYNTHETIC corpus.** |
| 5 | Open Food Facts sample | Not started. Optional; needs Infrastructure agreement first. No scraping, no heisse-preise data. |
| 6 | This report | Done. |
| 7 | Board round 2 | Appended to `docs/council/SCKRL-921.md`. |

## Results: SYNTHETIC corpus (115 product lines; 40 BILLA, 40 HOFER, 35 LIDL)

> **Leakage disclosure (QA merge condition):** w3 wrote the corpus in the same session as the seed.
> Match methods: exact 46 (40%), token 57 (50%), fuzzy 3 (3%), none 9 (8%). The earlier claim that
> "about a quarter of lines are outside the seed" was wrong. The 46 exact lines are the **entire**
> auto@0.85 population, so the 100% there is circular. **Excluding exact matches** (69 lines):
> coverage 87.0% [77.0–93.0], precision 88.3% [77.8–94.2] (53/60), which is **below the 90% gate**.
> Per chain (excluding exact): BILLA 92.0% cov / 82.6% [62.9–93.0] prec; HOFER 77.8% / 90.5% [71.1–97.3];
> LIDL 94.1% / 93.8% [71.7–98.9]. The real-corpus run must report the same excluding-exact view. **These numbers cannot support a GO decision**; only the real-receipt run can.
> The seed was not tuned against the misses listed here.

Wilson 95% intervals in brackets.

| System | Coverage | Top-1 precision | Auto-accept @0.65 | Auto-accept @0.85 |
|---|---|---|---|---|
| Current regex parser | 100% (it always assigns, falling back to `pantry`) | **24.3%** [17.4–32.9] | 24.6% [17.6–33.2] | 75.0% [40.9–92.9] (n=8) |
| Seed + normalizer | **92.2%** [85.8–95.8] | **93.4%** [87.0–96.8] | 94.2% [88.0–97.3] | **100%** [92.3–100] (n=46) |
| Hybrid (seed, else regex) | 100% | 87.8% [80.6–92.6] | 88.5% [81.3–93.2] | 100% [92.3–100] |

Per chain, seed + normalizer:

| Chain | Coverage | Precision |
|---|---|---|
| BILLA | 95.0% [83.5–98.6] | 89.5% [75.9–95.8] |
| HOFER | 85.0% [70.9–92.9] | 94.1% [80.9–98.4] |
| LIDL | 97.1% [85.5–99.5] | 97.1% [85.1–99.5] |

Every chain is above 40% coverage.

**Error patterns** in the 16 seed misses:

- **Brand-only lines** with no category word: Woerle Happy Cow, Thea, Golden Bridge.
- **Compound words the seed doesn't contain**: Speisetopfen, Krauterbutter.
- **First-match category conflicts**:
  - Fischstaebchen/Lachsfilet TK came out as meat; want frozen.
  - Paprika edelsuess came out as produce; want spices.
  - Vollmilchschokolade came out as dairy; want snacks.
  - Marillen Konfitüre came out as produce; want pantry.
- **Dotted abbreviations**: PUTENBR.FILET and SONNENBL.OEL. The normalizer doesn't split on an inner dot.

The regex parser's own weakness is its `pantry` fallback, which is wrong about 75% of the time on Austrian lines.

## Go/no-go, against the board thresholds

| Gate | Board threshold | Synthetic result |
|---|---|---|
| Top-1 precision | ≥90% | 93.4% (CI low bound 87.0%) |
| Coverage | ≥60% | 92.2% |
| Auto-accept @0.85 | ≥95% | 100% (CI low bound 92.3%) |
| Coverage per chain | every chain ≥40% | yes |

On the synthetic set, every point estimate meets **GO**. The lower CI bounds for precision and
auto-accept do not clear their thresholds.

**Recommendation: CONDITIONAL GO, pending the real corpus.** Ship nothing to users until the
measurement is re-run on the owner's 20–30 redacted receipts. Real labels go in
`.local/receipt-corpus/labels.jsonl`; run with `SCKRL_921_CORPUS` pointing at that file. The
real-corpus gates are the board thresholds: GO / suggest-only marginal / NO-GO. If precision lands
at 85–90%, ship as suggest-only (never pre-selected).

Fixes to make before the real run, without overfitting:

- Split dotted abbreviations.
- Let "tk" and frozen-context tokens override the base category.
- Add "-schok"/"schokolade" compounds as snacks ahead of milk tokens.
- Use token-priority rules instead of first-match.

## Proposed first production increment (unchanged from the Backend proposal)

1. Migration: `create extension if not exists pg_trgm`, and add `public.product_aliases`. It should
   look roughly like this:

   ```
   product_aliases(id uuid pk, chain_id text null, alias_norm text not null, category_id text not null
     references item categories, origin text check (origin in ('seed','catalog','promoted')),
     confidence numeric, support_households int default 0,
     status text check (status in ('candidate','active','retired')) default 'active',
     created_at timestamptz default now(), unique (coalesce(chain_id,''), alias_norm))
   gin index on alias_norm gin_trgm_ops
   RLS: SELECT for authenticated; no insert/update/delete policies (migration and service role only).
   ```

2. A seed insert generated from `austrianAliasSeed` (normalized), with `origin = 'seed'`.
3. `match_receipt_aliases(text, chain)` SQL: exact chain alias → global exact match → `similarity ≥ 0.55`.
   This mirrors the TS matcher.
4. Additive `receipt_items` columns: `suggested_alias_id`, `match_method`, `match_score`. The
   311/312 contracts are unchanged. The check is the 311/312 contract tests plus the freeze-trigger test.
5. The user still confirms every category. Each suggestion carries a reason ("matched 'bergkaese'").

Before any apply:

- The draft migration must pass a rolled-back dry run, or the disposable-PG runner.
- QA must re-measure on real receipts.

Open Food Facts and prices stay out of scope for this increment.

## Reproduce

```bash
pnpm --filter @sackerl/api-client test
cd packages/api-client
SCKRL_921_MEASURE=1 pnpm exec vitest run src/sckrl-921-measure.test.ts
SCKRL_921_MEASURE=1 SCKRL_921_CORPUS=../../.local/receipt-corpus/labels.jsonl pnpm exec vitest run src/sckrl-921-measure.test.ts
```

## Round 3 fixes (Chair weigh-in conditions)

- **Provenance:** the seed is hand-curated vocabulary. It contains no scraped, catalog or heisse-preise data.
- **Normalizer:**
  - It runs `NFC` before the umlaut fold, then strips combining marks with `\p{M}`.
  - Non-item lines (Pfand, Leergut, Rabatt, totals, payment, tax) are filtered before matching.
  - `kar` and `schlag` expand only when dotted.
- **SQL parity:** `match_receipt_aliases` must apply the same NFC fold, non-item filter and per-token
  contiguous-phrase pass before any trigram step.
- **Draft schema corrections:**
  - A unique **expression index** on `(coalesce(chain_id,''), alias_norm)`, since PG14 has no NULLS NOT DISTINCT.
  - `category_id` gets an FK to the categories table.
  - The RLS SELECT policy covers `status = 'active'` rows only.
- **Next increment, not this one:** `alias_correction_signals`, with household-only RLS and k=5 / ≥80% agreement promotion via a service-role job.
- **Corpus hygiene:**
  - Keep `.local/receipt-corpus/` out of iCloud, Dropbox and other synced folders.
  - Delete it when the spike ends.
