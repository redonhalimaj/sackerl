# Sackerl — Handoff Package

A grocery stock assistant for DACH households. Receipt-driven, expiry-aware, quietly opinionated.

This package is the **design + product handoff** for engineering. Feed it to your coding agents alongside the HTML hi-fi (`index.html`) which is the visual source of truth.

---

## How to use this

Read in this order:

1. **[`epics.md`](./epics.md)** — Ten epics, 6-slice delivery order, and the recommended tech stack. Start here for context.
2. **[`features.md`](./features.md)** — ~50 SCKRL-XXX tickets with acceptance criteria. This is what your coding agent works against, one PR per ticket.
3. **[`design-system.md`](./design-system.md)** — Tokens, type scale, components, motion, voice & a11y. Tickets reference this — keep it open while you build.
4. **[`screens.md`](./screens.md)** — Per-screen anatomy with ASCII layouts, copy, and every state (loading / empty / error). Resolves ambiguity in tickets.

---

## Quick reference

| Thing | Where |
|---|---|
| Visual source of truth | `index.html` (open the design canvas) |
| Print version of all frames | `index-print.html` |
| Component library | `sk-atoms.jsx` |
| Tokens (CSS vars) | `styles.css → :root` |
| Mobile screens code | `screens-1.jsx`, `screens-2.jsx` |
| Desktop screen code | `desktop.jsx` |
| iOS device frame | `ios-frame.jsx` |

## The non-negotiables

These four rules apply to every ticket. If a PR breaks them, it's wrong.

1. **Yellow (`--amber #F2C014`) is action.** Primary buttons and the Scan FAB. Never decoration.
2. **Green (`--sage #4F9D3A`) is information.** Eyebrows, success chips, "from your stock" suggestions, the brand mark.
3. **Kraft (`--kraft`) is identity.** Used only on the dashboard hero, cover footer band, and system-spec wordmark cell. Never an action surface.
4. **No emoji, no filled icons, no exclamation marks, no red.** Warnings use amber.

## Tech stack (recommended)

- **Mobile:** React Native / Expo (iOS-first, Android-ready).
- **Web:** Next.js (App Router) + React 18.
- **State:** TanStack Query + Zustand.
- **Auth:** Supabase Auth or Clerk.
- **DB:** Postgres (Supabase / Neon).
- **OCR:** Mindee Receipts, Google Vision, or Textract — abstract behind one provider interface.
- **Push:** APNs + FCM.
- **i18n:** i18next.
- **Tokens:** ship as `packages/tokens` (TS module + CSS-vars stylesheet) — see SCKRL-002.

## Out of scope for v1

Listed at the end of `features.md`. Don't build these without an explicit ask.

## Open questions for product

If unclear, ping the design owner before writing code:

- Final pricing for Premium (placeholder copy assumes Monthly + Yearly with 33% off Yearly).
- Are households shared between users in v1? Current spec says **no** — one user, one household.
- Which recipe data source for v1? Spec assumes a seeded set of 50 in DB.
- Receipt parse confidence thresholds (currently 0.85 / 0.65) — confirm with first OCR vendor.
