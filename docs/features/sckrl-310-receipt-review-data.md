# SCKRL-310 receipt review data contract

SCKRL-310 upgrades the SCKRL-303 receipt parser output into durable review data for SCKRL-304. It follows ADR-0001: parser promotion and review saves are server-owned commands, parser evidence stays immutable, and review state is separate from confidence.

## Data model

`receipts` now carries the active review token:

- `active_parse_generation_id`: the promoted parse generation currently shown to users. It is a composite foreign key back to the same receipt and household.
- `review_status`: `not_started`, `needs_review`, or `reviewed`.
- `review_revision`: integer optimistic revision. It starts at `0` and increments once for each successful review save.
- `reviewed_at` / `reviewed_by`: set only when every active line is reviewed.

`receipt_parse_generations` stores each promoted parse attempt. Old generations are retained so a failed or stale promotion does not delete the previous active evidence.

`receipt_items` now belong to one generation and expose two value groups:

- Immutable parser evidence: `raw_text`, `inferred_name`, `qty_value`, `qty_unit`, `category_id`, `confidence`, `confidence_level`, `parser_version`, and nullable `inferred_line_total_cents`, `inferred_unit_price_cents`, `inferred_discount_cents`, `inferred_tax_cents`.
- Editable review values: `corrected_name`, `corrected_qty_value`, `corrected_qty_unit`, `corrected_category_id`, plus `included`, `review_state`, `corrected_at`, `corrected_by`, `reviewed_at`, and `reviewed_by`.

Manual additions use `source = 'manual'`, a stable `client_line_id`, null parser evidence, and corrected values for the user-entered item. Parser lines use `source = 'parser'`, non-null raw/inferred fields, and null `client_line_id`. Actor UUIDs are retained as stable provenance values for generated, corrected, and reviewed states; receipt and household deletion still cascade the receipt data itself, but account deletion does not rewrite those historical actor values.

The financial line fields are read-only parser evidence in this ticket. `null` means unknown or not extracted; it never means zero. SCKRL-304 should display these values only if present and should not submit edits for money fields.

## Command RPCs

All commands require `auth.uid()` and household membership.

### `get_receipt_review(p_household_id, p_receipt_id)`

Returns one JSON snapshot:

```json
{
  "receipt": { "id": "...", "active_parse_generation_id": "...", "review_revision": 0 },
  "items": [{ "id": "...", "generation_id": "...", "review_state": "unresolved" }]
}
```

The snapshot is read in one database statement, so the returned rows and receipt revision belong together.

### `promote_receipt_parse(...)`

Inputs include `p_expected_active_generation_id` and `p_expected_review_revision`. The command locks the receipt, checks those values, inserts one complete generation and all parser lines, updates the receipt header and active generation pointer, resets review revision to `0`, and returns the same review snapshot shape.

A stale expected generation or revision raises `PT409`. Promotion also raises `PT409` after any review save has incremented `review_revision`, even when the caller has a fresh token, because replacing a reviewed/drafted active generation would hide accepted corrections and manual lines. Deliberate reparse/reset or merge behavior is deferred to SCKRL-309/SCKRL-304. The previous active generation and receipt header remain unchanged when promotion fails.

### `save_receipt_review(...)`

Inputs include `p_generation_id`, `p_expected_review_revision`, and full editable line values. Every existing active line ID must appear exactly once. Duplicate, missing, foreign, or stale lines raise `PT409` and mutate nothing. New manual lines use `client_line_id` and are appended to the active generation.

A successful save updates the effective corrections, preserves existing correction/review timestamps when a line is unchanged, increments `review_revision` once, and returns the new review snapshot.

### `mark_receipt_parse_failed(...)`

This conditional failure command uses the same expected active generation and review revision token. It marks an unpromoted receipt as `failed`, but returns `PT409` if another parse already promoted a generation, which prevents a failed loser from wiping a concurrent success.

## TypeScript client contract

`packages/api-client` exposes `ReceiptReview`:

```ts
type ReceiptReview = {
  readonly receipt: Receipt;
  readonly items: readonly ReceiptItem[];
  readonly summary: ReceiptReviewSummary;
};
```

Each `ReceiptItem` exposes immutable fields with `inferred*` names, editable values with `corrected*` names, and UI-ready `effectiveName`, `effectiveQtyValue`, `effectiveQtyUnit`, and `effectiveCategoryId` values. `confidence` and `confidenceLevel` describe parser confidence only. `reviewState` and `included` control review completion.

`ReceiptReviewSummary.unresolvedFields` is typed as `{ itemId, field }[]`, where `field` is one of `reviewState`, `name`, `qtyValue`, `qtyUnit`, or `categoryId`.

Review saves use a discriminated union:

```ts
type SaveReceiptReviewLineInput =
  | {
      id: string;
      clientLineId?: undefined;
      name: string;
      qtyValue: number;
      qtyUnit: ItemQuantityUnit;
      categoryId: ItemCategoryId;
      included: boolean;
      reviewState: ReceiptItemReviewState;
    }
  | {
      clientLineId: string;
      id?: undefined;
      name: string;
      qtyValue: number;
      qtyUnit: ItemQuantityUnit;
      categoryId: ItemCategoryId;
      included: boolean;
      reviewState: ReceiptItemReviewState;
    };
```

The web route `GET /receipts/:id/items` returns `{ review, items }` so older item-list callers can keep reading `items` while SCKRL-304 adopts the full snapshot. `PUT /receipts/:id/items` accepts `{ generationId, expectedReviewRevision, lines }` and returns `{ review }`.

## Migration and validation notes

Legacy SCKRL-303 receipt lines are backfilled into one `legacy-sckrl-303` generation per receipt, remain `unresolved`, and retain null financial fields unless the parser previously stored data. The migration revokes direct insert/update/delete/truncate paths for review-owned tables from app roles and grants only authenticated reads plus bounded receipt create/update columns. Review mutations must go through the RPCs.

Owned SQL replay fixtures:

- `supabase/tests/sckrl_310_legacy_seed.sql` seeds pre-upgrade parsed rows.
- `supabase/tests/sckrl_310_legacy_assert.sql` verifies legacy backfill.
- `supabase/tests/sckrl_310_review_commands.sql` verifies command conflicts, manual provenance, immutable parser evidence, conditional failed-state behavior, and direct mutation denial.

Out of scope for this ticket: OCR/media providers, durable job attempts, receipt placement into stock, expiry placement, mobile review UI, and financial editing tri-state behavior.

## Local acceptance (2026-09-13)

Accepted by independent QA, Infrastructure and integration review. Validation passed 102 workspace
tests, typecheck, lint, formatting, Next production build, populated/clean PostgreSQL replay,
legacy preservation, and both command/adversarial SQL fixtures. Manual parser-null defaults and
post-review reprocessing were corrected from actual SQL QA findings. Test fixtures roll back
synthetic changes and fail when an assertion evaluates to null.

The database evidence uses a disposable PostgreSQL instance with an auth stub and Supabase-like
grants. Hosted Supabase/Auth/PostgREST, provider/device journeys and deployment were not exercised.
The migration must be applied to the target environment before the new client/API code runs there.
