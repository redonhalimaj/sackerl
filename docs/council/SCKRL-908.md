# Council board — SCKRL-908 Mobile E2E (w1)

Process: board Council (owner direction 2026-11-02, see [README](README.md)). Worker session w1
(sackerl-76) chairs this board and reports to Chair sackerl-5d.

## Round 0 — Orchestrator (w1)

**Question:** Without Maestro (superseded 2026-11-04, see Round 4), what mechanism should run an extendable E2E suite for `apps/mobile`
(Expo SDK 57, in Expo Go on the booted iPhone 17 / iOS 26.5 simulator)? Which testIDs does the suite need?

**Owner decisions:**

- ~~No Maestro.~~ Superseded 2026-11-04: after Accessibility trust could not be granted, the owner asked for an alternative and installed Maestro themselves (see Round 4).
- Use the existing booted iPhone 17.
- Supabase: use the existing project (`raqq…`, keys in the ignored `.env`). Fixtures are synthetic users with exact cleanup.

**Acceptance criteria**

1. Flows cover:
   - auth/onboarding
   - storage zones
   - add item / stock
   - use-soon / expiry
   - receipt review (simulated capture)
   - recipe suggestions
   - the shopping list
   - the disabled "Continue to placement" CTA
2. Adding a flow means adding one declarative file under `apps/mobile/e2e/flows/`. No harness changes are needed.
3. Stable `testID`s on every element a flow interacts with or asserts, with no change to visible behavior.
4. Credentials reach the run only through env/ignored files. They never appear in Git, arguments, logs or screenshots.
5. Synthetic fixtures are always cleaned up in a `finally`.
6. `pnpm typecheck`, `pnpm lint` and `pnpm test` stay green.
7. A report with pass/fail counts and a screenshot for every step.

**Seats:**

- Orchestrator (w1, Opus 5.5)
- Frontend (Sonnet 5): testIDs
- DevOps (Sonnet 5): harness and scripts
- QA (Sonnet 5): independent, and does not implement

Backend and Infrastructure are not seated, since no schema or hosting work is involved.

**Probes (2026-11-02):**

- Text recognition works: `xcrun simctl io booted screenshot` plus macOS Vision OCR via a `swift` script needs no install, and it read the booted device's home screen correctly.
- Driving the UI does not work yet. macOS Accessibility (`AXIsProcessTrusted`) is **false** for the terminal, so it can't read the Simulator's iOS element tree (testIDs show up there as `AXIdentifier`) and can't press or type into it.
- Expo Go (`host.exp.Exponent`) is installed on the booted device, and the app scheme is `sackerl`. Deep links go through `exp://127.0.0.1:8081/--/<route>`.
- The mobile app has 0 `testID`s across 11.3k lines.

**Proposed mechanism ("simdrive")** — all in `apps/mobile/e2e/`, with no new dependencies:

- **Driver:** a Swift script run through `/usr/bin/swift` that uses macOS Accessibility on Simulator.app. It finds an element by `AXIdentifier`, which is the testID, or by its label. It can tap the element (`AXPress` or its centre point) and type into it (through the simulator pasteboard with `simctl pbcopy`, then paste). It can also read an element's value or enabled state.
- **Navigation:** `xcrun simctl openurl` deep links, plus `simctl launch`/`terminate` of Expo Go.
- **Fallback assertions:** Vision OCR on `simctl io screenshot`, for text-only checks and for evidence.
- **Runner:** Node with no dependencies (`e2e/run.mjs`). It runs these steps:
  1. Start Metro.
  2. Create the fixtures, using the ordinary SDK plus admin only for creating and deleting the exact synthetic users.
  3. Run the flows. Each flow is a JSON file with `open`, `tap`, `type`, `assertVisible`, `assertDisabled` and `screenshot` steps.
  4. Write a report.
  5. Clean up the fixtures in a `finally`.
- **Required owner action:** grant Accessibility to the terminal app (System Settings › Privacy & Security › Accessibility). Without it, only an OCR-only smoke of signed-out screens is possible.

Alternatives rejected _(superseded 2026-11-04 — the owner approved and installed Maestro; see Round 4)_:

| Alternative       | Reason rejected                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Detox / XCUITest  | Need a native prebuild or dev client and new dependencies.                                   |
| idb / AXe         | Need installs, which the owner had declined for Maestro-class tools (superseded 2026-11-04). |
| Computer Use only | Not repeatable from a script.                                                                |

## Round 1 (2026-11-02)

The owner chose to grant Accessibility; it is not active yet.

| Seat                                | Vote   | Key evidence                                                                                                                                                                                                                    |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend (Sonnet 5)                 | AGREE  | Added 206 testIDs across 14 screens. The diff only adds `testID` props. Catalogue: `apps/mobile/e2e/TESTIDS.md`. Mobile typecheck and tests pass.                                                                               |
| DevOps (Orchestrator, implementing) | AGREE  | Runner, driver, fixtures, 8 flows, the `e2e` script and `docs/qa/e2e-mobile.md`. Lint passes.                                                                                                                                   |
| QA (Sonnet 5, independent)          | OBJECT | **H1:** the flow 10 sign-in return is wrong. **H2:** `suggestions.card.*` taps a card that doesn't navigate. **H3:** no SIGINT cleanup, and the password is left in `login.json`. Medium findings M1–M9 and low findings L1–L6. |

## Round 2

The Orchestrator fixed H1–H3, M1–M7, M9 and L2. M8 and L3–L6 are deferred to the first live run.

QA voted **OBJECT** on N1: the zone taps in flow 10 toggle off the zones that are selected by default.

## Round 3

N1 is fixed: there are no zone taps, and flow 10 keeps the defaults. N3 is fixed: `TOMORROW` is the local date. For N2, the recipe flow was moved to slot 35, so it runs while the stock is non-empty.

QA voted **AGREE**. Frontend and DevOps still AGREE.

## Council Proposal (unanimous, round 3)

Accept the simdrive harness, the testIDs and the 8 flows as the SCKRL-908 mobile E2E suite. **Live execution is pending** until Accessibility is granted. The first live run must check the following:

- M8: the paste prompt.
- L3: whether `AXEnabled` reflects the disabled state.
- L4: whether the container testIDs appear in the AX tree.
- L5: whether the CTA is exposed while below the fold.
- L6: the Expo Go overlay.
- N2: whether recipe suggestions are non-empty.
- That screenshots never show a plaintext password.

Pass/fail counts come from that first run.

## Round 4 — driver change to Maestro (2026-11-04)

**Owner decision (2026-11-04):** the host could not get Accessibility trust (`AXIsProcessTrusted=false`),
so the owner asked for an alternative and installed **Maestro 2.12.1** themselves. This owner approval
supersedes the round 0 "No Maestro" constraint and the "alternatives rejected" reasoning; it is not a
Chair override. The Chair routed the switch, and worker w1 (Opus 5.5) implemented it.

**Change:** `apps/mobile/e2e/maestro/*.yaml` (8 flows, same steps and assertions as the old JSON, `id:`
selectors on the existing testIDs), `maestro/config.yaml` (fixed order), `maestro/lib/` helpers, and
`run.mjs` rewritten to provision → `maestro test --format junit` → redact → cleanup in `finally`.
`driver/simdrive.swift`, `driver/ocr.swift` and `flows/*.json` are removed. `fixtures.mjs` is unchanged.
No app source changed; no testIDs added.

**Live evidence (iPhone 17 / iOS 26.5, Expo Go, remote dev Supabase), final run `20261104103047-jh55`
on 2026-11-04:** 8/8 flows passed, cleanup verified (user 404, 0 households). Previous run
`20261104102600-4yaq` also 8/8.

| Flow                  | Result | Time  |
| --------------------- | ------ | ----- |
| 10-auth-onboarding    | PASS   | 1m 2s |
| 20-storage-zones      | PASS   | 16s   |
| 30-stock-add          | PASS   | 50s   |
| 35-recipe-suggestions | PASS   | 10s   |
| 40-use-soon           | PASS   | 21s   |
| 50-receipt-review     | PASS   | 49s   |
| 70-shopping-list      | PASS   | 13s   |
| 90-sign-out           | PASS   | 27s   |

**Deferred items from round 3:**

- M8 (paste prompt): moot. Maestro types via XCTest, no pasteboard. iOS instead shows a "Save Password?" sheet after sign-in that hides the app tree; flow 10 taps "Not Now".
- L3 (disabled state): Maestro reads `enabled`; `continue-placement` asserted `enabled: false` before and after save.
- L4 (container testIDs in tree): yes, e.g. `receipt-review.lines`, `suggestions.list`, `home.screen` are matched.
- L5 (CTA below the fold): not visible until scrolled; flows scroll to it first.
- L6 (Expo Go overlay): the floating tools button can open the dev menu under centre swipes; flows scroll with left-side swipes and close the menu if open.
- N2 (suggestions non-empty): yes when the stock item is named exactly "E2E Milk"; the recipe opened. With a mistyped name the empty state shows, so flow 35 accepts either and only opens a recipe when listed.
- Passwords: no screenshot shows the password (secure field). Maestro logs typed text verbatim, so `run.mjs` redacts the password from all run files (10 files in the final run); credentials pass as `MAESTRO_*` env, not argv.

**Findings for seats:** iOS typing via Maestro occasionally adds a stray key and QuickType autocompletes
("E2E Milkweed"); flows type with a trailing space and verify fields exactly. Low UI observation: a long
email wraps outside the `auth.email` field bounds (see `10-password-entered.png`).

## Round 5 — QA conditions (2026-11-04)

Independent QA voted AGREE on condition (live run `20261104103759-llxu`, 8/8). w1 addressed every condition:

1. Wording: Round 0 constraints and "alternatives rejected" are marked superseded; Round 4 and
   `docs/qa/e2e-mobile.md` record the owner's approval (owner asked for an alternative and installed Maestro).
2. Flow 35 asserts `suggestions.list` and opens a recipe (`recipe.title`); no either/or.
3. Flow 90 asserts the signed-out screen (`onboarding.get-started` or `auth.email`).
4. `run.mjs` runs Maestro as an async child, so SIGTERM stops it and cleans up promptly (verified:
   SIGTERM mid-run → fixture `cleaned`, no Maestro left). Cleanup runs once. New
   `node apps/mobile/e2e/run.mjs --cleanup <runId>` reaps a leaked user from `fixture.json`.
5. Flow 50 marks only unreviewed lines (the button toggles), asserts `0 needs review` and that no line
   still offers "Mark … reviewed"; the post-save `enabled: false` assert notes SCKRL-305 will flip it.
6. Flow 10 header names `MAESTRO_E2E_EMAIL` / `MAESTRO_E2E_PASSWORD`.

Live run `20261104105619-sjay` (2026-11-04): **8/8 passed**, cleanup ok — 10 1m 2s, 20 16s, 30 49s,
35 10s, 40 21s, 50 1m 15s, 70 13s, 90 27s.

The two app observations (auth email overflow, shopping-list Add needing two taps) are filed as
follow-ups by the coordinator and are not fixed here.

**Status: awaiting seat re-vote** (Frontend, DevOps, QA) on the Maestro driver.

## Chair weigh-in (2026-11-04)

**Vote: AGREE.** Independent QA (Sonnet 5) voted AGREE on 239109e: its own live run was 8/8 (`20261104103759-llxu`), there were no secret leaks and no app-source changes. Its one condition was fixing the wording, which aca1ba7 does. aca1ba7 also hardens flows 35, 50 and 90 and the runner's cleanup. The re-run was 8/8 (`20261104105619-sjay`).

The owner approved the Maestro driver on 2026-11-04 after Accessibility trust couldn't be granted, and installed Maestro themselves.

**Decision:** ratified and merged into `feature/stage1-receipt-loop` (merge 5d12366).

Follow-ups:

- **SCKRL-922:** the email overflows the `auth.email` field (`apps/mobile/app/auth.tsx:153`).
- **SCKRL-923:** the shopping-list ScrollView is missing `keyboardShouldPersistTaps` (`apps/mobile/app/shopping-list.tsx:300`).
