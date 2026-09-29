---
tags: [code-map, api, database, supabase]
---

# API and Database

See [[Sackerl Code Map]], [[Authentication and Household]], [[Receipt Pipeline]], [[Stock and Expiry]], [[Recipes and Shopping]], and [[Shared UI]]. Supabase Auth plus Supabase/Postgres is the current provider boundary.

```mermaid
flowchart TB
  Mobile[Expo mobile screens] --> Shared[packages/api-client]
  Web[Next App Router routes] --> Auth[getRequestAuthContext]
  Auth --> Shared
  Shared --> CRUD[Supabase PostgREST tables]
  Shared --> RPC[Supabase PostgREST RPC endpoints]
  CRUD --> DB[(Postgres + RLS)]
  RPC --> DB
```

## Runtime boundaries

| Caller            | Boundary                                                                      | Current behavior                                                                                                                                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile            | `apps/mobile` → shared client → Supabase REST                                 | Direct authenticated PostgREST CRUD for profile, household, zones, stock, receipts, recipes, and shopping lists. See [`items.ts`](../../packages/api-client/src/items.ts) and [`profile.ts`](../../packages/api-client/src/profile.ts). |
| Web               | Next route → `getRequestAuthContext` → shared client → Supabase REST/RPC      | Route handlers validate the bearer token through Supabase Auth, resolve household membership, then return JSON. See [`api-auth.ts`](../../apps/web/lib/api-auth.ts).                                                                    |
| Review commands   | Either client → `/rest/v1/rpc/*` → Postgres function                          | SCKRL-310 review reads and writes are server-owned RPCs, not direct table mutations. See [`requestRpcJson`](../../packages/api-client/src/receipts.ts).                                                                                 |
| Expiry provenance | Either client → PostgREST item write → `before` trigger → `item_expiry_facts` | SCKRL-406 keeps the existing direct item writes and records provenance inside the same statement. Callers state it with the write-only `items.expiry_declaration` column; an undeclared write is recorded as `inferred`.                |

Direct PostgREST CRUD is appropriate for ordinary resource operations: `SackerlItemsClient.listItems/createItem/updateItem/deleteItem`, `SackerlProfileClient.getMe/ensureMe/updateMe`, `SackerlShoppingListClient.listItems/createItem/updateItem/deleteItem`, `SackerlReceiptsClient.createReceipt/listReceipts/getReceipt/updateReceipt`, and recipe reads. Receipt review uses the new commands `get_receipt_review`, `promote_receipt_parse`, `mark_receipt_parse_failed`, and `save_receipt_review`; their client methods are `getReceiptReview`, `promoteReceiptParse`, `markReceiptParseFailed`, and `saveReceiptReview`.

## HTTP route surface

| Area     | Routes                                                                                                                      | Implementation                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Identity | `GET/PATCH /me`, `GET/PATCH /household`                                                                                     | [`me/route.ts`](../../apps/web/app/me/route.ts), [`household/route.ts`](../../apps/web/app/household/route.ts) |
| Stock    | `GET/POST /items`, `POST /items/batch`, `PATCH/DELETE /items/:id`, `GET /items/removal-stats`                               | [`apps/web/app/items`](../../apps/web/app/items/route.ts)                                                      |
| Receipts | `GET/POST /receipts`, `POST /receipts/:id/parse`, `GET/PUT /receipts/:id/items`                                             | [`apps/web/app/receipts`](../../apps/web/app/receipts/route.ts)                                                |
| Recipes  | `GET /suggestions`                                                                                                          | [`suggestions/route.ts`](../../apps/web/app/suggestions/route.ts)                                              |
| Shopping | `GET/POST /shopping-list`, `POST /shopping-list/batch`, `PATCH/DELETE /shopping-list/:id`, `GET /shopping-list/suggestions` | [`apps/web/app/shopping-list`](../../apps/web/app/shopping-list/route.ts)                                      |

## Persistence map

| Migration                                                                                                                        | Durable boundary                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`20260524211500_sckrl_009_profile_households.sql`](../../supabase/migrations/20260524211500_sckrl_009_profile_households.sql)   | `users`, `households`, `household_members`, auth-user profile trigger, and user/owner RLS policies.                                                                                  |
| [`20260531110000_sckrl_102_household_zones.sql`](../../supabase/migrations/20260531110000_sckrl_102_household_zones.sql)         | Adds `households.zones` as a non-empty `text[]` with default fridge, pantry, basement, and freezer values.                                                                           |
| [`20260531203000_sckrl_201_item_data_model.sql`](../../supabase/migrations/20260531203000_sckrl_201_item_data_model.sql)         | Adds global `categories`, normalized `zones`, zone sync helpers/triggers, `items`, membership helper, and stock RLS.                                                                 |
| [SCKRL-415 removal outcomes](../../supabase/migrations/20260607100000_sckrl_415_item_removal_outcomes.sql)                       | Adds used/composted removal reason metadata to stock items.                                                                                                                          |
| [SCKRL-501 recipes](../../supabase/migrations/20260611100000_sckrl_501_recipes.sql)                                              | Global recipe records, seed recipes and read policies.                                                                                                                               |
| [SCKRL-511 shopping lists](../../supabase/migrations/20260612100000_sckrl_511_shopping_list.sql)                                 | Household shopping-list rows, source/quantity data and RLS.                                                                                                                          |
| [Shopping-list idempotency](../../supabase/migrations/20260621100000_sckrl_511_shopping_list_idempotency.sql)                    | Unique active recipe-sourced entries for retry-safe batch insertion.                                                                                                                 |
| [`20260621110000_sckrl_302_receipts.sql`](../../supabase/migrations/20260621110000_sckrl_302_receipts.sql)                       | `receipts`, receipt status enum, timestamps, indexes, household RLS.                                                                                                                 |
| [`20260804100000_sckrl_303_receipt_parsing.sql`](../../supabase/migrations/20260804100000_sckrl_303_receipt_parsing.sql)         | `receipt_items`, parsed metadata, confidence, receipt-item RLS.                                                                                                                      |
| [`20260911110000_sckrl_310_receipt_review_data.sql`](../../supabase/migrations/20260911110000_sckrl_310_receipt_review_data.sql) | Parse generations, review enums/columns, legacy backfill, grants, four RPC commands.                                                                                                 |
| [`20260916100000_sckrl_406_expiry_provenance.sql`](../../supabase/migrations/20260916100000_sckrl_406_expiry_provenance.sql)     | Append-only `item_expiry_facts`, item projection and declaration columns, the sync and history-guard triggers, `households.calendar_time_zone`, legacy backfill, select-only grants. |

Stock, receipt, zone, and shopping-list rows carry `household_id` and use household-membership checks where their migrations define them. `users`, `households`, and `household_members` use user/owner policies, with member household SELECT added by SCKRL-406; categories and recipes are not universally household-scoped. The SCKRL-310 migration revokes authenticated direct insert/update/delete access for review-owned rows and exposes authenticated reads plus bounded receipt header writes. Its schema is required before using the new review RPCs. Codex has not applied it; hosted migration state must be verified separately.

SCKRL-406 adds `item_expiry_facts`: household scoped, select-only for `authenticated`, protected by
a guard trigger that rejects direct history deletion and every update other than the supersede transition, with
composite household-scoped foreign keys so a cross-household reference is not expressible.
`recorded_by`, `recorded_at`, `confirmed_by`, `confirmed_at`, `origin` and the supersede chain are
database owned and discarded if a client sends them; `households.calendar_time_zone` defaults to the
existing `Europe/Vienna` pilot value and is validated against `pg_timezone_names`. Its migration is
present locally and has **not** been applied by Codex, like SCKRL-310's. The owner reported a
hosted SQL fixture run on 2026-09-27; their actual migration state is unverified. Contract:
[docs/features/sckrl-406-expiry-provenance.md](../features/sckrl-406-expiry-provenance.md).

Codex return corrections preserve explicit null expectations (expect no active fact), make
confirmation of unknown-origin dates a new user assertion, normalize confidence before retry
comparison, and order history by database-owned `fact_sequence`. A parent hard delete can cascade
history; ordinary Used/Compost actions retain it. Mobile Settings updates the household calendar,
and [[Recipes and Shopping]] describes its consumers. The pending migration also permits members
to SELECT their household through `is_household_member`, while UPDATE remains owner-only.

The database is the source of truth for atomicity and conflict handling. TypeScript maps snake_case rows to camelCase models and computes UI-ready effective values in [`mapReceiptItemRow`](../../packages/api-client/src/receipts.ts), while SQL functions return one receipt-plus-items snapshot.

Use [[Method Index]] for every exported method and [[Maintenance]] when a route, client contract, migration, RLS policy, or RPC changes.
