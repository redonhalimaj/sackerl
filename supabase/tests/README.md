# Receipt database tests

These SQL fixtures exercise SCKRL-310 against a disposable local PostgreSQL database. They
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
