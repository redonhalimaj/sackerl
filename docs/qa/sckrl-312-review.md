# SCKRL-312 independent source QA

Date: 2026-10-01. Reviewer: independent QA (`/root/qa2`, actual route
`gpt-6.1-sol`, high; explicit fallback for the unavailable preferred route).

Status: **source accepted for Review**. No remaining blocking source finding was identified in
the inspected increment. This is not ticket Done, database acceptance, connected acceptance or
native acceptance. The accepted design remains [COUNCIL-20260930-01 v2](../agents/council-decisions/COUNCIL-20260930-01.md).

## Inspected boundary

The review covered the prepared SCKRL-312 migration and legacy/command fixtures, the shared receipt
types, strict expiry validator, guarded save serialization and pending-review query, the web
receipt-review payload and route tests, mobile review drafts and route, and the Home saved-review
entry and tests. The contract, feature index, SCKRL-406 receipt mapping and ADR-0001 addendum were
also checked for agreement during the preceding documentation review.

Receipt placement, stock conversion and placement idempotency remain future SCKRL-311 work.
The current increment keeps placement unavailable and implements expiry review plus saved-review
exit/resume. SQL was read only; no migration or fixture was applied or replayed.

## Findings resolved before source acceptance

- Clean saved exit originally remained available during an unchanged save and after a conflict.
  The final route requires the loaded scope, ready state, positive saved revision, idle save and
  absence of dirty, conflicted or uncertain state. Leaving during a save requests that the user
  wait; an explicit discard re-dispatches the original navigation action afterward.
- A raw `beforeRemove` listener did not provide the supported native-stack prevention boundary.
  The route now uses `usePreventRemove` from the installed Expo Router navigation exports and
  disables the native header back-button menu. Mounted tests verify the callback behavior; actual
  native gestures still need device/simulator evidence.
- Ordinary same-account token refresh originally discarded expiry drafts. Draft identity now
  follows account/receipt, while request validity also follows the token. A refresh during a save
  retains the draft and marks its outcome uncertain. A refresh interrupting an explicit reload
  restores the visible draft instead of leaving the loading screen stuck. Old prompt callbacks
  cannot act on a different receipt/account scope.
- Home originally allowed stale resume failures and pagination settlement to affect newer state.
  The final implementation guards replies and settlement with account/token, focus epoch and
  request identity; paging also binds the displayed household. Refocus, refresh and authentication
  changes invalidate superseded requests. Existing entries survive recoverable failures, and an
  explicit saved-review retry is available.
- No-date helper text and saved/no-stock copy were missing from the visible flow. The selected
  **No expiry date** state now shows the accepted helper and accessibility distinction from
  **Unknown**. Successful save says **Review saved. Items are not in stock yet.**

## Source and deterministic evidence

The SQL source preserves stored expiry when old clients omit it, defaults parser/manual lines to
unknown, rejects invalid state/date combinations and caller-owned attribution, and owns expiry
editor/time changes independently of row review metadata. Equality comparisons preserve unchanged
line metadata. Date validation checks real Gregorian days and the year range 1–9999. The prepared
fixtures challenge legacy preservation, omission, two-member review attribution, unchanged saves,
invalid inputs, rollback, stale tokens and access/grant boundaries. These are fixture intentions,
not executed database results.

The shared client and web boundary preserve explicit unknown/no-date/dated intent through the
generation/revision save. Typed dates carry no printed evidence or confirmation. Mobile expiry
edits require review again for included lines; excluded choices remain receipt data and create
no stock through this flow. Display formatting uses an explicit UTC calendar adapter, retaining
the stored day; physical-device locale/timezone/DST behavior remains an open native gate.

Home discovers saved active reviews from the authenticated server query, pages beyond its initial
three rows, deduplicates additions, and revalidates the same receipt before navigation. It derives
resume from persisted receipt identity rather than an in-memory sample attempt. The mounted tests
exercise canonical invalidation, household mismatch, retries, simultaneous requests, auth changes,
and deferred page/resume/query responses across blur/refocus. This supports the restart design;
an actual app-restart journey remains unverified.

Independent QA ran the following against the final inspected source:

| Check                                                         | Result                                       |
| ------------------------------------------------------------- | -------------------------------------------- |
| Focused mobile draft/review/Home tests                        | 49 passed: draft 9, review route 21, Home 19 |
| Full mobile suite                                             | 85 passed across 8 files                     |
| Mobile typecheck                                              | Passed                                       |
| Mobile lint with zero warnings                                | Passed                                       |
| Prettier check on mobile review/Home source and focused tests | Passed                                       |

Commands:

```sh
pnpm --filter @sackerl/mobile test -- lib/receipt-review.test.ts lib/receipt-review-screen.test.tsx lib/home-pending-receipts.test.tsx
pnpm --filter @sackerl/mobile test
pnpm --filter @sackerl/mobile typecheck
pnpm --filter @sackerl/mobile lint
```

Mounted tests use mocked native/navigation/network boundaries. Passing them does not establish
Supabase persistence, authorization enforcement in a real database, native removal prevention,
keyboard layout or screen-reader behavior.

The Chair separately reported final integration checks: 314 workspace tests passed (161 shared
client, 57 web, 85 mobile, 8 UI and 3 tokens); all five workspace lint/typecheck gates, repository
formatting and the code-map check passed. The code map records 671 callables, 1,231 relationships
and 83 modules with no stale artifacts. The iOS Metro export passed with 1,289 modules, written to
`/tmp/sackerl-312-ios-verified`. An export verifies bundling, not a native user journey. These wider
checks were reported by the Chair; the independent reruns above cover the mobile acceptance slice.

## Remaining gates and follow-up boundaries

- Authorized populated/clean migration replay and SCKRL-310 regression fixtures against the new
  schema; the current migration-application/replay restriction remains in force.
- Connected Auth/PostgREST review save, omission compatibility, reload persistence and household
  authorization evidence. Client mapping intentionally rejects a missing expiry schema rather
  than presenting an unmigrated response as unknown.
- Native review/date modal and keyboard layout, tap/screen-reader interaction, back/swipe
  prevention, safe Home exit, app restart into the same saved receipt and account changes.
- SCKRL-311 must add authoritative unplaced filtering to pending-review discovery and resume,
  and implement locked stock conversion, lineage, acquisition events, retry/recovery and placed
  review immutability. Those behaviors are neither implemented nor accepted by this source pass.
- SCKRL-304 and SCKRL-406 retain their independent open runtime/native acceptance gates.

There is no accepted claim of real acquisition/OCR, stock placement, expiry confirmation inherited
from review, automatic receipt expiry estimation, reminder scheduling, deployment, commit or merge.
