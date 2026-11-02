# SCKRL-907 — Web/API journey E2E (Playwright)

## Round 0

- **Question:** Deliver an extensible Playwright E2E harness for web (API contract plus a design
  smoke) covering me, household, items/expiry, receipts create/parse/review, suggestions, shopping
  list and placement (GET/POST /receipts/:id/placement, GET /receipts/pending-placement), with
  auth-denial and outsider cases.
- **Acceptance:** typecheck and lint clean; e2e is excluded from `turbo test` (the `.e2e.ts`
  suffix); synthetic users tagged per run with teardown; target guard (local by default, never
  prod); docs in docs/qa/e2e-web.md; backend specs pass against an approved target.
- **Seats:** Orchestrator (w2 root, Opus 5.5); Backend A (core API specs); Backend B (receipts,
  placement and smoke); QA C (independent, not an implementer).
- **Files:** apps/web/e2e/\*\*, apps/web/playwright.config.ts, the e2e scripts and devDeps in
  apps/web/package.json (plus the resulting pnpm-lock.yaml), docs/qa/e2e-web.md and this board.

## Round 1

| Seat         | Done                                                                                                         | Next                               | Blockers                          | Position                                                                    | Vote    |
| ------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------- | --------------------------------- | --------------------------------------------------------------------------- | ------- |
| Orchestrator | Harness, config, env guard, admin fixtures, cleanup, docs; fixed typecheck (dotenv `quiet`, TS2769) and lint | Run QA C; apply the backend target | Supabase target pending the owner | Ready for QA on the offline scope                                           | AGREE   |
| Backend A    | me/household/items/suggestions/shopping-list: 50 tests                                                       | Run against a target               | No backend                        | Assertions are grounded in source; 13 noted uncertainties                   | AGREE   |
| Backend B    | receipts/review/placement/CTA-API: 26 tests; design smoke 6/6                                                | Run against a target               | No backend                        | Zones read via PostgREST; INVALID_PLACEMENT_LINE is unreachable via the API | AGREE   |
| QA C         | pending                                                                                                      |                                    |                                   |                                                                             | pending |

Open findings for the routes (not owned here): malformed JSON on the items/shopping routes
returns 500, not 400 (Backend A, note 13).

## Round 2

QA C objected on the bc8d499 revision; Medium findings were: the `cleanup` project wiped every run's
users, and teardown delete failures were silent. The Chair later fixed the target as remote dev and
required exact cleanup that never lists users.

| Seat         | Done                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Next          | Blockers | Position                                    | Vote    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- | ------------------------------------------- | ------- |
| Orchestrator | Removed the list-and-delete cleanup and its project. Users are now deleted by exact id in the fixture `finally`, with a ledger sweep that fails loudly. Opt-in `E2E_BACKEND=1`; credentials come from ignored env files; serial on hosted. Added the placement schema gate. Fixed 3 test-setup bugs (receipt stock now built via placement because of the 311 lineage guard; real recipe id for the FK; raw-bytes malformed JSON). Run record in the doc. | Fresh QA vote | none     | Remote dev: 82/82 passed, cleanup confirmed | AGREE   |
| QA C         | pending fresh review                                                                                                                                                                                                                                                                                                                                                                                                                                      |               |          |                                             | pending |
