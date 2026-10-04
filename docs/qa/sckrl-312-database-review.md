# SCKRL-312 local database validation

Date: 2026-10-01. Status: **local SQL prerequisite accepted**; hosted application,
connected acceptance, native acceptance and ticket Done remain pending.

The owner's subsequent request to perform the migration step authorized this disposable local
validation prerequisite, superseding the earlier prohibition for this bounded run. The
[source acceptance](../agents/council-decisions/COUNCIL-20261001-01.md) and its historical evidence
remain unchanged. This addendum records new execution evidence separately from the frozen source
report.

## Execution and independent review

The Chair initialized and ran a new disposable PostgreSQL **14.20 (Homebrew)** cluster at
`/tmp/sckrl312-validation.UOXs6e`, listening on its Unix socket at port `55432` with TCP disabled.
Formal sandbox escalation was used after shared-memory and socket access were denied. The
independent QA agent's separate initialization attempt was also denied; its escalation was
aborted while awaiting approval, and it created no running cluster.

The Chair executed `/tmp/sckrl312-validation.UOXs6e/replay.py`. Independent QA then inspected the
runner, `results.json`, all per-step logs, the decisive fixture outputs and server startup log
against [the fixture procedure](../../supabase/tests/README.md). QA did not execute a second SQL
run and makes no claim of independent execution.

The runner uses explicit socket, port, database and user arguments for every `psql` call, removes
inherited `PG*` settings, and enables `-X`, `-w` and `ON_ERROR_STOP=1`. It creates three fresh test
databases in this cluster; it never addresses a hosted database. Application migrations run with
`--single-transaction`. Command fixtures manage their own transactions and finish with rollback.
Synthetic users/households and the local `auth.uid()` stub emulate application-role boundaries;
they do not exercise real Supabase authentication or PostgREST.

## Results

**All 49 subprocess steps returned exit code 0.** All 49 expected per-step logs exist, with no
`ERROR`, `FATAL` or `PANIC` entry. The server log contains an earlier sandbox-denied startup, then
the approved PostgreSQL 14.20 startup and ready-to-accept-connections entry; the denial is not a
failure in the completed replay.

| Case                 | Executed sequence                                                                                                                                                   | Result                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `sckrl312_populated` | Bootstrap; 11 earlier migrations through SCKRL-406; SCKRL-312 legacy seed before upgrade; SCKRL-312 migration; legacy assertions; expiry command fixture            | Passed: 16 database steps |
| `sckrl312_clean`     | Bootstrap and all 12 application migrations into an empty database                                                                                                  | Passed: 13 database steps |
| `sckrl310_post312`   | Bootstrap; 9 migrations before SCKRL-310; SCKRL-310 legacy seed; SCKRL-310/406/312 migrations; SCKRL-310 legacy assertions, review commands and adversarial fixture | Passed: 17 database steps |

The remaining three steps create the three test databases. Counts describe process invocations,
not 49 independent behavioral assertions.

The SCKRL-312 command fixture completed its assertion blocks, printed
`SCKRL-312 receipt expiry SQL checks passed`, and rolled back synthetic mutations. It exercises
Gregorian dates, unknown versus intentional no-date, old-client omission, separate expiry-editor
attribution across household members, unchanged metadata, parser/manual defaults, rejected
state/date/actor shapes, stale revisions/generations, duplicate manual identity, atomic failure
rollback, all-excluded saves and application-role access/direct-write restrictions. The legacy
assertions verify existing review/parser/manual data survives with unknown/null/unattributed
expiry defaults. Assertions treat null conditions as failure.

Post-upgrade SCKRL-310 fixtures completed and rolled back; the adversarial suite printed
`SCKRL-310 adversarial SQL checks passed`. This establishes regression evidence for the existing
review command against the upgraded local schema.

Independent QA compared all **22 frozen source-manifest files** with the hashes in the source
Council record: zero mismatches. No source fix or alteration to the historical source QA report
was needed for these runs. The accepted source aggregate remains
`68c01565ac804a849d4864935d06e4cbf92091e2e579f9adf4fe7fd557070263`.

## Remaining boundary

This accepts the executed disposable local replay and regression prerequisite. It does not
establish the hosted target's identity, current SCKRL-310/406 baseline, migration application,
PostgREST schema visibility, connected receipt expiry save/reload or actual household authorization.
Hosted target access and the bounded [development migration plan](sckrl-312-development-migration-plan.md)
remain separate preflight work.

Native calendar/date modal, keyboard, screen-reader, back/swipe prevention and saved-review restart
journeys remain open. Two-session concurrency was not added or exercised in this run. SCKRL-311
stock conversion, placement idempotency/result recovery, authoritative placed filtering and placed
review immutability remain future work. No hosted write, deployment, commit or merge occurred in
this validation pass.
