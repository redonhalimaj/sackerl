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
