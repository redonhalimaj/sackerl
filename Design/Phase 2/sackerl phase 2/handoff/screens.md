# Sackerl — Screens

Per-screen anatomy: layout, copy, states, empty/loading/error cases. Use
with [`design-system.md`](./design-system.md) for component specs and
[`features.md`](./features.md) for ticket numbers.

All screens are mobile-first at **402 × 874** (iPhone 14 reference frame).
Desktop screens at **1320 × 840** unless noted.

> **Reading this doc.** Each screen lists: the SCKRL ticket(s) that build
> it, the layout from top to bottom, all copy, and every state. Copy is
> shown in English; production must localise via SCKRL-801.

---

## Mobile · 01 · Onboarding (welcome)

**Ticket:** SCKRL-101  ·  **Frame:** 402 × 874  ·  **Bg:** `--bg`

```
┌───────────────────────────────────────┐
│ Status bar (safe area)                │ 62
│                                       │
│ [logo]                       EN·DE·FR │ 24
│                                       │
│ ─────────────────────────────────     │
│                                       │
│ Know what's                           │ ← Display 52/0.98, serif italic for last line
│ at home.                              │
│ Waste less.   ← sage-deep italic      │
│                                       │
│ Scan a receipt, drop your             │ ← Body 16, ink-soft, max-width 310
│ groceries into your real kitchen,     │
│ and get a quiet nudge before food     │
│ expires.                              │
│                                       │
│ [animated PaperBag, 240×260]          │ ← centered, breathing
│                                       │
│        spacer                         │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │  Get started               →    │   │ ← Primary CTA (amber)
│ └─────────────────────────────────┘   │
│   I already have an account           │ ← Ghost link, mute
│                                       │
│ Home indicator                        │ 34
└───────────────────────────────────────┘
```

**Behaviour**
- Bag animation runs on mount; pauses if `prefers-reduced-motion`.
- "Get started" → SCKRL-102 (storage zones).
- "I already have an account" → SCKRL-008 sign-in.

**States** — single state. No loading, no error (no network calls here).

---

## Mobile · 02 · Storage zones setup

**Ticket:** SCKRL-102  ·  **Frame:** 402 × 874  ·  **Bg:** `--bg`

Top bar: back chevron · *Step 1 of 3* · skip-disabled.

Title: **"Where do you store food?"** (Title-XL · 32/600).
Subtitle: *"Tap every place you'd open looking for ingredients. You can change this later."* (Body-S, ink-soft).

Grid 2 × 3 of zone cards (10px gap, 18px gutter). Each card 168 × 132:

- Zone glyph (Fridge / Pantry / Basement / Freezer / Cabinet / +Add)
- Zone label (Body 16/500)
- Microcopy: *"e.g. cold drinks, dairy"* (Caption, mute)
- Selected state: 2px solid `--ink` border + amber check pill top-right.

Defaults: Fridge, Pantry, Basement, Freezer selected. Cabinet unselected. "+Add" opens a sheet.

Sticky bottom: **Continue** primary CTA. Disabled while count = 0.

**States**
- Empty selection → CTA disabled, microcopy below: *"Pick at least one."*
- Cabinet picker sheet → text input + Save.

---

## Mobile · 03 · Locale picker

**Ticket:** SCKRL-103  ·  **Frame:** 402 × 874

Top bar: back · *Step 2 of 3*.

Title: **"Your language."**
Subtitle: *"Sackerl speaks four. Receipts are read in all of them."*

Segmented control, 2-up × 2 rows: Deutsch · English · Français · Italiano. Preselected from device locale.

Below: a small note card (kraft surface) — *"You can switch any time in Settings."*

Sticky bottom CTA **Continue**.

---

## Mobile · 04 · Home dashboard

**Ticket:** SCKRL-203, 204, 205, 206  ·  **Frame:** 402 × 874  ·  **Bg:** `--bg`

```
┌───────────────────────────────────────┐
│ Status bar                            │ 62
│ TUESDAY, 17 MAY                       │ ← eyebrow
│ Hello, *Lena*       [⌕]  [🔔·dot]    │ ← Title-XL serif italic name
│                                       │
│ ┌─ Kraft hero ────────────────────┐   │
│ │ ━ dein sackerl              [PaperBag] │ ← top-right stamp, bag right-aligned
│ │                                  │   │
│ │ 85 things                        │   │
│ │ at home                          │   │
│ │ Enough for 5 dinners.            │   │
│ │ Skip the shop on Wednesday.      │   │
│ │ [FRESH·18] [PANTRY·41]          │   │ ← mono pills on kraft
│ └──────────────────────────────────┘   │
│                                       │
│ ┌─ Expiring soon (white card) ────┐   │
│ │ ● 3 items expiring soon  See all │   │
│ │ ──────────────────────────────── │   │
│ │ [tile] Greek yogurt    [tomorrow]│   │
│ │ [tile] Spinach         [2 days]  │   │
│ │ [tile] Chicken thighs  [2 days]  │   │
│ └──────────────────────────────────┘   │
│                                       │
│ STORAGE                       85 items│
│ ┌─────────────┐ ┌─────────────┐       │
│ │ [FR] 3 soon │ │ [PA]        │       │
│ │ Fridge      │ │ Pantry      │       │
│ │ 23 items    │ │ 41 items    │       │
│ └─────────────┘ └─────────────┘       │
│ ┌─────────────┐ ┌─────────────┐       │
│ │ [BS] Basement│ │ [FZ] Freezer│       │
│ │ 12 items    │ │ 9 items     │       │
│ └─────────────┘ └─────────────┘       │
│                                       │
│ ┌─ Sage suggestion card ──────────┐   │
│ │ ✦ FROM YOUR STOCK                │   │
│ │ You have what you need for       │   │
│ │ *spinach pasta* tonight.         │   │
│ │ [Pasta][Spinach][Garlic][Parm]   │   │
│ │ [Show recipe →] (ink)            │   │
│ └──────────────────────────────────┘   │
│                                       │
│ Tab bar (Home · Stock · Scan · Exp · Me)│ 88
└───────────────────────────────────────┘
```

**States**
- **Empty stock** → Hide expiring + suggestion cards. Kraft hero copy becomes *"Your sackerl is empty. Scan your first receipt."* + amber inline CTA.
- **Loading** → Skeleton bar inside the kraft hero (count placeholder); other cards collapse.
- **No expiring** → Replace expiring card with green meadow card: *"Nothing expiring this week — well done."*

---

## Mobile · 05 · Scan receipt

**Ticket:** SCKRL-301  ·  **Frame:** 402 × 874  ·  **Bg:** `#15171A`

Dark fullscreen camera viewport.

- Top: Close (round translucent) · *Scan receipt* (white) · Help button.
- Center: a faux receipt preview floats with corner-bracket alignment frame (white 2.5px, only outer corners). When ≥ 80% of frame is filled, corners turn `--amber`.
- Microcopy below frame: *"Align receipt inside frame · hold steady"*.
- Bottom row of three actions: Gallery · **[●] Capture** (amber 72px circle with ink ring) · PDF.
- "Skip — type it instead" tertiary link beneath.

**States**
- **Misaligned** → corners white, capture disabled.
- **Aligned** → corners amber, soft haptic, capture enabled.
- **Capturing** → 200ms shutter flash, then route to SCKRL-304 with the receipt id.
- **Permission denied** → fullscreen state with copy *"Sackerl needs camera access to scan receipts."* + Open Settings button.

---

## Mobile · 06 · Review items

**Ticket:** SCKRL-304  ·  **Frame:** 402 × 874  ·  **Bg:** `--bg`

Top: back · *Step 2 of 3* · kebab.

Title: **Review *8 items*** (the count in serif italic).
Subtitle: *"From Grocery Markt · 17.05.2026 · €25.12"*.

Chip row: `✓ 7 confident` (sage) · `1 needs review` (amber).

Item list (white card, rounded 16). Each row:

- Category tile · name (Body 15/500) + raw OCR text below in mono 11 mute-soft.
- Right: quantity text (e.g. *500 g*) + chevron round button.
- Confidence-low rows append small *· check* in amber after the name.

Dashed CTA row at bottom of list: *"+ Add missing item"* in mute.

Sticky bottom: **Continue to placement** primary (amber). Disabled while any row remains "needs review".

**States**
- Tap row → bottom sheet for full inline edit (name, qty + unit, category).
- All confident → chip becomes only `✓ 8 confident`; CTA enabled immediately.
- Empty parse (OCR failure) → empty state card: *"We couldn't read this one. Add items by hand?"* with **Add manually** primary CTA.

---

## Mobile · 07 · Place items

**Ticket:** SCKRL-305  ·  **Frame:** 402 × 874  ·  **Bg:** `--bg`

Top: back · *Step 3 of 3* · *Auto-sort* text button right.

Title: **Where does it *go?***
Subtitle: *"Drag each item into its storage spot."*

Layout
- **Dock** (top) — horizontal scrollable list of unplaced item chips (`.sk-grocery-chip`) with category tile + name. Heading: `TO PLACE · N` + `M / 8 done` meta on the right.
- **Zones** (below) — vertical stack of drop-targets, one per active zone. Each shows Zone glyph + name + count meta + "release here" sage chip when an item hovers.

Sticky bottom: **Save & set reminders** primary CTA.

**Behaviour**
- Default suggestion per category mapped before user interaction. Dock chips start coloured with a faint amber ring suggesting their target.
- Auto-sort accepts all defaults.
- Tap-and-drag with a tilted ghost chip preview (rotated -3deg, sage outline).
- On miss, chip snaps back to dock with a tiny shake.

---

## Mobile · 08 · Storage detail (Fridge / Pantry / …)

**Ticket:** SCKRL-211  ·  **Frame:** 402 × 874

Top bar: back · kebab.

Header block: Zone glyph 64 + name (Title-XL) + meta *"23 items · 3 expire soon"* (3 in amber).

Chip filter row: `All · 23` (ink), `Dairy · 5`, `Produce · 8`, `Meat · 3` (default chips).

Sections (white cards rounded 16):
- **USE SOON** — sorted by expiry ascending. Right side: amber chip with days.
- **STOCKED** — alphabetical or category-grouped.

Each row: Tile · name · qty (mono, tabular) · right action.

Floating amber Add FAB bottom-right (56), opens SCKRL-212.

**States**
- **Empty zone** → cardboard-card placeholder *"Nothing in your Fridge yet."* + inline button **Add item**.
- **All stocked** (no expiring) → Use Soon section hidden; "Stocked" first.

---

## Mobile · 09 · Add item (sheet)

**Ticket:** SCKRL-212  ·  **Frame:** 402 × 720 (sheet, ¾)

Sheet shape: top-rounded 28. Drag handle.

Fields (in order):
1. Name — text input, big (Body 17), placeholder *"e.g. Cucumber"*.
2. Category — horizontal scroll of Tile chips (selected = ink outline + check).
3. Quantity — number with +/- buttons + unit segmented (g · kg · ml · l · pcs).
4. Zone — segmented from active zones.
5. Expires on — date input; default = estimated via SCKRL-405, with a small *"estimated"* meta and a tap-to-edit affordance.

Bottom row: **Add** primary CTA · **Cancel** ghost.

**States**
- Save in progress → CTA shows spinner; rest of sheet locked.
- Error → inline red microcopy *under* the offending field.

---

## Mobile · 10 · Expiring soon (full list)

**Ticket:** SCKRL-401, 421  ·  **Frame:** 402 × 874

Top: back · *Expiring soon* · kebab.

Grouped by day bucket, each a section header (Eyebrow):
- TODAY · N
- TOMORROW · N
- THIS WEEK · N
- NEXT WEEK · N

Each item row uses the standard list row.

Swipe actions:
- Trailing swipe left → **Used** (sage) · **Snooze 2d** (amber-soft) · **Compost** (ink).
- Leading swipe right → quick **Used**.

**States**
- Empty → meadow card *"Nothing expiring soon."* + sage `leaf` icon.

---

## Mobile · 11 · Notifications inbox

**Ticket:** SCKRL-421  ·  **Frame:** 402 × 874

Top: back · *Notifications* · *Mark all read* (text button right).

Sections: TODAY · EARLIER.

Each row: small left dot (amber for unread, transparent for read) · title (Body 15/500) · body (Body-S, ink-soft) · timestamp (Caption mono mute) right.

**States**
- Empty → *"No notifications yet — we'll only nudge when it matters."*

---

## Mobile · 12 · Suggestions

**Ticket:** SCKRL-521  ·  **Frame:** 402 × 874

Top: back · *From your stock* · filter icon.

Filter chips row: All · Vegetarian · Quick · Dinner.

Cards (full-width, rounded 22) — one per recipe:

- Header: title (Title) + serves/time meta + match score chip (e.g. *4 of 5 ingredients*).
- Ingredient chip wrap: in-stock (sage), missing (amber).
- CTA row: **Show recipe** (ink) + heart icon (ghost).

**States**
- No matches → kraft card: *"Stock a few more things and we'll suggest dinners."* (Sage CTA *Add item*).

---

## Mobile · 13 · Premium paywall

**Ticket:** SCKRL-601  ·  **Frame:** 402 × 874  ·  **Bg:** `#15171A`

- Close button top-right.
- Big serif headline: *"Cook smarter. Waste less."* (white).
- Hero illustration slot (use animated PaperBag inverted/dark variant).
- 4 feature rows: icon + bold label + one-line description. Icons in `--amber`.
- Toggle: Monthly / **Yearly** with "SAVE 33%" amber pill.
- CTA: **Start 7-day free trial** (amber primary, ink text).
- Microcopy: *"Cancel anytime · No charge until day 7"* (white 70%).
- Restore purchases ghost link.

---

## Desktop · D1 · Web dashboard

**Ticket:** SCKRL-705  ·  **Frame:** 1320 × 840

Two-column shell: 240px sidebar + main.

**Sidebar**
- Logo + version pill.
- Primary nav: Home · Stock · Expiring soon (amber count) · Receipts · Suggestions · Shopping list.
- Storage list with Zone glyphs and small dot indicators.
- Premium nudge card (sage meadow) at bottom.
- User row at very bottom.

**Main**
- Top bar: search input (left), `Add item` ghost, `Scan receipt` primary (amber) right.
- Hero row (2 columns):
  - Left: Greeting + Title-XL "Hello, *Lena.* You have 5 things to use this week."
  - Right: Kraft "dein sackerl · live" hero card with `<PaperBag>`, copy *"Was im Sackerl ist — genug für 5 Abende."*
- Stat row: 4 cards — In stock · Expiring this week · Saved this month · Food waste avoided.
- Body (1.4fr / 1fr):
  - Left: Expiring this week — table (Item · Location · Qty · Expires) with amber chips per urgency.
  - Right: Suggestions panel (3 cards stacked).

**States**
- Empty stock → all panels collapse into a single full-width onboarding banner: *"Scan your first receipt to wake your sackerl."* with **Upload receipt** primary CTA.

---

## Desktop · D2 · Receipt upload

**Ticket:** SCKRL-711  ·  **Frame:** 1320 × 840

Dropzone (full-width, dashed 2px `--border`, kraft tint) centered:
- Icon (upload) 48
- Headline *"Drop receipts here"*
- Subline *"or click to pick — JPEG, PNG, HEIC, PDF · up to 10 at once"*

Below: parsed-receipts list (sortable). Each row: filename · store · total · status pill (parsing / parsed / failed) · actions.

Clicking a parsed row → routes to the mobile-style **Review** modal at 720px width.

---

## Desktop · D3 · Shopping list (print-ready)

**Ticket:** SCKRL-715  ·  **Frame:** 1320 × 840

Two-pane: items left (60%), preview right (40%). Preview is a paper-style A4 rectangle with a print stylesheet preview.

Top action: **Print list** button (amber primary).

Print stylesheet hides chrome; prints kraft header band + plain checkboxed list.

---

## Universal screens

### Loading skeletons
- Bone colour: `--border-soft`.
- 1.4s shimmer, ease-in-out, infinite.
- Never spin. Always skeleton or progress bar.

### Empty states
Consistent layout: small icon (28, mute-soft), Title (Title), Body-S subline, optional primary CTA. Stick to one sentence.

### Error states
- Inline (form fields): Body-S in `#8C2E1A` below the field.
- Page-level: ink card with amber leading dot, headline *"Something didn't work."*, body explaining what + Retry button.

### Toasts
- 56px tall, rounded 14.
- `success` = ink bg, sage leading dot.
- `warn` = amber-soft bg, amber-deep dot.
- `error` = ink bg, amber dot (we don't use red).
- 4s auto-dismiss, swipeable.

### Bottom sheets
- 28px top radius, 4px drag handle.
- Background `--card`, scrim `rgba(27,36,24,0.35)` over the page.
- Snap-points: peek 25% · half 50% · full 92%.
- Closes on scrim tap, drag-down, or hardware back.

---

## Component checklist per ticket

When you build any screen, verify against:

- [ ] Spacing matches the gutters above (mobile 18–22; desktop 32).
- [ ] All text uses tokens from `design-system.md`.
- [ ] Yellow only appears on actions (primary CTA, Scan FAB).
- [ ] Green only appears as info (chip, eyebrow, suggestion).
- [ ] Black does the heavy lifting (body, secondary, ink CTAs).
- [ ] Kraft used only on the 3 sanctioned surfaces.
- [ ] Reduced-motion honoured.
- [ ] Tap targets ≥ 44pt.
- [ ] No emoji, no filled icons, no exclamation marks.
