# SCKRL-913 — Generalized SQL suite in CI and readJsonBody adoption

## Round 0

- **Question:** Deliver three things.
  - **(a) Generalized runner:** generalize `supabase/tests/run_sckrl_311.py` so it no longer
    requires 311 to be the last migration. It should replay all migrations, inserting each legacy
    seed before its target migration, and include the 912 fixture and the concurrency suite.
  - **(b) F2:** a CI workflow, `.github/workflows/sql.yml` (proposed to the Chair, who owns
    ci.yml), on the self-hosted runner with labels `self-hosted, sackerl`, running the suite on a
    disposable PG14.
  - **(c) readJsonBody:** adopt it in the receipts, receipts/[id]/items, me and household routes,
    with 400 tests.
- **Acceptance:** the runner passes locally on a disposable PG; the workflow is valid YAML using
  pinned actions; unit tests, lint, typecheck and format pass; local commits only.
- **Seats:** Orchestrator (w2 root, Opus 5.5); Backend/DevOps D1 (owner, implements); QA Q2
  (independent).

## Round 1

| Seat         | Done                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Next  | Blockers | Position      | Vote    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------- | ------------- | ------- |
| Orchestrator | Framed the scope; briefed D1                                                                                                                                                                                                                                                                                                                                                                                                                         | QA Q2 | none     | Proceed to QA | AGREE   |
| D1           | `run_sql_suite.py` (with a `run_sckrl_311.py` shim): replays all migrations, seeds inserted before their target, 912 fixture + concurrency included, `--ci`/`--artifacts-dir`. Local PG 14.20: 101/101 steps, cluster stopped. `sql.yml` proposal (self-hosted runner, contents: read, no secrets; yaml/actionlint OK). readJsonBody adopted in receipts, receipts/[id]/items, me and household, with unit and e2e assertions. All repo checks pass. | —     | none     | Ready         | AGREE   |
| QA Q2        | pending                                                                                                                                                                                                                                                                                                                                                                                                                                              |       |          |               | pending |

## Round 2 — Council Proposal

QA Q2 voted **AGREE** on 024793e after an independent run (101/101; an injected fixture error
failed the run with exit 1; a bad pg-bin exits 1). The Orchestrator applied Q2's non-blocking
hardening findings:

1. Concurrency group `sql-suite`, with no cancel in progress, because of the fixed port.
2. PG discovery tries `postgresql@14` first and accepts `pg_config` only for version 14.
3. `push` is limited to main, dev and feature/\*\*.
4. The runner also records `OSError`/`SubprocessError` as a failure.

Re-verified: the YAML parses, actionlint is clean (with the `sackerl` label declared), and a full
suite run passes 101/101 with the cluster stopped. Info items for the Chair: an
`actionlint.yaml` declaring the `sackerl` label would serve both workflows. The api-client test
count of 346 is a pre-existing duplication: vitest also collects the built `dist/*.test.js`
(177 unique). A follow-up should exclude `dist`.

**Unanimous: Orchestrator AGREE, D1 AGREE, QA Q2 AGREE.** Ready for the Chair's weigh-in.
