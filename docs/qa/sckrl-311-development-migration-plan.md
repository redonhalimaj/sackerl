# SCKRL-311 development installation and connected acceptance plan

Updated: 2026-11-01. State: **planning packet only**. On October 23 a connection was bound to the expected
development project for a limited read-only catalog probe, but the full preflight is incomplete;
neither migration execution nor connected Auth/PostgREST writes are authorized by this document.
SCKRL-311 remains Review and Stage 1 remains incomplete.

This packet defines the bounded evidence needed to install the accepted SCKRL-311 migration in a
development project and then exercise it through real Supabase Auth, PostgREST and the shared API
client. Disposable PostgreSQL evidence is already recorded in the
[database review](sckrl-311-database-review.md); it does not establish hosted schema state, target
identity, real authentication, PostgREST behavior or uncertain-response recovery.

## Target status and required authorization

The SCKRL-312 execution record from 2026-10-04 historically names development project
`raqqhpeailkxqvubgzir`, session pooler port `5432`, database `postgres`, user
`postgres.raqqhpeailkxqvubgzir`, and client TLS. On 2026-10-23, the bounded metadata-only inspector
below successfully bound the current read-only connection to that expected project and reported the
expected database identity, server, read-only mode and TLS 1.3. This binds the connection for this
limited probe; it does not complete the target/schema preflight or authorize a write. The target
therefore remains **unresolved for execution** pending exact prerequisite and baseline verification,
independent review, a frozen Council revision and explicit owner authorization.

Before any hosted write, obtain explicit owner authorization naming the verified development
project, the exact migration SHA-256 below, the bounded migration transaction, synthetic connected
fixture creation/placement/cleanup, and the operator. This packet itself grants no write permission.
Production, unrelated migrations, migration-history repair, deployment and publication are out of
scope. Safely parsing an available ignored local connection configuration is permitted for this
bounded preflight; do not source/evaluate it, print credentials, or search unrelated secret stores.
If the required configuration is unavailable or the target cannot be bound, stop and request owner
setup/authorization.

### Limited read-only development probe (2026-10-23)

The Chair ran `/private/tmp/sckrl311-dev-inspection-20261022.py` (SHA-256
`b4bc1ddd34f118a8257dba896d8551b8c685d39e665c9a511c2e46c76330aeed`). Its sanitized output is
`/private/tmp/sckrl311-dev-inspection-20261022.json` (SHA-256
`c16da7494c87b468a4dd54a592b69e46781aae78d6e9b517aa36266875a8a773`). The probe succeeded against
project `raqqhpeailkxqvubgzir`; it reported database `postgres`, role `postgres`, read-only mode,
server version `17.6`, and TLS 1.3. Catalog presence checks found no `items.source_receipt_item_id`,
`receipt_placements` table or `inventory_acquisition_events` table; the receipt expiry column and
`item_expiry_facts` table were present. It observed metadata for four prerequisite functions:
`get_receipt_review`, `mark_receipt_parse_failed`, `promote_receipt_parse` and
`save_receipt_review`.

This is a limited catalog-presence and connection-identity observation, not the full preflight.
As of November 1 its temporary raw probe artifacts are no longer present. The hashes and reported
observations remain historical records; no new hosted read was performed during local evidence
restoration. Re-establish the target and full baseline before any execution proposal.
Exact prerequisite function definitions and grants, full migration-history status, RLS/policies,
constraints/triggers, item-write grants, preexisting row counts and aggregate fingerprints, and
absence of every partial SCKRL-311 object have not all been established by this probe. It did not
execute or validate the migration, establish a hosted migration executor, reload/check PostgREST's
schema cache, or run a connected Auth/client harness. Do not treat catalog presence alone as a
complete preflight or executable-migration readiness.

## Frozen migration and prerequisites

The only migration in scope is
[`20261015100000_sckrl_311_atomic_receipt_placement.sql`](../../supabase/migrations/20261015100000_sckrl_311_atomic_receipt_placement.sql),
SHA-256 `b130383684fc85549c8d33542108dd5992e3e23c7ed4aea565f73dabfb858459` (measured in the
current workspace on 2026-10-22). Recompute and compare the raw file hash immediately before any
authorized execution. Any mismatch requires a new review and Council revision.

The migration consumes the established SCKRL-201 item schema, SCKRL-302 receipts,
SCKRL-303 parse generations, SCKRL-310 review locking, SCKRL-406 expiry provenance, and
SCKRL-312 saved expiry choices. Relevant source snapshots at packet preparation:

| Dependency source                                  | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `20260531203000_sckrl_201_item_data_model.sql`     | `79f614dc4423d71fec92643bf4e68c2b337d0f99d47abbd2de5cf94b1b0481fe` |
| `20260621110000_sckrl_302_receipts.sql`            | `9a5cc41ce938017744e3eed31adf0b050a944d7a4724484fabb238f9da4603ce` |
| `20260804100000_sckrl_303_receipt_parsing.sql`     | `61ccf43693e59f2a60f27fc62c7cc7c6a57d8e86954e114def93e9281f94b4d6` |
| `20260911110000_sckrl_310_receipt_review_data.sql` | `ee32d67e00ebec9b5f42e2179bd576f24b28a18b44a6b9ce9cd54bc552c7faca` |
| `20260916100000_sckrl_406_expiry_provenance.sql`   | `3b7197f7deb1c1895518d671838e1430331b04d170d5ed6239a5e42d35791a3c` |
| `20260930100000_sckrl_312_receipt_expiry.sql`      | `9cbd2cabda9787da088caa6060950c77ac97f07ece7700d9fafc076fbf62b576` |

These are local source hashes, not proof those versions are installed. Do not replay dependencies
or update migration history as part of this ticket. If read-only inspection finds a missing,
unexpected, partially installed or drifted dependency, stop and return to review.

## Read-only target and schema preflight

Use a reviewed wrapper that safely parses ignored local configuration without sourcing/evaluating
it, puts credentials only in the child process environment, enforces TLS and never prints a URL,
password, token, row content or auth user data. Require the verified project ref to match the
explicitly authorized target; compare pooler host, session port `5432`, database `postgres`, user
`postgres.<verified-project-ref>`, and client TLS against current configuration. Reject URL query
options that can override host, port, database, user, password or TLS. `psql -X -c '\conninfo'`
must be captured into a private file and sanitized before reporting; its client connection details
must show the expected host/port/database/user and TLS. Also compare the project ref parsed from
the non-secret public API URL. Record only sanitized host identity, project ref, connection
port/database, TLS version and query success.

After connection, run these read-only identity checks and retain only the result (never local
environment values):

```sql
select current_database() as database_name,
       current_user as database_role,
       current_setting('server_version_num') as server_version_num;
select to_regclass('supabase_migrations.schema_migrations') is not null
       as migration_history_available;
```

If migration history is present, read it without changing it and verify each prerequisite version
is installed; compare this result with object/function checks below. An absent history table or
ambiguous version record is not sufficient evidence by itself, so stop for review unless the
accepted baseline can be established from exact schema evidence.

Before opening the write transaction, use read-only catalog queries to verify:

- All prerequisite objects and the accepted 310/312/406 function signatures exist, with expected
  owners, `SECURITY DEFINER`, fixed `search_path`, and grants; compare function definitions to the
  exact accepted local source using consistent raw-body normalization.
- SCKRL-311 objects are wholly absent: no `items.source_receipt_item_id`, placement or acquisition
  tables, SCKRL-311 triggers/policies/functions, or partial/replacement constraints.
- Existing item write grants, receipt/item counts, RLS/policies, relevant foreign keys and schema
  metadata match the reviewed pre-311 baseline. Store counts and aggregate hashes of selected
  preexisting columns without outputting row values.
- The target is not production and no unrelated migration is pending or required for the reviewed
  baseline.

The following queries make the critical object checks concrete. They return metadata only:

```sql
select to_regclass('public.items') as items,
       to_regclass('public.receipts') as receipts,
       to_regclass('public.receipt_items') as receipt_items,
       to_regclass('public.receipt_parse_generations') as parse_generations,
       to_regclass('public.receipt_placements') as receipt_placements,
       to_regclass('public.inventory_acquisition_events') as acquisition_events;

select exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'items'
    and column_name = 'source_receipt_item_id'
) as source_lineage_column_exists;

select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_userbyid(p.proowner) as owner, p.prosecdef as security_definer,
       p.proconfig as function_settings
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'guard_item_receipt_lineage', 'guard_placed_receipt_header',
    'guard_placed_receipt_line', 'guard_placed_receipt_generation',
    'guard_receipt_placement_immutable', 'guard_acquisition_event_immutable',
    'assert_receipt_unplaced', 'finalize_receipt_placement',
    'get_receipt_placement', 'list_unplaced_receipt_reviews'
  )
order by p.proname, arguments;

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('items', 'receipts', 'receipt_items', 'receipt_placements',
                    'inventory_acquisition_events')
order by tablename, policyname;

select table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('items', 'receipt_placements', 'inventory_acquisition_events')
  and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC')
order by table_name, grantee, privilege_type;

select routine_name, specific_name, grantee, privilege_type, is_grantable
from information_schema.routine_privileges
where specific_schema = 'public'
  and routine_name in (
    'save_receipt_review', 'promote_receipt_parse', 'mark_receipt_parse_failed',
    'finalize_receipt_placement', 'get_receipt_placement',
    'list_unplaced_receipt_reviews'
  )
  and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC')
order by routine_name, specific_name, grantee, privilege_type;

select c.relname as table_name, t.tgname as trigger_name,
       p.proname as trigger_function, t.tgenabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal and n.nspname = 'public'
  and c.relname in ('items', 'receipts', 'receipt_items', 'receipt_parse_generations')
order by c.relname, t.tgname;
```

Also capture counts and stable aggregate fingerprints for `items`, `receipts` and
`receipt_items`. Hash complete rows inside PostgreSQL, ordered by primary key, and return only the
count and digest (never row values). For example, after confirming each table has an `id` primary
key, run this separately for each table:

```sql
select count(*) as row_count,
       md5(coalesce(string_agg(md5((to_jsonb(t) - 'source_receipt_item_id')::text), '' order by t.id), '')) as row_fingerprint
from public.items t;
```

Use the same expression for `public.receipts` and `public.receipt_items`; preserve these sanitized
baseline values for equality checks inside the transaction and after commit.

Any target mismatch, partial SCKRL-311 install, missing prerequisite, unexpected function/grant,
RLS drift, row-count/hash change or permission mismatch is a hard stop. Do not attempt repair or
automatic rerun. Preserve only sanitized preflight results.

## Exact hosted write scope, if separately authorized

After the exact source hash is rechecked and independent review is complete, execute only this one
migration in one transaction with `psql -X`, `ON_ERROR_STOP`, bounded statement/lock timeouts and
an explicit target connection. Repeat critical absence/baseline checks inside the transaction.
Do not apply earlier or later migrations, write migration-history bookkeeping, seed application
data, or change project settings.

The migration's bounded DDL changes are: add unique/FK-protected receipt-line lineage to
`public.items`; create `public.receipt_placements` and
`public.inventory_acquisition_events` with their constraints/index; enable their RLS and add
household-member select policies; replace the explicit item write-column grants while excluding
server-owned receipt lineage; add lineage/placed-receipt immutability guards; wrap the 310 save,
parse-promotion and parse-failure functions with the unplaced guard; add finalize/status/pending
placement RPCs; and set their execute and trigger-function grants. There are no application data
inserts in this migration. Require the migration tool/process to report successful COMMIT and exit
zero; precommit output alone is not evidence of installation.

Before commit, verify exact columns, constraints, foreign keys, index, RLS and policies; exact RPC
and trigger definitions/owners/security/search path; authenticated-only grants; retained prior item
write columns with receipt lineage excluded; unchanged preexisting row counts and aggregate hashes;
and successful schema visibility through a fresh read-only catalog query. Do not claim the
PostgREST schema cache has reloaded from DDL alone. If any assertion fails, roll back. If the
connection drops or commit status is uncertain, perform read-only inspection first and do not
blindly retry the migration.

After confirmed commit, open a new read-only connection and repeat schema, function, grant, RLS,
count and aggregate-hash checks. Persist sanitized output and process exit evidence for independent
QA. If postcommit inspection fails or is ambiguous, stop connected writes and resolve by read-only
inspection; do not reapply the migration.

## Synthetic connected Auth/PostgREST acceptance

Run only after the installation is confirmed, PostgREST exposes the new RPC schema, and separate
explicit authorization names the target and connected fixture lifecycle. Use the real Auth endpoint,
real PostgREST and the shared `createSackerlReceiptsClient` against generated one-run synthetic
accounts. Never use household-owner credentials or existing household data. Do not use service-role
access for placement assertions; any privileged account provisioning or cleanup must be narrowly
limited, reviewed and recorded separately.

Create fresh directly confirmed synthetic owner and outsider accounts with unique
`@example.invalid` identities and a run marker, plus an owner household, a distinct outsider
household, and a synthetic member. Record every creation intent
before issuing the request, then record returned IDs without tokens or PII. Through normal review
APIs create one synthetic receipt with at least two included reviewed lines assigned to valid
zones, and a second receipt for idempotency-key conflict coverage. Keep a foreign-household receipt
for access isolation. No email/invite, media upload, OCR, notification, background job or product UI
is involved.

Use a new immutable idempotency key and exact normalized command body per logical placement. Verify:

1. Owner placement returns canonical stock, unique receipt-line lineage, expected persisted expiry
   conversion, acquisition events and immutable placement result; read the result back through the
   status RPC and query stock through the normal client.
2. Exact same-key/same-body retry returns the canonical replay with no duplicate stock/events.
   Same key with altered normalized input conflicts. A different key for the already placed receipt
   returns `already_placed` with the canonical committed result; an authenticated status read also
   returns that result. Reuse of one household key on a different receipt returns
   `PLACEMENT_KEY_REUSED`/409 and rolls back without changing either receipt.
3. Member succeeds only within the owner household and receives the documented household-calendar
   `added_on`; outsider/foreign receipt/foreign household requests reveal no foreign rows and do
   not place stock. Membership is checked before cached replay.
4. A malformed response, wrong response household or deliberately lost HTTP response produces an
   unknown outcome. Preserve the exact key/body and local draft; query canonical receipt/key status.
   If status is placed, reconcile to that result. If status is unplaced or unavailable, do not claim
   failure or create a new key; retry only the exact same command/key after availability returns,
   then verify one canonical placement. Exercise this with a reviewed fault-injection proxy/test
   harness around the request boundary, not by modifying hosted SQL or database rows.
5. Review save, parse promotion and parse failure after placement reject with the documented
   conflict and leave the placement/result/source unchanged. Verify placed receipts do not appear
   in pending placement pages; verify foreign pending reads are isolated.

For every assertion, persist request shape with sensitive headers removed, response status/body
with IDs appropriately minimized, canonical readback, and before/after counts or row hashes. The
connected run does not substitute for native UI, device recovery/accessibility, remaining
concurrent multi-zone lock-order evidence, prerequisites' open acceptance, or the full Stage 1
gates. If a non-owner member cannot be provisioned within the reviewed Auth/household fixture
protocol without email/invites or broader access, mark member acceptance blocked and do not report
the connected packet complete.

## Fixture cleanup and uncertain cleanup recovery

After acceptance, while the synthetic owner session is still valid, delete only the recorded placed test receipt through
an exact-ID authenticated PostgREST DELETE under the household-member RLS policy (the shared
client exposes no receipt-delete method). Verify by read-only checks that its placement result
cascades away, the created stock remains, and its receipt-line lineage becomes null. Verify the
acquisition event remains with `receipt_id`, `source_receipt_item_id` and `placement_id` null, while
its item, quantity, unit, zone, actor, occurrence time and idempotency key remain unchanged. Only
then sign out all sessions, stop refresh timers and clear in-memory auth storage. Delete the exact
run-owned synthetic households using the reviewed cleanup procedure; household deletion
intentionally cascades that household's remaining stock, receipts and household-scoped history.
Verify household/receipt/stock absence and any retained history state. Then delete only the exact
run-owned Auth users and verify their absence. Mark each cleanup intent complete only after its
postcondition is read back. Do not claim stock remains after household deletion.

Persist cleanup intent before each destructive request. If a request times out, first inspect the
exact recorded resource ID and state; do not retry deletion blindly or broaden the query. If the
identity, ownership or cascade result is uncertain, halt cleanup, preserve sanitized evidence and
request operator review. A cleanup failure leaves the connected run incomplete and blocks another
run until resolved.

## Acceptance boundary and current disposition

The packet is conditional and reviewable; the current connection identity is bound only for the
limited read-only probe above, the full development preflight remains incomplete, and no hosted
write or connected run has been performed for SCKRL-311. A hosted migration executor and connected
Auth/client harness are also not yet established. Before execution, the Chair must
publish an immutable Council revision naming the live verified target, hashes, wrapper/harness,
assertions, cleanup and authorization evidence; independent QA must review it and all required
voters must vote fresh on that exact revision. Connected acceptance must bind to the installed
schema and exact source manifest. Any change to source, target, scope or cleanup creates a new
revision. Until all applicable reviews and target authorization are present, stop after local
planning and read-only evidence gathering.

References: [ratified backend contract](../agents/council-decisions/COUNCIL-20261015-02-placement.md),
[source review](sckrl-311-source-review.md), [disposable database evidence](sckrl-311-database-review.md),
[prior development execution plan](sckrl-312-development-migration-plan.md), and
[prior connected QA protocol](sckrl-304-406-312-connected-review.md).
