# SCKRL-924 — Fresh user: Scan fails with "Household not found."

## Round 0 — Question and criteria

**Question.** A fresh user who signs in and lands on Home has no household row. Scan's capture
(`createUploadedReceipt`) and dev sample (`handleLoadSample`) paths call `getHousehold` and throw
"Household not found." What is the minimal correct fix?

**Acceptance criteria**

1. Fresh user (10-auth-onboarding only, no 20/30 first) → Scan → Load sample → receipt review opens.
2. The household is created exactly once, including under double tap; concurrent creation does not fail.
3. Every other `getHousehold` caller reachable by a fresh user is audited and either tolerates `null`
   or ensures the household.
4. No SQL / migration changes. Default Maestro suite 11/11, fault suite 3/3, format/lint/typecheck/tests green.

## Round 1 — Implementation evidence (worker w2, Claude Opus 5.5)

**Fix chosen: option (a)**, Scan uses `ensureHousehold`. Option (b) (central creation in the auth
bootstrap in `lib/auth-session.tsx`) would touch the routing and onboarding gate that every screen and
flow depends on. That is a larger blast radius than this defect needs. Option (a) follows the existing
pattern in storage-zones, add-item and stock.

**Changes**

- `apps/mobile/app/(tabs)/scan.tsx`: both capture and sample paths call `ensureHousehold`.
- `apps/mobile/app/shopping-list.tsx`: `getHouseholdId` calls `ensureHousehold`. A fresh user would
  otherwise hit the same throw, and the screen writes data.
- `packages/api-client/src/profile.ts`: `ensureHousehold` hardening. `households.owner_id` is unique
  (`households_owner_id_key`), so a concurrent insert loses with 409. The client now re-reads and
  returns the winning household instead of throwing.
- Maestro: new `15-fresh-user-scan.yaml` (in the default suite after 10). `placement-fault.config.yaml`
  now runs 10 → 15 → 56; the "30 runs first" workaround is removed. Comments in run.mjs, flow 56 and
  docs/qa/e2e-mobile.md are updated.

**Idempotency / concurrency.** Within one screen, Scan's `captureInFlight` guard serializes
taps, and the unit test shows a double tap makes one `ensureHousehold` call and creates one household.
Across callers, the DB unique constraint prevents a second household, and the 409 path returns the
winner (unit test). Remaining edge: if the household insert succeeds but the owner
`household_members` insert fails, the next `getHousehold` still finds the household through
`owner_id`, so the user is not stuck. The membership row would be missing, though. This existed
before this change and is not addressed here.

**`getHousehold` caller audit (mobile)**

| Caller                                                  | Fresh-user behaviour                                                        | Action              |
| ------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------- |
| (tabs)/scan.tsx capture + sample                        | threw                                                                       | → `ensureHousehold` |
| shopping-list.tsx                                       | threw                                                                       | → `ensureHousehold` |
| (tabs)/index.tsx (Home, 4 sites)                        | null → empty state                                                          | none                |
| (tabs)/expiring.tsx                                     | null → empty                                                                | none                |
| (tabs)/stock.tsx load                                   | null → default zones; writes already ensure                                 | none                |
| (tabs)/settings.tsx                                     | stores null                                                                 | none                |
| suggestions.tsx                                         | null → empty suggestions                                                    | none                |
| recipe/[id].tsx (3)                                     | throws, reachable only via suggestions, which are empty without a household | none                |
| receipt-review/[id].tsx (2), receipt-placement/[id].tsx | throw, reachable only with an existing receipt, so the household exists     | none                |
| web household route                                     | already falls back to `ensureHousehold`                                     | none                |

**Verification**

- api-client tests 201 passed / 1 skipped (new 409-recovery test); mobile tests 156 passed (new
  fresh-user double-tap test in `lib/scan-review-entry.test.tsx`).
- format:check, lint, typecheck: pass.
- Default Maestro run `20261104211210-m2iz`: 11/11 passed (10, 15, 20, 30, 35, 40, 50, 51, 55, 70, 90).
- Fault Maestro run `20261104212328-cehm`: 3/3 passed (10, 15, 56) without 30 first.
