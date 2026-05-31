# Phase 2 Product Handoff Summary

The current Phase 2 handoff lives at `../../Design/Phase 2/sackerl phase 2`.

## What It Contains

- `index.html`: visual source of truth for the design canvas.
- `handoff/epics.md`: ten-epic product roadmap and six-slice delivery order.
- `handoff/features.md`: ticket-level SCKRL backlog and acceptance criteria.
- `handoff/screens.md`: mobile and desktop screen anatomy, copy, behavior, and states.
- `handoff/design-system.md`: tokens, typography, components, motion, voice, and accessibility rules.
- `screens-1.jsx`, `screens-2.jsx`, `desktop.jsx`: React reference screens.

## Delivery Interpretation

Phase 2 extends the Phase 1 design-system foundation. It does not replace the completed foundation work, but it is now the active source for product-screen implementation.

The next delivery slice is the walking skeleton:

1. Finish EPIC-1 decisions and provider scaffolding: SCKRL-008 and SCKRL-009.
2. Build minimal onboarding: SCKRL-101 through SCKRL-103.
3. Build the stock data base: SCKRL-201 and SCKRL-202.
4. Build the read-only dashboard modules: SCKRL-203 through SCKRL-205.

Receipt scanning remains the differentiator, but it should follow after the stock model can receive parsed items.

## Local Product Decisions

- Default auth/database recommendation: Supabase Auth with Supabase Postgres.
- V1 household scope: one user, one household, unless product explicitly changes it.
- Keep app text letter spacing at `0` for stable web/native rendering, even where the design handoff includes negative editorial tracking.
- Keep yellow reserved for primary actions and the Scan FAB.
- Keep green reserved for information and brand marks.
- Keep kraft reserved for sanctioned identity surfaces.
