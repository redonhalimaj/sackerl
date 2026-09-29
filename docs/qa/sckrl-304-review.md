# SCKRL-304 Independent QA Review

Date: 2026-09-28
Reviewer: Codex QA lane, independent from implementation
State: Source accepted for Review; SCKRL-304 is not Done

## Scope

This review covers the SCKRL-304 mobile receipt review implementation under Council
`COUNCIL-20260928-02` v3. Root/Chair completed the implementation after the Frontend writer stopped
at a usage limit. I remained read-only on application source and reviewed the actual route, helper,
fixtures and focused tests:

- `apps/mobile/app/receipt-review/[id].tsx`
- `apps/mobile/lib/receipt-review.ts`
- `apps/mobile/lib/receipt-review.fixtures.ts`
- `apps/mobile/lib/receipt-review.test.ts`
- `apps/mobile/lib/receipt-review-screen.test.tsx`
- `apps/mobile/lib/scan-review-entry.test.tsx`
- `apps/mobile/app/(tabs)/scan.tsx`
- `apps/mobile/app/_layout.tsx`

I did not apply or replay migrations, deploy, commit, merge, configure hosted Supabase, run native
visual QA, or validate against connected PostgREST/Auth.

## Decision

No blocking source findings remain in this QA pass. The implementation is acceptable to move
SCKRL-304 to Review after the integration owner records the completed evidence.

This is not a Done recommendation. SCKRL-304 still needs connected/runtime evidence after the
relevant migrations are available, plus native/device and visual/accessibility review of the
implemented screen.

## Source Findings

No blocking source findings.

The helper keeps the SCKRL-310 save boundary intact. Persisted rows, including saved manual rows,
are saved with their database `id`; only newly created manual rows use a stable `clientLineId`.
The payload includes every draft row and preserves excluded rows instead of dropping them. Excluded
rows still require valid editable details, matching the accepted full-line save contract.

Evidence: `apps/mobile/lib/receipt-review.ts:46`, `apps/mobile/lib/receipt-review.ts:102`,
`apps/mobile/lib/receipt-review.ts:130`, `apps/mobile/lib/receipt-review.ts:159`.

The route keeps review separate from parser confidence and placement. It uses loaded auth/session
scope, request tokens and a saving ref to ignore stale async responses, block duplicate writes,
preserve drafts through save failures and 409 conflicts, and require an explicit reload before
discarding edits. Save uses the current receipt generation and revision and updates the draft only
from the server response.

Evidence: `apps/mobile/app/receipt-review/[id].tsx:126`,
`apps/mobile/app/receipt-review/[id].tsx:143`, `apps/mobile/app/receipt-review/[id].tsx:198`,
`apps/mobile/app/receipt-review/[id].tsx:244`, `apps/mobile/app/receipt-review/[id].tsx:277`,
`apps/mobile/app/receipt-review/[id].tsx:287`, `apps/mobile/app/receipt-review/[id].tsx:295`.

The no-generation and empty-generation paths are honest. A receipt without an active parse
generation offers refresh and manual grocery fallback without inventing parsed data. An empty active
generation can accept a manual line, but placement remains disabled. All-excluded reviews can save
without implying that there are items to place.

Evidence: `apps/mobile/app/receipt-review/[id].tsx:220`,
`apps/mobile/app/receipt-review/[id].tsx:352`, `apps/mobile/app/receipt-review/[id].tsx:441`,
`apps/mobile/app/receipt-review/[id].tsx:541`.

Scan entry now routes a newly persisted receipt ID into receipt review without claiming OCR success
or real media upload. It blocks duplicate capture/import work, cancels stale responses across
session changes or unmounts, and shows explicit simulated-capture copy.

Evidence: `apps/mobile/app/(tabs)/scan.tsx:152`, `apps/mobile/app/(tabs)/scan.tsx:164`,
`apps/mobile/app/(tabs)/scan.tsx:186`, `apps/mobile/app/(tabs)/scan.tsx:193`,
`apps/mobile/app/(tabs)/scan.tsx:271`.

## Focused Evidence Run By QA

- `pnpm --filter @sackerl/mobile test -- receipt-review scan-review-entry` passed:
  24 tests across 3 files.
- `pnpm --filter @sackerl/mobile typecheck` passed.

The focused tests cover:

- draft construction and explicit review gating;
- persisted manual rows using database IDs, with new manual rows using stable client IDs;
- full save payloads including excluded rows;
- invalid excluded rows being rejected before save;
- all-excluded no-placement eligibility;
- no-generation refresh/manual fallback;
- empty active generation manual add;
- stale 409 draft preservation and explicit reload;
- duplicate-save guard and edit/reload blocking during save;
- auth/session staleness before save and after async responses;
- explicit reload failure preserving the visible draft;
- late initial load discard after sign-out and lookup cancellation after unmount;
- scan entry navigation without a parsed-receipt or real-upload claim.

## Additional Evidence Reported By Root

Root reported the following after fixing fixture/test typing and refreshing ignored Expo route
declarations:

- full mobile test passed: 44 tests across 7 files;
- mobile typecheck passed;
- mobile lint passed;
- iOS export passed with 1,286 modules to `/tmp/sackerl-304-ios-export`.
- code map check passed with 645 callables, 1,164 relationships, 81 modules and zero stale files.
- `git diff --check` passed.

I did not independently rerun the full mobile suite, lint, iOS export, code-map check or
`git diff --check` in this QA lane.

## Not Run

- No SCKRL-310 or SCKRL-406 migration application or SQL replay.
- No hosted Supabase/PostgREST/Auth validation.
- No connected receipt review save against a migrated dev database.
- No native simulator or physical-device interaction review.
- No screenshot or visual/accessibility QA of the review screen.
- No production deployment or release build.

## Remaining Acceptance Requirements

Before SCKRL-304 can move beyond Review, validate the route against a migrated environment with
real authenticated Supabase data, including no-generation and stale-review conflict behavior.
Run native/mobile visual QA for the review screen, modal scrolling, selected unit contrast,
disabled placement copy, scan-to-review navigation, empty state and failure states. Keep SCKRL-305
placement and SCKRL-311 stock writes out of SCKRL-304 acceptance.
