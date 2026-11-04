# Mobile E2E (SCKRL-908) — Maestro

End-to-end tests for `apps/mobile`, run in Expo Go on the iOS Simulator with [Maestro](https://maestro.mobile.dev).
The owner approved the switch from the in-repo "simdrive" (macOS Accessibility) driver to Maestro on
2026-11-04: Accessibility trust could not be granted (`AXIsProcessTrusted=false`), so the owner asked for
an alternative and installed Maestro themselves. This supersedes the earlier "no Maestro" decision. Maestro drives the
simulator through its own XCTest runner, so it needs no Accessibility permission.

## How it works

| Part     | File                                 | Role                                                                                                                                                                                                                                                                                                                    |
| -------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runner   | `apps/mobile/e2e/run.mjs`            | 1. Starts or reuses Metro (`--localhost`, port 8081). 2. Provisions one synthetic user. 3. Runs `maestro test --format junit apps/mobile/e2e/maestro`. 4. Redacts the fixture password from every Maestro log file. 5. Writes `report.json`. 6. Always cleans up in `finally` (and on SIGINT/SIGTERM).                  |
| Fixtures | `apps/mobile/e2e/lib/fixtures.mjs`   | Creates one confirmed user `sackerl-e2e+<run>@example.test` on the remote dev project. Admin access is used only to create and delete that exact user (matched by id, email and `app_metadata.sackerl_e2e_run`). Cleanup deletes the user's owned households, which cascade, then the user, and verifies both are gone. |
| Flows    | `apps/mobile/e2e/maestro/*.yaml`     | Maestro flows, `appId: host.exp.Exponent`. Order is fixed in `maestro/config.yaml` (`executionOrder.flowsOrder`, `continueOnFailure: true`).                                                                                                                                                                            |
| Helpers  | `apps/mobile/e2e/maestro/lib/*.yaml` | `scroll-to.yaml` (left-side swipes until `TARGET` is visible) and `dismiss-expo-menu.yaml`. Not run as flows.                                                                                                                                                                                                           |
| testIDs  | `apps/mobile/e2e/TESTIDS.md`         | The testID catalogue. Flows select with `id:` (a regex, so dots are escaped and `.*` replaces the old `*` wildcard).                                                                                                                                                                                                    |

Credentials reach Maestro only as `MAESTRO_E2E_EMAIL` / `MAESTRO_E2E_PASSWORD` **process environment**
(Maestro exposes `MAESTRO_*` env as `${MAESTRO_*}`), never as `-e` arguments, so they do not appear in
`ps`. Maestro itself logs typed text verbatim (`maestro.log`, `commands.json`, device logs); the runner
replaces the password with `[redacted]` in every run file before it finishes. The password field is
secure-entry, so screenshots show no plaintext password.

Run artifacts go to `.env.e2e-mobile/<runId>/` (git-ignored, mode 0700): `report.json`, `junit.xml`,
`shots/` (Maestro per-flow output: `takeScreenshot` evidence, failure screenshots, `commands.json`),
`maestro-debug/` and `fixture.json` (the cleanup manifest).

## Prerequisites (one-time)

1. `brew install maestro` (2.12.1 verified). The runner sets `MAESTRO_CLI_NO_ANALYTICS=1`.
2. Boot an iPhone simulator with Expo Go (`host.exp.Exponent`) installed. Verified: iPhone 17, iOS 26.5, Xcode 26.5.
3. Ignored env files:
   - `.env` must contain `EXPO_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - `apps/mobile/.env.local` must contain the same `EXPO_PUBLIC_SUPABASE_URL` plus the anon key.
   - In a git worktree, copy both ignored files in, or set `E2E_ENV_ROOT` for fixtures (Metro still reads `apps/mobile/.env.local`).

## Run

```bash
pnpm --filter @sackerl/mobile e2e                 # all flows (provision -> maestro -> cleanup)
node apps/mobile/e2e/run.mjs --cleanup <runId>    # reap a leaked user recorded in .env.e2e-mobile/<runId>/fixture.json
```

Cleanup runs once per run, from `finally` or from a SIGINT/SIGTERM handler (Maestro runs as an async child,
so a signal stops it and cleans up promptly). If a run is killed hard (e.g. SIGKILL) and `fixture.json`
is not `cleaned`, use `--cleanup <runId>`; it deletes only the user whose id, email and run marker match
that manifest.

Flows share one signed-in user and depend on `10-auth-onboarding`, so run the whole suite. Optional env:
`E2E_METRO_PORT`, `E2E_DEVICE` (simulator UDID), `MAESTRO_BIN`, `E2E_ENV_ROOT`.

Exit codes: 0 all passed · 1 a flow failed · 2 aborted · 4 cleanup incomplete (inspect `fixture.json`).

## Flows

| Flow                    | Covers                                                                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `10-auth-onboarding`    | Signed-out onboarding, default zones, sign-in, dismiss iOS "Save Password?" (Not Now), household created, Home.                                                                                          |
| `20-storage-zones`      | Home shows fridge and pantry zones.                                                                                                                                                                      |
| `30-stock-add`          | Empty stock, manual add with a user-entered expiry of tomorrow, row in Stock.                                                                                                                            |
| `35-recipe-suggestions` | Suggestions list (from the exact "E2E Milk" stock item) and opening a recipe (`recipe.title`).                                                                                                           |
| `40-use-soon`           | Item shows in Expiring; mark used; row disappears.                                                                                                                                                       |
| `50-receipt-review`     | Simulated capture, review, mark every line reviewed (asserts `0 needs review`), save; "Continue to placement" stays disabled before and after save (SCKRL-305 will flip the post-save state to enabled). |
| `70-shopping-list`      | Add an item to the shopping list.                                                                                                                                                                        |
| `90-sign-out`           | Settings, sign out, signed-out screen (`onboarding.get-started` or `auth.email`) visible.                                                                                                                |

Every flow after `10` restarts Expo Go on the Metro URL and waits for `tabs.home`, so an earlier failure
or pushed screen does not cascade.

## Extending

1. Add `testID`s using the `screen.element` convention and list them in `TESTIDS.md`.
2. Add `NN-name.yaml` under `apps/mobile/e2e/maestro/` and add its name to `flowsOrder` in `config.yaml`.

## Known limits and Expo Go quirks

- Flows run sequentially against one shared user.
- Gestures like drag aren't driven; the product requires non-drag alternatives, which the flows use.
- The SCKRL-311 placement isn't applied on remote dev, so only the disabled "Continue to placement" CTA is asserted.
- Expo Go's floating tools button can open the dev menu under centre swipes; scrolling uses left-side swipes and closes the menu if it appears.
- Maestro's iOS typing occasionally adds a stray key and QuickType can autocomplete; text fields are typed with a trailing space, closed with Return and verified exactly.
