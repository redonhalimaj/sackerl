# SCKRL-911 Dependabot security alerts

## Audit counts (pnpm audit, advisories found)

| Scope           | Before                                   | After                    |
| --------------- | ---------------------------------------- | ------------------------ |
| `--prod`        | 89 (5 low, 24 mod, 56 high, 4 critical)  | 4 (1 low, 2 mod, 1 high) |
| all (incl. dev) | 111 (6 low, 36 mod, 62 high, 7 critical) | 5 (1 low, 3 mod, 1 high) |

Critical alerts: 7 -> 0.

## What changed

Direct dependencies:

- `next` ^15.1.6 -> ^15.5.28 (apps/web) and `@next/eslint-plugin-next` ^15.1.6 -> ^15.5.28 (root). Resolved to 15.5.28.
- `vitest` ^2.1.8 -> ^4.1.12 (root, resolved 4.1.12). No config changes were needed; all suites pass.
- `vite` ^6.4.4 added as a root devDependency. vitest declares vite as a peer, and pnpm overrides do not
  reach auto-installed peers, so the explicit dependency is what moves vite 5.4.21 -> 6.4.5
  (and esbuild 0.21.5 -> 0.25.12).

`pnpm.overrides` added in the root package.json (semver-compatible with the parents; no Expo SDK pinned
package is overridden):

`brace-expansion@^1` ^1.1.21, `brace-expansion@^5` ^5.0.12, `browserslist` ^4.28.7,
`baseline-browser-mapping` ^2.11.0, `compression` ^1.8.2, `decode-uri-component` ^0.5.1,
`js-yaml` ^4.3.2, `node-forge` ^1.4.1, `postcss` ^8.5.23, `shell-quote` ^1.9.0, `source-map-js` ^1.2.2,
`ws@^7` ^7.5.11, `ws@^8` ^8.21.0, `@babel/core` ^7.29.6, `@xmldom/xmldom@^0.8` ^0.8.15,
`@xmldom/xmldom@^0.9` ^0.9.12, `nanoid@^3` ^3.3.18, `sharp` ^0.35.5,
`image-size` ^2.0.3 (was 1.2.1, metro dependency, major bump), `uuid@^7` ^11.1.1 (was 7.0.3, major bump).

## Remaining alerts and justification

- `zod` high (3.25.76, fixed in 4.6.6): only reached via `expo > @expo/cli`. Needs a zod major, and @expo/cli
  is pinned by Expo SDK 57. Dev-time CLI tooling, not shipped in the app. Accepted.
- `glob` moderate (13.0.6, fix 14.0.2) and `deepmerge` low (4.3.1, no patched version exists): reached via
  `@expo/cli` / `@expo/config`. Build tooling only. Accepted.
- `minimatch` moderate (3.1.5 and 10.2.5, fix 11.0.1): eslint, @eslint/config-array and typescript-estree
  require older majors. Dev-only lint tooling. Accepted.

## Expo compatibility

`pnpm --filter @sackerl/mobile exec expo install --check` exits 1: it reports expo 57.0.22 (expected ~57.0.31),
@expo/metro-runtime, expo-constants, expo-linking and expo-router as behind. This is pre-existing drift; Expo
package versions in the lockfile are unchanged by this ticket (only peer-hash suffixes changed from the
@babel/core bump). A separate Expo SDK patch update is recommended; it would likely clear zod/glob too.
Also pre-existing: unmet peer warning `@react-native/metro-config@0.86.3` (found 0.85.3).

## Commands run (repo root)

| Command                                                   | Result                                      |
| --------------------------------------------------------- | ------------------------------------------- |
| `pnpm install`                                            | OK                                          |
| `pnpm format:check`                                       | pass                                        |
| `pnpm lint`                                               | pass (5/5 tasks)                            |
| `pnpm typecheck`                                          | pass (5/5 tasks)                            |
| `pnpm test`                                               | pass (8/8 tasks; mobile 116 tests)          |
| `pnpm --filter @sackerl/web build`                        | pass (Next 15.5.28)                         |
| `pnpm --filter @sackerl/mobile exec expo install --check` | fail (pre-existing Expo patch drift, above) |
| `pnpm audit --prod` / `pnpm audit`                        | 89 -> 4 / 111 -> 5                          |

## QA to verify

- Web runtime on Next 15.5.28 (auth, middleware, receipt flows). Playwright e2e were not run here.
- Metro bundling on mobile with image-size 2.x, uuid 11, ws, node-forge and postcss overrides.
- Mobile dev client start.
