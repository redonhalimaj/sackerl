# Mobile E2E (SCKRL-908) — simdrive

These are end-to-end tests for `apps/mobile`. They run in Expo Go on the iOS Simulator with no Maestro, Detox or other new dependencies, which is the owner's decision from 2026-11-02.

## How it works

| Part     | File                                    | Role                                                                                                                                                                                                                                                                                                 |
| -------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Driver   | `apps/mobile/e2e/driver/simdrive.swift` | Uses macOS Accessibility on Simulator.app. It finds elements by `testID` (exposed as `AXIdentifier`) or by accessibility label, then taps them, reads values or reads their enabled state. Text is entered through `simctl pbcopy` (stdin) plus Cmd+V, so secrets never appear in process arguments. |
| OCR      | `apps/mobile/e2e/driver/ocr.swift`      | macOS Vision text recognition on `simctl io screenshot`, used for `assertText` and evidence.                                                                                                                                                                                                         |
| Runner   | `apps/mobile/e2e/run.mjs`               | Does the following in order: 1. Starts or reuses Metro (`--localhost`, port 8081). 2. Provisions one synthetic user. 3. Runs the flows in filename order. 4. Writes the report. 5. Always cleans up in `finally`.                                                                                    |
| Fixtures | `apps/mobile/e2e/lib/fixtures.mjs`      | Creates one confirmed user `sackerl-e2e+<run>@example.test` on the remote dev project. Admin access is used only to create and delete that exact user. Cleanup deletes the user's owned households, which cascade, then the user. It then verifies both are gone.                                    |
| Flows    | `apps/mobile/e2e/flows/*.json`          | Declarative steps.                                                                                                                                                                                                                                                                                   |
| testIDs  | `apps/mobile/e2e/TESTIDS.md`            | The testID catalogue.                                                                                                                                                                                                                                                                                |

Run artifacts go to `.env.e2e-mobile/<runId>/`, which is git-ignored and mode 0700:

- `report.json`
- `shots/`, with one screenshot per assertion or failure
- `fixture.json`, the cleanup manifest

The login file is deleted at the end of every run.

## Prerequisites (one-time)

1. Grant **Accessibility** to your terminal app (System Settings › Privacy & Security › Accessibility), then restart the terminal.
2. Boot an iPhone simulator with Expo Go installed. The current setup is the iPhone 17 on iOS 26.5.
3. Ignored env files:
   - `.env` must contain `EXPO_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - `apps/mobile/.env.local` must contain the same `EXPO_PUBLIC_SUPABASE_URL` plus the anon key.

## Run

```bash
pnpm --filter @sackerl/mobile e2e                 # all flows
pnpm --filter @sackerl/mobile e2e 30-stock-add    # one flow (by file name)
```

Exit codes:

| Code | Meaning                                     |
| ---- | ------------------------------------------- |
| 0    | All flows passed                            |
| 1    | At least one flow failed                    |
| 2    | Aborted                                     |
| 3    | No Accessibility permission                 |
| 4    | Cleanup incomplete. Inspect `fixture.json`. |

## Step reference

| Step                                 | Arguments        | Notes                                                              |
| ------------------------------------ | ---------------- | ------------------------------------------------------------------ |
| `launch`                             |                  | Restarts Expo Go and opens the Metro bundle.                       |
| `open`                               | `route`          | Deep link `exp://127.0.0.1:8081/--/<route>`.                       |
| `tap` / `tapIfPresent`               | `id`             | `id` is a testID or an accessibility label.                        |
| `type`                               | `id`, `text`     | `${E2E_EMAIL}`, `${E2E_PASSWORD}` and `${RUN_ID}` are substituted. |
| `assertVisible` / `assertNotVisible` | `id`, `timeout?` | Polls the element until the condition holds or the timeout passes. |
| `assertDisabled` / `assertEnabled`   | `id`             | Uses the `AXEnabled` attribute.                                    |
| `assertText`                         | `text`           | OCR, case-insensitive.                                             |
| `screenshot`                         | `name`           |                                                                    |
| `wait`                               | `ms`             |                                                                    |
| `runFlow`                            | `flow`           | Reuses another flow, e.g. sign-in.                                 |

## Extending

To add a feature flow:

1. Add `testID`s using the `screen.element` convention, and list them in `TESTIDS.md`.
2. Drop in `NN-name.json`. Numbering defines the order, and later flows can depend on state from earlier ones.

No runner changes are needed for new screens. Add a new step type only for a genuinely new kind of interaction.

## Known limits

- Flows run sequentially against one shared user. A failure early on can cascade into later flows.
- Gestures like swipe and drag aren't driven. The product requires non-drag alternatives anyway, so the flows use those.
- The SCKRL-311 placement isn't applied on remote dev, so only the disabled "Continue to placement" CTA is asserted.
