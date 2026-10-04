# SCKRL-312 development migration execution plan

Updated: 2026-10-04. State: local replay prerequisite accepted; bounded development installation and fresh read-only postcommit verification passed; independent QA accepted the execution log and postcommit metadata.

The owner asks Codex to perform point 1 of the next steps: apply the prepared SCKRL-312
migration to development after disposable testing. This authorizes this bounded upgrade and
its disposable validation; it does not authorize production, unrelated migrations, deployment
or publication. SCKRL-312 remains Review. The prior source acceptance snapshot is unchanged.

## Access and target

The ignored root `.env` and app-local configs identify development project
`raqqhpeailkxqvubgzir`. The owner added the session-pooler `DATABASE_URL` to ignored root
`.env` on 2026-10-03. Read-only connection checks bind it to the configured development
project, session port 5432 and database `postgres`; client TLSv1.3 was confirmed with `psql`
connection information. No credential value is recorded here. The Browser skill previously
found no available browser session.

Safely parse that file without sourcing or evaluation. Decode the URL into child-process
`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`; never pass the URL/password as command
arguments or print them. Require the trusted pooler hostname, session port 5432, database
`postgres`, user `postgres.raqqhpeailkxqvubgzir`, and TLS. Reject query options that could
override the reviewed target or credentials.

## Validation and execution

1. Independent QA runs populated pre-312 upgrade/legacy/command fixtures, clean replay and
   post-312 SCKRL-310 regressions in unique disposable local databases. No fixtures touch hosted
   data. Preserve any failure and correct/review source before attempting hosted execution.
2. Verify the exact reviewed SCKRL-312 file checksum. Read the hosted SCKRL-310 schema, foreign
   keys, RLS/grants and exact save function body/owner/security-definer/search-path boundary.
   Require SCKRL-312 enum/columns/constraints absent. A baseline mismatch or partial upgrade
   stops execution; do not apply SCKRL-310, SCKRL-406, all pending migrations or migration-history
   changes to resolve it automatically.
3. Apply only `20260930100000_sckrl_312_receipt_expiry.sql` with `psql -X`, `ON_ERROR_STOP`,
   bounded statement/lock timeouts and one transaction. Lock receipts then receipt_items,
   recheck baseline within the transaction, and record row counts plus aggregate hashes of
   original receipt/line columns without printing their contents.
4. Before commit, verify enum values, column types/default/nullability, validated constraints,
   exact installed function body and grants, authenticated select-only receipt_items access/RLS,
   legacy unknown/null/unattributed defaults, unchanged counts and original-column hashes.
   Notify PostgREST to reload schema inside the transaction; notification is delivered on commit.
5. Verify installation read-only after commit. Any preflight, lock, permission or SQL/verification
   failure rolls back. A lost connection with uncertain commit requires read-only inspection
   before retry; the constraint DDL is not blindly rerunnable.

Hosted read-only checks demonstrate installation, grants and data preservation. They cannot
prove hosted omission behavior without invoking a save. Connected save/reload/authorization,
native expiry/navigation/accessibility and app-restart resume remain separate gates. Placement,
stock conversion/idempotency and placed-review guards remain SCKRL-311 work.

## Roles and current evidence

Root owns execution/status. Independent QA2 owns local database validation. Infrastructure2
reviewed this bounded plan read-only and found it coherent after local QA and credential/baseline
preflight. Preferred roster routes remain unavailable; their existing explicit configured
`gpt-6.1-sol` fallbacks are retained (QA high, Infrastructure xhigh). Deputy coordinates the
operational Council checkpoint. Root ran 49 successful SQL steps across three disposable PostgreSQL 14.20 databases; independent QA verified the runner, all logs and frozen source hashes in [database QA](sckrl-312-database-review.md). The temporary server is stopped. Hosted preflight was read-only; the later bounded development execution is recorded below.

References: [source acceptance](../agents/council-decisions/COUNCIL-20261001-01.md),
[independent source QA](sckrl-312-review.md), [fixture commands](../../supabase/tests/README.md),
[Supabase connection documentation](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Hosted preflight — 2026-10-03

Read-only inspection found the accepted SCKRL-310 receipt columns, validated composite foreign
keys, RLS, authenticated select-only line access, and expected RPC owners/security/search paths.
All four installed receipt RPC bodies match accepted SCKRL-310 source byte for byte. An initial
checksum difference was a local comparison error: Python `strip()` removed newlines while SQL
`btrim()` removed only spaces. Consistent raw-body hashing resolves it; there is no hosted
function drift. The SCKRL-312 enum, columns and constraints are absent. The database contains
15 receipts and 3 receipt lines; no row content was printed.

Client `psql` connection information reports TLSv1.3 with TLS_AES_256_GCM_SHA384. The database
backend's `pg_stat_ssl` reports false for the separate pooled connection; it does not measure
the client-to-pooler leg. The executor requires `PGSSLMODE=require`.

The prepared transaction and credential wrapper are under
`/tmp/sckrl312-dev-preflight.u8f9Ru` and were independently reviewed by Backend, Infrastructure
and QA. SQL SHA-256 is `7918ab0adf2ccfa3f2a81957aa1701b1a369fbaef486e9cb99d989f0960761ee`;
wrapper SHA-256 is `3b8b9aabd5632025d4fa0d4bbf99eff54f6d33df1ce22acd61f73fc7228af6d2`.
Verify both immediately before execution. A precommit success message alone is insufficient:
require successful COMMIT/exit zero and separate read-only postcommit inspection. The accepted
migration file remains SHA-256 `9cbd2cabda9787da088caa6060950c77ac97f07ece7700d9fafc076fbf62b576`.

## Execution outcome — 2026-10-04

[COUNCIL-20261003-01 v1](../agents/council-decisions/COUNCIL-20261003-01.md) unanimously ratified
this bounded operation after fresh preliminary/final votes and Chair review. Root asserted all
four recorded artifact hashes immediately before running the exact wrapper. The single transaction
passed the locked baseline, original-row count/fingerprint, legacy default, schema and security
checks, delivered the schema-reload notification on commit, and returned explicit COMMIT with
process exit zero. No other migration, fixture or migration-history write occurred.

A separate fresh read-only connection ran the reviewed verifier and returned exit zero:
`postcommit_verified: true`, enum `unknown/dated/no_date`, 15 receipts, 3 receipt lines, and preserved
security boundaries. All original receipt/line values were verified unchanged inside the locked
transaction. Temporary evidence: `apply-result.log`, `postcommit-metadata.json`, and the original
preflight metadata under `/tmp/sckrl312-dev-preflight.u8f9Ru`; no credential or row content is recorded.
Independent QA2 inspected the actual execution log and postcommit metadata and accepted the
bounded installation evidence; process exit-zero results are root tool evidence. QA made no
additional database calls and did not claim to rerun the operation. At this installation checkpoint,
connected Auth/PostgREST, old-client omission/save/reload, native and SCKRL-406 behavior were
unverified. Later [connected validation](sckrl-304-406-312-connected-review.md),
[406 database validation](sckrl-406-database-review.md) and
[bounded native validation](sckrl-304-406-312-native-review.md) record subsequent evidence and
remaining gates. SCKRL-312 stays Review.
