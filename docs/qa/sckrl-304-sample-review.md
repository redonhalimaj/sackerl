# SCKRL-304 development sample: independent QA review

Date: 2026-09-29. Scope: SCKRL-304 review entry and SCKRL-908 simulator aid.
Reviewer: independent QA lane; actual runtime model/effort not exposed.
State: source accepted for Review. This is not a Done recommendation.

## Decision

The development sample is a bounded way to reach the real receipt editor from Scan. It creates
one synthetic receipt in the signed-in household, promotes unresolved parser rows through the
existing SCKRL-310 command, and opens the persisted receipt ID. The normal simulated capture path
still creates an uploaded receipt without a generation. Sample data is labelled in the Scan copy,
store, URI and parser provider, and the action is gated by `__DEV__` plus
`EXPO_PUBLIC_APP_ENV === 'dev'` at both render and press.

The implementation retains a sample attempt in the mounted Scan route. A known receipt ID is
reloaded before promotion, so a lost promotion response or repeat tap reuses the existing
generation and preserves edits. An uncertain create response is reconciled through household-scoped
paginated receipt listing and the exact synthetic URI. A failed or no-match reconciliation keeps
that attempt pending without another insert. This is the right conservative behavior under the
current create contract, which has no idempotency key.

Request tokens and the shared in-flight ref prevent stale navigation after focus/session changes
and block concurrent sample and ordinary Scan actions. No stock, media or OCR writes were added.
No blocking source findings remain. The QA final source vote on Council `COUNCIL-20260929-01` v1
is **Support**. This vote does not accept the connected or native SCKRL-304/SCKRL-908 gates.

## Evidence

- Reviewed `apps/mobile/app/(tabs)/scan.tsx`, `apps/mobile/lib/sample-receipt.ts`, and
  `apps/mobile/lib/scan-review-entry.test.tsx` against Council `COUNCIL-20260929-01` v1.
- Independent `pnpm --filter @sackerl/mobile test -- scan-review-entry`: 16 tests passed,
  including late promotion completion after unmount, session change during create, ambiguous
  create recovery, promotion retry, environment gate and ordinary Scan regression.
- Independent `pnpm --filter @sackerl/mobile typecheck` and
  `pnpm --filter @sackerl/mobile lint`: passed.
- Independent `git diff --check`: passed.
- Chair reported the full mobile suite passing with 54 tests before the last late cancellation
  test was added, and a successful iOS export of 1,287 modules. QA did not independently rerun
  that full suite or export after the final test edit.

## Remaining gates

This source review does not establish that the target hosted Supabase project has the SCKRL-310
RPC migration, that an authenticated simulator can promote and save the sample, or that the native
layout and accessibility are acceptable. Those remain SCKRL-304/SCKRL-908 connected and device
acceptance work. Synthetic samples do not validate real acquisition, private upload or OCR.

An uncertain create response may leave an orphan synthetic receipt if the Scan route is destroyed
before its attempt can be reconciled. The current API cannot guarantee exactly one insert across
that boundary. The explicit sample label and no-stock behavior bound this development-only risk.
