# SCKRL-311 / SCKRL-912 inverse (down) migration

Updated: 2026-11-03 (SCKRL-914, F3). State: **reviewed source, NOT APPLIED anywhere hosted.**
Validated only on a disposable, socket-only local PostgreSQL 14 cluster (see
[Validation evidence](#validation-evidence)).

## Purpose and status

This is the emergency rollback for:

1. `supabase/migrations/20261102225020_sckrl_912_placement_error_codes.sql`
2. `supabase/migrations/20261015100000_sckrl_311_atomic_receipt_placement.sql`

After both inverses the schema equals a database migrated only through
`20260930100000_sckrl_312_receipt_expiry.sql` (verified by a normalized `pg_dump --schema-only`
comparison, no differences).

- It is **not** a routine migration and must never be placed in `supabase/migrations`.
- It is **destructive** (see [Data-loss caveats](#data-loss-caveats)).
- Running it against any hosted database (development or production) requires **explicit owner
  approval for that specific target and run**. This document does not grant that approval.
- Prefer a forward fix. Use this only when SCKRL-311 placement must be removed entirely.

The executable SQL has a single source each; this document links them rather than copying them:

| Order | File                                                                                 | Reverses |
| ----- | ------------------------------------------------------------------------------------ | -------- |
| 1     | [`supabase/tests/sckrl_912_inverse.sql`](../../supabase/tests/sckrl_912_inverse.sql) | 912      |
| 2     | [`supabase/tests/sckrl_311_inverse.sql`](../../supabase/tests/sckrl_311_inverse.sql) | 311      |

## Preconditions

All must be true before the owner approves a run:

1. **Backup.** A fresh logical backup (`pg_dump`) or point-in-time-restore marker of the target
   database, taken after writes are stopped and verified restorable. The dropped placement and
   acquisition-event rows exist only in this backup afterwards.
2. **Maintenance window.** Writers stopped. The 311 inverse takes `ACCESS EXCLUSIVE` locks on
   `items`, `receipts`, `receipt_items`, `receipt_parse_generations`, `receipt_placements` and
   `inventory_acquisition_events` for the whole transaction.
3. **App version.** Web and mobile builds that no longer call the placement surface are deployed
   first: `POST/GET /receipts/[id]/placement` and `GET /receipts/pending-placement` (the
   `finalize_receipt_placement`, `get_receipt_placement` and `list_unplaced_receipt_reviews`
   RPCs). Any client still calling them gets "function does not exist" errors after rollback.
   Receipt review (`save_receipt_review`, `promote_receipt_parse`, `mark_receipt_parse_failed`)
   keeps the same signatures and keeps working.
4. **Baseline check.** The target has exactly 311 and 912 installed (both inverse files abort
   otherwise) and no later migration that depends on 311 objects. If a migration newer than
   `20261102225020` exists, this inverse must be re-reviewed first.
5. **Data snapshot.** Record the counts in [Verification queries](#verification-queries) (before)
   so the retained stock can be reconciled.

## Order of operations

1. Take and verify the backup; stop writers; deploy the app version without placement calls.
2. Run the before-counts from [Verification queries](#verification-queries).
3. Apply the 912 inverse, then the 311 inverse. Each file has its own `begin; ... commit;` and a
   guard that aborts if the expected objects are missing. Do not add `--single-transaction`.

   ```sh
   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_912_inverse.sql
   psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_311_inverse.sql
   ```

4. Run the after-checks in [Verification queries](#verification-queries).
5. **Owner step:** clear the migration-history rows (see
   [Migration history](#migration-history-owner-step)).
6. Resume writers.

If step 3 fails partway, the failing file rolls back as a unit. After a 912-inverse success and a
311-inverse failure the database is in the exact SCKRL-311 state, which is a supported state.

## Inverse design

### 912 inverse

SCKRL-912 only `create or replace`d two SCKRL-311 functions (identical signatures, `security
definer`, `search_path`) and re-stated their grants. The inverse re-creates the exact SCKRL-311
bodies of `guard_item_receipt_lineage()` and `finalize_receipt_placement(...)`, copied verbatim
from lines 104-152 and 336-601 of the 311 migration, and re-states the same (unchanged) grants.
Step 1 is required so that the system passes through the exact, validated SCKRL-311 state; the
311 inverse then drops both functions.

### 311 inverse

SCKRL-311 did not rewrite the legacy RPC bodies. It renamed the 310/312 implementations to
`save_receipt_review_before_311`, `promote_receipt_parse_before_311` and
`mark_receipt_parse_failed_before_311`, revoked all their grants, and added same-signature
wrappers that call `assert_receipt_unplaced` first. The inverse therefore restores the earlier
definitions exactly by:

1. Dropping `list_unplaced_receipt_reviews`, `get_receipt_placement`,
   `finalize_receipt_placement`.
2. Dropping the three wrappers and `assert_receipt_unplaced`, renaming the `*_before_311`
   functions back (`ALTER FUNCTION ... RENAME` keeps body, owner, `security definer` and
   `search_path`), and restoring the pre-311 ACL: execute for `service_role` (from schema default
   privileges, never revoked by 310/312) then `authenticated`, in that order so the ACL matches
   the 312 baseline byte for byte.
3. Dropping the placed-receipt freeze triggers and functions on `receipts`, `receipt_items` and
   `receipt_parse_generations`.
4. Dropping `inventory_acquisition_events` then `receipt_placements` (their RLS policies, index,
   constraints and immutability triggers go with them) and the two immutability functions.
5. Dropping the `guard_item_receipt_lineage_on_write` trigger and function, then
   `items.source_receipt_item_id` (its unique key and foreign key go with it).
6. Replacing 311's column-level `insert`/`update` grants on `items` with the pre-311 table-level
   privileges (`insert, update` to `anon`, `authenticated`, `service_role`, as produced by the
   schema default privileges). 311's `grant delete, select` was already implied pre-311 and needs
   no change. Table comments added by 311 disappear with the dropped objects.

The functions 311 redefined were checked against their sources: `save_receipt_review` (310, then
replaced by 312), `promote_receipt_parse` and `mark_receipt_parse_failed` (310). 406 did not
redefine any function that 311 touched. No other pre-existing function was replaced by 311.

## Data-loss caveats

- **`receipt_placements` is dropped.** Every committed placement command, its normalized input,
  placer, timestamp and original result is lost (backup only).
- **`inventory_acquisition_events` is dropped.** All acquisition facts (quantity, zone, actor,
  time, idempotency key) are lost (backup only).
- **`items.source_receipt_item_id` is dropped.** The link from stock to the receipt line it came
  from is lost; it cannot be reconstructed reliably later.
- **Stock created by placement is kept.** Those `items` rows remain as ordinary
  `source = 'receipt'` stock in their zones with their quantity, category, expiry and expiry
  facts; only lineage is removed. Users keep their groceries. They are indistinguishable from
  pre-311 receipt stock.
- **Placed-receipt freeze guards are removed.** Receipts that were placed become editable again
  through review/promote/mark-failed, and `list_unplaced_receipt_reviews` no longer exists. A
  later re-forward of 311 will see those receipts as unplaced, so re-placing one would create
  duplicate stock. Before re-forwarding, the owner must decide how to treat formerly placed
  receipts (for example restore placements from backup or mark them out of band).
- **Item write grants widen back** to the pre-311 table-level grants: clients could again write
  every `items` column (now that `source_receipt_item_id` no longer exists this matches pre-311
  exactly).

## Migration history (owner step)

The inverse files do not touch `supabase_migrations.schema_migrations`. Without this step the
Supabase CLI believes 311 and 912 are still applied and will not re-apply them. Only the owner
runs this, in the same maintenance window, after the after-checks pass:

```sql
begin;
select version, name from supabase_migrations.schema_migrations
 where version in ('20261015100000', '20261102225020') order by version;
-- Expect exactly these two rows. Otherwise rollback and stop.
delete from supabase_migrations.schema_migrations
 where version in ('20261015100000', '20261102225020');
commit;
```

## Verification queries

Before (and record) on the target:

```sql
select (select count(*) from public.receipt_placements) as placements,
       (select count(*) from public.inventory_acquisition_events) as acquisition_events,
       (select count(*) from public.items where source_receipt_item_id is not null) as linked_items,
       (select count(*) from public.items) as items,
       (select count(*) from public.items where source = 'receipt') as receipt_items;
```

After both inverses:

```sql
-- Every 311 object is gone (all columns null / false).
select to_regclass('public.receipt_placements') as placements,
       to_regclass('public.inventory_acquisition_events') as events,
       exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'items'
                 and column_name = 'source_receipt_item_id') as lineage_column,
       to_regprocedure('public.finalize_receipt_placement(uuid, uuid, uuid, integer, uuid, jsonb)') as finalize,
       to_regprocedure('public.get_receipt_placement(uuid, uuid, uuid)') as get_placement,
       to_regprocedure('public.list_unplaced_receipt_reviews(uuid, integer, integer)') as list_unplaced,
       to_regprocedure('public.assert_receipt_unplaced(uuid, uuid)') as assert_unplaced;

select proname from pg_proc
 where pronamespace = 'public'::regnamespace
   and (proname like '%before_311' or proname like 'guard_placed_receipt_%'
        or proname in ('guard_item_receipt_lineage', 'guard_receipt_placement_immutable',
                       'guard_acquisition_event_immutable'));   -- expect 0 rows

select tgname from pg_trigger
 where not tgisinternal and tgname in (
   'guard_item_receipt_lineage_on_write', 'guard_placed_receipt_header_on_update',
   'guard_placed_receipt_line_on_write', 'guard_placed_receipt_generation_on_write');  -- 0 rows

-- Legacy RPCs: restored originals (no assert_receipt_unplaced call), security definer, ACL.
select p.oid::regprocedure, p.prosecdef, p.proconfig, p.proacl,
       position('assert_receipt_unplaced' in p.prosrc) = 0 as original_body,
       md5(p.prosrc) as body_md5
  from pg_proc p
 where p.pronamespace = 'public'::regnamespace
   and p.proname in ('save_receipt_review', 'promote_receipt_parse', 'mark_receipt_parse_failed');
-- Expect prosecdef = true, proconfig = {"search_path=public, pg_temp"}, original_body = true,
-- proacl = {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres} (owner may
-- differ on hosted), and body_md5 equal to the same query on a 312-only reference database.

-- items grants: table-level insert/update again, no column-level ACLs left.
select grantee, string_agg(privilege_type, ',' order by privilege_type)
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'items'
 group by grantee order by grantee;
select count(*) as column_acls from pg_attribute
 where attrelid = 'public.items'::regclass and attacl is not null;   -- expect 0

-- Stock retained: equals the "before" items / receipt_items counts.
select (select count(*) from public.items) as items,
       (select count(*) from public.items where source = 'receipt') as receipt_items;
```

After the owner history step:

```sql
select count(*) from supabase_migrations.schema_migrations
 where version in ('20261015100000', '20261102225020');   -- expect 0
```

## Validation evidence

Disposable only: PostgreSQL 14.20 (`/opt/homebrew/opt/postgresql@14/bin`), `initdb` under
`/private/tmp/claude-501/sckrl914/data`, `listen_addresses=''` (Unix socket only, mode 0700,
port 55491), trust auth for the local socket only, `env -i PATH=... LC_ALL=C` (no `DATABASE_URL`,
`PG*` or `.env` values). Replay mechanics follow `supabase/tests/run_sql_suite.py`:
`local_bootstrap.sql`, then each migration with `psql -X -v ON_ERROR_STOP=1 --single-transaction`,
loading the ticket's legacy seed immediately before that ticket's migration. The cluster was
stopped and its directory deleted afterwards.

| Step | Database          | What ran                                                                                                                                                                                    | Result                                                      |
| ---- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| A1   | `inv`             | bootstrap, all migrations (311 seed before 311), `sckrl_311_legacy_assert`, `sckrl_311_placement_commands`                                                                                  | pass                                                        |
| A2   | `inv`             | `sckrl_311_placement_commands` with its final `rollback` changed to `commit` (scratch copy) to leave placed data                                                                            | 2 placements, 3 acquisition events, 3 linked items, 4 items |
| A3   | `inv`             | `sckrl_912_inverse.sql`, `sckrl_311_inverse.sql`                                                                                                                                            | pass; 4 items kept, all `source = 'receipt'`, tables gone   |
| R    | `ref312`          | bootstrap, migrations through `20260930100000_sckrl_312` only                                                                                                                               | reference                                                   |
| D1   | `inv` vs `ref312` | `pg_dump --schema-only` (comments included), drop `--` lines, blank lines, `SET`, `set_config` and `\restrict`/`\unrestrict` token lines; `diff -u`                                         | **identical**                                               |
| G1   | `reg310`          | 310 seed, all migrations, 310 legacy assert, both inverses, 310 legacy assert, `sckrl_310_review_commands`, `sckrl_310_adversarial`                                                         | pass                                                        |
| G2   | `reg312`          | same pattern with 312 seed, `sckrl_312_legacy_assert`, `sckrl_312_receipt_expiry`                                                                                                           | pass                                                        |
| G3   | `reg406`          | same pattern with 406 seed, `sckrl_406_legacy_assert`, `sckrl_406_expiry_commands`, `sckrl_406_adversarial`                                                                                 | pass                                                        |
| F1   | `inv`             | re-apply 311 then 912 forward (`--single-transaction`)                                                                                                                                      | pass                                                        |
| F2   | `inv`             | `sckrl_311_placement_commands`, `sckrl_912_error_codes`                                                                                                                                     | pass                                                        |
| F3   | `inv`             | `sckrl_311_legacy_assert`, `sckrl_311_adversarial`                                                                                                                                          | fail as expected (see below)                                |
| B1   | `rt`              | 311 seed, all migrations, legacy assert, both inverses, 311 + 912 forward, then `sckrl_311_legacy_assert`, `sckrl_311_placement_commands`, `sckrl_311_adversarial`, `sckrl_912_error_codes` | all pass                                                    |
| D2   | `rt` vs `full`    | normalized schema dump after the round trip vs a fresh replay of all migrations                                                                                                             | **identical**                                               |

The first comparison found one difference that was then fixed: the restored legacy RPC ACLs listed
`authenticated` before `service_role`. The inverse now grants `service_role` first, matching the
312 baseline order; D1 is then identical.

Why F3 fails on `inv` and is not a defect: `sckrl_311_legacy_assert` and the receipt-deletion
check in `sckrl_311_adversarial` assert the exact upgrade state of the 311 seed (one item in the
seed household). On `inv` the three items committed by placement in A2 intentionally survive the
rollback as unlinked receipt stock, so the household has four items before those fixtures run
and their exact counts no longer hold. On `rt`, which has no committed placement before rollback,
the full 311 fixture set including `sckrl_311_legacy_assert` passes after the round trip.

Reproduction outline (run from the repository root; `PGBIN` is a PostgreSQL 14 bin directory):

```sh
W=/private/tmp/sckrl914; mkdir -p "$W/s"; chmod 700 "$W/s"
E="env -i PATH=$PGBIN:/usr/bin:/bin LC_ALL=C PGCONNECT_TIMEOUT=5"
$E initdb -D "$W/data" -U postgres --auth-local=trust --auth-host=reject -E UTF8 --no-locale
$E pg_ctl -D "$W/data" -l "$W/server.log" \
  -o "-k $W/s -p 55491 -c listen_addresses='' -c unix_socket_permissions=0700" -w start
Q="$E psql -X -w -v ON_ERROR_STOP=1 -h $W/s -p 55491 -U postgres"
$E createdb -h "$W/s" -p 55491 -U postgres inv
$Q -d inv -f supabase/tests/local_bootstrap.sql
# for each migration in order (load sckrl_311_legacy_seed.sql right before the 311 migration):
#   $Q -d inv --single-transaction -f supabase/migrations/<file>
$Q -d inv -f supabase/tests/sckrl_912_inverse.sql
$Q -d inv -f supabase/tests/sckrl_311_inverse.sql
# repeat bootstrap + migrations through 20260930100000_sckrl_312 into ref312, then:
$E pg_dump -h "$W/s" -p 55491 -U postgres --schema-only inv | \
  grep -vE '^--|^$|^SET |^SELECT pg_catalog.set_config|^.(un)?restrict ' > inv.sql   # same for ref312
diff -u ref312.sql inv.sql
$E pg_ctl -D "$W/data" -m immediate -w stop && rm -rf "$W"
```

## Known limits

- The local bootstrap emulates Supabase roles and default privileges. On a hosted database,
  compare the restored function and `items` ACLs with a pre-311 snapshot (for example the
  SCKRL-312 development postcommit metadata) before declaring success; owners other than
  `postgres` are expected to differ.
- The schema diff covers DDL, ACLs and comments, not row data; retained stock is checked by the
  count queries only.
- The concurrency suite (`sckrl_311_concurrency.py`) was not rerun for the round trip.
