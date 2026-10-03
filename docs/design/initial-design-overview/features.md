# Sackerl — Features (Issue Tracker)

Per-ticket spec for the SCKRL backlog. Each ticket is sized to fit one
small-to-medium pull request (≤ ~2 days of work). If a ticket feels larger
than that, split it before starting.

**Ticket schema**

- **Title** — short imperative summary
- **Summary** — one paragraph of context + intent
- **Acceptance criteria** — testable bullets (the ticket is done when these pass)
- **Depends on** — upstream tickets that must merge first
- **Notes** — implementation hints, gotchas, links to design references

The HTML hi-fi designs (`index.html`) are the visual source of truth. Match
spacing, colour tokens (`styles.css`), and copy unless explicitly noted.

---

# EPIC-1 · Foundation & Design System

## SCKRL-001 · Repo, CI, environments
**Summary.** Spin up the monorepo (mobile + web + shared) with linting,
formatting, type-checking, and CI on PR. Three environments: `dev`, `staging`, `prod`.

**Acceptance criteria**
- Monorepo (pnpm/turbo) with `apps/mobile`, `apps/web`, `packages/ui`, `packages/api-client`, `packages/tokens`.
- ESLint + Prettier + TypeScript strict mode, all CI-checked.
- GitHub Actions: install, lint, typecheck, test on every PR.
- Three `.env` templates (`.env.dev`, `.env.staging`, `.env.prod`) with documented keys.

**Depends on.** —
**Notes.** Use Expo Router for mobile and Next.js App Router for web.

## SCKRL-002 · Design tokens package
**Summary.** Port the CSS variables from `styles.css` into a typed tokens
module consumed by both web and mobile.

**Acceptance criteria**
- `packages/tokens` exports `colors`, `space`, `radius`, `shadow`, `font` objects.
- Tokens match `:root` in `styles.css` 1:1 (paper, ink, sage, sage-deep, sage-soft, amber, amber-deep, amber-soft, kraft, kraft-deep, kraft-soft, kraft-ink, hairlines).
- Web exports a CSS-vars stylesheet and a JS object. Mobile exports a JS object only.
- Storybook (or RN demo screen) shows every token swatch with name + hex + oklch.

**Depends on.** SCKRL-001
**Notes.** Don't mutate the visual values. Yellow is action, green is information, kraft is identity, black is ink.

## SCKRL-003 · Typography setup
**Summary.** Wire SF Pro as the default sans, New York as the serif italic
accent, SF Mono for metadata. Provide an Android fallback.

**Acceptance criteria**
- Mobile: `font-family: 'SF Pro Display'` on iOS, `Inter` on Android (closest SF substitute).
- Web: native font stack `-apple-system, BlinkMacSystemFont, 'SF Pro Text', ...` (see `styles.css`).
- Display / Headline / Title / Body / Caption text styles defined in tokens with the same scale as the system spec (02.2): 56/700, 32/600, 22/600, 16/500, 13/500.
- All text uses tokens — no hard-coded font props in feature code.

**Depends on.** SCKRL-002

## SCKRL-004 · Core component library
**Summary.** Build the primitives needed by every screen: Button, Chip, Card,
Eyebrow, Avatar, RoundIconButton, ListRow, Tile, Zone.

**Acceptance criteria**
- `Button` variants: `primary` (amber + ink ring), `ink`, `ghost`, `soft`. Sizes: `lg` (52), `md` (38). With/without leading & trailing icon.
- `Chip` variants: default, sage, amber, ghost. Right-aligned text count supported.
- `Card`, `CardFlat`, `CardKraft` — kraft card uses the CSS fibre texture (web) or a layered Image+Tint approach (RN).
- All match HTML hi-fi pixel-for-pixel at 1×.
- Each component has a Storybook (web) or RN demo (mobile) entry, with prop knobs.

**Depends on.** SCKRL-002, SCKRL-003

## SCKRL-005 · Icon set
**Summary.** Ship the stroked-line icon set from `SK.icons`.

**Acceptance criteria**
- Icons: scan, camera, bell, home, sparkle, basket, clock, search, settings, pdf, upload, check, drop, snowflake, box, flame, cart, arrowRight, arrowUp, list, grid, dots, filter, star, shield, leaf, plus, close, chevron-(left/right/down).
- Single `<Icon name="bell" size sw stroke />` component, monoline, default stroke 1.6.
- No filled icons. No emoji.

**Depends on.** SCKRL-001

## SCKRL-006 · Animated paper bag (`<PaperBag />`)
**Summary.** Port the SVG sackerl from `sk-atoms.jsx`. Animated, breathing,
items drop in. Respects `prefers-reduced-motion`.

**Acceptance criteria**
- React component (web) + RN component (using react-native-svg + Reanimated).
- Props: `width`, `height`, `label`, `animated`, `items[]` (each: dx, kind, size, color, delay, tilt).
- Default cycle 4.4s with 4 items at staggered delays.
- Kraft gradient, fold band, three creases, stamped label rendered identically across platforms.
- Reduced-motion → bag is still drawn, items appear stationary at rest.

**Depends on.** SCKRL-002, SCKRL-005
**Notes.** Web reference: `SK.PaperBag` in `sk-atoms.jsx`.

## SCKRL-007 · App navigation shell (mobile)
**Summary.** Tab bar with Home / Stock / Scan (FAB) / Expiring / Settings.
Floating amber Scan button matches the hi-fi.

**Acceptance criteria**
- 5 tabs, middle tab is a 56px round amber FAB with 1.5px ink ring, lifted 24px above the rail.
- Tab labels and icons match the design.
- Active tab indicator: ink colour on icon+label; inactive: mute-soft.
- Safe-area insets handled top & bottom.

**Depends on.** SCKRL-004

## SCKRL-008 · Auth (sign up, sign in, sign out)
**Summary.** Email + password. Apple Sign-In on iOS. "I already have an account" deep link from onboarding.

**Acceptance criteria**
- Email/password signup with confirmation email.
- Sign-in with Apple on iOS (mandatory for App Store).
- Forgot password flow.
- Logged-out state routes to onboarding; logged-in routes to dashboard.

**Depends on.** SCKRL-001
**Notes.** Use Supabase Auth or Clerk. Don't roll your own.

## SCKRL-009 · User profile & household model
**Summary.** Data model for `users` and `households`. One user can belong to
one household at v1.

**Acceptance criteria**
- DB tables: `users (id, email, locale, created_at)`, `households (id, owner_id, name, created_at)`, `household_members (household_id, user_id, role)`.
- API: `GET /me`, `PATCH /me`, `GET /household`, `PATCH /household`.
- `locale` defaults to device locale, falls back to `de`.

**Depends on.** SCKRL-008

## SCKRL-010 · Logging, error reporting, analytics scaffolding
**Summary.** Sentry-style crash reporting, an event tracker, and a shared logger.

**Acceptance criteria**
- Crashes on mobile + web reported to Sentry (or equivalent) with release tag.
- `track(event, props)` helper for product events. No PII.
- Console-only in dev; sampled in prod.

**Depends on.** SCKRL-001

---

# EPIC-2 · Onboarding

## SCKRL-101 · Welcome screen
**Summary.** First screen on cold install. Hero headline, tag, primary CTA "Get started", secondary "I already have an account".

**Acceptance criteria**
- Matches `ScreenOnboarding` in `screens-1.jsx`.
- Primary CTA is amber with ink ring (SCKRL-004 variant `primary`).
- Tapping "Get started" navigates to SCKRL-102.
- "I already have an account" routes to sign-in.

**Depends on.** SCKRL-004, SCKRL-008

## SCKRL-102 · Storage-zone setup
**Summary.** Let the user declare which storage zones they have. Defaults preselected: Fridge, Pantry, Basement, Freezer. Cabinet optional.

**Acceptance criteria**
- Multi-select with the 5 SK.Zone tiles.
- Selecting/deselecting persists to `household.zones[]`.
- At least 1 zone required to continue.
- Skipping is not allowed.

**Depends on.** SCKRL-009

## SCKRL-103 · Locale picker
**Summary.** Choose UI language (DE, EN, FR, IT). Pre-selected from device locale.

**Acceptance criteria**
- 4 segmented options.
- Persists to `users.locale`.
- App reloads strings without restart.

**Depends on.** SCKRL-009, SCKRL-801

## SCKRL-104 · "What's a sackerl?" explainer (optional skip)
**Summary.** Single illustrated screen explaining the brand metaphor using the animated `<PaperBag />`.

**Acceptance criteria**
- Bag is animated and centered.
- One paragraph of copy + dismiss button "Got it".
- Shown once, then never again (track in user profile).

**Depends on.** SCKRL-006

---

# EPIC-3 · Stock & Storage

## SCKRL-201 · Item data model
**Summary.** Schema for `items`, `categories`, `zones`.

**Acceptance criteria**
- `items (id, household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, added_on, removed_on, source)`.
- `qty_unit` enum: `g`, `kg`, `ml`, `l`, `pcs`.
- `source` enum: `manual`, `receipt`, `imported`.
- `categories` seeded with the 10 keys in `SK.categories`.
- `zones` seeded per household per SCKRL-102.

**Depends on.** SCKRL-009

## SCKRL-202 · Items API (CRUD)
**Summary.** REST endpoints for items.

**Acceptance criteria**
- `GET /items?zone&category&expires_within=days` — paginated.
- `POST /items` — single item create.
- `POST /items/batch` — used by SCKRL-318.
- `PATCH /items/:id`, `DELETE /items/:id`.
- Soft delete sets `removed_on`.

**Depends on.** SCKRL-201

## SCKRL-203 · Dashboard — "Your Sackerl" hero widget
**Summary.** The kraft-textured card on Home with the animated `<PaperBag />` and a live item count.

**Acceptance criteria**
- Displays `household.itemCount` and a copy stub ("Enough for N dinners. Skip the shop on …").
- Bag breathes; items drop on the cycle (SCKRL-006).
- Reduced-motion → static bag.
- Tap → navigates to Stock list.

**Depends on.** SCKRL-006, SCKRL-202

## SCKRL-204 · Dashboard — Expiring soon card
**Summary.** The white card listing up to 3 items expiring within 7 days, with amber chips.

**Acceptance criteria**
- Reads from `GET /items?expires_within=7`.
- Shows `tomorrow` for 1 day, `N days` for 2–7.
- "See all" routes to SCKRL-401.
- Empty state: "Nothing expiring this week — well done."

**Depends on.** SCKRL-202

## SCKRL-205 · Dashboard — Storage grid
**Summary.** 2×2 grid of zone cards, each with the SK.Zone tile, label, item count, and "N soon" amber pill if any expire this week.

**Acceptance criteria**
- Matches `ScreenDashboard` layout.
- Tapping a zone navigates to SCKRL-211.
- "Soon" pill shown only when count > 0.

**Depends on.** SCKRL-202

## SCKRL-206 · Dashboard — Suggestion card
**Summary.** The dark "From your stock" suggestion card, displaying one recipe match.

**Acceptance criteria**
- Reads from SCKRL-501.
- Shows up to 4 ingredient chips.
- CTA "Show recipe" → SCKRL-505.

**Depends on.** SCKRL-501

## SCKRL-211 · Storage detail screen
**Summary.** Per-zone view: header with zone glyph + title + "N items · M expire soon", category chips, "Use soon" section, "Stocked" section.

**Acceptance criteria**
- Matches `ScreenLocation`.
- Items sorted by expiry ascending in "Use soon"; remaining items grouped under "Stocked".
- Category chip taps filter the list.
- FAB at bottom-right opens SCKRL-212.

**Depends on.** SCKRL-202

## SCKRL-212 · Add item (manual)
**Summary.** Manual item entry sheet: name, category, qty + unit, zone, expiry date.

**Acceptance criteria**
- All fields required except expiry (estimated if blank — SCKRL-405).
- Category picker uses SK.Tile glyphs.
- Quantity supports +/- buttons.
- Submit creates an item via SCKRL-202 with `source: manual`.

**Depends on.** SCKRL-202

## SCKRL-213 · Item detail / edit
**Summary.** Tap an item row → bottom sheet with full detail and inline edits.

**Acceptance criteria**
- Shows everything from SCKRL-201.
- Edit name, qty, unit, zone, expiry.
- Buttons: "Move to…" (zone), "Mark as used", "Delete" (with confirm).
- Mark-as-used sets `removed_on`, counts toward "waste avoided" (SCKRL-415).

**Depends on.** SCKRL-202

---

# EPIC-4 · Receipt → Stock

## SCKRL-301 · Camera capture screen
**Summary.** The dark scan screen with the alignment frame, flash toggle, gallery import.

**Acceptance criteria**
- Matches `ScreenScan` visually.
- Frame overlay with the four animated corners; user must align the receipt within ~80% coverage to enable capture.
- Buttons: "Cancel" (top-left), "Help" (top-right), "Gallery" (bottom-left), "PDF" (bottom-right), "Capture" (centre).
- Capture shoots a still and uploads to SCKRL-302.

**Depends on.** SCKRL-007

## SCKRL-302 · Receipt upload + storage
**Summary.** Upload the captured image to S3-compatible storage, persist a `receipts` row.

**Acceptance criteria**
- `receipts (id, household_id, image_url, store_name, total_cents, currency, captured_at, parsed_at, status)`.
- Status enum: `uploaded`, `parsing`, `parsed`, `failed`.
- Returns `receipt_id` for SCKRL-303 to poll/subscribe.

**Depends on.** SCKRL-301

## SCKRL-303 · OCR + line-item parsing
**Summary.** Send the receipt to the OCR provider, parse into structured line items with category + confidence.

**Acceptance criteria**
- Backend job parses store name, date, currency, total, and per-line `raw_text`, `inferred_name`, `qty`, `qty_unit`, `category`, `confidence ∈ [0,1]`.
- Confidence ≥ 0.85 = high (auto-accept). 0.65–0.84 = mid. < 0.65 = needs review.
- Supports DE/EN/FR/IT receipt text.
- Writes results to `receipt_items`.
- Emits webhook / pushes to client on completion.

**Depends on.** SCKRL-302
**Notes.** Use Mindee Receipts or a fine-tuned Vision pipeline; abstract behind one provider interface.

## SCKRL-304 · Review screen
**Summary.** Editable list of parsed items with confidence chips, original raw text on each row.

**Acceptance criteria**
- Matches `ScreenReview`.
- Sage chip "N confident" + amber chip "M needs review" at the top.
- Per-row: edit name, qty, unit, category.
- Add missing item via dashed CTA at the bottom.
- "Continue to placement" only enabled when no items are flagged `needs review`.

**Depends on.** SCKRL-303

## SCKRL-305 · Placement screen (drag & drop)
**Summary.** Drag each item chip into a zone target. Targets highlight on hover, items snap home or revert on miss.

**Acceptance criteria**
- Matches `ScreenPlacement`.
- Default zone suggested per category (e.g. Dairy → Fridge, Pantry → Pantry).
- User can override; "Auto-sort" button accepts all suggestions.
- "Save & set reminders" creates items via SCKRL-202 batch endpoint, kicks off SCKRL-405 expiry estimation, navigates to dashboard with a toast.

**Depends on.** SCKRL-304, SCKRL-202

## SCKRL-306 · Receipt history
**Summary.** A list of past receipts, tap to view the parsed result + image.

**Acceptance criteria**
- Sortable by date descending.
- Filter by store.
- Tap → re-opens Review screen for re-edit (cannot re-place; new items would have to be added manually).

**Depends on.** SCKRL-302

---

# EPIC-5 · Expiry & Notifications

## SCKRL-401 · Expiring-soon list
**Summary.** Dedicated screen listing every item expiring within 14 days, grouped by day bucket (Today, Tomorrow, This week, Next week).

**Acceptance criteria**
- Matches the "Expiring" screen in `screens-2.jsx`.
- Per-row actions: "Used" (removes), "Snooze 2d", "Compost" (removes + tracks waste).
- Empty state: "Nothing expiring soon."

**Depends on.** SCKRL-202

## SCKRL-405 · Expiry estimation
**Summary.** Estimate `expires_on` per category if not provided.

**Acceptance criteria**
- Lookup table per category × zone (e.g. Dairy in Fridge = 7d, Dairy in Freezer = 60d).
- Backend service; pure function, fully unit-tested.
- User can override on Add Item or Edit.

**Depends on.** SCKRL-201

## SCKRL-411 · Push registration
**Summary.** Request push permission, register device tokens for APNs/FCM.

**Acceptance criteria**
- Permission prompt is contextual (after first item added, not at startup).
- Token stored on `users.devices[]`.
- Settings screen toggle to disable.

**Depends on.** SCKRL-009

## SCKRL-412 · Daily reminder job
**Summary.** Server cron at 08:00 local time per household. Sends a single notification listing top 3 expiring items.

**Acceptance criteria**
- Respects household timezone.
- Combined push: "3 things to use today — Greek yogurt, spinach, chicken."
- Tapping opens SCKRL-401.
- No reminder if zero items expiring within 2 days.

**Depends on.** SCKRL-411

## SCKRL-415 · Waste-avoided counter
**Summary.** When an item is marked "Used", increment a counter; when "Compost", increment a waste counter. Surface both on dashboard (desktop) and a stats screen.

**Acceptance criteria**
- Aggregate by month.
- Compare to previous month (% delta).
- Shown on desktop hero (`Stat` cards in `desktop.jsx`).

**Depends on.** SCKRL-213

## SCKRL-421 · Notifications inbox
**Summary.** In-app inbox of past system notifications, ordered newest first.

**Acceptance criteria**
- Matches `ScreenNotifs`.
- Mark all as read.
- Group by Today / Earlier.

**Depends on.** SCKRL-412

---

# EPIC-6 · Suggestions & Recipes

## SCKRL-501 · Recipe matching engine
**Summary.** Given the household's current stock, return recipes whose required ingredients are mostly present.

**Acceptance criteria**
- Seed recipe set of 50 in `recipes` table (name, image, ingredients[], serves, time_minutes).
- Match score = covered_ingredients / total_ingredients.
- API: `GET /suggestions?limit=5&min_score=0.7`.
- Substitutes (e.g. yogurt ↔ sour cream) optional in v2.

**Depends on.** SCKRL-202

## SCKRL-505 · Recipe detail screen
**Summary.** Show one recipe with the ingredient list checked against stock.

**Acceptance criteria**
- Ingredients in stock: ink colour with check icon.
- Missing ingredients: amber chip "buy".
- Button: "Add missing to shopping list" (SCKRL-511).
- Button: "Cooked it" → marks the matched stock items as used.

**Depends on.** SCKRL-501

## SCKRL-511 · Shopping list
**Summary.** A simple checkable list of items the user needs.

**Acceptance criteria**
- Add manually, or from SCKRL-505.
- Items auto-suggest from prior receipts.
- Strikethrough on check; checked items archive after 24h.

**Depends on.** SCKRL-202

## SCKRL-521 · Suggestions screen
**Summary.** The full list of "From your stock" recipe cards.

**Acceptance criteria**
- Matches `ScreenSuggestions`.
- Sort: best match first.
- Filter chips: vegetarian, quick (<30 min), dinner.

**Depends on.** SCKRL-501

---

# EPIC-7 · Premium

## SCKRL-601 · Paywall screen
**Summary.** The dark "Premium" screen with Monthly / Yearly toggle and "Start 7-day free trial" CTA.

**Acceptance criteria**
- Matches `ScreenPremium`.
- Yearly preselected with "SAVE 33%" amber badge.
- Lists the 4 premium features visually.
- "Cancel anytime · No charge until day 7" microcopy.

**Depends on.** SCKRL-004

## SCKRL-605 · IAP integration
**Summary.** Real subscriptions via App Store Connect / Stripe for web.

**Acceptance criteria**
- iOS: StoreKit 2 products `sackerl_pro_monthly`, `sackerl_pro_yearly`.
- Web: Stripe Checkout w/ same SKUs.
- Server-side receipt verification on both.
- Webhook updates `subscriptions` table.

**Depends on.** SCKRL-601

## SCKRL-610 · Entitlement gating
**Summary.** Feature flag gates for premium-only features.

**Acceptance criteria**
- Helper `useEntitlement('premium')` returns boolean.
- Suggestions limited to 1/day for free tier.
- Shopping list cap at 10 items for free tier.
- Trying to exceed → opens paywall.

**Depends on.** SCKRL-605

---

# EPIC-8 · Web Companion

## SCKRL-701 · Web auth + shell
**Summary.** Next.js app with auth and the sidebar+main layout.

**Acceptance criteria**
- Sign in / sign up shared with mobile (same Supabase/Clerk project).
- Sidebar matches `desktop.jsx`: logo, nav, storage list, premium nudge, user.
- Top bar: search, "Add item", "Scan receipt" CTAs.

**Depends on.** SCKRL-008

## SCKRL-705 · Desktop dashboard
**Summary.** Hero with greeting + "Dein Sackerl · live" kraft card; stat row (In stock, Expiring this week, Saved, Waste avoided); two-column body.

**Acceptance criteria**
- Matches `DesktopDashboard`.
- All stats fed from real APIs.
- Suggestion card on the right column.

**Depends on.** SCKRL-202, SCKRL-415, SCKRL-501

## SCKRL-711 · Receipt scan on web (upload-only)
**Summary.** No camera — drag-and-drop or file picker upload, then jump straight to Review.

**Acceptance criteria**
- Accepts JPEG, PNG, HEIC, PDF.
- Multi-file batch.
- Hits SCKRL-303 same as mobile.

**Depends on.** SCKRL-303

## SCKRL-715 · Shopping list on web (print-ready)
**Summary.** Same data as SCKRL-511, with a "Print list" button that produces a tidy single-page A4.

**Acceptance criteria**
- Matches mobile data 1:1.
- Print stylesheet hides chrome, prints item names + checkboxes.

**Depends on.** SCKRL-511

---

# EPIC-9 · Internationalisation

## SCKRL-801 · i18n framework
**Summary.** i18next on both clients. Strings live in `packages/i18n/locales/{de,en,fr,it}.json`.

**Acceptance criteria**
- All hard-coded strings extracted.
- Fallback chain: user locale → `en` → key.
- Number, date, currency formatters use locale.
- Missing-key lint rule in CI.

**Depends on.** SCKRL-001

## SCKRL-805 · DACH polish
**Summary.** German is the lead locale. Make sure tone is right (Du, not Sie). Add "Sackerl"-flavoured German microcopy where it shines.

**Acceptance criteria**
- All key surfaces reviewed by a native speaker (record reviewer in PR).
- Currency € prefix on Austria, suffix on Germany if needed.
- Date format `dd.mm.yyyy`.

**Depends on.** SCKRL-801

## SCKRL-810 · Multi-language receipts
**Summary.** Receipt parser handles DE/AT, EN, FR, IT layouts.

**Acceptance criteria**
- Per-language test fixtures (10 receipts each).
- ≥ 80% line-item accuracy per language.
- Store-name recognition per region.

**Depends on.** SCKRL-303

---

# EPIC-10 · Quality, Telemetry & Release

## SCKRL-901 · Accessibility audit
**Summary.** WCAG AA pass on the top 10 screens.

**Acceptance criteria**
- All text contrast ≥ 4.5:1 (3:1 for large).
- Every interactive element has an accessibility label.
- VoiceOver flow works end-to-end on Onboarding → Add Item.
- Tap targets ≥ 44pt.

**Depends on.** all UI epics

## SCKRL-905 · Performance budget
**Summary.** Define and enforce budgets.

**Acceptance criteria**
- Cold start ≤ 2s on iPhone 12 baseline.
- Dashboard data fetch ≤ 800ms p95.
- Web LCP ≤ 2.5s on Fast 3G simulation.
- CI lighthouse + RN profiler reports.

**Depends on.** SCKRL-705, full app

## SCKRL-910 · Telemetry events
**Summary.** Define the events that matter and instrument them.

**Acceptance criteria**
- Funnel events: `onboarding_started`, `onboarding_completed`, `receipt_scanned`, `receipt_parsed`, `items_placed`, `notification_opened`, `recipe_viewed`, `premium_started`, `premium_purchased`.
- All events sampled in dev, full in prod.
- No PII in payloads.

**Depends on.** SCKRL-010

## SCKRL-915 · Store listings
**Summary.** App Store + Play Store + landing site.

**Acceptance criteria**
- Screenshots in EN/DE/FR/IT.
- Privacy policy + terms hosted at sackerl.app.
- App Privacy nutrition labels filled in.

**Depends on.** SCKRL-901

## SCKRL-920 · Release pipeline
**Summary.** Fastlane (mobile) + Vercel (web) with staged rollouts.

**Acceptance criteria**
- Tag `vX.Y.Z` → mobile build → TestFlight & Play internal track.
- Manual promote to production.
- Web previews on every PR.

**Depends on.** SCKRL-001

---

## Out of scope for v1

These are explicitly **not** in the first release. Capture in a backlog for v2.

- Barcode scan (we scan receipts, not items).
- Multi-household / shared baskets.
- Smart-fridge integration.
- AI nutrition coaching.
- Voice add ("Hey sackerl, add milk").
- Apple Watch / wearable companion.
- Community recipe sharing.
