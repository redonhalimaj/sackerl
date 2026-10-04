# SCKRL-406 local database validation

Date: 2026-10-04. Status: **local SQL and concurrency evidence accepted**. SCKRL-406 remains
Review; connected application, native and Done acceptance are separate gates.

This report records the Chair's authorized disposable validation and independent QA's read-only
inspection. It supplements the historical [source review](sckrl-406-review.md); that report and
the accepted SCKRL-312 source evidence were not edited. This is not a new Council final acceptance.

## Execution and review

The Chair executed a fresh PostgreSQL **14.20 (Homebrew)** cluster and database `sckrl406_final`
through `/var/folders/sz/htc75wrs1gqc7qxrylld40sc0000gn/T/sckrl406-rerun._9n442p5/run.py`.
The cluster listened only on its Unix socket at port `55433`, with TCP disabled. The runner
removes inherited `PG*` variables and sets only the disposable socket, port, user and database.
Its `psql` commands use `-X`, `-w` and `ON_ERROR_STOP=1`. Application migrations run in single
transactions; command/adversarial fixtures manage their own transactions.

Independent QA inspected the actual runner, `results.json`, fixture and race logs, server version
and shutdown evidence against [the fixture procedure](../../supabase/tests/README.md). QA did
not execute SQL or make database/network requests. Root owns execution and operational status.

## Original failure and fixture correction

The first run's evidence remains in
`/var/folders/sz/htc75wrs1gqc7qxrylld40sc0000gn/T/sckrl406-validation.80yn19s4`.
Its 406 upgrade and legacy assertions passed, but `pre312-expiry_commands.log` records exit 3:
`13: removing an item rewrote its expiry provenance`. Later suites were not run. Its server
stopped successfully; this failed run is not counted as passing evidence.

Independent source inspection found a fixture variable error: section 12b assigned `v_fact` to
`v_item_c`, then section 13 compared `v_item`'s fact ID against that unrelated fact. The only
fixture change reloads `v_item`'s active fact immediately before its soft removal, preserving the
original assertions for unchanged fact ID and history count. No application migration was changed.

The corrected [command fixture](../../supabase/tests/sckrl_406_expiry_commands.sql) has SHA-256
`30eaaf1e268358edc53ed07bf11d7de395bfd8da334451f56d1f239ecd98a886`, independently verified
after the successful rerun. The original failure alone did not establish a provenance defect.

## Results

**All 26 recorded steps passed.** This count includes setup, migrations, fixture suites, two
race groups and shutdown; a race group issues multiple queries/connections. It is not a count
of subprocesses or individual behavioral assertions.

| Phase             | Executed coverage                                                             | Result                                         |
| ----------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| Populated upgrade | Bootstrap, ten pre-406 migrations, legacy seed before 406, then 406 migration | Passed                                         |
| Before 312        | 406 legacy assertions, expiry commands and adversarial suite                  | All three passed                               |
| After 312         | 312 migration, then the same three 406 suites                                 | All three passed                               |
| Guarded race      | Two authenticated-role connections using the same expected fact ID            | A committed; B blocked, then failed with PT409 |
| Unguarded race    | Two connections writing without an expected fact ID                           | B blocked, then both committed in sequence     |
| Shutdown          | Fast stop of the disposable server                                            | Exit 0; shutdown confirmed in server log       |

Both phases' command/adversarial logs contain their success notices, `SET CONSTRAINTS` and
`ROLLBACK`. The legacy assertions verify unchanged visible dates, honest unconfirmed backfill
without invented actor/estimator/confidence/package evidence, no fact for an undated legacy
item and the Europe/Vienna household default. Command suites cover declared/inferred writes,
confirmation, confidence normalization and idempotency, explicit-null and stale expected-fact
guards, clearing, unrelated edits, soft removal, validation rejection and rollback coherence.
Adversarial suites cover forged fields, append-only history, household references, calendar
validation and owner/member/non-member grant/RLS boundaries.

For each race, the runner starts A, observes it sleeping after its update, starts B and observes
B's actual `wait_event_type = 'Lock'`. After both settle, it asserts the projected date, history
count and exactly one active fact. With the guard, A's date remains and history grows by one;
B's log records the expected `PT409`. Without the guard, B's later date remains, both logs show
`COMMIT` and history grows by two. The expected guarded conflict is the only SQL error in the
successful run's logs; it also appears in the server log.

## Evidence boundary

This accepts the corrected local fixture replay and the executed two-session concurrency cases
against the final post-312 local schema. Fixtures use synthetic records, an `auth.uid()` stub
and Supabase-like local grants. They do not establish real Auth sessions, hosted PostgREST,
development database behavior, mobile navigation, keyboard, accessibility or app-restart resume.
The temporary server is stopped.

Connected owner/member expiry and calendar behavior, native Add/Edit/Settings and receipt
journeys, and final integration acceptance remain separate. SCKRL-304/312/908 retain their own
gates. No hosted migration, fixture write, provider call, deployment, publication or merge occurred
in this local validation. SCKRL-311 placement and the deferred notification/snooze features are
outside this evidence and scope.
