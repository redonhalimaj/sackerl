# Database tests

These SQL fixtures are prepared source for a disposable local PostgreSQL database. They use
synthetic records, an `auth.uid()` stub and Supabase-like default grants. Do not run any fixture
against a hosted, development, or application database. Hosted Auth, PostgREST and device journeys
require separate integration evidence.

## SCKRL-311 atomic receipt placement

The SCKRL-311 fixtures require a disposable local PostgreSQL database with the SCKRL-310, 406,
and 312 migrations already replayed. The separately reviewed and authorized 2026-11-01 disposable
run passed the receipt-save, parse-promotion, calendar-boundary, multi-zone assignment,
normalized replay and pending-list assertions, plus the corrected concurrent zone-order proof. See
[the evidence and limits](../../docs/qa/sckrl-311-database-review.md). A future replay still requires
the reviewed runner and applicable execution permission. Never use hosted Supabase, a development
database, or the application connection. Use separate empty databases for clean and populated-upgrade
checks.

The latest synthetic results and all step logs are preserved in the ignored workspace directory
`.env.qa-sckrl311-evidence-20261101`. Its capture wrapper pins the unchanged reviewed runner/helper,
defaults to plan-only, and records hashes and incomplete/error states without copying the database
data directory or loading application env files. The raw results retain original temporary paths;
review archived logs by matching basenames and the archive registry after temporary paths expire.

The plan-by-default entry point is `python3 supabase/tests/run_sql_suite.py --pg-bin /path/to/postgresql14/bin`
(`run_sckrl_311.py` remains as a compatibility shim). Adding `--execute` creates its own fresh
socket-only cluster; it accepts no existing database coordinates. Every case replays all migrations in
order; a populated case loads its ticket's legacy seed immediately before that ticket's migration and
then continues through every later migration. It includes clean/populated 311 (with the SCKRL-912
error-code fixture) and isolated 310/406/312 regression databases, runs the SCKRL-311 concurrency suite
on the populated database (`--skip-concurrency` to omit), retains source hashes and logs, and records
cluster shutdown. `--ci` prints a concise summary with the failing log tail, exits non-zero on any
failure and removes cluster data after shutdown; `--artifacts-dir` keeps logs and `results.json`
there. `.github/workflows/sql.yml` runs it on the self-hosted runner. It does not grant permission
to run against any non-disposable database.

For the populated upgrade, run the baseline migrations through the 312 migration, then seed the
unlinked legacy receipt-source item and saved receipt before installing 311:

```sh
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/local_bootstrap.sql
for migration in supabase/migrations/*.sql; do
  case "$migration" in
    *sckrl_311*) break ;;
  esac
  psql -X -v ON_ERROR_STOP=1 --single-transaction -f "$migration" || exit 1
done
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_311_legacy_seed.sql
psql -X -v ON_ERROR_STOP=1 --single-transaction \
  -f supabase/migrations/20261015100000_sckrl_311_atomic_receipt_placement.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_311_legacy_assert.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_311_placement_commands.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_311_adversarial.sql
```

The legacy assertion verifies that migration preserves the receipt review and its unlinked legacy
receipt-source stock without inventing placement records. Command and adversarial fixtures manage
rollback-only transactions; do not add `--single-transaction` around them. They exercise atomic
stock/fact/event/result writes, exact source-line lineage, all expiry states, normalized replay,
key conflicts, status/list pagination, placed review/parse/header freeze, preserved eighteen item
column grants, direct-lineage denial for authenticated and service roles, generic receipt-source
rejection, parent deletion behavior and injected partial-write rollback. The clean-schema check
replays the same migrations into a separate empty database, omits the seed and populated fixtures,
and runs `sckrl_311_clean_assert.sql` after the 311 migration.

The main command fixture assigns three included lines across two zones, verifies the household day
can differ from UTC, exercises reversed/uppercase normalized replay, and checks pending-list totals
and adjacent pages after placement. Two parser-only seed receipts are saved by the helper immediately
before review-save and parse-promotion contenders. The two-session test is intentionally run last on a
fresh populated disposable replay. It observes PostgreSQL blocking by application name and checks
same-key replay, alternate-key canonical results, same household key across different receipts with
loser rollback, review-save/parse-promotion/parse-failure versus placement, membership revocation
ordering and a zone-delete race. A combined scenario uses fresh zones and opposing assignment
orders; an A-only lower-zone delete probe proves the high-first placer took the lower lock before
the higher gate. The probe rolls back before the second placement starts. A later deletion must
wait on an actual observed placement PID, then reject with `23503` after both placements commit.
Exact canonical, stock and event mappings are checked. This is nine scenarios including the eight
earlier races; the combined scenario has four observed-blocker phases. Each subprocess has bounded
waits and is terminated on failure. Pass
the reviewed psql executable and disposable socket coordinates explicitly; the runner never falls
back to `PATH` or infers a database:

```sh
python3 supabase/tests/sckrl_311_concurrency.py \
  --psql-bin /path/to/reviewed/psql --host /path/to/disposable/socket \
  --port 55432 --user postgres --database sckrl311_test
```

These instructions do not authorize replay, migration application, hosted connection, activation
or SCKRL-311 completion. Those remain separate gates.

## SCKRL-310 receipt review

This fixture procedure is retained for separately reviewed disposable replays. The 2026-10-19
SCKRL-311 runner includes these post-upgrade regressions; its completed execution does not authorize
another run or hosted migration. Never point these commands at hosted Supabase, development, or
application databases. When a replay is
authorized, set `PGHOST`, `PGPORT`, `PGUSER` and `PGDATABASE` to the disposable instance and run
from the repository root:

```sh
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/local_bootstrap.sql
for migration in supabase/migrations/*.sql; do
  case "$migration" in
    *sckrl_310*) break ;;
  esac
  psql -X -v ON_ERROR_STOP=1 -f "$migration" || exit 1
done
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_310_legacy_seed.sql
psql -X -v ON_ERROR_STOP=1 --single-transaction \
  -f supabase/migrations/20260911110000_sckrl_310_receipt_review_data.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_310_legacy_assert.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_310_review_commands.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_310_adversarial.sql
```

For a clean schema replay, use a second empty database and omit the legacy seed, assertion and
command test files. The command files manage their own transaction and roll back their mutations;
do not wrap them in `--single-transaction`.

The legacy assertion checks that original line IDs, parser values and receipt headers survive,
high confidence remains unresolved, and missing financial values remain null. For a clean
schema replay, use a second empty database and omit the legacy seed, assertion and command
test files. The command test files each manage their own transaction and roll back their
mutations; do not wrap them in `--single-transaction`. They cover promotion/review rollback,
stale generation/revision rejection, snapshot consistency, manual additions, immutable parser
evidence, correction timestamps and household/role access.

`local_bootstrap.sql` creates cluster roles only when absent. Its tables, grants and auth
stub belong exclusively in disposable test databases. The application migrations remain the
source of truth for production schema and policies.

## SCKRL-406 expiry provenance

The SCKRL-406 fixtures follow the same rules: a disposable database, synthetic records and an
`auth.uid()` stub. Replay a populated pre-406 schema from the repository root:

```sh
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/local_bootstrap.sql
for migration in supabase/migrations/*.sql; do
  case "$migration" in
    *sckrl_406*) break ;;
  esac
  psql -X -v ON_ERROR_STOP=1 --single-transaction -f "$migration" || exit 1
done
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_406_legacy_seed.sql
psql -X -v ON_ERROR_STOP=1 --single-transaction \
  -f supabase/migrations/20260916100000_sckrl_406_expiry_provenance.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_406_legacy_assert.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_406_expiry_commands.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_406_adversarial.sql
```

`sckrl_406_legacy_assert.sql` checks that visible legacy dates survive byte for byte, that the
backfill identifies itself (`origin = 'backfill'`, `recorded_by is null`) and invents no estimator,
confidence, package evidence or user confirmation, that an undated item receives no fact, and that
existing households take the `Europe/Vienna` pilot calendar default.

`sckrl_406_expiry_commands.sql` covers undeclared versus declared writes, printed markings,
category-zone estimates, confirming an estimate without moving its date, confirmation never being
inherited by a new date, clearing, unrelated edits preserving provenance, idempotent retries,
optimistic `expected_fact_id` rejection and acceptance, batch inserts, eighteen rejected invalid
declarations, and a mid-transaction failure leaving a coherent projection and history.

`sckrl_406_adversarial.sql` covers forged projection columns and actor values, cross-household fact
references, append-only enforcement against direct update and delete, item deletion still cascading
history, calendar-zone validation, and RLS/grant isolation for the member, the application role and
a non-member.

Both command files manage their own transaction, settle the deferrable item foreign key with
`set constraints all immediate` and then roll back; do not wrap them in `--single-transaction`.
For a clean-schema replay, use a second empty database and omit the seed, legacy assertion and
both command suites. The command/adversarial suites require the populated replay above; running
the migration alone does not create their synthetic households or items.

### Missing household error (`23503`)

If `sckrl_406_adversarial.sql` reports that household
`40600000-0000-4000-8000-000000000010` is absent, the seeded test household is missing in the
database running the suite. The member insert references a household created by
`sckrl_406_legacy_seed.sql`; it cannot create that household itself. The command suites now
check their prerequisites before any fixture writes and report a setup error with this guidance.

Use the populated replay sequence above in one disposable database: baseline migrations,
legacy seed, 406 migration, then assertions and suites. The seed must precede the migration to
exercise the backfill; seeding afterward produces normal inserted facts and cannot prove legacy
preservation. Do not substitute a real household ID or disable the foreign key. If a run failed
inside a manually managed transaction, roll that failed transaction back before retrying the
properly prepared test database. The bootstrap and seed are not intended for a hosted Supabase
SQL editor or any application database. This guidance does not authorize migration application
when the current work checkpoint prohibits it.

### Concurrency check (two sessions)

The optimistic guard needs two real connections, so it is a manual procedure rather than a fixture.
Create one committed item with a declared fact, note its `expiry_fact_id`, then in session A run
`begin; update public.items set expires_on = ..., expiry_declaration = '{"source":"printed","expected_fact_id":"<fact>"}' ...; select pg_sleep(3); commit;`
while session B issues the same update with the same now-stale `expected_fact_id`. B must block on
the row lock and then fail with `PT409` once A commits, leaving A's fact active and the history a
single ordered chain. Repeating the pair without `expected_fact_id` must let both writes land, with
the later one active.

## SCKRL-312 receipt-line expiry

The SCKRL-312 fixtures are included in the separately authorized 2026-10-19 post-311 regression
run. The procedure below documents a disposable test pass; it does not itself authorize another
run or any hosted migration. Use an empty disposable database,
synthetic records and `local_bootstrap.sql`, never a hosted or application database.

For a populated pre-312 schema, apply earlier migrations, seed accepted parser/manual review rows
before the upgrade, then run the new migration and assertions in the same database:

```sh
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/local_bootstrap.sql
for migration in supabase/migrations/*.sql; do
  case "$migration" in
    *sckrl_312*) break ;;
  esac
  psql -X -v ON_ERROR_STOP=1 --single-transaction -f "$migration" || exit 1
done
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_312_legacy_seed.sql
psql -X -v ON_ERROR_STOP=1 --single-transaction \
  -f supabase/migrations/20260930100000_sckrl_312_receipt_expiry.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_312_legacy_assert.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/sckrl_312_receipt_expiry.sql
```

The legacy assertion checks unknown/null/unattributed defaults while retaining parser evidence,
accepted corrections, review state, manual provenance and receipt headers. The command fixture
uses the seeded owner, a second household member and an outsider. It covers typed dates,
explicit reset versus no-date, omission by older clients, separate expiry/editor attribution,
unchanged-save metadata, manual/parser defaults, invalid shapes/dates/provenance, atomic rollback,
stale tokens, duplicate manual identity, RLS and direct-write denial. It also checks that receipt
review creates no stock or stock expiry facts. The command file manages its own transaction and
rolls back all mutations; do not add `--single-transaction` around it.

For a clean-schema check, use another empty disposable database and omit the seed/assertion/command
files. Full SCKRL-310 regression fixtures should also be rerun against the post-312 schema in their
own populated disposable replay. SCKRL-311 placement, race/retry/lost-response handling, placed
immutability and two-member stock fact conversion are **not** implemented or validated by this
suite; they remain separate gates. SQL source review and TypeScript tests cannot substitute for
an authorized replay or hosted Auth/PostgREST/native acceptance.
