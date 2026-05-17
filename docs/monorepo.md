# Sackerl Monorepo

Sackerl uses pnpm workspaces with Turborepo task orchestration.

## Workspaces

| Workspace             | Package               | Purpose                                                  |
| --------------------- | --------------------- | -------------------------------------------------------- |
| `apps/web`            | `@sackerl/web`        | Next.js App Router shell for the web companion.          |
| `apps/mobile`         | `@sackerl/mobile`     | Expo Router shell for iOS and Android.                   |
| `packages/tokens`     | `@sackerl/tokens`     | Design token package placeholder for SCKRL-002.          |
| `packages/ui`         | `@sackerl/ui`         | Shared UI package placeholder for SCKRL-004.             |
| `packages/api-client` | `@sackerl/api-client` | API boundary placeholder for future backend integration. |

## Commands

Run from the repo root:

```bash
pnpm dev:web
pnpm dev:mobile
pnpm lint
pnpm typecheck
pnpm test
```

Target a workspace:

```bash
pnpm --filter @sackerl/web dev
pnpm --filter @sackerl/mobile typecheck
pnpm --filter @sackerl/tokens build
```

## Boundaries

- Keep app-specific routing and platform setup inside `apps/*`.
- Put reusable cross-platform contracts in `packages/*`.
- Do not add visual token values or component styling until the design handoff is available.
- Do not choose auth, database, OCR, notification, or AI providers in this scaffold ticket.
