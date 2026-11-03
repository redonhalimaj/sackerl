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
- **Answers:** L3: UI makes no receipt-row write and no direct stock insert; the RPC is the only write. Guards raise RECEIPT_ALREADY_PLACED (`20261015100000_…sql:159-189`).
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
