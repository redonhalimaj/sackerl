# SCKRL-406 Independent QA Review

Date: 2026-09-27
Reviewer: Codex QA lane, independent from implementation
State: Source accepted; SCKRL-406 remains Review until runtime gates pass

## Scope

This review covers the current uncommitted SCKRL-406 expiry provenance work across the contract,
ADR addendum, migration SQL, shared clients, web payload handling, mobile Add/Edit/Settings,
recipe calendar consumers and expiry-adjacent flows. I did not apply pending migrations, deploy,
commit, merge, start SCKRL-407/SCKRL-408, or replay SQL. Claude's SQL evidence in
`docs/agents/claude-work-package.md` remains historical implementation evidence, not a fresh QA
rerun after the current corrections.

## Current Decision

Static source review accepts the current SCKRL-406 implementation for Review handoff. The prior
Add/Edit, confidence precision, deterministic history ordering and member-readable calendar
findings are addressed in source, and the requested workspace `pnpm test`, `pnpm typecheck` and
`pnpm lint` gates pass.

This is not a Done recommendation. SCKRL-406 still needs final runtime acceptance because SQL
migration/fixture replay and native/simulator flows were not run under the current restriction.

## Source Findings

No blocking source findings remain in this QA pass.

The member-readable calendar gap is now closed in source: `getHousehold()` tries the owned
household first, falls back to the caller's `household_members` row ordered by `household_id.asc`,
then derives the returned role from `households.owner_id` rather than trusting the membership role
string. The SCKRL-406 migration adds a member-readable `households` SELECT policy using
`public.is_household_member(id)`, while calendar updates remain owner-scoped through the existing
`owner_id=eq.<current user>` write path.

Evidence:

- Client owner-first/member fallback: `packages/api-client/src/profile.ts:300`
- Role derived from the actual owner: `packages/api-client/src/profile.ts:194`
- Profile tests cover owned, member fallback, no membership, and member reuse:
  `packages/api-client/src/profile.test.ts:124`
- Member-readable household SELECT policy: `supabase/migrations/20260916100000_sckrl_406_expiry_provenance.sql:193`
- SQL adversarial fixture now includes a synthetic member and member/non-member calendar checks:
  `supabase/tests/sckrl_406_adversarial.sql:7`, `supabase/tests/sckrl_406_adversarial.sql:301`

## Positive Review Evidence

- Add Item sends declared provenance: untouched or blank-fallback dates become unconfirmed
  `estimated` with `category-zone-v1`, and typed dates become confirmed `user` declarations.
- Edit Item omits expiry for untouched saves, sends rendered `expectedFactId` including explicit
  `null` for typed expiry changes, uses `clearItemExpiry` for blank clears, and keeps a 409
  conflict draft open with reload copy.
- `clearItemExpiry` combines metadata changes and `expiresOn: null` in one `updateItem` call.
- The shared client preserves `expectedFactId: null` through TypeScript and JSON payload mapping.
- `confirmItemExpiry` converts inferred/backfill dates into a declared user assertion rather than
  inventing estimator metadata, while declared estimates keep their estimated source.
- The migration includes `fact_sequence` for deterministic history order and rounds confidence
  before idempotency comparison.
- The SQL command/adversarial suites now include prerequisite checks before fixture writes, so a
  database missing the seeded SCKRL-406 households/items reports a setup error instead of falling
  through to a confusing member-insert foreign-key failure.
- The SQL adversarial suite statically covers authenticated owner calendar updates, member calendar
  reads, member update denial, and non-member isolation.
- Home, Suggestions, Recipe detail, Add Item estimates and the web suggestions route use the
  household calendar zone; the fallback/default remains `Europe/Vienna`, preserving SCKRL-506's
  pilot behavior.
- Expiry fact RLS remains household-scoped through `is_household_member`, with select-only grants
  on `item_expiry_facts`.

## Deferred SCKRL-408 Risk

The Expiring screen still implements Snooze by updating `expiresOn`. This is the known separate
SCKRL-408 defect and the user explicitly prohibited implementing it during this SCKRL-406 pass. With
SCKRL-406's trigger, the path will honestly record the moved date as an inferred expiry fact, but
the product behavior remains a release risk until SCKRL-408 separates reminder snooze from expiry.

Evidence:

- Current snooze mutation: `apps/mobile/app/(tabs)/expiring.tsx:501`
- Contract exclusion: `docs/features/sckrl-406-expiry-provenance.md:308`

Acceptance impact: track as deferred release risk, not an SCKRL-406 blocker.

## Fresh Commands

- `pnpm test` passed: 194 tests across 20 mobile tests, 39 web tests, 124 api-client tests, 8 ui
  tests and 3 tokens tests. Turbo replayed some cached package logs; api-client, mobile and web test
  tasks ran as cache misses.
- `pnpm typecheck` passed: 5/5 tasks. Api-client, mobile and web ran as cache misses.
- `pnpm lint` passed: 5/5 tasks. Api-client ran as a cache miss.
- `pnpm --filter @sackerl/api-client test` passed: 124 tests, including 20 profile tests.
- `git diff --check` passed.
- `pnpm code:map:check` passed after root's map refresh: 607 callables, 1110 relationships,
  78 modules, 0 stale files.

## Not Run

- No SCKRL-310 or SCKRL-406 migration application or SQL replay, per current user/root prohibition.
- No hosted Supabase/PostgREST/Auth validation.
- No native simulator or authenticated device journey validation.
- No production build/export in this QA lane.

## SQL Fixture Note

`supabase/tests/sckrl_406_expiry_commands.sql` and `supabase/tests/sckrl_406_adversarial.sql` now
check that the SCKRL-406 schema and legacy fixture households/items exist before issuing fixture
writes. `supabase/tests/README.md` explains that the command/adversarial suites require the
populated replay sequence: baseline migrations, `sckrl_406_legacy_seed.sql`, the SCKRL-406
migration, then assertions and suites. This directly addresses the hosted SQL-editor `23503`
confusion by making the fixture dependency explicit.

I did not replay this SQL, so the corrected fixture remains pending runtime validation.

## Final Acceptance Requirements

- When the migration restriction is lifted, rerun SQL migration/fixture evidence against the final
  SQL, including null `expected_fact_id`, cross-household guards, member-readable household
  calendars, clear+metadata atomicity, confidence idempotency, deterministic history ordering,
  backfill honesty and calendar validation.
- Run native or simulator coverage for the Add/Edit/Settings user flows before moving SCKRL-406
  beyond Review.
