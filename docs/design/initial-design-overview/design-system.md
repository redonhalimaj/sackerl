# Sackerl — Design System

The single source of truth for tokens, type, components, and motion. Pair
this with [`screens.md`](./screens.md) for per-screen anatomy.

When in doubt, the HTML hi-fi (`index.html`) wins — but everything here
matches it exactly as of writing.

---

## 1. Principles

1. **Yellow is action.** Sunflower amber is reserved for primary buttons and the Scan FAB. Never decoration.
2. **Green is information.** Eyebrows, success chips, "from your stock" highlights, the brand mark.
3. **Black is ink.** Body type, secondary CTAs, dark surfaces.
4. **Kraft is identity.** The paper-bag tone is the brand metaphor — used on the dashboard hero card, the cover footer band, and the bag specimen. Never as an action surface.
5. **Helpful, not alarming.** "Use today" — never "URGENT". Yellow nudges, green encourages, never red.
6. **No more than two coloured chips on screen at once.**
7. **Metric and European-first.** g / kg / ml / l / pcs. No oz. Basements are first-class storage zones.

---

## 2. Colour tokens

All tokens defined in `styles.css` under `:root`. Roles below.

| Token | Hex | OKLCH | Role |
|---|---|---|---|
| `--bg` | `#FCFDFA` | `oklch(.99 .005 117)` | Paper / app background |
| `--bg-warm` | `#F4F7EE` | `oklch(.97 .015 117)` | Warm surface, soft buttons |
| `--card` | `#FFFFFF` | — | Card surface |
| `--ink` | `#1B2418` | `oklch(.21 .015 134)` | Body text, secondary CTA |
| `--ink-soft` | `#364232` | — | Subdued body text |
| `--mute` | `#6E7A6A` | — | Captions, metadata |
| `--mute-soft` | `#A3AC9E` | — | Disabled labels |
| `--border` | `#E8ECDF` | `oklch(.93 .015 122)` | Hairlines, card edges |
| `--border-soft` | `#F1F4EA` | — | Inner row dividers |
| `--hairline` | `rgba(27,36,24,.08)` | — | Translucent rule on tinted bgs |
| **`--sage`** | `#4F9D3A` | `oklch(.66 .17 138)` | **Brand mark, info chips** |
| `--sage-deep` | `#2F6A20` | `oklch(.49 .14 138)` | "From your stock" headline tint |
| `--sage-soft` | `#ECF6E5` | — | Sage chip background |
| `--sage-tint` | `#D4E9C6` | — | Sage card backgrounds |
| **`--amber`** | `#F2C014` | `oklch(.81 .17 91)` | **Primary CTA, Scan FAB** |
| `--amber-deep` | `#B58A0C` | `oklch(.64 .13 86)` | Primary hover, expiry dot |
| `--amber-soft` | `#FBF3CC` | — | Warning chip background |
| **`--kraft`** | `#C8A06E` | — | **Paper-bag accent surface** |
| `--kraft-deep` | `#8A6238` | — | Kraft borders, stamp ink |
| `--kraft-soft` | `#F4E8D2` | — | Kraft card body |
| `--kraft-ink` | `#4A3520` | — | Type on kraft |

### Usage cheat-sheet

| If you want to… | Use |
|---|---|
| Primary CTA (Get started, Continue, Save) | `--amber` bg, `--ink` text, 1.5px `--ink` ring |
| Secondary CTA (Show recipe, Cancel) | `--ink` bg, `--bg` text |
| Tertiary / ghost | transparent bg, `--ink` text, 1px `--ink` outline |
| Surface a recipe match / "from your stock" | `--sage-soft` bg, `--sage-deep` text |
| Surface a warning (item expiring) | `--amber-soft` bg, `#6E5108` text, 1px `--amber-deep` 18%-opacity inner ring |
| Communicate "your stock"/"your sackerl" | `.sk-kraft` texture utility |

---

## 3. Typography

Stack defined in `:root --font-sans / --font-serif / --font-mono`.

```
sans:  -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif
serif: 'New York', ui-serif, 'Iowan Old Style', Georgia, 'Times New Roman', serif
mono:  ui-monospace, 'SF Mono', 'Menlo', 'Monaco', monospace
```

### Scale (1.250 — minor third)

| Style | Family / Weight | Size / Line | Tracking | Used for |
|---|---|---|---|---|
| Display | sans / 800 | 92 / 0.88 | -0.045em | Cover headline only |
| Headline | sans / 700 | 56 / 0.95 | -0.04em | Editorial spreads |
| Title-XL | sans / 700 | 32 / 1.05 | -0.03em | Section openers |
| Title | sans / 600 | 22 / 1.15 | -0.02em | Card titles, screen titles |
| Subtitle | sans / 600 | 17 / 1.2 | -0.015em | List section headers |
| Body | sans / 500 | 16 / 1.45 | 0 | UI text |
| Body-S | sans / 400 | 14 / 1.5 | 0 | Microcopy |
| Caption | sans / 500 | 13 / 1.4 | 0 | Chips, meta |
| Eyebrow | mono / 500 | 11 UPPERCASE | 0.08em | Section labels (`.sk-eyebrow`) |
| Meta | mono / 400 | 10 UPPERCASE | 0.18em | Editorial metadata |

### Editorial moments

- The serif (`'New York'` italic) appears only for accent words — "Lena", "spinach pasta", "have." underline. Never set paragraphs in serif.
- Monospace is used exclusively for metadata, eyebrows, receipt facsimiles, and editorial captions. Never for body copy.

---

## 4. Spacing & layout

We use a 4px base. Common values: `4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 56, 64`.

| Token | Value | Usage |
|---|---|---|
| `--r-sm` | 10 | Tiles, small chips |
| `--r-md` | 14 | Inputs, secondary cards |
| `--r-lg` | 20 | Hero cards |
| `--r-xl` | 28 | Bottom sheets |
| Pill | 999 | Buttons, chips |

| Shadow | Definition |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(26,29,26,.04), 0 1px 3px rgba(26,29,26,.03)` |
| `--shadow-md` | `0 2px 6px rgba(26,29,26,.04), 0 8px 24px rgba(26,29,26,.05)` |
| `--shadow-lg` | `0 6px 20px rgba(26,29,26,.06), 0 20px 50px rgba(26,29,26,.08)` |

**Screen gutters:** mobile = 18–22px outer, 14–16px inner. Desktop = 32px outer.
**Safe areas:** top 60px (status bar), bottom 100px (tab bar + iOS home indicator).

---

## 5. Components

Every component matches its React reference in `sk-atoms.jsx`. Reproduce
visually first; behaviour second.

### 5.1 Button

Height **52** (lg) / **38** (md). Border-radius **999**. Padding `0 22` (lg) / `0 16` (md). Font weight 500–600.

| Variant | Background | Text | Border / FX |
|---|---|---|---|
| **Primary** | `--amber` | `--ink` | 1.5px ring `--ink`, inset top highlight `rgba(255,255,255,.55)`, outer glow `0 8px 22px rgba(242,192,20,.28)` |
| Ink | `--ink` | `--bg` | inset top highlight `rgba(255,255,255,.12)`, glow `0 4px 16px rgba(27,36,24,.18)` |
| Ghost | transparent | `--ink` | 1px solid `--ink` |
| Soft | `--bg-warm` | `--ink` | 1px solid `--border` |

Primary hover → bg `--amber-deep`, text `#fff`.

Tap state: `transform: scale(0.98)` (`transition: transform .12s`).

### 5.2 Chip

Height **28**. Padding `0 10`. Font 12/500 mono-or-sans. Radius 999.

| Variant | Background | Text |
|---|---|---|
| Default | `--bg-warm` | `--ink-soft` |
| Sage | `--sage-soft` | `--sage-deep` |
| Amber | `--amber-soft` | `#6E5108` (+ inset 1px `--amber-deep` @18%) |
| Ghost | transparent + 1px `--border` | `--mute` |

### 5.3 Card

```
background: --card;
border: 1px solid --border;
border-radius: 20;
```

`.sk-card-flat` = no border, same bg.

### 5.4 Kraft card (`.sk-kraft`)

The paper-bag surface. Used **only** on:
- Dashboard "Your Sackerl" hero (mobile + desktop)
- Cover footer band
- System-spec wordmark cell

CSS texture: 4 layered gradients (3 radial paper-fibre dots + 1 diagonal crease hatch). See `styles.css → .sk-kraft`. Don't try to recreate by hand — copy the utility.

Border: `1px solid rgba(74,53,32,0.18)`. Radius matches the card it's on.

### 5.5 Tile (category)

44 × 44. Border-radius 12. Background = `SK.categories[cat].bg`, text = category initials (e.g. `MK` for Dairy) in mono 11/500. Ten categories: `dairy, produce, meat, pantry, canned, frozen, bakery, snacks, drinks, spices`.

### 5.6 Zone (storage glyph)

56 × 56. Border-radius 14. Five kinds: `fridge, pantry, basement, freezer, cabinet`. Each is a tinted square with mono 2-letter label (FR, PA, BS, FZ, CB).

### 5.7 Eyebrow (`.sk-eyebrow`)

```
font-family: mono;
font-size: 11;
font-weight: 500;
text-transform: uppercase;
letter-spacing: .08em;
color: --mute;
```

Optionally prefixed with `<span class="sk-mark"></span>` — a 22×1 ink rule — for editorial moments.

### 5.8 Tabbar (mobile)

Height ~ 88 (incl. iOS home indicator). Background `rgba(250,250,247,0.85)` with `backdrop-filter: blur(20px) saturate(180%)`. Border-top hairline. 5 tabs evenly spaced; middle is the **Scan FAB** lifted -24px.

**Scan FAB** — 56px circle, `--amber` bg, `--ink` icon, 1.5px `--ink` ring, outer glow `0 10px 24px rgba(242,192,20,.36)`.

### 5.9 Round icon button

36 × 36 circle. Default: `--card` bg, 1px `--border`, `--ink` icon. Dark variant: `--ink` bg, no border, `--bg` icon. Used in top bars.

### 5.10 List row

Padding `12 16`. Hairline `1px solid var(--hairline)` between rows. Tile/Zone left, name + meta middle, action chip right.

### 5.11 Animated paper bag (`<PaperBag />`)

The hero element. See SCKRL-006 and the SVG in `sk-atoms.jsx`. Specs:

| Prop | Default | Notes |
|---|---|---|
| width / height | 280 / 300 | Aspect must stay ≥ 0.9 |
| label | `SACKERL` | Rendered inside the stamped card on the bag, mono 9.5/letterSpacing 2 |
| animated | `true` | Honours `prefers-reduced-motion` |
| items | 4 defaults | sage circle, ink rect, amber rect, sage-deep circle |

**Bag anatomy**
- Outer drop shadow ellipse at the base
- Two arched handles in `--kraft-deep`
- Back panel (linear gradient `--kraft-deep` → darker)
- Front panel (linear gradient `#DCB587` → `#A57945`)
- Paper-fibre `<pattern>` overlay at 60% opacity
- Darker rim ellipse at the opening
- Fold band at the top
- Three vertical creases (left/centre/right) in `rgba(74,53,32,.28)`
- Hand-stamped label rectangle, slightly rotated, with "EST · WIEN · 2026"

**Motion**
- Bag itself: `sk-bag-breathe` 5.2s ease-in-out infinite — translateY ±1.5px, rotate ±0.3deg
- Each item: `sk-bag-drop` 4.4s linear-ish (cubic-bezier(.55,.05,.7,.55)) infinite
  - Start above the bag opening, fade in, settle at the rim, scale 0.78 and fade as it disappears inside
  - Per-item `--sk-x`, `--sk-r0`, `--sk-r1` CSS variables for horizontal offset and tilt-in/tilt-out
- Reduced motion → items stationary at start, bag still

---

## 6. Iconography

Stroked line icons only, 24×24 viewBox, default `strokeWidth=1.6`. Defined in `SK.icons`. **No filled icons. No emoji.** When the design system doesn't have an icon, draw a placeholder rectangle and ship the ticket — don't improvise.

---

## 7. Motion

- **Default ease** — `cubic-bezier(.22,.61,.36,1)` (out-quint)
- **Tap feedback** — `transform: scale(.98)`, 120ms
- **Sheet/page transitions** — 240ms out-quint
- **Bag breathing** — 5.2s loop, never speed up
- **Item drop** — 4.4s loop, stagger by 1s

All animations must respect `prefers-reduced-motion: reduce` and gracefully degrade to a still state.

---

## 8. Voice & copy

- Address the user with **Du** in German, **you** in English.
- Numbers first when they matter: "85 things at home" not "You have 85 things at home".
- Use sentence case for everything but the wordmark.
- Microcopy for empty states should be quietly reassuring: *"Nothing expiring this week — well done."*
- Allowed: a single Austrian-flavoured phrase per surface (e.g. *"Was im Sackerl ist."*). Don't pepper the UI with German if the user is in English.
- Never use exclamation marks. Never use emoji.

---

## 9. Accessibility

- Body text contrast ≥ 4.5:1; large text ≥ 3:1. Amber-on-ink and ink-on-amber both pass.
- Tap targets ≥ 44×44.
- Every icon-only button has an `aria-label`.
- Animated bag stops on reduced motion.
- Receipt review screens fully usable via screen reader (line items in a semantic list).

---

## 10. Brand wordmark + mark

### Wordmark
`sackerl` set in SF Pro Display 700, tracking `-0.035em`, lowercase only. Never uppercase, never italic, never letter-spaced apart.

### Mark
The monoline paper-bag glyph (24×26 viewBox) in `--sage-deep`. Sits to the left of the wordmark with a gap of `size × 0.32`.

### Clear space
½ × cap-height on every side. Never lock the wordmark inside a coloured pill or container.

### Don'ts
- Don't recolour the mark unless on a dark surface (then it goes white).
- Don't use the bag mark without the wordmark below ~size 18.
- Don't apply effects (shadow, gradient, stroke).
