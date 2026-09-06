# Sackerl

**Sackerl** is a mobile-first grocery stock management app for households. It helps users scan or import receipts, review grocery items, place items into real storage locations, track expiry dates, and later use AI-assisted recipe and buying suggestions.

> **Where to go next**
>
> - [CLAUDE.md](CLAUDE.md) - project context, agent guidance, conventions
> - [PROGRAM.md](PROGRAM.md) - long-term product direction, delivery stages, and agent ownership
> - [TEAM.md](TEAM.md) - canonical agent roster, model routing, delegation, and handoffs
> - [status.md](status.md) - tactical delivery status and decisions
> - [epic.md](epic.md) - product epic map
> - [features.md](features.md) - canonical SCKRL ticket backlog
> - [docs/monorepo.md](docs/monorepo.md) - workspace layout and commands
> - [docs/environment.md](docs/environment.md) - environment variable setup
> - [docs/design](docs/design) - active design handoff pointers
> - [docs/agents](docs/agents) - detailed agent role briefs

## Quick Start

### Requirements

- Node.js 20.19+ - `.nvmrc` provided
- pnpm 9 via Corepack

### Bootstrap

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
pnpm dev:web
```

For mobile:

```bash
pnpm dev:mobile
```

The Phase 1 design-system foundation is present locally through tokens, shared UI primitives, icon assets, the animated paper bag, brand logo utilities, and the mobile tab shell. Slice 1 now also includes Supabase Auth, profile/household persistence, storage-zone onboarding, the normalized item data model, and item CRUD API routes.

The active Phase 2 product handoff is in `Design/Phase 2/sackerl phase 2`. It is the source for onboarding, stock, receipt, expiry, suggestions, premium, and web companion screens. The next unblocked Slice 1 work is the read-only dashboard modules: SCKRL-203, SCKRL-204, and SCKRL-205.

## Monorepo Layout

```text
sackerl/
├── apps/
│   ├── web/                 @sackerl/web - Next.js App Router
│   └── mobile/              @sackerl/mobile - Expo Router
├── packages/
│   ├── api-client/          @sackerl/api-client - shared Supabase-backed clients
│   ├── tokens/              @sackerl/tokens - shared design tokens
│   └── ui/                  @sackerl/ui - shared primitives, icons, logo, and paper bag
├── docs/                    agent docs, environment, monorepo notes
└── .github/workflows/       PR checks
```

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check

pnpm typecheck:web
pnpm typecheck:mobile
pnpm --filter @sackerl/web build
pnpm --filter @sackerl/mobile build
```

## Architecture Quick Reference

- **Monorepo**: pnpm workspaces + Turborepo
- **Web**: Next.js App Router + React + TypeScript
- **Mobile**: Expo SDK 54 + Expo Router + React Native + TypeScript
- **Shared packages**: tokens, UI, and Supabase-backed API client boundaries
- **Default Slice 1 providers**: Supabase Auth + Supabase Postgres, unless explicitly changed
- **Quality gates**: ESLint, Prettier, TypeScript strict mode, Vitest
- **Environments**: `dev`, `staging`, `prod` via ignored local `.env*` files

## CI

GitHub Actions runs install, format check, lint, typecheck, and tests on pull requests and pushes to `main` or `dev`.

## License

License is not set yet.
