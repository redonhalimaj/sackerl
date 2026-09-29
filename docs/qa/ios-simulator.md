# iOS simulator development

Ticket: SCKRL-908, simulator startup prerequisite. Full journey automation remains in progress.

## Run the current app

From the repository root:

```sh
pnpm --filter @sackerl/mobile ios:simulator
```

This starts Metro on localhost and asks Expo to launch the iOS Simulator with Expo Go. Use the
existing `pnpm dev:mobile` / mobile `ios` command for the normal LAN/physical-phone workflow.
Stop an existing Metro process on port 8081 before starting a second one, or use the first process's
`i` shortcut to open iOS. Leave Metro running while using the app; `Ctrl+C` stops it.

The simulator script runs the installed Expo CLI through Node's `--dns-result-order=ipv4first`.
On the current Mac, plain `expo start --localhost` bound Metro only to `::1`, while Expo advertised
`127.0.0.1`. The explicit lookup order makes the listener and advertised URL agree. It affects only
this Node process and preserves existing `NODE_OPTIONS`; no system DNS settings change.

The mobile package also explicitly declares `babel-preset-expo`, as used by its Babel config.
Relying on Expo's transitive dependency caused a cold Metro transformer failure under pnpm's
isolated dependency layout. The version follows the installed Expo SDK's dependency contract.

## Prerequisites

- Xcode selected with `xcode-select`, an installed iOS simulator runtime and an available iPhone
  device. Inspect with `xcodebuild -version`, `xcrun simctl list runtimes` and
  `xcrun simctl list devices available`.
- If the runtime is missing, use Xcode's platform installer or, on Apple Silicon,
  `xcodebuild -downloadPlatform iOS -architectureVariant arm64`. This is a large Apple download
  and system installation, not part of normal app startup.
- Installed workspace dependencies and the existing ignored `apps/mobile/.env.local` with
  `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Do not print or commit values.
- Expo can download the matching simulator Expo Go app on first launch. Expo Go validates the
  current startup/UI path; it is not the development build required by the full SCKRL-908 suite.

If no device exists after runtime installation, create an iPhone using identifiers from
`xcrun simctl list devicetypes` and `xcrun simctl list runtimes`, then boot it. Do not erase an
existing device to repair an unrelated startup issue.

## Startup checks

```sh
curl --fail http://127.0.0.1:8081/status
lsof -nP -iTCP:8081 -sTCP:LISTEN
```

Expected: `packager-status:running` and a listener on `127.0.0.1:8081`. A listening server or
successful JavaScript export alone does not prove native rendering. Check the simulator's actual
screen and Metro errors after launch. Sandbox restrictions can prevent access to CoreSimulator
or localhost even when the host installation works; use the runtime's normal permission flow.

## Evidence — 2026-09-16

- Mobile typecheck, lint and all 5 provider-free tests pass.
- Cache-cleared iOS Metro export succeeded with 1,284 modules in
  `/private/tmp/sackerl-s908-ios-export-cold` after adding the explicit Babel preset dependency.
- The installed Expo CLI path and simulator script help invocation pass.
- Reproduced the IPv6-only listener and failed IPv4 request with ordinary localhost startup.
  Restarting with the dedicated Node flag produced an IPv4 listener and a successful status request.
- Installed Apple iOS 26.5 (23F77) arm64 and Expo Go 57.0.9. iPhone 17 device
  `534D9647-8E3B-4EFE-A3F6-CF45A0905324` completed first boot.
- Restarted with the exact `pnpm --filter @sackerl/mobile ios:simulator --clear` command. A fresh
  native development bundle compiled 1,450 modules and rendered Sackerl's welcome screen.
  [Captured screen](evidence/sckrl-908-ios-startup.png) shows Expo Go's first-run Continue sheet
  over the welcome screen; dismissing that sheet and signed-in interaction are not validated yet.
- Independent QA accepted the simulator command and direct preset dependency. Frozen offline
  install and direct preset load pass; the lockfile adds only the required mobile importer entry.
- Sol integration review accepted the bounded startup increment and screenshot evidence.
- Root `pnpm test` passes all 122 tests (7 Turbo cache hits; mobile tests reran). Code-map check
  reports zero stale files; focused formatting and `git diff --check` pass.

No authenticated household journey, device gestures, network-failure recovery, camera/OCR, push,
or deployed database behavior is claimed by these checks. Computer Use initially reported missing
permissions, so interaction automation is not assumed available.

At the end of this check, the simulator and Metro are left running for continued development.
Dismiss Expo Go's first-run sheet in the simulator before interacting with Sackerl. Signed-in
journey testing needs an isolated dev account/household; none was created or used during startup.

## Next journey layer

The repo has no Maestro flows, installed Maestro command, native development build or fixture mode
yet. The full SCKRL-908 suite still needs its development-build setup, an isolated confirmed test
account/household with deterministic data and cleanup, the specified mobile journeys, failure/retry
coverage and accessibility evidence. See [the harness](application-test-harness.md) and
[the journey matrix](core-journey-test-matrix.md). Do not treat Expo Go startup as ticket completion.
