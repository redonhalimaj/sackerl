# Sackerl Core Journey Test Matrix

Last reviewed: 2026-09-11

Ticket: SCKRL-022

Status: Accepted; SCKRL-022 Done.

## Purpose

This matrix defines repeatable evidence for the current product and the Stage 1 reliable food loop.
It separates deterministic checks from provider, device, and user validation so a green command
cannot be mistaken for a working end-to-end product.

## Evidence Levels

| Level | Evidence                                                                | Required environment                         |
| ----- | ----------------------------------------------------------------------- | -------------------------------------------- |
| L1    | Pure unit and contract tests                                            | Local, deterministic                         |
| L2    | Authenticated API and database integration tests with isolated fixtures | Local services or Supabase dev               |
| L3    | Automated application journey                                           | Expo development build and supported browser |
| L4    | Physical-device and provider validation                                 | iOS/Android device plus approved providers   |
| L5    | Product-owner acceptance                                                | Representative account and realistic data    |

An implementation ticket cannot claim an evidence level that was not run. Manual evidence remains
valid, but it must record device, environment, date, and observed result.

## Current Baseline

- SCKRL-906 is Done locally after independent QA on 2026-09-11. Root tests/typecheck and both
  app lint/typecheck commands passed; changed harness files passed formatting checks.
- The test suite contains 75 tests: 58 API-client, 8 UI, 3 token, 5 mobile, and 1 web route test.
- Both app scripts now fail on empty suites. Mobile coverage includes mounted React render/rerender
  behavior with mocked native hosts; web coverage exercises the real household route's rejection
  of missing credentials. This is deterministic harness evidence, not authenticated integration or
  a native device journey. See [accepted harness and commands](application-test-harness.md).
- Receipt parsing tests cover deterministic DE, EN, FR, and IT examples. They do not establish the
  accuracy target in SCKRL-810 or validate a real OCR provider.
- Prior Expo Go and authenticated Supabase checks in `status.md` are useful L2/L4 evidence, but they
  are not repeatable application automation.

## Journey Matrix

| Journey                       | Setup and happy path                                                                   | Failure and recovery path                                                                        | Accessibility and interaction checks                                                  | Current evidence | Required gate                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| Authentication and onboarding | New user signs up, confirms, signs in, sees welcome, and resumes the intended route    | Invalid credentials, unconfirmed email, expired reset, network loss, and cancelled Apple sign-in | Focus order, readable errors, keyboard behavior, screen-reader labels, 44pt targets   | L1, manual L4    | Automated auth-route checks plus one physical-device sign-up/sign-in run                      |
| Household and storage setup   | User selects default/custom zones and persists one household                           | No selection, duplicate custom zone, failed save, session expiry, and return-to flow             | Selection state announced; Continue disabled state explained; no drag dependency      | L1, manual L4    | L2 isolated household test and L3 onboarding-to-dashboard smoke                               |
| Manual stock creation         | User adds a named item with quantity, unit, category, zone, and expiry                 | Missing fields, invalid quantity/date, unavailable zone, duplicate tap, and network retry        | Labels, error association, numeric controls, segmented controls, and submit lock      | L1, manual L4    | L2 create/readback plus L3 add-item smoke                                                     |
| Item edit, move, and removal  | User edits fields, moves zone, marks used, or composts                                 | Stale record, failed update, double action, invalid zone, and cancellation                       | Bottom-sheet focus, confirmation semantics, non-color status, and destructive labels  | L1, manual L4    | L2 update/removal assertions plus L3 edit/use/compost smoke                                   |
| Receipt acquisition           | Camera, gallery, or PDF produces a real upload-ready asset                             | Permission denial, cancellation, unsupported type, oversized file, corrupt file, and retry       | Camera help, manual fallback, announced progress, and no drag-only import             | Visual L4 only   | SCKRL-307 must provide L3/L4 evidence; synthetic `sackerl://` data is not acceptance evidence |
| Private receipt upload        | Authorized user uploads bytes and receipt records a private object reference           | Interrupted upload, orphan object, wrong household, expired signed URL, validation rejection     | Progress and retry are announced; user can cancel without an orphaned receipt         | None             | SCKRL-308 L2 authorization/lifecycle tests and L4 image/PDF upload                            |
| Receipt OCR and parsing       | Uploaded receipt queues once, reaches parsed, and exposes ordered candidate lines      | Provider timeout, retry exhaustion, duplicate request, zero lines, partial write, and reprocess  | Status is understandable without color; retry/manual fallback remains available       | L1, limited L2   | SCKRL-309 L2 job/idempotency tests and L4 provider fixture run                                |
| Receipt review                | User resolves uncertain lines, edits values, adds/removes a line, and completes review | Save conflict, invalid quantity/category, stale parse, failed save, and return after restart     | Editable rows have labels, errors, focus order, and visible confidence meaning        | None             | SCKRL-310 contract tests plus SCKRL-304 L3/L4 review journey                                  |
| Receipt placement             | Suggested zones appear; user accepts or changes every included line and finalizes once | Missed drag, missing zone, duplicate submit, partial transaction, and retry after timeout        | Full tap alternative, announced targets, keyboard/screen-reader path, and submit lock | None             | SCKRL-311 transaction tests plus SCKRL-305 L3/L4 drag and tap journeys                        |
| Expiry management             | Estimated and confirmed dates display correctly; snooze/use/compost update state       | Invalid date, estimate override, stale item, failed mutation, and noisy repeat action            | Provenance is textual, urgency is not color-only, and confirmations are controlled    | L1, manual L4    | SCKRL-406 L2 provenance tests and L3 estimate/confirm/action smoke                            |
| Recipe suggestion and detail  | Stock produces ranked suggestions; detail distinguishes available and missing items    | No match, stale stock, heuristic misclassification, failed load, and repeated Cooked action      | Ingredient status has text; filters and actions are labelled; back navigation works   | L1, manual L4    | L2 route tests plus L3 suggestion-detail-return smoke                                         |
| Shopping list                 | User adds manual and recipe items, checks, unchecks, and removes without duplication   | Duplicate add, failed batch, offline retry, stale row, and invalid input                         | Check state announced; strikethrough is not the only signal; controls have labels     | L1, manual L4    | L2 idempotency integration plus L3 recipe-to-list smoke                                       |

## Automation Order

Use the accepted SCKRL-906 harness for the following delivery order:

1. Keep the strict mobile/web empty-suite guard delivered by SCKRL-906.
2. Add authenticated API integration coverage through SCKRL-907 for household setup and manual item CRUD.
3. Add SCKRL-908 mobile smoke coverage for onboarding, manual add/edit/remove, expiry actions, recipe detail,
   and shopping list.
4. Add deterministic receipt route tests for authorization, parse failure, idempotency, and data
   preservation.
5. Extend the receipt smoke journey as SCKRL-307 through SCKRL-311 and SCKRL-304/305 land.
6. Run physical-device and real-provider suites as explicit release checks rather than ordinary CI.

Accepted SCKRL-906 tooling is Vitest for route/contract tests and React Test Renderer 19.1.0 for
focused mounted mobile component behavior. React Native Testing Library was an initial recommendation;
it is not installed by this increment. Maestro remains selected for future device journeys against
an Expo development build, with implementation in SCKRL-908. Tool boundaries and commands are recorded
in [the harness documentation](application-test-harness.md).

## Test Data And Isolation

- Use a unique test run identifier and a dedicated QA user or household per L2 run.
- Clean up auth users, storage objects, receipt records, items, and jobs after the run.
- Use de-identified receipt fixtures with no real names, addresses, loyalty IDs, or payment data.
- Keep deterministic parser fixtures versioned and immutable once used as a quality baseline.
- Never log receipt text, signed URLs, tokens, or environment secrets in CI output.
- Destructive and retry tests must target local or dev environments only.

## Release Blockers

- Cross-household data or media access.
- A failed reparse erasing the last good reviewed receipt lines.
- Duplicate receipt placement or partial stock creation after retry.
- An explicit allergy or other future hard constraint being ignored.
- Destructive stock changes without confirmation or recoverable audit evidence.
- A production receipt flow that passes only with synthetic media or deterministic sample text.

## Required Ticket Evidence

Every implementation handoff must state:

- Evidence levels run and exact commands.
- Environment, app version, provider version, device/browser, and date where applicable.
- Fixture or isolated-data identifier without exposing user content.
- Acceptance criteria not tested and why.
- Failures, retries, cleanup result, and remaining risks.
