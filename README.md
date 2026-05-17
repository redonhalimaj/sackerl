# Sackerl

**Sackerl** is a mobile-first grocery stock management app for households. It helps users scan or import receipts, review grocery items, place items into real storage locations, track expiry dates, and later use AI-assisted recipe and buying suggestions.

> **Where to go next**
>
> - [CLAUDE.md](CLAUDE.md) - project context, agent guidance, conventions
> - [status.md](status.md) - tactical delivery status and decisions
> - [epic.md](epic.md) - product epic map
> - [features.md](features.md) - canonical SCKRL ticket backlog
> - [docs/monorepo.md](docs/monorepo.md) - workspace layout and commands
> - [docs/environment.md](docs/environment.md) - environment variable templates
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

The repo is scaffolded only. Product UI, design tokens, auth, persistence, receipt parsing, and backend services are intentionally deferred to their SCKRL tickets.

## Monorepo Layout

```text
sackerl/
├── apps/
│   ├── web/                 @sackerl/web - Next.js App Router
│   └── mobile/              @sackerl/mobile - Expo Router
├── packages/
│   ├── api-client/          @sackerl/api-client - API boundary placeholder
│   ├── tokens/              @sackerl/tokens - design token package placeholder
│   └── ui/                  @sackerl/ui - shared UI package placeholder
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
```

## Architecture Quick Reference

- **Monorepo**: pnpm workspaces + Turborepo
- **Web**: Next.js App Router + React + TypeScript
- **Mobile**: Expo + Expo Router + React Native + TypeScript
- **Shared packages**: tokens, UI, and API client placeholders
- **Quality gates**: ESLint, Prettier, TypeScript strict mode, Vitest
- **Environments**: `dev`, `staging`, `prod` templates

## CI

GitHub Actions runs install, format check, lint, typecheck, and tests on pull requests and pushes to `main` or `dev`.

## License

License is not set yet.
