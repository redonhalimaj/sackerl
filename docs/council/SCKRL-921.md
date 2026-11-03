# Council board: SCKRL-921, Austrian retailer catalog and receipt-alias spike

## Round 0: Chair / Orchestrator

**Question:** Can we seed product categorization from Austrian retailer catalogs (BILLA, HOFER, LIDL, plus
SPAR and PENNY if cheap), so that brand-named and abbreviated receipt lines are categorized automatically?
That same catalog would later enable price comparison and cheaper-deal suggestions.

This is an early, time-boxed discovery for `PROGRAM.md` P2.1 (product normalization) and P2.4 (price and
retailer history). It doesn't displace Stage 1 (SCKRL-305 placement UI, 308/307/309 media and OCR).

**Acceptance criteria for the spike:**

1. **Data sources:** an inventory of candidate sources with their coverage. Candidates include Open Food Facts, community Austrian price trackers (e.g. "heisse-preise"), official or partner feeds and the chains' own public pages. For each, record coverage of chains, fields (name, brand, pack size, category, EAN, price, history), freshness, licence, and terms-of-service and EU database-right risk. Name a recommended source path.
2. **Schema proposal:** `retail_chains`, `retail_products`, `product_aliases (chain, receipt_text_normalized → product)`, `price_observations`, plus the mapping to Sackerl categories. Show how this fits the existing `receipt_items` and categories without breaking 311/312 contracts.
3. **Matching pipeline proposal:** exact chain alias → normalized fuzzy match → optional AI fallback → mandatory user confirmation. Define how confirmed corrections become shared aliases without leaking household data.
4. **Measurement plan:** match rate on 20–30 real BILLA/HOFER/LIDL receipts, using precision of the auto-category, coverage and correction rate. Real receipts are pending from the owner.
5. **Placement:** where this slots into the roadmap, and what the smallest shippable first increment is.

**Seats:**

- Backend (Opus): schema, matching, contract fit.
- Infrastructure (Sonnet 5): data sources, licensing, ingestion and refresh.
- QA (Sonnet 5): measurement design and acceptance.

**Out of scope:** scraping implementation, hosted writes, new dependencies.

## Round 1

These seats were started by the Chair session on 2026-11-03.

### Backend (Opus): AGREE

- **Today:**
  - Categories come from about 10 keyword regexes, falling back to `pantry`.
  - Placement uses `coalesce(corrected_category_id, category_id)`.
  - `pg_trgm` is not enabled yet.
- **Schema:**
  - Reference tables: `retail_chains`, `retail_products` (with `source`, `source_license`), `product_aliases(chain_id null, alias_norm, product_id null, category_id, origin seed|catalog|promoted, confidence, support_households, status candidate|active|retired)` and `price_observations` (from catalog data only).
  - Authenticated users can SELECT the reference tables. Only migrations or the service role write them.
  - Household signals go in a separate `alias_correction_signals` table with household-only RLS.
  - `receipt_items` gets additive columns (`suggested_product_id`, `suggested_alias_id`, `match_method`, `match_score`), written at parse time.
  - The 311/312 contracts are unchanged, and the existing freeze trigger covers the new columns.
- **Pipeline:**
  - The api-client normalizer folds umlauts and ß, strips pack sizes and prices, and strips house-brand prefixes (Clever, S-Budget, Milsani, Spar, Ja! Natürlich), keeping each as a chain hint. It then expands abbreviations (vollm → vollmilch).
  - A SQL `match_receipt_aliases` tries exact chain alias, then a global exact match, then `pg_trgm` at ≥0.55. The score maps onto the existing confidence tiers.
  - The AI fallback comes later, behind a flag, and produces needs_review only.
  - Promotion is a service-role job: ≥5 distinct households with ≥80% agreement. It copies normalized text and category only.
- **First increment:**
  - A `product_aliases` table plus `pg_trgm`.
  - A curated seed of about 300 Austrian receipt tokens.
  - The normalizer and lookup feeding `category_id` at parse time.
  - No catalog is needed.
- **Asks:**
  - Infrastructure: does the licence allow storing derived mappings?
  - QA: measure seed-only against the regex baseline first.

### QA (Sonnet 5): AGREE

- **Corpus:**
  - At least 8 receipts each from BILLA, HOFER and LIDL.
  - Redact name, card and loyalty details, cashier and store; keep chain, month and line text.
  - Store them in ignored `.local/receipt-corpus/`, which must be gitignored before the first file. Committed fixtures are synthetic only.
- **Ground truth:**
  - JSONL per line: chain, raw_text, is_product, canonical_product, category_id.
  - A second labeller on a 20% sample, against a frozen category list.
- **Metrics:**
  - Coverage, top-1 precision, auto-accept precision at 0.65 and 0.85, and correction rate.
  - Reported per chain against the current parser baseline, with Wilson 95% intervals.
- **Go/no-go:**
  - **GO:** precision ≥90% at coverage ≥60%, high-tier auto-accept precision ≥95%, and every chain at ≥40% coverage.
  - **Marginal (suggest-only):** precision 85–90% or coverage 45–60%.
  - **NO-GO:** precision <85% or coverage <45%.
- **Fixtures:** table-driven German cases in `receipt-parsing.test.ts`: brand-only lines, abbreviations, weight lines, Pfand and Rabatt, an uncategorizable line, and an alias hit and miss.
- **Guardrails:**
  - The user always confirms.
  - Each suggestion carries a source enum and a reason.
  - Shared aliases need k-anonymity agreement and carry no PII.
- **Weak ACs:**
  - AC1 and AC5 have no pass criteria.
  - AC3 needs a field allowlist plus a k-anonymity test.
  - AC4 needs the thresholds above.
  - AC2 should name the 311/312 contract tests as its check.
- **Open questions:**
  - Promotion threshold: k=3 (QA) or k=5 (Backend)? To reconcile.
  - Owner consent for redacted receipts.

### Infrastructure (Sonnet 5): AGREE

Sources are marked V (verified) or I (inferred). Not legal advice.

- **Open Food Facts:**
  - Has EAN, brand, categories and pack size. No chains, and no usable prices.
  - ODbL (V): attribution, and share-alike if merged into another database.
  - Austrian own-brand coverage is likely patchy (I).
  - Risk: LOW as a separate, attributed lookup table.
- **heisse-preise:**
  - The code is MIT. It covers BILLA, SPAR, HOFER, LIDL, DM and MPREIS (V).
  - It has prices and history, but no visible EAN or category.
  - The data carries no reuse licence, because it is scraped (I).
  - Risk: MED-HIGH as a bulk source. LOW as a one-off offline sample to test matching.
- **Official sources:**
  - The BWB price API (2023) was not adopted.
  - The state price app was cancelled.
  - Statistik Austria launched "Preisradar" on 2026-01-19 (V). Product-level open data is unverified.
- **The chains' own sites:** no public APIs. The ToS couldn't be read (the BILLA fetch returned 500). Self-built scraping is HIGH risk (EU 96/9/EC sui generis right, UrhG §§76c–d, ToS, UWG).
- **Recommendation:**
  - **A (now):** Open Food Facts plus the owner's receipts plus user-confirmed aliases, categorization only.
  - **B (prices):** a licensed or partner feed, or written permission. Revisit Preisradar.
  - **C (no):** self-built scraping, or putting heisse-preise data into production, without counsel.
- **Asks:**
  - Backend: `source` and `licence` on every catalog row. Open Food Facts rows go in their own table. No `price_observations` until the licence is cleared.
  - Chair: counsel review before any price work.

Sources: github.com/badlogic/heissepreise; openfoodfacts.github.io/openfoodfacts-server/api/; bmf.gv.at preisradar press release (2026-01).

## Council Proposal (unanimous, round 1)

Proceed with a categorization-only spike on path A:

- Open Food Facts as a separate attributed table.
- A curated Austrian receipt-token seed.
- The normalizer plus `pg_trgm` matching.
- User-confirmed aliases.
- Prices are deferred to path B, after counsel review. No scraping.

Measurement and go/no-go follow the QA plan. Promotion threshold: the stricter k=5 households with ≥80% agreement (Backend). QA accepts that as stricter than its k=3.

## Chair weigh-in

**Vote: AGREE.** This is consistent with `PROGRAM.md` P2.1 and P2.4, the guardrails (the user confirms, suggestions explain why) and the owner's goals.

**Ratified 2026-11-03.** The spike is handed to the worker session **w3** for execution.

## Round 2: w3 implementation evidence (2026-11-03)

w3 (Claude Opus 5.5) executed the spike; see `docs/qa/sckrl-921-spike-report.md`.

- **Done:**
  - `.local/` is gitignored.
  - Normalizer and ~300-alias seed in `receipt-aliases.ts`.
  - Synthetic fixtures added to `receipt-parsing.test.ts`.
  - Gated measurement script.
  - Spike report.
- **Synthetic result** (115 lines; biased, cannot support GO), current parser vs seed+normalizer:
  - Precision: 24.3% → 93.4%.
  - Coverage: 92.2%.
  - Auto-accept @0.85: 100% (n=46).
- **Recommendation:** conditional GO, pending the real-corpus run.
- **Not done:**
  - Real corpus (waiting on the owner).
  - Migration dry run.
  - Open Food Facts sample, which needs Infrastructure's AGREE on this board first.
- **Asks:**
  - QA: confirm the measurement method. The regex parser always assigns a category, so its coverage is defined as 100%.
  - Backend: confirm the draft `product_aliases` shape in the report.
  - Infrastructure: agree or object to a one-off offline Open Food Facts sample.
- **Status:** awaiting seat votes (rounds 2–3), then the Chair's weigh-in. The implementer (w3) does not vote as QA.
