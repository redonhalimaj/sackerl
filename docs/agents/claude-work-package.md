# Shared work package: Claude implements, Codex validates

Prepared: 2026-09-16. Ticket: **SCKRL-406 — expiry provenance and confirmation**.
Stage: 1. Primary implementation role: Backend, with Infrastructure review of the persistence design.
State: **Codex resumed final validation on 2026-09-27.** SCKRL-406 is Review, not Done.
Backend corrections and mobile/calendar integration are implemented. Independent source QA and
integration review passed; corrected SQL/authenticated simulator validation remain outstanding.

This is the shared execution record for this assignment. Claude updates the checklist and ledger
below; Codex records review findings and acceptance here afterward. Keep the current owner and
ticket state synchronized with [status.md](../../status.md), which remains the global queue.

## Outcome and ownership

Sackerl must distinguish a package date, a user-entered date and an estimate without changing
existing displayed dates or treating a date as proof of food safety. Claude delivers the backend
foundation and its tests. Codex then reviews the implementation, completes mobile integration and
validates the result in the simulator. SCKRL-407 warning UI and SCKRL-408 snooze remain separate tickets.

- **Claude owns:** a focused SCKRL-406 contract/ADR addition, a new forward migration, required
  shared API-client and web API changes, and meaningful domain/database/route tests. Record the
  exact files before editing. Use the Claude model selected in the owner's runtime and record its
  identity when available; use `TEAM.md`'s Claude profile for specialist roles.
- **Codex owns on return:** architecture/security and compatibility review, acceptance tests,
  mobile Add/Edit integration, household-calendar integration, independent QA coordination and
  final ticket status. Codex can correct or return incomplete work rather than accept it blindly.
- **Preserve:** current simulator fixes, app package/lockfile changes, QA evidence and the owner's
  Obsidian layout settings. Inspect staged, unstaged and untracked files; do not reset or restage them.
- **Excluded:** warning-screen redesign, snooze implementation, notifications, camera/OCR, recipe
  book/AI/nutrition, general dependency upgrades, live migrations, deployments, commits and merges.
  Do not change mobile screens, simulator tooling or the accepted receipt-review implementation.

## Read first

1. [Current status](../../status.md), [TEAM.md](../../TEAM.md), [AGENTS.md](../../AGENTS.md),
   [CLAUDE.md](../../CLAUDE.md), and [the handover workflow](codex-claude-handoff.md).
2. SCKRL-406 and its dependencies in [features.md](../../features.md), Stage 1 in
   [PROGRAM.md](../../PROGRAM.md), and the **Expiry Provenance** section of
   [ADR-0001](../architecture/adr-0001-reliable-food-loop.md).
3. [Phone feedback triage](../product/phone-feedback-triage-2026-09-13.md),
   [Stock and Expiry](../code-map/Stock%20and%20Expiry.md),
   [API and Database](../code-map/API%20and%20Database.md), and
   [SCKRL-506 contract](../features/sckrl-506-recipe-expiry-eligibility.md).
4. Actual item/profile/recipe clients, web payload validators and current migrations. Read source
   and callers before choosing a schema; do not rely on a chat summary alone.

## Implementation sequence

### 1. Publish the contract before changing storage

Write `docs/features/sckrl-406-expiry-provenance.md` and an ADR addition recording the persistence
and authorization choices. Preserve ADR-0001's accepted model:

- `items.expires_on` remains the compatible current-date projection.
- Append-only expiry facts preserve source, optional confidence/version, actor, confirmation time,
  creation time and superseded fact. Initial sources are `printed`, `user`, `estimated`, `model`;
  reserve model provenance without adding a model provider or accepting fabricated model evidence.
- Backfill existing non-null dates as `estimated` unless reliable history proves another source.
  Preserve the date exactly, leave confirmation unset and identify legacy backfill honestly;
  never invent estimator versions, confidence, package evidence or user confirmation.
- Keep printed marking (`use-by`, `best-before`, `unknown`) separate from source and confirmation.
  An explicit confirmation is a user action, not a guarantee of safety.
- Define clear-date behavior, edits to a confirmed date, unrelated item edits, retries and concurrent
  edits. Changing an expiry must not silently carry the old date's confirmation onto the new date.
- Define the household IANA calendar-zone contract and its migration/default policy. Document how
  Codex will replace the temporary Vienna recipe-factory setting without breaking existing callers.

Record any remaining design question and your chosen reasoning. If a solution requires changing
the accepted architecture or expanding product scope, document the concrete conflict and leave that
part for Codex; continue independent bounded work. Do not silently replace the append-only model
with editable metadata columns alone.

### 2. Implement the backend foundation

- Add a new migration; do not rewrite accepted migrations. Preserve household isolation and existing
  auth semantics. Database-owned actor/time fields must not be forgeable through client payloads.
- Keep active fact and `expires_on` consistent atomically on every supported write path, including
  existing PostgREST item writes. Document the RPC/trigger strategy and stale-write behavior.
  Protect history from ordinary direct edits and reject unauthorized cross-household references.
- Extend shared types, row mapping and necessary web validation with documented null/omitted
  semantics. Keep current callers compiling and ensure legacy writes do not claim false provenance.
- Provide create/edit/confirm/clear examples for Codex's mobile work, including how category-zone
  estimates are identified. Provide the contract future receipt placement will use without
  implementing SCKRL-311 or modifying receipt review.
- Keep SCKRL-506's existing date eligibility behavior intact. Document the remaining mobile and
  calendar wiring precisely instead of claiming the full SCKRL-406 ticket is complete.

### 3. Prove behavior locally

Use disposable local fixtures. Record commands and outcomes, not just "tests pass":

- Clean and populated migration replay; visible legacy dates unchanged and unconfirmed.
- Estimated versus explicitly entered/printed dates; confirm, change and clear; unrelated edits
  preserve provenance; history remains intact; invalid dates/source/confidence combinations fail.
- Concurrent changes, retry behavior and transaction failure leave a coherent projection/history.
- Cross-household attempts, spoofed actor/confirmation fields and direct history mutation fail.
- Existing item CRUD, receipt contracts and all 29 recipe regressions still pass.
- Household calendar validation and compatibility tests for the chosen backend contract.
- Relevant typecheck/lint/tests, workspace regression checks, `git diff --check`, code-map refresh
  and `pnpm code:map:check`. Record unrun database checks honestly if local tooling is unavailable.

SCKRL-310's live migration is still recorded as unapplied. Do not deploy either migration or use
real household data for testing. Never copy env values or credentials into this record.

### 4. Return a reviewable implementation to Codex

Update this ledger, `status.md`, the contract and relevant code-map notes. Set SCKRL-406 to Review
with the backend slice and missing mobile work stated explicitly. Do not mark the ticket Done or
expand into SCKRL-407/408. Stop delegated writers and release only the files assigned here.

## Shared execution ledger

**Latest checkpoint — 2026-09-27 (supersedes earlier milestones and the Claude return table):**
Backend (`gpt-5.5`, xhigh) finished its corrections and released item client/tests, web payload/tests
and pending SQL/fixtures. Frontend (`gpt-5.6-luna`, high) finished Add/Edit and form helpers/tests
and released them. Root implemented Settings and recipe calendar integration and owns docs/map.
Earlier final reviewers hit a usage limit. Resumed independent QA (`gpt-5.5`, high) accepted the
source and full checks; Orchestrator (`gpt-5.6-sol`, xhigh) accepted read-only integration review.
No Claude handover is active. Root also corrected Add's existing label to distinguish user entry.

Corrections include null CAS, stale/no-date confirmation, honest legacy confirmation as a user
assertion, atomic clear plus metadata, declared-estimate classification, normalized confidence
retries, sequence-ordered history and nullable web metadata. All three product questions are
resolved in the contract. Final evidence: 194 workspace tests, all five typecheck/lint tasks and
the final cold iOS export (1,284 modules) pass. Code-map generation/check passes: 607 callables,
1,110 relationships, 78 modules, zero stale files. No SQL replay or authenticated simulator
evidence is claimed. Keep Review; see [independent QA](../qa/sckrl-406-review.md).

**Final review correction:** Orchestrator found that member Settings was only represented by a
mock: real profile lookup and household SELECT RLS were owner-only. The Backend lane stopped
at its usage limit; root finalized its saved correction. Owner-first/member-safe reads, actual
owner-derived roles and `ensureHousehold` reuse now pass 20 profile tests and both independent
reviews. The pending migration adds member SELECT access; calendar writes remain owner-only.
Contract/ADR records this refinement. Final workspace and export results above include the fix.

**SQL setup follow-up:** the owner confirmed running the adversarial script in hosted Supabase.
The missing household is a synthetic fixture from the legacy seed, not application data to repair.
Root added prerequisite checks before writes in both command suites, documented seed-before-406
ordering in a disposable database, and added an authenticated-owner calendar write assertion.
Independent QA accepted these changes statically; they remain unexecuted. Which migrations the
owner has applied in hosted Supabase is unverified. Codex has applied neither migration.

**Program update:** `status.md` now explains Stage 0 complete locally, Stage 1 in progress and
remaining alpha/beta gates. Business Process Analyst (`gpt-5.6-luna`, high) prepared
`docs/product/notion-program-roadmap.md`; root reconciled it with final QA. The owner supplied the
Sackerl Notion parent page and authorized creation. Follow-up on 2026-09-27 connected the local
Notion MCP successfully and read the parent/children. Notion rejected child roadmap creation with
HTTP 403 `restricted_resource` because the workspace has used all free blocks. Publication now
awaits workspace capacity; no successful creation receipt was returned and existing content was
not changed. Resume from `docs/product/notion-program-roadmap.md`, checking for duplicates first.

**Current ownership:** Codex owns integration, mobile/calendar implementation and this ledger.
Claude has released all files. Infrastructure (`gpt-5.5`, xhigh) reviews persistence/security
read-only; Orchestrator (`gpt-5.6-sol`, xhigh) reviews product/contract decisions read-only.
No pending migration may be applied this session, including for a fresh replay. The Evidence
section below records Claude's historical runs and will not be presented as Codex verification.
Initial review finding: nullable `expectedFactId` is discarded in the client/web path, so an
Edit that loaded no fact cannot guard against another writer adding one. Contract correction
and regression coverage precede mobile integration. The table below is Claude's return record.

**Codex milestone — 2026-09-16:** Orchestrator accepted all three product decisions before Add
edits; see the contract's resolved decisions. Trigger and origin are accepted as ADR refinements
with origin taking precedence over the compatibility source placeholder. Infrastructure found
null-guard and confirm-null/stale gaps. Backend (`gpt-5.5`, xhigh) owns corrections in the pending
406 migration/SQL fixtures, item client/tests and web item payload/tests. Frontend
(`gpt-5.6-luna`, high) owns Add/Edit, their form helpers/tests and household Settings. Codex owns
recipe factories/consumers, documentation and integration. Independent QA (`gpt-5.5`, high), which
did not implement these changes, owns `docs/qa/sckrl-406-review.md` and read-only validation.
Root's mobile calendar integration checks pass (2 tests); web household-calendar route check
passes (1 test), using synthetic responses and Vienna/New York midnight boundaries. These are
deterministic checks, not hosted or simulator evidence. Confirmation of legacy/undeclared dates
will become a declared user assertion; the prior fact preserves unknown origin. Known urgency
grouping and expiry-changing snooze remain SCKRL-407/408 follow-ups and are not being implemented.

Update this section at each milestone, especially before a limit. Use real results; unchecked means
unfinished. If interrupted midway, preserve the actual state rather than advancing it to Review.

- [x] Claude claimed ownership; actual model and owned files recorded.
- [x] Contract and ADR addition published.
- [x] Forward migration and compatible backend/API implementation finished.
- [x] Local migration, authorization, concurrency and regression evidence recorded.
- [x] Code-map notes/index updated; exact Codex integration steps documented.
- [x] Claude returned backend slice for Codex review; no writers were delegated.
- [x] Codex reviewed the diff/contracts and implemented corrections with regression coverage.
- [x] Codex completed mobile/calendar integration.
- [ ] Corrected SQL runtime and authenticated simulator checks completed.
- [x] Independent source QA and integration review accepted the final source changes.
- [ ] Full independent runtime acceptance completed; only then consider SCKRL-406 Done.

| Field                         | Current record                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Active writer / actual model  | Claude, `claude-opus-5` (Claude Code CLI, Opus 5). **Ownership released 2026-09-16**; Claude has stopped writing to every file listed below. Codex is the incoming writer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Checkout baseline             | `feature/SCKRL-ASTRA`, HEAD `fbd18c5`. Inherited uncommitted edits verified present and untouched: `AGENTS.md`, `CLAUDE.md`, `README.md`, `TEAM.md`, `apps/mobile/package.json`, `docs/agents/codex-claude-handoff.md`, `docs/code-map/.obsidian/graph.json`, `docs/code-map/.obsidian/workspace.json`, `docs/code-map/Testing and Delivery.md`, `pnpm-lock.yaml`, `status.md`, `docs/qa/evidence/`, `docs/qa/ios-simulator.md`.                                                                                                                                                                                                                                                                                                                 |
| Owned files                   | `docs/features/sckrl-406-expiry-provenance.md` (new), `docs/architecture/adr-0001-reliable-food-loop.md` (append-only addendum), `supabase/migrations/20260916100000_sckrl_406_expiry_provenance.sql` (new), `supabase/tests/sckrl_406_*.sql` (new), `supabase/tests/README.md`, `packages/api-client/src/items.ts`, `packages/api-client/src/items.test.ts`, `packages/api-client/src/profile.ts`, `packages/api-client/src/profile.test.ts`, `apps/web/lib/item-payload.ts`, `apps/web/lib/recipes.ts`, `apps/web/app/suggestions/route.ts`, `docs/code-map/Stock and Expiry.md`, `docs/code-map/API and Database.md`, this file, `status.md`. Not owned: every mobile screen, simulator tooling, receipt review, `docs/code-map/.obsidian/*`. |
| Last completed step           | Backend slice complete and returned for review. Contract, ADR addendum, migration, SQL fixtures, shared client, web payload/route and code-map notes are in the working tree, uncommitted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Files and contracts changed   | New: `docs/features/sckrl-406-expiry-provenance.md`, `supabase/migrations/20260916100000_sckrl_406_expiry_provenance.sql`, `supabase/tests/sckrl_406_{legacy_seed,legacy_assert,expiry_commands,adversarial}.sql`, `apps/web/lib/item-payload.test.ts`. Modified: `docs/architecture/adr-0001-reliable-food-loop.md` (append-only addendum), `supabase/tests/README.md`, `packages/api-client/src/{items,items.test,profile,profile.test,index}.ts`, `apps/web/lib/{item-payload,recipes}.ts`, `apps/web/app/suggestions/route.ts`, `docs/code-map/{Stock and Expiry,API and Database}.md`, plus regenerated `docs/code-map/generated/*` and `Method Index.md`.                                                                                  |
| Commands/results and evidence | See **Evidence** below. Clean and populated replay, three SQL suites, a two-session concurrency probe, the SCKRL-310 SQL suites under SCKRL-406, and workspace typecheck/lint/test/build/code-map all pass. No hosted database, deployment or live migration was touched.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Decisions / unresolved risks  | Trigger plus write-only command column instead of a new RPC, so the existing direct PostgREST item writes stay atomic (recorded in the ADR addendum). A third `origin` axis (`declared`/`inferred`/`backfill`) so an undeclared write and a legacy backfill cannot claim provenance they lack. `source = 'model'` reserved in the enum but rejected at write time. Open risks: no hosted/PostgREST integration run; SCKRL-310's migration is still unapplied and SCKRL-406's now joins it; the three open questions at the end of the contract are Codex/product calls.                                                                                                                                                                          |
| First next action             | Codex: review the diff and the contract, then work the **Remaining work for Codex** list below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Codex review findings         | Pending implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Append concise milestone entries with date, actor, changed paths, evidence and next action here.
Keep details in the contract/tests; this ledger should remain a readable handoff, not a command log.

## Codex return checklist

1. Inspect actual diffs and Claude's ledger; review authorization, atomicity, backfill, date marking,
   confirmation invalidation and calendar assumptions. Check for untested claims and scope expansion.
2. Validate Claude's backend against the criteria above, using independent QA for final acceptance.
3. Integrate mobile Add/Edit and household calendar consumers against the accepted contract.
4. Run current app checks and simulator flows using an isolated dev account. Resolve environment
   prerequisites explicitly; Expo Go welcome rendering alone is not authenticated journey evidence.
5. Finish SCKRL-406 only when its full criteria pass. SCKRL-407 and SCKRL-408 are explicitly
   excluded from this session; retain the still-open SCKRL-908 journey-automation work.

## Prompt for Claude

> Implement the bounded SCKRL-406 backend assignment in docs/agents/claude-work-package.md.
> Codex has stopped writing to that scope. Read status.md, AGENTS.md, CLAUDE.md and TEAM.md first,
> inspect the actual workspace, then claim your files and record your model in the shared ledger.
> Follow the contract-first sequence and preserve existing simulator fixes and unrelated edits.
> Update the ledger and status at each milestone, with exact tests, decisions and remaining work.
> Finish the backend slice, then return it for Codex review; do not implement mobile screens,
> start other tickets, deploy migrations, commit or merge. Codex will validate, integrate and
> finalize the ticket. If interrupted, save the precise next action and actual incomplete state.

## Prompt for Codex when Claude finishes

> Claude has stopped writing. Resume from docs/agents/claude-work-package.md and status.md.
> Inspect Claude's actual diff and evidence, review and validate the backend, resolve findings,
> then complete the recorded mobile/calendar integration and simulator checks. Keep the shared
> ledger current and require independent QA before marking SCKRL-406 Done.

### Milestone log

- **2026-09-16 — Claude (`claude-opus-5`) — ownership claimed.** Read the required sources and
  inspected the actual tree (`git status --short` matches the recorded baseline). No files changed
  yet. Next: publish the SCKRL-406 contract and the ADR addendum, then the forward migration.
- **2026-09-16 — Claude (`claude-opus-5`) — contract first.** Published
  `docs/features/sckrl-406-expiry-provenance.md` and the ADR-0001 addendum before touching storage.
- **2026-09-16 — Claude (`claude-opus-5`) — backend slice returned for review.** Migration, SQL
  fixtures, shared client, web payload/route and code-map notes landed with the evidence below.
  SCKRL-406 set to Review. No commit, merge, deployment or live migration performed.

## Evidence

Every command below was run in this session. A disposable PostgreSQL 14 cluster was created under
the session scratchpad, never a hosted or application database, and it held only synthetic fixture
rows. No environment values or credentials were read or recorded.

**Migration replay**

- Clean replay: all 11 migrations applied in order to an empty database with `--single-transaction`.
  Passed.
- Populated replay: baseline migrations, then `sckrl_406_legacy_seed.sql`, then SCKRL-406. Passed.
  One defect was found and fixed during this run: the deferrable item foreign key left pending
  trigger events that blocked the later `ALTER TABLE` statements, so the migration now issues
  `set constraints all immediate` after the backfill.
- `sckrl_406_legacy_assert.sql` passed. The legacy date `2026-09-20` is unchanged, its backfilled
  fact is `origin = 'backfill'` / `source = 'estimated'` with null confidence, estimator, actor and
  confirmation, the undated legacy item received no fact at all, no dated item was left without an
  active fact, projection and active fact agree for every row, and existing households took the
  `Europe/Vienna` pilot default.

**Behaviour and authorization**

- `sckrl_406_expiry_commands.sql` passed: 3 assertion groups covering 17 scenarios plus 18 rejected
  declarations. Undeclared versus declared writes, printed markings, category-zone estimates,
  confirming an estimate without moving its date, a new date never inheriting the old confirmation,
  clearing, unrelated edits and unchanged dates preserving provenance, idempotent retries, stale and
  matching `expected_fact_id`, soft removal, batch inserts, the global projection/active-fact
  invariant, and a mid-transaction failure leaving one coherent fact. The validation loop was
  negative-controlled: feeding it one deliberately valid declaration made it fail as intended, so
  the eighteen rejections are real rather than vacuous.
- `sckrl_406_adversarial.sql` passed: 7 assertion groups covering forged projection columns
  discarded on insert and update, the confirming actor always being the session, a cross-household
  `expected_fact_id` rejected with `PT403`, in-place fact edits and deletes rejected with `PT403`
  while item deletion still cascades history, calendar-zone validation, `authenticated` holding
  `SELECT` only on `item_expiry_facts`, member and non-member RLS isolation in both directions, and
  a household-scoped foreign key refusing a fact that names another household's item.
- Two-session concurrency probe: session B blocked on the item row lock and then failed with
  `PT409` once session A committed, leaving A's fact active and the history one ordered chain.
  Repeated without `expected_fact_id`, both writes landed with the later one active, the
  confirmation was correctly dropped by the date change, and the projection/active-fact sweep
  returned 0 mismatches.

**Regression**

- SCKRL-310 SQL suites re-run with SCKRL-406 applied on top: `sckrl_310_legacy_assert`,
  `sckrl_310_review_commands` and `sckrl_310_adversarial` all pass.
- Workspace: `pnpm typecheck` 5/5, `pnpm lint` 5/5, `pnpm test` 163 tests across 8 tasks
  (api-client 111 including all 29 recipe tests, web 36, ui 8, mobile 5, tokens 3; up from 122
  before this slice), `pnpm --filter @sackerl/web build` succeeds, `pnpm code:map` then
  `pnpm code:map:check` reports 598 callables, 78 modules and 0 stale files, and `git diff --check`
  is clean.
- No existing caller needed a change to compile; mobile and web typecheck unchanged. Six existing
  assertions were updated because the contract genuinely changed: `itemSelect` and `householdSelect`
  gained columns, `StockItem` gained `expiryProvenance`, `Household` gained `calendarTimeZone`.
- `pnpm format:check` still flags only the eleven pre-existing unrelated files this checkpoint
  records (`.claude/settings.local.json`, `apps/mobile/expo-env.d.ts`, and the owner's
  `docs/**/.obsidian/*` layout). They were deliberately left untouched. Every file this slice
  changed passes `prettier --check`.

**Not run**

- No hosted Supabase, PostgREST, Auth, device or simulator validation. The SQL evidence uses a local
  `auth.uid()` stub and Supabase-like default grants, not hosted Auth or PostgREST.
- No live migration or deployment. SCKRL-310's migration remains unapplied, and SCKRL-406's must be
  applied after it before either is exercised against dev Supabase.

## Codex integration checklist — updated 2026-09-27

1. **Review implemented:** trigger/origin refinement accepted with explicit origin precedence.
   Null CAS, confirmation guards, confidence rounding and deterministic history corrections are
   in the actual diff. Corrected SQL runtime validation remains unrun.
2. **Mobile Add implemented:** untouched/blank fallback is a declared, unconfirmed category-zone
   estimate; typed date is a confirmed user assertion. Q1 was settled before screen wiring.
3. **Mobile Edit implemented:** untouched expiry is omitted; typed/clear intents carry the
   rendered fact expectation, including null. Clear plus other fields uses one PATCH.
4. **Calendar implemented and reviewed:** owner Settings and all three mobile recipe consumers
   plus web suggestions are wired. The profile/member SELECT correction is complete and accepted
   in independent source review; owner-only calendar writes remain. Runtime RLS checks are pending.
5. **Scope preserved:** SCKRL-407 warning UI and SCKRL-408 snooze are not started. The existing
   expiry-changing snooze remains a documented release risk, not a completed SCKRL-406 fix.
6. **Source QA accepted:** 194 workspace tests, typecheck/lint, final iOS cold export (1,284 modules)
   and code-map check (zero stale files) pass after the member correction. Both independent source
   reviews passed; fixture preconditions and role assertions have static review only.
   No migrations are authorized for application, so SQL replay and authenticated simulator/
   PostgREST validation remain pending. The ticket stays Review.

## Release record

- **2026-09-16 — Claude (`claude-opus-5`) — writer ownership released.** Stopped at a safe boundary
  with no in-flight edits. Every owned file is saved and verified as recorded under **Evidence**; no
  file is left half-written. No sub-agents or delegated writers were used, so none needed quiescing.
  The disposable PostgreSQL 14 cluster used for the SQL evidence was stopped and deleted, so this
  session leaves no background job, database or process running. Inherited uncommitted work is
  untouched. Nothing was committed, merged, deployed or migrated.
- Codex takes ownership of the files listed in the **Owned files** row plus the mobile screens and
  `status.md` integration. Start from the prompt below.
