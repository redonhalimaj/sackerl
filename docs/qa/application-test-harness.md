# Application test harness

Ticket: SCKRL-906  
Last reviewed: 2026-09-11

Status: accepted locally after independent QA and integration review; SCKRL-906 Done.

## Chosen layers and commands

- Web route/contract tests: Vitest. Run `pnpm --filter @sackerl/web test` locally or
  `pnpm test --filter=@sackerl/web` from the workspace. The real `/household` route test exercises
  its unauthenticated response without contacting Supabase.
- Mobile behavior/component tests: Vitest with the component's real function, a mounted
  `react-test-renderer` 19.1.0 tree (matching mobile React 19.1.0), and provider-free React Native
  host mocks. Run `pnpm --filter @sackerl/mobile test` locally or
  `pnpm test --filter=@sackerl/mobile` from the workspace. The focused checks cover add-item input
  normalization and the shared mobile screen shell, including a mounted rerender that asserts
  visible copy and the optional illustration.
- Device journeys: Maestro against an Expo development build. This is the SCKRL-908/physical
  journey layer, not required by the deterministic CI test command. Device automation itself is
  intentionally deferred to SCKRL-908.

The root CI job runs `pnpm test`, which includes both app packages. The app scripts intentionally
omit Vitest's `--passWithNoTests`, so an absent expected suite fails the job.

## Fixtures, isolation, and prerequisites

The SCKRL-906 tests use only de-identified literals and no receipt content, network calls, provider
credentials, OCR, push, or production services. They do not create persistent records. Component
tests unmount their renderers after each test and restore the React act-environment flag after the
suite. Future L2 tests must generate a unique run ID and
dedicated dev household, then remove auth users, storage objects, receipts, items, and jobs in a
`finally` cleanup path; CI output must never contain tokens, signed URLs, or receipt text.

For local deterministic checks, install Node `>=20.19.4` with pnpm `9.15.4`, then run the commands
above from the repository root. Maestro checks additionally require Maestro, an Expo development
build, a supported iOS/Android device or simulator, and explicitly configured dev fixtures; they
must remain separate from ordinary provider-free CI.

## Component-harness boundary

`ScreenScaffold.test.tsx` mounts the real screen component with `react-test-renderer` and uses
`act` for both initial render and rerender. The assertions inspect the mounted tree's visible text
and illustration host, rather than calling the component function or relying on child indexes.
React Native and shared UI host components remain provider-free test doubles so this deterministic
suite does not require Expo, a native runtime, Supabase, or device services. This validates
component lifecycle and prop-driven behavior; it does not replace native layout, accessibility
semantics, gestures, keyboard behavior, or end-to-end navigation coverage.

Keep the existing add-item form normalization checks; they exercise the same helpers used by the
Add item screen. Device journeys remain the SCKRL-908/physical journey layer.

Maestro is the selected future device-journey layer; no Maestro flow or runnable journey command is
delivered in this increment. Record the concrete bootstrap/run command when the device harness is
configured, with actual journey implementation tracked by SCKRL-908.

## Acceptance evidence (2026-09-11)

Independent QA accepted the harness after running both app test suites (mobile 5 tests, web 1),
both app lint/typecheck commands, root `pnpm test` (75 tests across packages), and root
`pnpm typecheck`. Empty-suite probes using
`pnpm --filter @sackerl/mobile exec vitest run __sckrl_no_tests__` and the corresponding web command
both exited 1 with no test files found, confirming the strict app-suite behavior.

This is local deterministic evidence; a hosted CI run, native device, real provider, and E2E journey
were not exercised. The renderer's upstream deprecation warning and Vite CJS warning remain visible
and are not acceptance failures for this pinned harness.
