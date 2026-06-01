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

The Slice 1 walking skeleton has completed the foundation/auth/profile/household, onboarding start, storage-zone setup, item data model, and item API work now represented by SCKRL-006 through SCKRL-009, SCKRL-100 through SCKRL-102, and SCKRL-201/SCKRL-202.

The next unblocked delivery work is the read-only dashboard:

1. SCKRL-203: dashboard hero widget.
2. SCKRL-204: dashboard expiring soon card.
3. SCKRL-205: dashboard storage grid.

Receipt scanning remains the differentiator, but it should follow after the stock model can receive parsed items.

## Local Product Decisions

- Default auth/database recommendation: Supabase Auth with Supabase Postgres.
- V1 household scope: one user, one household, unless product explicitly changes it.
- Keep `households.zones` as the onboarding selection source and sync it into normalized per-household `zones` rows for item foreign keys.
- Keep app text letter spacing at `0` for stable web/native rendering, even where the design handoff includes negative editorial tracking.
- Keep yellow reserved for primary actions and the Scan FAB.
- Keep green reserved for information and brand marks.
- Keep kraft reserved for sanctioned identity surfaces.
