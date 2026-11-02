# Council board — SCKRL-311 (PR #7) merge readiness

Process: board Council (owner direction 2026-11-02, see [README](README.md)).
Decisions are also recorded in the `status.md` Decision Log.

## Round 0 — Chair / Orchestrator

**Question:** Is PR #7 (`feature/SCKRL-311-astra-luna` → `dev`, atomic receipt placement backend) ready
to merge into `dev`? What follow-ups and next roadmap steps come before SCKRL-305?

**Acceptance criteria**

1. The migration has no security-definer, RLS or grant holes. Membership is enforced and the household always comes from the server.
2. Idempotency: replaying the same key returns the canonical result. The same key with changed input is rejected. A different key on a placed receipt returns `already_placed`.
3. Locking is consistent, with no interleaving between review and placement.
4. The SDK and routes map uncertain outcomes to `outcomeUnknown`, so a retry never duplicates stock.
5. Typecheck, lint and unit tests pass, and the SQL suite has recorded evidence.
6. Legacy flows are unchanged (saved-review discovery, and the placement CTA stays disabled).
7. The PR contains no build artifacts or secrets.

Merging into `dev` does not authorize hosted migration or deployment.

**Seats:** Orchestrator (Opus 5.5), Backend (Opus), Infrastructure, DevOps, QA and Frontend (Sonnet 5).

**Prior evidence (2026-11-02, read-only pre-pass)**

- Roadmap review (BPA): we are at the end of Stage 0 moving into Stage 1. Order: 311 → E2E/907 → close 304/312 → 305. SCKRL-308 is unblocked and can run in parallel.
- Code review: no blocking defects. Typecheck, lint and the 372 unit tests pass (from the Turbo cache). The SQL 95/95 replay is the recorded run from 2026-11-01.
  Low-severity findings:
  - L1: an unexpected FK/unique violation (23503/23505) surfaces with no code.
  - L2: in `apps/web/lib/receipt-placement.ts`, the fallback maps 409/422 to placement codes.
  - L3: `guard_placed_receipt_header` freezes every update on a placed receipt.
  - L4: a dead check in `guard_item_receipt_lineage`.
  - L5: a status-read network failure returns a generic 503.
- Build artifacts: verified that the PR diff contains no `.next`, `dist` or `temp` files.
- E2E: web has no product UI, so its tests are Playwright API contracts. Mobile uses Maestro and needs testIDs first. No local Supabase or CLI exists, and Docker is down.

## Round 1
All seats wrote in parallel on 2026-11-02 (Backend Opus; Infrastructure, DevOps, QA and Frontend Sonnet 5).

| Seat | Vote | Key evidence |
| --- | --- | --- |
| Backend | AGREE | Criteria 1–4 met. Definer functions set `search_path`, lines 107/160/345. Membership is taken with `for key share`, lines 400–405. Keys: lines 413–436 plus the unique constraint at line 27. The receipt row is locked before the key lookup, lines 407–408. `outcomeUnknown` mapping: receipts.ts:1166–1217. L1, L2, L3 and L4 confirmed; L5 not traced. |
| Infrastructure | AGREE | The migration orders last and fails loudly if a prerequisite is missing. It runs in one transaction. There's no down migration, so the inverse needs documenting. L3 would block SCKRL-308 from writing media on the receipt row; use a separate `receipt_media` table or narrow the guard. A local stack needs the CLI, `config.toml` and Docker, without `local_bootstrap.sql`. |
| DevOps | AGREE | CI "Install, lint, typecheck, test" passes, and the PR is mergeable and clean. The diff has no build artifacts or secrets, and `.env.qa-*` is ignored. CI never runs the SQL suite, so it should be added as a follow-up job. |
| QA | AGREE* | A fresh `--force` run passes 372 tests (api-client 169, web 76, mobile 116, ui 8, tokens 3). *Condition: the uncommitted w2 E2E files currently fail web typecheck and must not be bundled into the merge. The SQL 95/95 result is the recorded run from 2026-11-01; Docker is down, so it wasn't re-run. Items `outcomeUnknown` is unverified. |
| Frontend | AGREE | Nothing under `apps/mobile` changed. Legacy discovery and the disabled CTA are unchanged. The CTA has no testID. Frontend specified SCKRL-305's retry UX for `outcomeUnknown`. |

Asks relayed by the Chair:
- QA asked whether the CTA's disabled state was verified. Answer: yes, Frontend verified it in `receipt-review/[id].tsx` around lines 699–705.
- QA and DevOps asked about the E2E typecheck. It's assigned to w2 (SCKRL-907) in its own worktree; it's not part of PR #7.
- Infrastructure asked whether the L3 guard should be narrowed. That question is carried to the SCKRL-308 board.

## Council Proposal (unanimous, round 1)

Merge PR #7 into `dev` as committed (HEAD `bb5aa80`), with no uncommitted working-tree files.

Follow-ups:
- **F1 (Backend):** map 23503/23505 to a coded PT409, and drop the generic 409/422 fallbacks in `apps/web/lib/receipt-placement.ts`. These are L1 and L2; L4 is cleanup.
- **F2 (DevOps):** a CI job that runs local Supabase plus the SQL suite.
- **F3 (Infrastructure):** document the manual inverse migration.
- **F4 (Backend/QA):** add `outcomeUnknown` coverage to the items tests.

Constraints carried forward:
- L3 is a constraint for SCKRL-305 and 308: put media in a separate table, or narrow the guard by decision.
- SCKRL-311 stays in **Review** until hosted install and real-auth tests are done, which needs owner authorization.

## Chair weigh-in

AGREE. The proposal matches the placement v1 contract and the `PROGRAM.md` order (311 → 907 → 304/312 → 305, with 308 running in parallel). Every acceptance criterion has evidence. The only stale evidence is the SQL replay, which is a recorded run and wasn't re-run. That's acceptable for `dev`, because merging doesn't apply the migration anywhere.

**Decision: ratified 2026-11-02.** Next owner: the Chair performs the merge once the owner gives the go-ahead. F1–F4 are queued.
