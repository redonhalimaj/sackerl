# Database tests

These SQL fixtures exercise SCKRL-310 and SCKRL-406 against a disposable local PostgreSQL database. They
use synthetic records, an `auth.uid()` stub and Supabase-like default grants. Run them as
the owner of an **empty test database**, never against a hosted or application database.
Hosted Auth, PostgREST and device journeys require separate integration evidence.

Set `PGHOST`, `PGPORT`, `PGUSER` and `PGDATABASE` to the disposable instance. From the
repository root, replay a populated pre-upgrade schema:

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
