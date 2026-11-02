# SCKRL-912 — Placement and API error-handling follow-ups

## Round 0

- **Question:** Close the follow-ups F1, F4, F5 and L4 from the SCKRL-311/907 reviews.
  - **F1:** inside `finalize_receipt_placement`, unexpected FK/unique violations (23503/23505) map
    to a coded PT409 error. This goes in a NEW migration `sckrl_912_placement_error_codes`; the
    applied 311 migration is never edited. Drop the generic 409→`STALE_RECEIPT_REVIEW` and
    422→`INVALID_PLACEMENT_LINE` fallbacks in `apps/web/lib/receipt-placement.ts`.
  - **L4:** remove the dead household check in `guard_item_receipt_lineage`, in the same migration.
  - **F4:** cover `outcomeUnknown` in the packages/api-client items tests.
  - **F5:** malformed JSON on the items and shopping-list routes returns 400, not 500. Add e2e
    assertions for it.
- **Acceptance:** the migration replays cleanly on a disposable local Postgres together with the
  existing 311 fixtures; unit tests, lint and typecheck pass; the migration is NOT applied to dev
  (the Chair pushes it after ratification); no push.
- **Seats:** Orchestrator (w2 root, Opus 5.5); Backend B1 (owner, implements everything); QA Q1
  (independent, implements nothing).
- **Files:** the new migration, `apps/web/lib/receipt-placement.ts` (+ its tests),
  `apps/web/app/items/**` and `apps/web/app/shopping-list/**` route handlers (+ tests), api-client
  items tests, `apps/web/e2e/api/{items,shopping-list}.e2e.ts`, `supabase/tests/*912*`, this
  board.

## Round 1

| Seat         | Done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Next  | Blockers | Position      | Vote    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------- | ------------- | ------- |
| Orchestrator | Framed the scope; briefed B1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | QA Q1 | none     | Proceed to QA | AGREE   |
| Backend B1   | Migration `20261102225020_sckrl_912_placement_error_codes.sql`: finalize's write phase maps 23503/23505 to PT409 `PLACEMENT_CONFLICT`, PLACEMENT_KEY_REUSED handling unchanged; L4 removed the unreachable household term in the lineage-clearing branch. Removed the web 409/422 fallbacks. Added `lib/request-json.ts` for 400 on malformed/empty JSON across the six items/shopping routes, with unit and e2e assertions. Disposable PG14 replay passed (clean + populated, 311 fixtures + new 912 fixture). Turbo lint/typecheck 10/10; tests 399 pass. | —     | none     | Ready         | AGREE   |
| QA Q1        | pending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |       |          |               | pending |

Asks to the Chair:

- **F4 premise:** the items client never produces `outcomeUnknown`; only the placement client does. B1 pinned the current items failure behavior instead (6 tests). Does items need a real outcome-unknown contract, as a new ticket?
- **L4 reading:** B1 removed the unreachable `household_id` term (311 file around line 123) and kept the line-133 cross-household check, which is reachable and tested.
- **Runner:** `run_sckrl_311.py` assumes 311 is the last migration. The 912 replay was run manually; the concurrency script was not re-run.
