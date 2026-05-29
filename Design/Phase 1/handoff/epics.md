# Sackerl — Epics

A grocery stock assistant for DACH households. Receipt-driven, expiry-aware,
quietly opinionated. The literal *sackerl* (Austrian for "paper bag") is the
brand metaphor: you put things in, you keep track, you waste less.

This document defines the **epics** — large bodies of work that group related
features. See [`features.md`](./features.md) for the per-ticket spec.

---

## Conventions

- All issues use the prefix `SCKRL-` followed by a three-digit number.
- Numbering is grouped per epic: SCKRL-0XX = foundation, SCKRL-1XX = onboarding, etc.
- Each ticket has: title, summary, acceptance criteria, dependencies, technical notes.
- Status flags are added by your tracker, not this doc.

## Tech stack (recommended)

| Layer | Choice |
|---|---|
| Mobile | React Native (iOS-first, Android-ready) or Expo |
| Web | Next.js / React 18 |
| State | Zustand or TanStack Query + REST |
| Auth | Supabase Auth / Clerk |
| DB | Postgres (Supabase / Neon) |
| Storage (receipt images) | S3-compatible bucket |
| OCR | Cloud OCR API (Google Vision, Textract, or Mindee Receipts) |
| Push | APNs / FCM |
| i18n | i18next |
| Design tokens | already provided in `styles.css` — port to RN via a tokens module |

---

## Epics

### EPIC-1 · Foundation & Design System
**Range:** SCKRL-001 — SCKRL-019
The non-negotiable groundwork. Tokens, type, components, auth, navigation shell.
Everything else assumes this exists.

### EPIC-2 · Onboarding
**Range:** SCKRL-101 — SCKRL-119
First-run flow. Welcome screen, household setup, storage-zone declaration
(fridge, pantry, basement, freezer, cabinet — basement is mandatory, this is
DACH), optional account creation.

### EPIC-3 · Stock & Storage
**Range:** SCKRL-201 — SCKRL-249
Core data model. Items, quantities, locations, categories. Manual add,
edit, delete, move-between-zones. The **"Your Sackerl"** hero widget on the
dashboard belongs here.

### EPIC-4 · Receipt → Stock
**Range:** SCKRL-301 — SCKRL-349
The marquee flow. Scan a receipt, OCR-parse it, review the parsed line items,
confirm or correct, drag-and-drop each item into a storage zone. Three screens:
**Scan**, **Review**, **Place**.

### EPIC-5 · Expiry & Notifications
**Range:** SCKRL-401 — SCKRL-429
Expiry estimation per category, "Use soon" surfaces, gentle push reminders,
the Notifications inbox.

### EPIC-6 · Suggestions & Recipes
**Range:** SCKRL-501 — SCKRL-529
"From your stock" — recipe matches based on what's actually at home. A small,
curated recipe set is fine for v1; expand with an API later.

### EPIC-7 · Premium
**Range:** SCKRL-601 — SCKRL-619
Subscription paywall, entitlements, billing.

### EPIC-8 · Web Companion
**Range:** SCKRL-701 — SCKRL-729
Desktop dashboard. Same data, larger canvas, optimised for shopping-list
planning at the kitchen table.

### EPIC-9 · Internationalisation
**Range:** SCKRL-801 — SCKRL-819
DE, EN, FR, IT. Metric units. Multi-language receipt parsing.

### EPIC-10 · Quality, Telemetry & Release
**Range:** SCKRL-901 — SCKRL-929
Analytics, crash reporting, performance budgets, accessibility audits,
store listings, CI/CD.

---

## Suggested delivery order

1. **Slice 1 — Walking skeleton** (Foundation + minimal Onboarding + manual Add Item + Dashboard read-only): SCKRL-001..009, 101..103, 201..205
2. **Slice 2 — Receipt flow** (the differentiator): SCKRL-301..320
3. **Slice 3 — Expiry intelligence**: SCKRL-401..415
4. **Slice 4 — Polish & retention**: SCKRL-501..510, 421..429
5. **Slice 5 — Premium + web**: SCKRL-601..610, 701..715
6. **Slice 6 — i18n + release**: SCKRL-801..815, 901..920

Don't build epics in parallel until Slice 1 is shipped — every later
ticket depends on the data model and component library it produces.
