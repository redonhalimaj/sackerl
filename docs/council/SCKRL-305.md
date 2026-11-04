# Council board: SCKRL-305, receipt placement screen

## Round 0: Chair / Orchestrator (2026-11-03)

**Question:** SCKRL-311 (atomic placement) is merged, installed on dev, and its real-auth E2E passes. Can SCKRL-305
start implementation now, and what is the build plan? The spec is in `features.md` § SCKRL-305 and the visual
is `ScreenPlacement` in `Design/Phase 2/sackerl phase 2/index.html`.

**Dependency position:** `features.md` lists SCKRL-304, 311 and 312 as dependencies.

- SCKRL-311 is effectively met.
- SCKRL-304 and 312 are in **Review**. What's left is native navigation, offline and accessibility checks, plus
  final acceptance. Those checks are what SCKRL-908 mobile E2E (w1) is waiting to run, once the owner grants
  Accessibility access.

**Proposed rule:**

- Implementation of 305 may proceed in parallel on its own branch.
- 305 cannot be **merged or accepted** until 304 and 312 are accepted.
- Changes to the 304/312 review code are limited to activating the `receipt-review.continue-placement` CTA.

**Acceptance criteria:**

1. **Placement UI:** the screen matches `ScreenPlacement`. Each item chip can be dragged into a zone target, and the target highlights on hover. A miss reverts the chip.
2. **Tap path:** a complete tap-only placement path exists, alongside drag (product guardrail). Every chip and zone has a label and a testID.
3. **Suggested zones:** each category has a default zone suggestion. The user can override it, and "Auto-sort" accepts all suggestions.
4. **Add to stock:**
   - "Add to stock" calls `finalize_receipt_placement` through the api-client, with one idempotency key per placement attempt.
   - It navigates to the dashboard and shows a toast only after confirmed success.
   - The copy doesn't claim reminders were scheduled.
5. **Error and uncertain outcomes:**
   - **Validation errors:** keep the user's state and identify the offending field.
   - **Stale review:** requires reconciliation.
   - **`already_placed`:** opens the committed result.
   - **`outcomeUnknown`:** claims neither success nor failure. Retry uses the same key and input, so stock is never duplicated.
6. **Entry points:** the review CTA is enabled only for a clean saved review. "Done for now" and the Home resume flow from SCKRL-312 keep working.
7. **Tests:**
   - Unit tests for the state machine (suggest, override, auto-sort, retry with the same key).
   - Web/API E2E stays green.
   - A new simdrive flow for tap placement plus `outcomeUnknown` retry, added to SCKRL-908's suite.
8. **Checks:** format, lint, typecheck and test pass. No new dependencies unless justified on this board, for example a gesture library already in Expo SDK 57.

**Seats:** Backend (Opus; contract and idempotency use), Frontend (Sonnet 5; UI, a11y, drag/tap), QA
(Sonnet 5; flows and gates), DevOps (Sonnet 5; CI impact). Infrastructure abstains unless storage is touched.

**Implementer:** w2 (sackerl-8c) on `feature/SCKRL-305-placement-ui` in `../sackerl-w2`. w2 does not take the QA seat.

**Constraint carried from SCKRL-311:** L3. A placed receipt's header is frozen, so 305 must not write to the receipt
row after placement.

## Round 1: Seat standups (2026-11-03)

### Backend (Opus)

- **Done:** Read 305 spec, `packages/api-client/src/receipt-placement.ts`, `receipts.ts:1107-1255`, 311/912 migrations. Contract is sufficient; no api-client or SQL change needed.
- **Next:** w2 builds a pure placement state machine over existing `finalizeReceiptPlacement` / `getReceiptPlacement`.
- **Blockers:** None for implementation; merge/acceptance gated on 304/312.
- **Asks:** Frontend: zone suggestions are a client-side default map (RPC takes only `{receiptItemId, zoneId}`). QA: simdrive outcomeUnknown retry must assert a byte-identical command, not just the same key.
- **Answers:** L3: UI makes no receipt-row write and no direct stock insert; the RPC is the only write. Guards raise RECEIPT*ALREADY_PLACED (`20261015100000*…sql:159-189`).
- **Position:** Send exactly `{householdId, receiptId, generationId, expectedReviewRevision, idempotencyKey, assignments[]}` (extra keys rejected, `receipts.ts:1114-1126`); assignments = exactly the active included lines (else PLACEMENT_LINE_SET_MISMATCH). Mint key on first Add-to-stock and freeze it with the body; new key only after a confirmed failure; edits blocked while unknown (server raises PLACEMENT_KEY_REUSED on mismatch). Persist pending attempt per receipt so a retry after app kill reuses the key. outcomeUnknown → `getReceiptPlacement` with key: placed+keyMatches → success; placed, no match → committed result; not placed → retry same key/body. PLACEMENT_CONFLICT (PT409) is a definite rollback, never unknown. Validation errors highlight `receiptItemId`/`field`; STALE/NOT_REVIEWED/LINE_SET_MISMATCH → back to review; KEY_REUSED → log, new key after status check; EMPTY → CTA hidden up front.
- **Vote:** AGREE

### Frontend (Sonnet 5)

- **Done:** Located disabled CTA card at `apps/mobile/app/receipt-review/[id].tsx` ~L692-709; `ScreenPlacement` at `Design/Phase 2/sackerl phase 2/screens-1.jsx:504`. Mobile has reanimated 4.5.1 + worklets 0.10.1; no gesture-handler, no haptics.
- **Next:** Implement after proposal ratification.
- **Blockers:** None.
- **Asks:** Backend: review read supplies categoryId/revision/generation; key client-generated (answered by Backend). DevOps: native-build impact of gesture-handler (answered: avoid).
- **Answers:** No new deps: drag via RN `PanResponder` + Reanimated shared values; hit-test via `measureInWindow` rects.
- **Position:** Route `apps/mobile/app/receipt-placement/[id].tsx` + stack entry. Pure `apps/mobile/lib/receipt-placement.ts` (suggestZone map, reducer: init/assign/unassign/autoSort/submit lifecycle, buildCommand) with vitest. Tap path primary (chip select → zone tap/picker; accessibilityActions per zone; testIDs `placement.chip.*`, `placement.zone.*`, `placement.zone-option.*`); drag is an enhancement with hover highlight and spring-back on miss. CTA disabled until all lines assigned; navigation + toast only on confirmed success; neutral outcomeUnknown banner with Try again / Check status. Review CTA enabled only for clean saved review with includedCount > 0.
- **Vote:** AGREE

### QA (Sonnet 5)

- **Done:** Read criteria, api-client placement, `apps/web/e2e/api/placement.e2e.ts`, `smoke/placement-cta.e2e.ts`. No simdrive harness on this branch (908 is on w1's branch).
- **Next:** Verify AC1-8 post-implementation: reducer unit tests, viewport 390×844 / 360×640, labels/testIDs, ≥44pt targets, no reminder copy, CTA gating E2E, Done-for-now/Home-resume regression.
- **Blockers:** simdrive flow can be written but not run until 908 harness + owner Accessibility grant.
- **Asks:** Chair: simdrive flow path/branch. Backend: retry contract (answered). Frontend: drag deps (answered: none).
- **Answers:** outcomeUnknown simulation: unit fake throwing `outcomeUnknown`; simdrive test-only fetch shim dropping the first committed response; web E2E same key+body twice → no duplicate items.
- **Position:** Parallel build OK; merge gated on 304/312; 304/312 diff limited to the CTA; L3 checked by diff grep; simdrive flow required before Done (stays in Review if harness unavailable); independent QA ≠ w2.
- **Vote:** AGREE (conditional on gate + simdrive-before-Done)

### DevOps (Sonnet 5)

- **Done:** Reviewed ci.yml, sql.yml, turbo.json, mobile package.json, lockfile, migrations.
- **Next:** Re-check diff for package.json / lockfile / supabase; CI green on Draft PR.
- **Blockers:** None for work.
- **Asks:** No new deps (gesture-handler would change lockfile + native build); zero migrations (any supabase/migrations diff = OBJECT); clean `pnpm install --frozen-lockfile` + format/lint/typecheck/test on final revision.
- **Answers:** CI impact none; PR stays Draft until 304/312 accepted; simdrive stays local-only, evidence as pasted run log.
- **Position:** Proceed in parallel; minimal CTA diff for clean rebases.
- **Vote:** AGREE (conditional on no deps / no migration / frozen lockfile)

**Round 1 tally:** 4 AGREE (Backend, Frontend, QA, DevOps); Infrastructure abstains (no storage touched). Unanimous.

## Council Proposal (Round 1, pending Chair weigh-in)

1. **Scope / files:** new `apps/mobile/app/receipt-placement/[id].tsx`, `apps/mobile/lib/receipt-placement.ts` (+ `.test.ts`), stack entry in `apps/mobile/app/_layout.tsx`, placement component test; 304/312 change limited to enabling `receipt-review.continue-placement` in `receipt-review/[id].tsx`. No api-client, SQL, migration or dependency changes.
2. **Suggestion map:** client-side `suggestZone(categoryId, zones)` (dairy/meat/produce→fridge, frozen→freezer, pantry/bakery/drinks→pantry; fallback by zone kind → first zone → null). Suggestions prefill as unconfirmed; user override always wins.
3. **Auto-sort:** fills only unassigned lines with suggestions, never overwrites overrides, reports count changed.
4. **Tap path (primary):** select chip → tap zone card or picker option; placed chips tappable to move/remove; VoiceOver/TalkBack custom actions per zone; labels + testIDs on every chip/zone; ≥44pt targets.
5. **Drag (enhancement):** PanResponder + Reanimated, `measureInWindow` hit-test, hover highlight, spring-back on miss; dispatches the same `assign` action.
6. **Idempotency:** one client UUID per attempt, frozen with the exact command; edits blocked while outcome unknown; new key only after a confirmed failure (or KEY_REUSED after status check). Pending attempt `{key, command}` persisted per receipt in existing AsyncStorage (already a dep) so retry after app kill reuses it; cleared on confirmed outcome.
7. **Outcome/error UX:** placed/replayed → `router.replace` to dashboard + toast "N items added to your stock" (no reminder copy); already_placed / RECEIPT_ALREADY_PLACED / status placed-without-key-match → committed result view; outcomeUnknown → neutral banner, Check status (`getReceiptPlacement` with key) and Try again (same key + byte-identical body), no success/failure claim; validation → keep state, highlight `receiptItemId`/`field`, reload zones on zone error; STALE/NOT_REVIEWED/LINE_SET_MISMATCH → back to review for reconciliation (keep overrides where line ids match); PLACEMENT_CONFLICT → definite failure, reload + new key; EMPTY → CTA hidden; auth codes → existing flow.
8. **Entry:** review CTA enabled only for a clean saved review with includedCount > 0; Done for now and Home resume unchanged.
9. **Tests / gates:** reducer + buildCommand + retry-same-key unit tests; component test (tap path, outcomeUnknown retry args, nav only after success); extend `placement-cta.e2e.ts` and add same-key/body double-submit no-duplicate API case; web E2E green on dev; format/lint/typecheck/test + clean frozen-lockfile; simdrive tap-placement + outcomeUnknown flow written against the 908 suite and required before Done (local-only, run log pasted). L3: no receipt-row writes (diff grep).
10. **Gate:** Draft PR / local commits only; no merge or acceptance until 304/312 accepted. Independent QA seat ≠ w2.

**Open for Chair:** location/branch of the SCKRL-908 simdrive suite (QA Ask 1).

## Chair weigh-in (2026-11-03)

**Vote:** AGREE. The proposal is ratified and implementation may start. It matches the features.md acceptance criteria and guardrails: a tap-first path, user confirmation, an `outcomeUnknown` state that never claims a result, and the same key on retry. No contract, migration or dependency changes are needed, and L3 is respected. Client-side zone suggestions are acceptable for v1.

**Decision on QA Ask 1:** the simdrive flows live in SCKRL-908 on `test/SCKRL-908-mobile-e2e` (4c3bb1d, w1).

- w1 owns `apps/mobile/e2e/run.mjs`, the driver and `TESTIDS.md`. w2 does not edit them.
- w2 writes only the new flows `apps/mobile/e2e/flows/receipt-placement-tap.json` and `receipt-placement-unknown-retry.json`, following w1's flow schema.
- New testIDs use the `receipt-placement.*` prefix and are listed on this board. They get folded into TESTIDS.md at merge.
- Merge order: 908 merges first, then 305 rebases onto it. A local throwaway merge is allowed only for running the flows and is never committed.
- The fault-injection hook for the unknown-outcome flow must be dev-only and inert in production builds. Its guard will be documented here.
- The gates stand: no merge until 304/312 are accepted, and QA is not w2.

**Consensus:** the Round 1 proposal is final, and the Chair reconfirmed the same revision.

## Implementation milestone (w2, 2026-11-03)

**Files.** Everything listed here is either new or limited to the noted change.

- `apps/mobile/app/receipt-placement/[id].tsx`: the screen.
- `apps/mobile/lib/receipt-placement.ts`: the pure state machine.
- `apps/mobile/lib/receipt-placement.test.ts`: 21 unit tests.
- `apps/mobile/lib/receipt-placement-screen.test.tsx`: 8 component tests.
- `apps/mobile/lib/placement-fault-injection.ts`
- `apps/mobile/lib/placement-toast.ts` and `apps/mobile/components/PlacementToast.tsx`
- `apps/mobile/app/_layout.tsx`: adds the stack entry and the toast host.
- `apps/mobile/app/receipt-review/[id].tsx`: the **CTA only**, +26/−7 lines (gate, testID, copy, onPress).
- `apps/mobile/lib/receipt-review-screen.test.tsx`: one CTA test.
- `apps/web/e2e/api/placement.e2e.ts`: a same-key/body double-submit test that checks stock is created exactly once.
- `apps/web/e2e/smoke/placement-cta.e2e.ts`: doc comment only.
- `apps/mobile/e2e/flows/receipt-placement-{tap,unknown-retry}.json`

**Not changed:** api-client, SQL, migrations, package.json and the lockfile.

**Deviations from the proposal (for QA to check):**

1. Suggestions are **not prefilled**. Unplaced items show "Suggested: <zone>", and Auto-sort or the selection bar's "<Zone> (suggested)" applies them. This resolves the conflict between "prefill" and "auto-sort fills only unassigned", and keeps an explicit user confirmation step.
2. Drag uses RN core `Animated` + `PanResponder`, not Reanimated. This keeps dependency use at zero and the screen testable under vitest.
3. Home has no toast pattern. A root-level `PlacementToastHost` in `_layout.tsx` shows the one-shot toast after `router.replace('/(tabs)')`, so the Home/312 code is untouched.
4. Non-`ReceiptPlacementApiError` failures from finalize are treated as `outcomeUnknown`, so the screen never claims a failure it can't confirm.

**Fault-injection guard** (`lib/placement-fault-injection.ts`): the hook runs only when all three conditions hold:

- `__DEV__ === true`, which is false in release bundles.
- `EXPO_PUBLIC_APP_ENV === 'dev'`, the same guard as the sample receipt in `scan.tsx`.
- `EXPO_PUBLIC_E2E_PLACEMENT_FAULT === 'drop-first-response'`

When active, the first finalize call per key reaches the server, then its response is dropped and reported as an unknown outcome. Otherwise the real result passes through unchanged. Because the flag is set in the Metro env, the unknown-retry flow must run in its own simdrive invocation.

**New testIDs** (fold into TESTIDS.md at merge). Chips use the line index and zones use the zone key, so flows have no UUIDs.

| testID                                                                      | Element                                                               |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `receipt-review.continue-placement`                                         | Review CTA (now enabled when clean, saved, reviewed and included > 0) |
| `receipt-placement.back` / `.auto-sort` / `.scroll` / `.dock` / `.progress` | Header, dock and progress                                             |
| `receipt-placement.chip.<i>` / `.placed.<i>`                                | Unplaced / placed item chip (i = included-line index)                 |
| `receipt-placement.zone.<zoneKey>`                                          | Zone tap target                                                       |
| `receipt-placement.selection` / `.accept-suggestion` / `.unplace`           | Selection bar actions                                                 |
| `receipt-placement.submit`                                                  | Add to stock                                                          |
| `receipt-placement.error` / `.back-to-review`                               | Confirmed-failure notice / stale reconcile                            |
| `receipt-placement.outcome-unknown` / `.check-status` / `.retry`            | Unknown-outcome banner                                                |
| `receipt-placement.committed` / `.go-home`                                  | Already-placed result                                                 |
| `receipt-placement.state`                                                   | Loading/unavailable/not-placeable card                                |
| `receipt-placement.toast`                                                   | Success toast on Home                                                 |

**Evidence:**

- `pnpm format:check`, `lint`, `typecheck` and `test` all pass, with mobile at 146/146.
- `pnpm install --frozen-lockfile` is clean.
- Web E2E on dev: 89/89, with the teardown sweep confirming 88 synthetic users absent.
- L3: the diff has no receipt-row or direct item writes. The RPC is the only write.
- The copy has no reminder claims.

**Not yet run:** the simdrive flows. They need 908 merged (or a throwaway local merge) and the owner's Accessibility grant, and they remain a Done gate.

**Merge notes for the Chair/w1:**

- w1's `50-receipt-review.json` asserts `continue-placement` is **disabled after save**. With 305 that becomes enabled once the lines are reviewed and saved, so that step needs flipping when 305 rebases onto 908.
- If 908 also added testIDs to `receipt-review/[id].tsx`, expect a small conflict on the CTA `Pressable`.

## QA standup (independent Sonnet QA seat, run by the Chair, on 246fd8e)

- **Vote:** AGREE (conditional on fixing findings 1-3; findings 4-6 are optional but recommended).
- **Verified OK:** idempotency, persistence, the error table, the tap path, the fault guard, scope and L3.
- **Findings:**
  1. **HIGH:** on confirmed success, `router.replace` ran while `usePreventRemove` was still armed from the submitting/checking/unknown render. The user could see "Still confirming" and stay put. The same applied to Check status → placed.
  2. **MEDIUM:** `load()` depended on the token and email, so `TOKEN_REFRESHED` reloaded and reset state. That lost assignments, or left the screen stuck in `unknown` with a null attempt.
  3. **MEDIUM:** if the screen was in `committed` but the placement read had failed, it fell through to the editing UI with no notice.
  4. **LOW:** a deterministic non-API throw could loop in `unknown`.
  5. **LOW:** `RECEIPT_NOT_FOUND` and uncoded 401/429 got only generic copy, and `INVALID_PLACEMENT_ZONE` should reload zones.
  6. **LOW:** with zero zones, submit was disabled with no explanation.

## QA fixes (w2)

1. Navigation and the toast now run from a `useEffect` on `phase === 'success'`. It is declared after `usePreventRemove`, so the guard has already been disarmed by the time it runs. `finish()` was removed.
2. The load runs once per `user:receipt` (ref guard). Only the explicit Try again forces a reload. The auth context is read from a ref at call time, so after a refresh, retries and status checks use the new token.
3. A `committed` phase with no placement shows a "couldn't load where its items went" card with Try again (which re-reads status) and Go to Home. Pending storage is cleared on `committed`.
4. Uncoded `ApiRequestError` 401/403 maps to auth, 429 to "Too many tries", and other 4xx (not 408) to a definite failure. 5xx, 408 and non-API errors stay unknown, because the client already raises local validation as coded `INVALID_PLACEMENT_INPUT`. `RECEIPT_NOT_FOUND` gets its own copy.
5. `INVALID_PLACEMENT_ZONE` reloads zones through a new `zonesReloaded` reducer action. It only applies while editing, and it drops assignments to zones that were removed.
6. With zero zones, the hint reads "Add a storage place in Settings before placing items."

**Regression evidence:**

- New screen tests use a `usePreventRemove` mock that records navigation while the guard is armed. They cover:
  - deferred success
  - Check status → placed
  - a token refresh while editing
  - a token refresh during unknown, then retry with the same key and new token
  - committed with an unreadable result
  - a zone reload
- Swapping the 246fd8e screen and reducer back in fails 5 of these 6 tests. The refresh-during-unknown case passes on old code, because there persistence restores the attempt.
- Unit tests were added for classification and `zonesReloaded`.
- Repo-wide format, lint, typecheck and test pass, with mobile at 154/154. The frozen-lockfile install is clean, and there are still no dependency, api-client, SQL or migration changes.

## QA re-verification (independent Sonnet QA seat, on 940f180)

- **Vote:** AGREE. All six findings are resolved and no new defects were found.
- **Regression evidence:**
  - 7 of the new tests fail on 246fd8e.
  - The token-refresh-during-unknown test passes on the old code, because persistence restores the attempt there. So it guards behaviour, not the stale-state regression itself.
- **Key re-mint:** QA judges re-minting the key after an uncoded 401/403 safe, because the server's guard returns `RECEIPT_ALREADY_PLACED` for any second placement.

## Chair note

SCKRL-305 → **Review** (status.md 015a095).

**Done gates still open:**

1. A simdrive run of `receipt-placement-tap` and `receipt-placement-unknown-retry` confirms Home with no "Still confirming" alert.
2. SCKRL-304/312 are accepted.

**Order:** merge 908 → rebase 305 onto it → flip the `continue-placement` assert in w1's `50-receipt-review.json`. The branch stays local.

## Round: rebase onto SCKRL-908 + Maestro E2E (w2, Claude Opus 5.5, 2026-11-04)

**Rebase.** Rebased onto `origin/feature/stage1-receipt-loop` (534abe3, 908 Maestro merged). One
conflict in `apps/mobile/app/receipt-review/[id].tsx` at the "Continue to placement" CTA: kept 305's
gating (`disabled={!canContinueToPlacement}`, `onPress`, enabled style) and 908's
`receipt-review.continue-placement` testID. No other conflicts.

**Flows (simdrive JSON removed, converted to Maestro).**

- `55-receipt-placement-tap.yaml` (default suite, after 50): saved review → Continue (asserted
  enabled) → tap chip 0 + Fridge (asserts selection bar and `placed.0`), then tap-only placement of the
  rest via `lib/place-all-tap.yaml` → Add to stock → `home.screen` + `tabs.home`, `receipt-placement.toast`
  visible, `assertNotVisible: 'Still confirming'`, placement dock gone. No drag.
- `56-receipt-placement-unknown-retry.yaml` (tag `placement-fault`, excluded from `config.yaml`): run
  with `node apps/mobile/e2e/run.mjs --placement-fault`, which starts its own Metro (`--clear`, refuses
  to reuse one) with `EXPO_PUBLIC_APP_ENV=dev` and `EXPO_PUBLIC_E2E_PLACEMENT_FAULT=drop-first-response`
  and uses `e2e/placement-fault.config.yaml` (10 → 30 → 56, fresh fixture user). Asserts the neutral
  outcome-unknown notice (no toast, no error, not Home), Check status → (Try again if still open) →
  toast → Home, no "Still confirming", then Stock › Pantry shows Milk, Bananas, Bread exactly once each
  and exactly three rows.
- Shared helpers `lib/review-and-save.yaml` and `lib/place-all-tap.yaml`.
- `50-receipt-review.yaml` post-save assertion flipped to `enabled: true`. `TESTIDS.md` gains the
  `receipt-placement.*` section; `docs/qa/e2e-mobile.md` documents 55/56 and fault mode.

**Runs.**
| Run id | Mode | Result |
| --- | --- | --- |
| 20261104110713-kozz | default | 8/9; 55 FAIL: CTA tapped while under the sticky footer (flow issue, fixed by scrolling to the end) |
| 20261104111402-ezog | default | **9/9 PASS** (10, 20, 30, 35, 40, 50, 55, 70, 90); cleanup ok |
| 20261104112111-elsd, -112338-m88j | fault (10+56) | 56 FAIL: Scan "Household not found" (see finding) |
| 20261104112849-naoj, -113422-blsu, -114005-7ce2 | fault (10+30+56) | 56 FAIL: flow timing vs the 4 s toast / branch race (flow-only fixes); -113948-etuf was a YAML format error (0 flows) |
| 20261104114533-0eh0 | fault (10+30+56) | **3/3 PASS**; cleanup ok |

**"No Still confirming" evidence.** `assertNotVisible: 'Still confirming'` COMPLETED on Home in
ezog (55) and 0eh0 (56); screenshots `55-placement-home-toast`, `56-placement-retry-home`.

**Idempotency / no duplicates.** In 0eh0 the first finalize committed with its response dropped; the
screen showed the neutral notice; **Check status** with the same key confirmed the commit (the Try
again branch was skipped, so this run exercised Check status, not the replay path). Stock › Pantry:
3 items, Milk/Bananas/Bread × 1 (`56-stock-no-duplicates`). The retry-replay path stays covered by unit
tests only.

**Findings.** No SCKRL-305 app defect found. Pre-existing, outside 305: a fresh user who signs in and
lands straight on Home has no household row (only add-item / storage-zones / stock mutations call
`ensureHousehold`), so Scan's sample path (`apps/mobile/app/(tabs)/scan.tsx:232-234`, and capture at
:186-190) shows "Household not found." Fault config runs 30-stock-add first to work around it. Worth a
ticket.

**Checks.** format:check, lint, typecheck, mobile tests 154/154 pass. Metro stopped by the runner.

## Round: QA objections on 18e142c (w2, Claude Opus 5.5, 2026-11-04)

**Changes.** 55: submit tap uses `waitToSettleTimeoutMs: 300`, then a hard `extendedWaitUntil` on
`receipt-placement.toast` before Home / no "Still confirming" / no dock. 55 now counts Home's pending
saved reviews before saving its receipt and after placement (`lib/count-pending.yaml`) and asserts the
count is unchanged. All sample receipts share one store name, and rows expose only an index, so the
count delta (newest-first list) is how this flow identifies its receipt. New `51-resume-after-restart`
(after 50): save → status copy "Review saved. Items are not in stock yet." → Done for now →
`stopApp` + relaunch → resume `home.pending-reviews.row.0` → `receipt-review.lines` and
`continue-placement` enabled.

**Runs.** Default 20261104121513-g4u1: **9/10**, 51 PASS, 55 FAIL at the pending-count assertion
(before 2, after 3). Fault 20261104122545-sy5m: **3/3 PASS**. format, lint, typecheck and mobile tests
154/154 pass.

**Defect (real, 305/312, not masked).** The placed receipt is still listed on Home as "Continue a
saved review" (screenshot `step-182-assertCondition.png` in g4u1: 3 pending rows, stock 3). Home still
calls the legacy `listPendingReceiptReviews` at `apps/mobile/app/(tabs)/index.tsx:392` and `:629`.
That query (`packages/api-client/src/receipts.ts:1073-1090`) filters only on parse generation and
`review_revision > 0`, with no placed-state exclusion. Its doc comment says it stays "until SCKRL-305
activates the authoritative method" `listUnplacedReceiptReviews` (`receipts.ts:1256`, RPC
`list_unplaced_receipt_reviews`). 305 never switched Home over (see also status.md:727). Not fixed
here: Home is outside the 305 placement file set. The fix needs a Chair decision on ownership.
Flow 55 stays red until it lands.

## Round: Home switched to the authoritative unplaced list (w2, Claude Opus 5.5, 2026-11-04)

**Chair decision:** this switch is in SCKRL-305 scope.

**Change.** `apps/mobile/app/(tabs)/index.tsx:392` and `:629` now call `listUnplacedReceiptReviews`
(RPC `list_unplaced_receipt_reviews`) with the same household and pagination (`pageSize: 3`,
`page + 1`). The legacy `listPendingReceiptReviews` stays in api-client, marked `@deprecated` in its
comment. `apps/mobile/lib/home-pending-receipts.test.tsx` mocks the new method. A new test asserts
that the legacy method is not called and that a placed receipt is not rendered.

**Runs.** Default 20261104123157-avgw: **10/10 PASS**, including 51 and 55. The 55 pending-review
count is unchanged after placement, and the toast assert is hard. Fault 20261104124209-1z8h: **3/3 PASS**. format, lint, typecheck pass, and mobile tests pass 155/155.

## Round: flow 51 proves the same receipt reopens (w2, Claude Opus 5.5, 2026-11-04)

**Flow 51.** After save, the flow renames line 0 to `Milk <HHMMSS from run id>`, a unique digits
suffix so QuickType can't alter it, marks it reviewed and saves again. The status copy still reads
"Review saved. Items are not in stock yet." The flow then taps Done for now, stops and relaunches the
app and resumes `home.pending-reviews.row.0`. It asserts `receipt-review.lines`, that
`continue-placement` is enabled, and that the unique name is visible on line 0 (screenshot
`51-resumed-same-receipt`).

**Run 20261104130114-gt0y.** 51 PASS; every unique-name assertion completed.

**Flow 90 (908 flow, test-only).** It failed twice: in 20261104130114-gt0y, and in
20261104131234-pjno (where 51 also passed). The cause: the confirmation dialog closed between the
`when visible 'Sign out'` check and the tap, and the screenshot shows the signed-out screen. The tap
is now `optional: true`; the following waits still prove sign-out.

**Default run 20261104132316-moao:** **10/10 PASS**, cleanup ok. format, lint, typecheck pass, and
mobile tests pass 155/155.
