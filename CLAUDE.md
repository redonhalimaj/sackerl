# Sackerl Coding Agent Guide

## Repo Context

Sackerl is a mobile-first grocery stock management app for private households. The core user journey is:

1. Scan or import a grocery receipt.
2. Review and correct detected items.
3. Place items into storage locations such as fridge, pantry, freezer, or basement.
4. Track expiry dates and receive reminders.
5. Later, use AI-assisted recipes and buying behavior suggestions.

The product should feel friendly, simple, accessible, and practical. It must not feel like warehouse inventory software.

## Current Stage

The repo has the SCKRL-001 foundation scaffold in place. The selected baseline is pnpm workspaces + Turborepo, Next.js App Router for web, Expo Router for mobile, and shared packages for tokens, UI, and API-client boundaries.

Designs are still pending. Do not start design-token extraction, component implementation, product screens, auth, persistence, OCR, notification, AI, or provider-specific backend work until the relevant SCKRL ticket is active.

## How To Work

- Read [AGENTS.md](AGENTS.md), [status.md](status.md), [epic.md](epic.md), and [features.md](features.md) before starting substantial work.
- Work from explicit `SCKRL-XXX` tickets or direct user instructions.
- Keep changes scoped to the active ticket.
- Do not introduce unrelated refactors while the codebase is still forming.
- Update `status.md` when ticket state changes.
- Update durable repo guidance in this file only after decisions are stable or implementation has landed.

## Repo Commands

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install

pnpm dev:web
pnpm dev:mobile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @sackerl/web build
```

## Current Structure

- `apps/web`: Next.js App Router scaffold.
- `apps/mobile`: Expo Router scaffold.
- `packages/tokens`: placeholder package for SCKRL-002.
- `packages/ui`: placeholder package for SCKRL-004.
- `packages/api-client`: placeholder package for future API integration.
- `.env.dev`, `.env.staging`, `.env.prod`: checked-in environment templates.

## Product Guardrails

- User correction is mandatory for receipt parsing, item extraction, categories, quantities, and expiry dates.
- Drag-and-drop must have a non-drag alternative.
- Expiry dates can be suggested, but the user confirms them.
- Notifications should have clear user controls for timing, frequency, category, product, and disable/snooze behavior.
- AI suggestions should explain why they are shown and allow dismissal or correction.

## Frontend Expectations

- Build mobile-first.
- Use clear touch targets and readable typography.
- Keep dashboards focused; avoid overwhelming users with inventory complexity.
- Preserve the app identity around visual storage locations and quick post-shopping workflows.
- Support older and younger users through contrast, labels, simple navigation, and few hidden gestures.

## Backend Expectations

- Model groceries, quantities, categories, storage locations, expiry data, reminders, and household ownership explicitly.
- Treat receipt parsing as uncertain data that flows through review and correction.
- Keep AI and OCR boundaries replaceable; early versions may use simple services while later versions can improve intelligence.
- Store user corrections in a way that can support future learning and normalization.

## QA Expectations

- Validate core flows against acceptance criteria, not only happy paths.
- Include mobile viewport checks for user-facing UI.
- Check accessibility for drag alternatives, labels, contrast, and readable text.
- Treat receipt parsing failures, manual entry, and user correction as first-class flows.

## Documentation Rule

When a ticket is completed and merged into `main`, update:

- [status.md](status.md) with final ticket state.
- The relevant feature doc under `docs/features` if behavior changed.
- [AGENTS.md](AGENTS.md) if agent workflow or ownership changed.
- [CLAUDE.md](CLAUDE.md) if architecture, commands, conventions, or repo setup changed.
