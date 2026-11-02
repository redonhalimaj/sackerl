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

### Infrastructure (Sonnet 5): pending
