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

The repo has the SCKRL-001 foundation scaffold in place. The selected baseline is pnpm workspaces + Turborepo, Next.js App Router for web, Expo SDK 54 with Expo Router for mobile, and shared packages for tokens, UI, and API-client boundaries.

The Phase 1 design-system foundation is implemented locally from the initial design handoff: shared tokens, typography, core primitives, icon registry, animated paper bag, brand mark/logo utilities, and the mobile tab shell. SCKRL-006 and SCKRL-007 are Done after screenshot-based visual QA.

The working prototype now includes Supabase Auth, profile/household persistence, storage zones, stock CRUD, expiry flows, receipt records and deterministic parsing, recipe suggestions, and a shopping list. Real receipt media capture/upload, production OCR, receipt review/placement/history, notifications, learning-grade event data, and release hardening remain incomplete. Use `status.md` for the exact current queue and `PROGRAM.md` for the staged path forward.

The active product-screen handoff is now `Design/Phase 2/sackerl phase 2`. Use its `index.html` as visual source of truth and its `handoff` docs for epics, features, screens, and design-system details. Phase 2 extends the Phase 1 foundation; it does not replace the completed design-system work.

## How To Work

- Read [AGENTS.md](AGENTS.md), [PROGRAM.md](PROGRAM.md), [TEAM.md](TEAM.md), [status.md](status.md), [epic.md](epic.md), and [features.md](features.md) before starting substantial work.
- Use `PROGRAM.md` for long-term sequencing, stage gates, safety constraints, and agent ownership. Use `status.md` and `features.md` for active ticket state and accepted implementation scope.
- Follow the canonical model, delegation, escalation, and handoff policy in `TEAM.md`. Luna agents receive bounded work with stable contracts; unresolved architecture, privacy, transactional, health-safety, or recommendation-policy decisions must be escalated through the assigned GPT-5.5 specialist and the Sol Orchestrator.
- Work from explicit `SCKRL-XXX` tickets or direct user instructions.
- Keep changes scoped to the active ticket.
- Do not introduce unrelated refactors while the codebase is still forming.
- Update `status.md` when ticket state changes.
- Update durable repo guidance in this file only after decisions are stable or implementation has landed.
- Use Supabase Auth plus Supabase/Postgres as the default Slice 1 provider path unless the user explicitly changes the decision.
- Keep server-only Supabase secrets out of chat and Git. If runtime QA needs a service role key or database URL, put it only in ignored local `.env*` files.

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

- `apps/web`: Next.js App Router scaffold with profile, household, stock, receipt, parsing, recipe-suggestion, and shopping-list routes.
- `apps/mobile`: Expo SDK 54 + Expo Router app with auth-gated onboarding, storage zones, stock and expiry management, recipe suggestions, shopping lists, and simulated receipt capture.
- `packages/tokens`: shared design token package.
- `packages/ui`: shared primitives, icons, logo utilities, and animated paper bag.
- `packages/api-client`: shared Supabase-backed auth, profile/household, stock, receipt, parsing, recipe, and shopping-list clients.
- `.env*`: ignored local environment files; keep real values out of Git.

## Current Design Source

- Phase 2 product handoff: `Design/Phase 2/sackerl phase 2`.
- Phase 2 visual source: `Design/Phase 2/sackerl phase 2/index.html`.
- Phase 2 engineering docs: `Design/Phase 2/sackerl phase 2/handoff`.
- Phase 1 history: `docs/design/initial-design-overview`.

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
