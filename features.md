# Sackerl - Features (Issue Tracker)

Per-ticket spec for the SCKRL backlog. Each ticket is sized to fit one small-to-medium pull request, roughly two days of work or less. If a ticket feels larger than that, split it before starting.

## Ticket Schema

- **Title**: short imperative summary.
- **Summary**: one paragraph of context and intent.
- **Acceptance criteria**: testable bullets. The ticket is done when these pass.
- **Depends on**: upstream tickets that must merge first.
- **Notes**: implementation hints, gotchas, links to design references.

The active Phase 2 handoff in `Design/Phase 2/sackerl phase 2` is the current product-screen source of truth. Use `index.html` for visual reference, `handoff/screens.md` for screen anatomy, and `handoff/design-system.md` for component, motion, voice, and accessibility details.

Keep the local SCKRL-003 decision that app text letter spacing is `0` across web/native implementation, even when the design handoff uses negative editorial tracking.

---

# EPIC-0 - Product Truth And Stage Gates

## SCKRL-020 - Product-owner QA triage

**Summary.** Convert the product owner's broad current-version QA pass into explicit, sized SCKRL tickets before new product-screen implementation resumes.

**Acceptance criteria**

- Findings are grouped as defects, usability gaps, documentation drift, or new product scope.
- Each accepted finding has a proposed SCKRL ticket, owner, dependency, and severity.
- Duplicate findings are merged without losing the original user observation.
- Out-of-scope or deferred findings include the reason and the next decision needed.

**Depends on.** SCKRL-303

**Notes.** This is Stage 0 P0.1 in `PROGRAM.md`. Do not implement fixes directly from untriaged feedback.

## SCKRL-021 - Done-ticket truth audit

**Summary.** Audit completed tickets against their literal acceptance criteria and record production gaps as explicit follow-up tickets.

**Acceptance criteria**

- SCKRL-301, SCKRL-302, and SCKRL-303 are checked against the acceptance criteria in this file and their recorded evidence in `status.md`.
- Any mock-only, simulated, missing provider, missing device, missing E2E, or missing failure-path behavior is linked to a follow-up ticket.
- `status.md` distinguishes validated foundation behavior from production behavior that remains unimplemented.
- The SCKRL-304 and SCKRL-305 prerequisites are listed before those tickets move forward.

**Depends on.** SCKRL-303

**Notes.** This is Stage 0 P0.2 in `PROGRAM.md`. The initial artifact is `docs/qa/done-ticket-truth-audit.md`.

## SCKRL-022 - Core journey test matrix

**Summary.** Create a repeatable QA matrix for the current reliable-food-loop journeys and the receipt-to-stock slice.

**Acceptance criteria**

- Matrix covers onboarding, storage setup, manual stock, item edit/removal, receipt upload/parse/review/placement, expiry, recipes, and shopping list.
- Each journey lists setup data, happy path, failure path, accessibility checks, device/browser target, automation candidate, and required evidence.
- The matrix separates checks that can run with local deterministic data from checks requiring Supabase dev credentials, Expo Go, object storage, OCR, or push providers.
- Gaps become explicit QA or implementation follow-up tickets.

**Depends on.** SCKRL-303

**Notes.** This is Stage 0 P0.3 in `PROGRAM.md`. The initial artifact is `docs/qa/core-journey-test-matrix.md`.

## SCKRL-023 - Reliable food-loop architecture ADR

**Summary.** Decide the next-slice architecture for command APIs, private receipt media, asynchronous OCR, expiry provenance, inventory events, and data retention.

**Acceptance criteria**

- ADR records accepted decisions, rejected alternatives, and consequences for SCKRL-304 and SCKRL-305.
- ADR covers server-owned transactional commands for multi-record stock changes.
- ADR covers private receipt media storage, validation, signed access, retry behavior, and default retention.
- ADR covers idempotent OCR job state and completion signaling.
- ADR covers the minimum expiry provenance and inventory event data required before receipt placement creates stock.

**Depends on.** SCKRL-021, SCKRL-022

**Notes.** This is Stage 0 P0.4 in `PROGRAM.md`. The initial artifact is `docs/architecture/adr-0001-reliable-food-loop.md`.

## SCKRL-024 - Product measurement plan

**Summary.** Define privacy-safe product metrics for activation, capture reliability, parser quality, inventory fidelity, waste, recommendations, and retention.

**Acceptance criteria**

- Metrics avoid receipt text, personal names, health data, and other unnecessary PII.
- Every metric has a purpose, event or source table, aggregation level, retention expectation, and stage when it becomes useful.
- Measurement definitions distinguish deterministic quality checks from product analytics.
- Any telemetry implementation is deferred to scoped engineering tickets after provider decisions.

**Depends on.** SCKRL-021

**Notes.** This is Stage 0 P0.5 in `PROGRAM.md`. The initial artifact is `docs/product/measurement-plan.md`.

## SCKRL-025 - Linked code overview

**Summary.** Give the owner an Obsidian-friendly view of implemented user flows, modules, methods,
callers and database boundaries, with a repeatable method-index refresh as AI changes the source.

**Acceptance criteria**

- Dedicated `docs/code-map` folder has a starting note, linked domain notes, source links and diagrams.
- Current mobile, web/API, shared clients, UI, database and test boundaries are explained accurately.
- Key methods show where they are used; a generated index provides source-derived call/reference links.
- Static-analysis limits and unimplemented product behavior are explicit.
- Regeneration/check commands and a change-maintenance guide keep the map reviewable and current.
- Internal/source links and representative method relationships pass independent review.

**Depends on.** SCKRL-310 (user-requested sequencing; documentation only).

**Notes.** Explicit user request on 2026-09-13. No app behavior or provider changes.

---

# EPIC-1 - Foundation And Design System

## SCKRL-001 - Repo, CI, environments

**Summary.** Spin up the monorepo (mobile + web + shared) with linting, formatting, type-checking, and CI on PR. Three environments: `dev`, `staging`, `prod`.

**Acceptance criteria**

- Monorepo (pnpm/turbo) with `apps/mobile`, `apps/web`, `packages/ui`, `packages/api-client`, `packages/tokens`.
- ESLint + Prettier + TypeScript strict mode, all CI-checked.
- GitHub Actions: install, lint, typecheck, test on every PR.
- Documented environment keys for `dev`, `staging`, and `prod`; real `.env*` files are ignored by Git.

**Depends on.** -

**Notes.** Use Expo Router for mobile and Next.js App Router for web.

## SCKRL-002 - Design tokens package

**Summary.** Port the CSS variables from `styles.css` into a typed tokens module consumed by both web and mobile.

**Acceptance criteria**

- `packages/tokens` exports `colors`, `space`, `radius`, `shadow`, `font` objects.
- Tokens match `:root` in `styles.css` 1:1: paper, ink, sage, sage-deep, sage-soft, amber, amber-deep, amber-soft, kraft, kraft-deep, kraft-soft, kraft-ink, hairlines.
- Web exports a CSS-vars stylesheet and a JS object. Mobile exports a JS object only.
- Storybook, web demo route, or RN demo screen shows every token swatch with name + hex + oklch.

**Depends on.** SCKRL-001

**Notes.** Do not mutate the visual values. Yellow is action, green is information, kraft is identity, black is ink.

## SCKRL-003 - Typography setup

**Summary.** Wire SF Pro as the default sans, New York as the serif italic accent, SF Mono for metadata. Provide an Android fallback.

**Acceptance criteria**

- Mobile: `font-family: 'SF Pro Display'` on iOS, `Inter` on Android as the closest SF substitute.
- Web: native font stack `-apple-system, BlinkMacSystemFont, 'SF Pro Text', ...` from `styles.css`.
- Display / Headline / Title / Body / Caption text styles defined in tokens with the same scale as the system spec (02.2): 56/700, 32/600, 22/600, 16/500, 13/500.
- Implementation letter spacing is `0` across app text styles for stable web/native rendering.
- All text uses tokens. No hard-coded font props in feature code.

**Depends on.** SCKRL-002

**Notes.** The initial design overview also contains a cover-only 92/800 editorial display style and negative tracking references. Those remain design-reference details, not the app text scale for SCKRL-003.

## SCKRL-004 - Core component library

**Summary.** Build the primitives needed by every screen: Button, Chip, Card, Eyebrow, Avatar, RoundIconButton, ListRow, Tile, Zone.

**Acceptance criteria**

- `Button` variants: `primary` (amber + ink ring), `ink`, `ghost`, `soft`. Sizes: `lg` (52), `md` (38). With/without leading and trailing icon.
- `Chip` variants: default, sage, amber, ghost. Right-aligned text count supported.
- `Card`, `CardFlat`, `CardKraft`. Kraft card uses the CSS fibre texture on web or a layered Image+Tint approach in React Native.
- All match HTML hi-fi pixel-for-pixel at 1x.
- Each component has a Storybook web entry, web demo route with representative states, or RN demo mobile entry with prop knobs.

**Depends on.** SCKRL-002, SCKRL-003

## SCKRL-005 - Icon set

**Summary.** Ship the stroked-line icon set from `SK.icons`.

**Acceptance criteria**

- Icons: scan, camera, bell, home, sparkle, basket, clock, search, settings, pdf, upload, check, drop, snowflake, box, flame, cart, arrowRight, arrowUp, list, grid, dots, filter, star, shield, leaf, plus, close, chevron-left, chevron-right, chevron-down.
- Single `<Icon name="bell" size sw stroke />` component, monoline, default stroke 1.6.
- No filled icons. No emoji.

**Depends on.** SCKRL-001

## SCKRL-006 - Animated paper bag (`<PaperBag />`)

**Summary.** Port the SVG sackerl from `sk-atoms.jsx`. Animated, breathing, items drop in. Respects `prefers-reduced-motion`.

**Acceptance criteria**

- React component for web and RN component using `react-native-svg` + Reanimated.
- Props: `width`, `height`, `label`, `animated`, `items[]` where each item has `dx`, `kind`, `size`, `color`, `delay`, `tilt`.
- Default cycle 4.4s with 4 items at staggered delays.
- Kraft gradient, fold band, three creases, stamped label rendered identically across platforms.
- Reduced-motion: bag is still drawn, items appear stationary at rest.

**Depends on.** SCKRL-002, SCKRL-005

**Notes.** Web reference: `SK.PaperBag` in `sk-atoms.jsx`.

## SCKRL-007 - App navigation shell (mobile)

**Summary.** Tab bar with Home / Stock / Scan (FAB) / Expiring / Settings. Floating amber Scan button matches the hi-fi.

**Acceptance criteria**

- 5 tabs, middle tab is a 56px round amber FAB with 1.5px ink ring, lifted 24px above the rail.
- Tab labels and icons match the design.
- Active tab indicator: ink colour on icon+label; inactive: mute-soft.
- Safe-area insets handled top and bottom.

**Depends on.** SCKRL-004

## SCKRL-008 - Auth (sign up, sign in, sign out)

**Summary.** Email + password. Apple Sign-In on iOS. "I already have an account" deep link from onboarding.

**Acceptance criteria**

- Email/password signup with confirmation email.
- Sign-in with Apple on iOS, mandatory for App Store.
- Forgot password flow.
- Logged-out state routes to onboarding; logged-in routes to dashboard.

**Depends on.** SCKRL-001

**Notes.** Default implementation choice is Supabase Auth paired with Supabase Postgres unless the product owner overrides it before implementation. Do not roll your own auth.

## SCKRL-009 - User profile and household model

**Summary.** Data model for `users` and `households`. One user can belong to one household at v1.

**Acceptance criteria**

- DB tables: `users (id, email, locale, created_at)`, `households (id, owner_id, name, created_at)`, `household_members (household_id, user_id, role)`.
- API: `GET /me`, `PATCH /me`, `GET /household`, `PATCH /household`.
- `locale` defaults to device locale, falls back to `de`.

**Depends on.** SCKRL-008

**Notes.** V1 scope is one user and one household. Use Supabase/Postgres tables and row-level security as the default implementation path unless the provider decision changes.

## SCKRL-010 - Logging, error reporting, analytics scaffolding

**Summary.** Sentry-style crash reporting, an event tracker, and a shared logger.

**Acceptance criteria**

- Crashes on mobile and web reported to Sentry or equivalent with release tag.
- `track(event, props)` helper for product events. No PII.
- Console-only in dev; sampled in prod.

**Depends on.** SCKRL-001

---

# EPIC-2 - Onboarding

## SCKRL-100 - Local onboarding preview setup

**Summary.** Help the product owner run the Sackerl onboarding flow locally on a laptop browser and on a physical phone through Expo Go before continuing product-screen work.

**Acceptance criteria**

- Laptop browser instructions include the repo root command `pnpm --filter @sackerl/mobile web -- --port 8082` and the URL `http://localhost:8082/onboarding`.
- Expo Go instructions include installing Expo Go, keeping laptop and phone on the same Wi-Fi, running `pnpm --filter @sackerl/mobile dev -- --host lan`, and scanning the QR code.
- Troubleshooting notes cover using `pnpm --filter @sackerl/mobile dev -- --tunnel` if LAN QR connection fails, checking `apps/mobile/.env.local` for public Supabase keys, and stopping the dev server with `Ctrl+C`.
- The user can see the SCKRL-101 onboarding screen in both browser preview and Expo Go, or the remaining blocker is clearly recorded.

**Depends on.** SCKRL-008, SCKRL-101

**Notes.** This is a guided local setup/QA task, not product implementation. Do not commit local env values or expose Supabase service-role credentials.

## SCKRL-101 - Welcome screen

**Summary.** First screen on cold install. Hero headline, tag, primary CTA "Get started", secondary "I already have an account".

**Acceptance criteria**

- Matches `ScreenOnboarding` in `screens-1.jsx`.
- Primary CTA is amber with ink ring (SCKRL-004 variant `primary`).
- Tapping "Get started" navigates to SCKRL-102.
- "I already have an account" routes to sign-in.

**Depends on.** SCKRL-004, SCKRL-008

## SCKRL-102 - Storage-zone setup

**Summary.** Let the user declare which storage zones they have. Defaults preselected: Fridge, Pantry, Basement, Freezer. Cabinet optional.

**Acceptance criteria**

- Multi-select with the 5 `SK.Zone` tiles.
- Selecting/deselecting persists to `household.zones[]`.
- At least 1 zone required to continue.
- Skipping is not allowed.

**Depends on.** SCKRL-009

**Notes.** Use Supabase/Postgres migrations as the default implementation path. Categories are global seed data; zones are household-scoped records seeded from SCKRL-102.

## SCKRL-103 - Locale picker

**Summary.** Choose UI language (DE, EN, FR, IT). Pre-selected from device locale.

**Acceptance criteria**

- 4 segmented options.
- Persists to `users.locale`.
- App reloads strings without restart.

**Depends on.** SCKRL-009, SCKRL-801

## SCKRL-104 - "What's a sackerl?" explainer (optional skip)

**Summary.** Single illustrated screen explaining the brand metaphor using the animated `<PaperBag />`.

**Acceptance criteria**

- Bag is animated and centered.
- One paragraph of copy + dismiss button "Got it".
- Shown once, then never again, tracked in user profile.

**Depends on.** SCKRL-006

---

# EPIC-3 - Stock And Storage

## SCKRL-201 - Item data model

**Summary.** Schema for `items`, `categories`, `zones`.

**Acceptance criteria**

- `items (id, household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, added_on, removed_on, source)`.
- `qty_unit` enum: `g`, `kg`, `ml`, `l`, `pcs`.
- `source` enum: `manual`, `receipt`, `imported`.
- `categories` seeded with the 10 keys in `SK.categories`.
- `zones` seeded per household per SCKRL-102.

**Depends on.** SCKRL-009

## SCKRL-202 - Items API (CRUD)

**Summary.** REST endpoints for items.

**Acceptance criteria**

- `GET /items?zone&category&expires_within=days` is paginated.
- `POST /items` creates a single item.
- `POST /items/batch` is used by SCKRL-305.
- `PATCH /items/:id`, `DELETE /items/:id`.
- Soft delete sets `removed_on`.

**Depends on.** SCKRL-201

## SCKRL-203 - Dashboard "Your Sackerl" hero widget

**Summary.** The kraft-textured card on Home with the animated `<PaperBag />` and a live item count.

**Acceptance criteria**

- Displays `household.itemCount` and a copy stub: "Enough for N dinners. Skip the shop on ...".
- Bag breathes; items drop on the cycle.
- Reduced-motion: static bag.
- Tap navigates to Stock list.

**Depends on.** SCKRL-006, SCKRL-202

## SCKRL-204 - Dashboard Expiring soon card

**Summary.** The white card listing up to 3 items expiring within 7 days, with amber chips.

**Acceptance criteria**

- Reads from `GET /items?expires_within=7`.
- Shows `tomorrow` for 1 day, `N days` for 2-7.
- "See all" routes to SCKRL-401.
- Empty state: "Nothing expiring this week - well done."

**Depends on.** SCKRL-202

## SCKRL-205 - Dashboard Storage grid

**Summary.** 2x2 grid of zone cards, each with the `SK.Zone` tile, label, item count, and "N soon" amber pill if any expire this week.

**Acceptance criteria**

- Matches `ScreenDashboard` layout.
- Tapping a zone navigates to SCKRL-211.
- "Soon" pill shown only when count > 0.

**Depends on.** SCKRL-202

## SCKRL-206 - Dashboard Suggestion card

**Summary.** The dark "From your stock" suggestion card, displaying one recipe match.

**Acceptance criteria**

- Reads from SCKRL-501.
- Shows up to 4 ingredient chips.
- CTA "Show recipe" routes to SCKRL-505.

**Depends on.** SCKRL-501

## SCKRL-211 - Storage detail screen

**Summary.** Per-zone view: header with zone glyph + title + "N items / M expire soon", category chips, "Use soon" section, "Stocked" section.

**Acceptance criteria**

- Matches `ScreenLocation`.
- Items sorted by expiry ascending in "Use soon"; remaining items grouped under "Stocked".
- Category chip taps filter the list.
- FAB at bottom-right opens SCKRL-212.

**Depends on.** SCKRL-202

## SCKRL-212 - Add item (manual)

**Summary.** Manual item entry sheet: name, category, qty + unit, zone, expiry date.

**Acceptance criteria**

- All fields required except expiry, which is estimated if blank by SCKRL-405.
- Category picker uses `SK.Tile` glyphs.
- Quantity supports +/- buttons.
- Submit creates an item via SCKRL-202 with `source: manual`.

**Depends on.** SCKRL-202

## SCKRL-213 - Item detail / edit

**Summary.** Tap an item row to open a bottom sheet with full detail and inline edits.

**Acceptance criteria**

- Shows everything from SCKRL-201.
- Edit name, qty, unit, zone, expiry.
- Buttons: "Move to...", "Mark as used", "Delete" with confirm.
- Mark-as-used sets `removed_on`, counts toward "waste avoided" in SCKRL-415.

**Depends on.** SCKRL-202

---

# EPIC-4 - Receipt To Stock

## SCKRL-301 - Camera capture screen

**Summary.** The dark scan screen with the alignment frame, flash toggle, gallery import.

**Acceptance criteria**

- Matches `ScreenScan` visually.
- Frame overlay with the four animated corners; user must align the receipt within roughly 80% coverage to enable capture.
- Buttons: "Cancel" (top-left), "Help" (top-right), "Gallery" (bottom-left), "PDF" (bottom-right), "Capture" (centre).
- Capture shoots a still and uploads to SCKRL-302.

**Depends on.** SCKRL-007

## SCKRL-302 - Receipt upload and storage

**Summary.** Upload the captured image to S3-compatible storage, persist a `receipts` row.

**Acceptance criteria**

- `receipts (id, household_id, image_url, store_name, total_cents, currency, captured_at, parsed_at, status)`.
- Status enum: `uploaded`, `parsing`, `parsed`, `failed`.
- Returns `receipt_id` for SCKRL-303 to poll or subscribe.

**Depends on.** SCKRL-301

## SCKRL-303 - OCR and line-item parsing

**Summary.** Send the receipt to the OCR provider, parse into structured line items with category and confidence.

**Acceptance criteria**

- Backend job parses store name, date, currency, total, and per-line `raw_text`, `inferred_name`, `qty`, `qty_unit`, `category`, `confidence in [0,1]`.
- Confidence >= 0.85 = high and auto-accept. 0.65-0.84 = mid. < 0.65 = needs review.
- Supports DE/EN/FR/IT receipt text.
- Writes results to `receipt_items`.
- Emits webhook or pushes to client on completion.

**Depends on.** SCKRL-302

**Notes.** Use Mindee Receipts or a fine-tuned Vision pipeline; abstract behind one provider interface.

## SCKRL-304 - Review screen

**Summary.** Editable list of parsed items with confidence chips, original raw text on each row.

**Acceptance criteria**

- Matches `ScreenReview`.
- Sage chip "N confident" + amber chip "M needs review" at the top.
- Per-row: edit name, qty, unit, category.
- Add missing item via dashed CTA at the bottom.
- "Continue to placement" only enabled when no items are flagged `needs review`.

**Depends on.** SCKRL-020, SCKRL-310

## SCKRL-305 - Placement screen (drag and drop)

**Summary.** Drag each item chip into a zone target. Targets highlight on hover, items snap home or revert on miss.

**Acceptance criteria**

- Matches `ScreenPlacement`.
- Default zone suggested per category, for example Dairy -> Fridge, Pantry -> Pantry.
- User can override; "Auto-sort" button accepts all suggestions.
- "Save & set reminders" calls the idempotent SCKRL-311 placement command and navigates to the dashboard with a toast only after the transaction succeeds.
- A complete tap-based placement path is available in addition to drag and drop.

**Depends on.** SCKRL-304, SCKRL-311

## SCKRL-306 - Receipt history

**Summary.** A list of past receipts, tap to view the parsed result and image.

**Acceptance criteria**

- Sortable by date descending.
- Filter by store.
- Tap re-opens Review screen for re-edit. It cannot re-place; new items would have to be added manually.

**Depends on.** SCKRL-304, SCKRL-308, SCKRL-310

## SCKRL-307 - Real receipt acquisition

**Summary.** Replace the simulated Scan handoff with real camera, gallery, and PDF acquisition on mobile.

**Acceptance criteria**

- Camera capture produces a real local image asset after permission grant.
- Gallery import accepts JPEG, PNG, HEIC where supported by Expo, and rejects unsupported files with recoverable feedback.
- PDF import accepts a supported PDF file and rejects unsupported or oversized files with recoverable feedback.
- Permission denial, cancellation, retry, and manual-entry fallback are handled without losing navigation state.
- Receipt acquisition remains accessible without drag-only interactions.

**Depends on.** SCKRL-020, SCKRL-021, SCKRL-023, SCKRL-301

**Notes.** This closes the SCKRL-301 production gap where capture currently creates a simulated receipt handoff.

## SCKRL-308 - Private receipt media storage

**Summary.** Store real receipt images and PDFs in household-authorized private object storage instead of synthetic `sackerl://` URLs.

**Acceptance criteria**

- Private storage bucket or equivalent is configured with household-scoped authorization and no public read access.
- Upload path validates file type, size, household ownership, and authenticated user context.
- `receipts.image_url` or its successor stores a private object reference, not a public URL with unbounded access.
- Signed read access is available only where needed for review/history.
- Default retention, deletion, and cleanup behavior are documented.

**Depends on.** SCKRL-302, SCKRL-023

**Notes.** This closes the SCKRL-302 production gap where persistence currently uses temporary synthetic URLs.

## SCKRL-309 - Asynchronous OCR processing and completion signaling

**Summary.** Replace synchronous deterministic parsing with an idempotent OCR job pipeline and client-visible completion state.

**Acceptance criteria**

- Receipt parsing is represented by an idempotent job or equivalent durable attempt state.
- Real OCR provider adapter is called for private receipt media, while deterministic parser fixtures remain available for tests.
- Retry limits, failed state, provider errors, and no-line parse results are observable without logging receipt text.
- Client can poll or subscribe to status changes from `uploaded` to `parsing`, `parsed`, or `failed`.
- Completion signaling satisfies the SCKRL-303 webhook or push requirement before production receipt flows depend on it.

**Depends on.** SCKRL-303, SCKRL-308

**Notes.** This closes the SCKRL-303 production gap where local parsing currently returns deterministic sample text for synthetic URLs.

## SCKRL-310 - Receipt review data upgrade

**Summary.** Add the minimum durable receipt-line fields and correction state needed before SCKRL-304 review and SCKRL-305 placement create inventory.

**Acceptance criteria**

- Receipt items track review state separately from parser confidence.
- User edits preserve raw text, original inferred values, corrected values, correction timestamp, and parser version.
- Line total, unit price, discount, and tax fields are either implemented or explicitly deferred with documented null behavior.
- Review replacement is transactional and cannot duplicate or silently drop accepted lines.
- SCKRL-304 receives a stable typed contract for editable lines, confidence, and unresolved fields.

**Depends on.** SCKRL-021, SCKRL-023, SCKRL-303

**Notes.** Keep this smaller than full product normalization; only add what review and placement need.

## SCKRL-311 - Atomic receipt placement command

**Summary.** Finalize one reviewed receipt into stock through an idempotent server-owned transaction with receipt-line lineage, expiry facts, and acquisition events.

**Acceptance criteria**

- Command requires an idempotency key and validates authenticated household membership.
- Every included receipt line is reviewed and has a valid household storage zone before placement.
- Stock rows link uniquely to their source receipt lines and use `source: receipt`.
- Stock creation, active expiry facts, acquisition events, and receipt placement state commit or roll back together.
- Retrying a completed command returns the prior result without creating duplicate stock or events.
- Injected validation and persistence failures leave reviewed receipt data and existing stock unchanged.

**Depends on.** SCKRL-202, SCKRL-310, SCKRL-406

**Notes.** Implement the transaction defined by ADR-0001. Do not extend this ticket into later product normalization or full event sourcing.

---

# EPIC-5 - Expiry And Notifications

## SCKRL-401 - Expiring-soon list

**Summary.** Dedicated screen listing every item expiring within 14 days, grouped by day bucket: Today, Tomorrow, This week, Next week.

**Acceptance criteria**

- Matches the "Expiring" screen in `screens-2.jsx`.
- Per-row actions: "Used" removes, "Snooze 2d", "Compost" removes + tracks waste.
- Empty state: "Nothing expiring soon."

**Depends on.** SCKRL-202

## SCKRL-405 - Expiry estimation

**Summary.** Estimate `expires_on` per category if not provided.

**Acceptance criteria**

- Lookup table per category x zone, for example Dairy in Fridge = 7d, Dairy in Freezer = 60d.
- Backend service; pure function, fully unit-tested.
- User can override on Add Item or Edit.

**Depends on.** SCKRL-201

## SCKRL-406 - Expiry provenance and confirmation

**Summary.** Separate exact, user-entered, estimated, and model-derived expiry facts so reminders do not imply unsupported precision.

**Acceptance criteria**

- Item expiry stores source, confidence where relevant, and user confirmation state separately from the displayed date.
- Manual Add/Edit and receipt placement can distinguish user-entered expiry from category-zone estimates.
- UI copy can show whether an expiry date is estimated or confirmed.
- Existing items receive a forward-compatible default provenance without changing their visible dates.
- Follow-up notification tickets can filter or phrase reminders based on expiry provenance.

**Phone-QA refinement (2026-09-13).** Retain printed date marking (use-by, best-before, unknown)
separately from source/confirmation. Define household calendar time zone to replace SCKRL-506's
explicit Vienna pilot configuration. Unknown and estimated dates must not imply guaranteed safety.

**Depends on.** SCKRL-405, SCKRL-023

## SCKRL-407 - Add source-aware expiry warning and overdue interaction

**Classification:** usability gap/new scope. **Priority:** P1 alpha trust. **Primary owner:** Frontend, with Backend support. **Stage:** Stage 1 after SCKRL-406. **Proposed state:** Todo after SCKRL-020 acceptance.

**Summary:** Show estimated-versus-confirmed expiry clearly and provide accessible warning, overdue, and explicit discard interactions on Add Item, item detail, Stock, and Expiring surfaces.

**Acceptance criteria:**

- Estimated dates have a yellow warning affordance with an accessible label and a short explanation that invites exact package-date entry; the exact date remains user-editable.
- Overdue status has a red visual treatment plus a non-color indicator, such as the requested double exclamation, with accessible text that names the state and source.
- The interaction distinguishes printed use-by, printed best-before, user-entered, estimated, and unknown states when those facts are available; no generic “unsafe” claim is shown for every past date.
- Trash/discard requires a visible user action and confirmation. A notification or warning never auto-deletes, marks discarded, or claims the user has already discarded the item.
- Used, Compost, and any future Trash outcome retain the existing removal-outcome semantics and can be reloaded after the mutation; failed mutations leave the row unchanged and report the failure.
- Every warning has a tap path and a screen-reader path. Red/yellow styling is supplementary, not the only signal.

**Depends on:** SCKRL-406; coordinate with SCKRL-213, SCKRL-401, SCKRL-415, and SCKRL-908. Do not duplicate push-delivery implementation from SCKRL-411/412/421.

## SCKRL-408 - Preserve expiry when snoozing reminders

**Classification:** defect already identified by the mobile-first delivery review. **Priority:** P1 correctness. **Primary owner:** Backend, with Frontend and QA. **Stage:** Stage 1 before external reminders.

**Summary:** Store snooze/reminder state separately from the item expiry fact. “Snooze 2d” postpones a reminder or view without changing the source date.

**Acceptance criteria:**

- Snoozing an item leaves the displayed expiry date and its SCKRL-406 provenance unchanged.
- The item is omitted from the applicable reminder window only for the snooze period, then becomes eligible again according to the same expiry policy.
- Repeated snoozes, timezone boundaries, app restart, failed update, and retry are deterministic and idempotent.
- Recipe eligibility and discard decisions never treat a snooze as a new expiry date.

**Depends on:** SCKRL-406 and SCKRL-401. Publish the snooze contract for SCKRL-411/412 before reminder delivery; those tickets must not create a circular dependency. This ticket is the follow-up named in `docs/product/mobile-first-delivery-plan.md`.

## SCKRL-409 - Capture optional package evidence

**Classification:** later product scope. **Priority:** P2. **Primary owner:** Infrastructure for media/evidence boundaries, with Backend, Frontend, and QA. **Stage:** Stage 2 or later.

**Summary:** Let a user optionally attach a package-date photo and/or barcode to an existing stock item, keeping the flow quick and optional. Evidence supports identification and review; it does not prove expiry automatically.

**Acceptance criteria:**

- The user can skip evidence and retain an estimated or unknown item state without blocking normal stock management.
- A photo is captured/uploaded through the private-media contract, with household authorization, size/type checks, retention/deletion behavior, and visible upload failure/retry.
- A barcode is stored as optional product-identity evidence and is never treated alone as an expiry fact.
- Any date extracted from an image is a candidate with provenance and user confirmation; it cannot silently replace the active expiry fact.
- The product records whether evidence was user-provided, extracted, or confirmed, without claiming that evidence establishes a minimum safe lifetime.

**Depends on:** SCKRL-307, SCKRL-308, SCKRL-406, and a Backend product-identity/provenance contract. This is intentionally later than the current simulated receipt media path.

## SCKRL-411 - Push registration

**Summary.** Request push permission, register device tokens for APNs/FCM.

**Acceptance criteria**

- Permission prompt is contextual after first item added, not at startup.
- Token stored on `users.devices[]`.
- Settings screen toggle to disable.

**Depends on.** SCKRL-009

**Phone-QA refinement (2026-09-13).** Coordinate SCKRL-406/407/408: controllable overdue
reminders, source-appropriate wording, household-local timing, duplicate suppression, and a deep link
to explicit item review/discard confirmation. Delivery never marks an item discarded automatically.

## SCKRL-412 - Daily reminder job

**Summary.** Server cron at 08:00 local time per household. Sends a single notification listing top 3 expiring items.

**Acceptance criteria**

- Respects household timezone.
- Combined push: "3 things to use today - Greek yogurt, spinach, chicken."
- Tapping opens SCKRL-401.
- No reminder if zero items expiring within 2 days.

**Depends on.** SCKRL-411

**Phone-QA refinement (2026-09-13).** Coordinate SCKRL-406/407/408: controllable overdue
reminders, source-appropriate wording, household-local timing, duplicate suppression, and a deep link
to explicit item review/discard confirmation. Delivery never marks an item discarded automatically.

## SCKRL-415 - Waste-avoided counter

**Summary.** When an item is marked "Used", increment a counter; when "Compost", increment a waste counter. Surface both on dashboard desktop and a stats screen.

**Acceptance criteria**

- Aggregate by month.
- Compare to previous month (% delta).
- Shown on desktop hero (`Stat` cards in `desktop.jsx`).

**Depends on.** SCKRL-213

## SCKRL-421 - Notifications inbox

**Summary.** In-app inbox of past system notifications, ordered newest first.

**Acceptance criteria**

- Matches `ScreenNotifs`.
- Mark all as read.
- Group by Today / Earlier.

**Depends on.** SCKRL-412

---

**Phone-QA refinement (2026-09-13).** Coordinate SCKRL-406/407/408: controllable overdue
reminders, source-appropriate wording, household-local timing, duplicate suppression, and a deep link
to explicit item review/discard confirmation. Delivery never marks an item discarded automatically.

# EPIC-6 - Suggestions And Recipes

## SCKRL-501 - Recipe matching engine

**Summary.** Given the household's current stock, return recipes whose required ingredients are mostly present.

**Acceptance criteria**

- Seed recipe set of 50 in `recipes` table: name, image, ingredients[], serves, time_minutes.
- Match score = covered_ingredients / total_ingredients.
- API: `GET /suggestions?limit=5&min_score=0.7`.
- Substitutes such as yogurt <-> sour cream are optional in v2.

**Depends on.** SCKRL-202

## SCKRL-505 - Recipe detail screen

**Summary.** Show one recipe with the ingredient list checked against stock.

**Acceptance criteria**

- Ingredients in stock: ink colour with check icon.
- Missing ingredients: amber chip "buy".
- Button: "Add missing to shopping list" (SCKRL-511).
- Button: "Cooked it" marks the matched stock items as used.

**Depends on.** SCKRL-501

## SCKRL-506 - Exclude overdue stock from recipe matching

**Summary.** Phone QA found June-dated stock contributing to recipe suggestions in September.
Only active, dated stock eligible on the recommendation calendar day may count as an ingredient.

**Acceptance criteria**

- List and detail matching exclude past, missing, null and invalid expiry dates from coverage and
  every matched-item ID. Today remains date-eligible; this is not a food-safety guarantee.
- The exported pure scorer takes an explicit valid calendar date and applies the same eligibility
  rule, so direct use cannot bypass the gate.
- With no eligible stock or no ingredient matches, list suggestions are empty even at minScore 0.
  Direct recipe detail remains available with zero matched stock and missing ingredients.
- The client derives one day per request from an injectable clock and explicit IANA time zone.
  Mobile and web visibly configure Europe/Vienna for the current Austrian pilot; household time
  zone persistence is a documented follow-up, not an implicit universal default.
- Regression tests cover the reported old stock, today/yesterday, malformed/missing dates, leap
  days, Vienna midnight and DST, empty stock, direct scorer and list/detail agreement.
- No stock is deleted or expiry rewritten by recommendation. Estimates and printed dates are
  not represented as proof food is safe; provenance/labeling remains SCKRL-406/407.

**Depends on.** SCKRL-501, SCKRL-020 triage of the reported defect.

**Notes.** Backend owns the shared contract and factory configuration; QA and Orchestrator review
required. No media/OCR, nutrition, personalized recipes or notification implementation in this fix.
Accepted contract: [SCKRL-506 recipe expiry eligibility](docs/features/sckrl-506-recipe-expiry-eligibility.md).

## SCKRL-507 - Personal recipe book and priority

**Classification:** later product scope. **Priority:** P2. **Primary owner:** Backend, with Frontend and QA. **Stage:** Stage 4 personalized recipes and meal timing.

**Summary:** Support household-owned custom recipes that appear alongside suggestions and receive an explicit personal-priority treatment, while preserving recipe source, editing, and outcome provenance.

**Acceptance criteria:**

- A household member can create, edit, archive, and view a custom recipe with structured ingredients, instructions, servings, tags, and source metadata.
- Personal recipes are clearly labeled and can be prioritized in the recipe book without falsifying match score or expiry eligibility.
- Suggestions can include personal recipes only through the same stock-eligibility and hard-constraint contracts as seeded recipes.
- Missing ingredients can flow to the existing shopping-list path, and any cooked/consumed action remains explicit and recoverable.
- Recipe data has ownership, authorization, source/license handling, and an outcome path for cooked, skipped, or dismissed states.

**Depends on:** SCKRL-501, SCKRL-505, structured recipe data, and the Stage 4 quantity-aware/non-destructive recipe contracts in `PROGRAM.md`.

## SCKRL-508 - Recipe sharing and album voting discovery

**Classification:** discovery/new scope. **Priority:** P3. **Decision owner:** Business Process Analyst and Orchestrator; Backend/Frontend support. **Stage:** Stage 4+ only after a product decision.

**Summary:** Explore private or bounded recipe collections with an album-like sharing and voting metaphor. This is a product discovery ticket, not authorization to build a social feed.

**Acceptance criteria for discovery:**

- Define the sharing boundary, household/member model, visibility, invitations, reporting/moderation, deletion, and abuse controls.
- Define whether votes rank recipes, collections, or suggestions, and how manipulation and personal data are handled.
- Define source/license requirements for user-created and imported recipes.
- Produce a decision record with pilot hypothesis, success/failure signals, and a recommendation to proceed, defer, or reject.

**Depends on:** SCKRL-507, recipe provenance/licensing, privacy controls, and an explicit Orchestrator product decision. No implementation should start from the metaphor alone.

## SCKRL-511 - Shopping list

**Summary.** A simple checkable list of items the user needs.

**Acceptance criteria**

- Add manually, or from SCKRL-505.
- Items auto-suggest from prior receipts.
- Strikethrough on check; checked items archive after 24h.

**Depends on.** SCKRL-202

## SCKRL-521 - Suggestions screen

**Summary.** The full list of "From your stock" recipe cards.

**Acceptance criteria**

- Matches `ScreenSuggestions`.
- Sort: best match first.
- Filter chips: vegetarian, quick (<30 min), dinner.

**Depends on.** SCKRL-501

---

# EPIC-7 - Premium

## SCKRL-601 - Paywall screen

**Summary.** The dark "Premium" screen with Monthly / Yearly toggle and "Start 7-day free trial" CTA.

**Acceptance criteria**

- Matches `ScreenPremium`.
- Yearly preselected with "SAVE 33%" amber badge.
- Lists the 4 premium features visually.
- "Cancel anytime / No charge until day 7" microcopy.

**Depends on.** SCKRL-004

## SCKRL-605 - IAP integration

**Summary.** Real subscriptions via App Store Connect / Stripe for web.

**Acceptance criteria**

- iOS: StoreKit 2 products `sackerl_pro_monthly`, `sackerl_pro_yearly`.
- Web: Stripe Checkout with same SKUs.
- Server-side receipt verification on both.
- Webhook updates `subscriptions` table.

**Depends on.** SCKRL-601

## SCKRL-610 - Entitlement gating

**Summary.** Feature flag gates for premium-only features.

**Acceptance criteria**

- Helper `useEntitlement('premium')` returns boolean.
- Suggestions limited to 1/day for free tier.
- Shopping list cap at 10 items for free tier.
- Trying to exceed opens paywall.

**Depends on.** SCKRL-605

---

# EPIC-8 - Web Companion

## SCKRL-701 - Web auth and shell

**Summary.** Next.js app with auth and the sidebar+main layout.

**Acceptance criteria**

- Sign in / sign up shared with mobile through the same Supabase or Clerk project.
- Sidebar matches `desktop.jsx`: logo, nav, storage list, premium nudge, user.
- Top bar: search, "Add item", "Scan receipt" CTAs.

**Depends on.** SCKRL-008

## SCKRL-705 - Desktop dashboard

**Summary.** Hero with greeting + "Dein Sackerl / live" kraft card; stat row (In stock, Expiring this week, Saved, Waste avoided); two-column body.

**Acceptance criteria**

- Matches `DesktopDashboard`.
- All stats fed from real APIs.
- Suggestion card on the right column.

**Depends on.** SCKRL-202, SCKRL-415, SCKRL-501

## SCKRL-711 - Receipt scan on web (upload-only)

**Summary.** No camera. Drag-and-drop or file picker upload, then jump straight to Review.

**Acceptance criteria**

- Accepts JPEG, PNG, HEIC, PDF.
- Multi-file batch.
- Hits SCKRL-303 same as mobile.

**Depends on.** SCKRL-303

## SCKRL-715 - Shopping list on web (print-ready)

**Summary.** Same data as SCKRL-511, with a "Print list" button that produces a tidy single-page A4.

**Acceptance criteria**

- Matches mobile data 1:1.
- Print stylesheet hides chrome, prints item names + checkboxes.

**Depends on.** SCKRL-511

---

# EPIC-9 - Internationalisation

## SCKRL-801 - i18n framework

**Summary.** i18next on both clients. Strings live in `packages/i18n/locales/{de,en,fr,it}.json`.

**Acceptance criteria**

- All hard-coded strings extracted.
- Fallback chain: user locale -> `en` -> key.
- Number, date, currency formatters use locale.
- Missing-key lint rule in CI.

**Depends on.** SCKRL-001

## SCKRL-805 - DACH polish

**Summary.** German is the lead locale. Make sure tone is right: Du, not Sie. Add "Sackerl"-flavoured German microcopy where it shines.

**Acceptance criteria**

- All key surfaces reviewed by a native speaker, with reviewer recorded in PR.
- Currency EUR prefix on Austria, suffix on Germany if needed.
- Date format `dd.mm.yyyy`.

**Depends on.** SCKRL-801

## SCKRL-810 - Multi-language receipts

**Summary.** Receipt parser handles DE/AT, EN, FR, IT layouts.

**Acceptance criteria**

- Per-language test fixtures, 10 receipts each.
- > = 80% line-item accuracy per language.
- Store-name recognition per region.

**Depends on.** SCKRL-303

---

# EPIC-10 - Quality, Telemetry And Release

## SCKRL-901 - Accessibility audit

**Summary.** WCAG AA pass on the top 10 screens.

**Acceptance criteria**

- All text contrast >= 4.5:1, or 3:1 for large text.
- Every interactive element has an accessibility label.
- VoiceOver flow works end-to-end on Onboarding -> Add Item.
- Tap targets >= 44pt.

**Depends on.** all UI epics

## SCKRL-902 - Add bounded swipe interactions on mobile

**Classification:** usability gap. **Priority:** P1 mobile polish. **Primary owner:** Frontend, with QA/accessibility. **Stage:** Stage 1.

**Summary:** Add native-feeling swipe affordances where they fit the information architecture, beginning with the Phase 2 Expiring row actions and any clearly defined horizontal option navigation. Keep visible tap controls and system back behavior.

**Acceptance criteria:**

- The ticket names each screen and gesture; “swipe navigation everywhere” is not accepted as an unbounded requirement.
- Expiring-row swipe actions match the handoff where implemented: Used, Snooze 2d, and Compost, with a tap equivalent.
- Swipe actions have confirmation and error recovery for mutations; they cannot bypass discard confirmation or change expiry while snoozing.
- VoiceOver/accessibility labels, tap targets, keyboard/web fallback where applicable, reduced motion, and non-gesture alternatives pass QA.
- Native back swipe and horizontal content gestures do not conflict, and the screen remains usable for one-handed interaction.

**Depends on:** SCKRL-401, SCKRL-408, SCKRL-908, and a short Frontend interaction decision based on the user's intended surface.

## SCKRL-905 - Performance budget

**Summary.** Define and enforce budgets.

**Acceptance criteria**

- Cold start <= 2s on iPhone 12 baseline.
- Dashboard data fetch <= 800ms p95.
- Web LCP <= 2.5s on Fast 3G simulation.
- CI lighthouse + RN profiler reports.

**Depends on.** SCKRL-705, full app

## SCKRL-906 - Application test harness

**Summary.** Establish deterministic web/mobile application test tooling and prevent empty suites from reporting success.

**Acceptance criteria**

- The repo records the chosen route-test, mobile component-test, and device-journey tools with local and CI commands.
- Mobile and web test commands fail when their expected suites contain no tests.
- One deterministic web route test and one deterministic mobile behavior test run in CI without production providers or secrets.
- Test fixtures use isolated, de-identified data and document cleanup requirements.
- CI can run deterministic checks without real OCR, push, or production secrets.

**Depends on.** SCKRL-022, SCKRL-023

## SCKRL-907 - Authenticated API journey tests

**Summary.** Add isolated integration coverage for current authenticated household, stock, receipt, recipe, and shopping-list routes.

**Acceptance criteria**

- Tests cover household zones, manual stock CRUD, receipt persistence and deterministic parsing, recipe suggestions, and shopping-list idempotency.
- Failure cases cover unauthorized access, missing household, invalid payloads, parse failure, and duplicate parse requests.
- Each run creates isolated data and verifies cleanup without logging credentials or receipt content.
- Local/dev environment requirements and exact commands are documented.

**Depends on.** SCKRL-906

## SCKRL-908 - Current mobile journey smoke tests

**Summary.** Automate the critical mobile journeys that exist before receipt review and placement.

**Acceptance criteria**

- Automated smoke covers onboarding/storage setup, manual add/edit/remove, expiry actions, recipe detail, and recipe-to-shopping-list.
- Checks include accessible labels, focus order where supported, stable tap targets, and non-color-only status.
- Network failure and retry behavior is exercised for at least one read and one mutation.
- The suite runs against an Expo development build with deterministic fixtures and documents device prerequisites.

**Depends on.** SCKRL-906

## SCKRL-909 - Receipt-to-stock journey automation

**Summary.** Extend application automation across real acquisition, processing, review, placement, and receipt-created stock.

**Acceptance criteria**

- Happy path proves one real test asset reaches reviewed and placed inventory with receipt-line lineage.
- Failure paths cover denied permission, upload interruption, OCR failure/retry, unresolved review lines, and duplicate placement retry.
- Both drag and tap placement paths are tested; the tap path is the accessibility baseline.
- Provider/device evidence is separated from deterministic CI evidence.

**Depends on.** SCKRL-304, SCKRL-305, SCKRL-307, SCKRL-308, SCKRL-309, SCKRL-310, SCKRL-311

## SCKRL-910 - Telemetry events

**Summary.** Define the events that matter and instrument them.

**Acceptance criteria**

- Funnel events: `onboarding_started`, `onboarding_completed`, `receipt_scanned`, `receipt_parsed`, `items_placed`, `notification_opened`, `recipe_viewed`, `premium_started`, `premium_purchased`.
- All events sampled in dev, full in prod.
- No PII in payloads.

**Depends on.** SCKRL-010

## SCKRL-915 - Store listings

**Summary.** App Store + Play Store + landing site.

**Acceptance criteria**

- Screenshots in EN/DE/FR/IT.
- Privacy policy + terms hosted at `sackerl.app`.
- App Privacy nutrition labels filled in.

**Depends on.** SCKRL-901

## SCKRL-930 - Optional nutrition and calorie information discovery

**Classification:** later health/recommendation scope. **Priority:** P3. **Primary owner:** Backend with Orchestrator/QA health-policy review; Frontend and Infrastructure support. **Stage:** Stage 6 only.

**Summary:** Explore an explicitly optional question/opt-in for nutrition or calorie information on suggested and custom recipes. This ticket does not decide whether health data is collected or what guidance is safe.

**Acceptance criteria for discovery and policy gate:**

- Decide whether any health-related data is collected, with explicit purpose, consent, access, export, deletion, and retention boundaries.
- Identify vetted regional nutrition/allergen sources, licensing, update cadence, provenance, and confidence requirements.
- Define the UI boundary between general food information, optional wellness preferences, and medical advice; exclude diagnosis, treatment, eating-disorder, pregnancy, chronic-illness, and minor-specific guidance until reviewed.
- Require hard allergy/explicit-constraint exclusions with zero tolerated known-allergen breaches before implementation.
- Define opt-in, dismiss/skip, explanation, correction, and “not relevant” behavior for both seeded and personal recipes.

**Depends on:** `PROGRAM.md` Stage 6 gates, privacy controls, structured recipe data, and a Backend/Orchestrator decision. Do not implement calories or nourishment as part of SCKRL-501, SCKRL-507, or the current phone-test fix.

## SCKRL-920 - Release pipeline

**Summary.** Fastlane mobile + Vercel web with staged rollouts.

**Acceptance criteria**

- Tag `vX.Y.Z` -> mobile build -> TestFlight and Play internal track.
- Manual promote to production.
- Web previews on every PR.

**Depends on.** SCKRL-001

---

## Out Of Scope For V1

These are explicitly not in the first release. Capture in a backlog for v2.

- Barcode scan. We scan receipts, not items.
- Multi-household / shared baskets.
- Smart-fridge integration.
- AI nutrition coaching.
- Voice add, for example "Hey sackerl, add milk".
- Apple Watch / wearable companion.
- Community recipe sharing.
