# Sackerl Monorepo

Sackerl uses pnpm workspaces with Turborepo task orchestration.

## Workspaces

| Workspace             | Package               | Purpose                                                                   |
| --------------------- | --------------------- | ------------------------------------------------------------------------- |
| `apps/web`            | `@sackerl/web`        | Next.js App Router shell plus profile, household, and item API routes.    |
| `apps/mobile`         | `@sackerl/mobile`     | Expo Router app with auth, onboarding, storage-zone setup, and tab shell. |
| `packages/tokens`     | `@sackerl/tokens`     | Shared design token package.                                              |
| `packages/ui`         | `@sackerl/ui`         | Shared UI primitives, icons, logo utilities, and paper bag.               |
| `packages/api-client` | `@sackerl/api-client` | Shared Supabase-backed auth, profile/household, and item clients.         |

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
- Phase 2 product-screen implementation follows `Design/Phase 2/sackerl phase 2`.
- Supabase Auth plus Supabase/Postgres is the selected Slice 1 provider path unless explicitly changed.
- Keep server-only secrets out of Git and chat; use ignored local `.env*` files, CI secrets, or host-managed secrets.
