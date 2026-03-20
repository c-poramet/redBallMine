# CSS & HTML Style Guide

A complete reference for the visual design system, layout patterns, components, and interaction patterns used in this project. Written for reuse in other projects or as an AI context document.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [CSS Custom Properties (Design Tokens)](#2-css-custom-properties-design-tokens)
3. [Typography](#3-typography)
4. [Page-Level Layout](#4-page-level-layout)
5. [The Panel System](#5-the-panel-system)
6. [State Indicators & Semantic Color](#6-state-indicators--semantic-color)
7. [Reusable UI Components](#7-reusable-ui-components)
8. [Side Settings Panels (Squeeze Layout)](#8-side-settings-panels-squeeze-layout)
9. [Animations & Transitions](#9-animations--transitions)
10. [Pure CSS State Management](#10-pure-css-state-management)
11. [Responsive Considerations](#11-responsive-considerations)
12. [Math Notation & KaTeX Compatibility](#12-math-notation--katex-compatibility)
13. [How to Reuse in Another Project](#13-how-to-reuse-in-another-project)
14. [Integrated Help Panel, Indicators, Footer, Tooltips](#14-integrated-help-panel-indicators-footer-tooltips)

---

## 1. Design Philosophy

These principles apply whether you're building a tool, a game, a dashboard, or a utility. They are the foundation every component decision is made from.

### Minimalism
Every element earns its place. No decorative borders, no gradients for their own sake, no copy that repeats what the UI already communicates. When in doubt, remove it. The surface should feel empty except for what the user needs right now.

### Tone
Dark, warm, focused. Surfaces are near-black (`#111111`) or warm dark grey (`#2b2b2b`). The warmth comes from the page background tone — not from color splashed around the UI. Text opacity is the primary scale for hierarchy: `#f0f0f0` for primary, `rgba(255,255,255,0.38)` for secondary, `rgba(255,255,255,0.18)` for dim hints. The accent color (`--accent`, a muted orange) is reserved for status — urgency, counters, warnings — not decoration.

### Indicator
Color carries meaning. Green means correct or active. Yellow means present but wrong position. Gray means absent or disabled. Orange means caution or a live count. These mappings are never broken. If a new color is introduced, it must map to a new discrete state. Color is not decoration: it is communication.

### Intentional Design
Every interaction has feedback. Hover states lift elements by 1px. Active states push them back to 0. Transitions are short (80–320 ms). Subtle box-shadows create depth without drawing attention. Borders use very low-opacity white (`rgba(255,255,255,0.07–0.13)`) — they define edges without adding visual weight.

### No-Scroll Page
The page is fully viewport-locked: `height: 100vh; overflow: hidden` on `.main`. The user never scrolls the page itself. If a region needs to scroll (a results list, a debug panel), it scrolls internally — isolated within its container with a styled thin scrollbar. This contract means the user always sees the same spatial layout and never loses context.

### Everything in Reach
The layout is structured so all interactive controls are visible at all times. The primary action is always at the bottom of the input panel, the status is always in the header, and results fill the remaining space. Nothing requires scrolling to find, only scrolling to see more of a long list.

### Data Density Through Typography
Numbers, scores, and computed values use `Space Mono` (monospace). Labels and UI copy use `Inter` (sans-serif). This visual distinction lets the user instantly separate "data" from "chrome".

Text should scale fluidly, but never shrink into unreadable sizes. Use `clamp()` for all UI text tokens and keep these floors:

- Never below `10px` for compact tags/chips.
- Never below `11px` for actionable UI labels and controls.
- Never below `12px` for descriptive/helper copy.

Uppercase small-caps labels stay compact (`10–12px; letter-spacing: 0.06–0.1em; text-transform: uppercase`) and are used for section headers and chip labels — never for body copy or key data values.

---

## 2. CSS Custom Properties (Design Tokens)

All tokens are defined on `:root`. These are the single source of truth for every color, size, and font used in the project.

```css
:root {
  /* ── Backgrounds ── */
  --bg:          #2b2b2b;   /* page background — warm dark grey */
  --bg-deeper:   #1e1e1e;   /* reserved deeper background */
  --card-dark:   #111111;   /* primary panel/card surface */
  --surface:     #1f1f1f;   /* interactive surface — buttons, rows, inputs */
  --surface-2:   #252525;   /* slightly lighter interactive surface */

  /* ── Borders ── */
  --border:      rgba(255,255,255,0.07);   /* subtle — panel outlines, row dividers */
  --border-md:   rgba(255,255,255,0.11);   /* medium — active states, focused inputs */

  /* ── Text ── */
  --text-pri:    #f0f0f0;               /* primary — near white */
  --text-sec:    rgba(255,255,255,0.38); /* secondary — labels, sublabels */
  --text-dim:    rgba(255,255,255,0.18); /* dim — hints, placeholders, row numbers */

  /* ── Accent ── */
  --accent:      #c97f50;   /* muted orange — counters, warnings, urgency only */

  /* ── Shape ── */
  --radius:      18px;      /* panel/card border-radius */
  --radius-sm:   10px;      /* inner component border-radius (rows, inputs, chips) */

  /* ── Fonts ── */
  --font-ui:     'Inter', system-ui, sans-serif;
  --font-mono:   'Space Mono', monospace;

  /* ── Fluid Type Scale (readability floors) ── */
  --fs-2xs:      clamp(10px, 0.18vw + 9px, 12px);  /* chips/tags */
  --fs-xs:       clamp(11px, 0.24vw + 9px, 13px);  /* labels/buttons */
  --fs-sm:       clamp(12px, 0.3vw + 10px, 14px);  /* helper text */
  --fs-md:       clamp(13px, 0.4vw + 10px, 16px);  /* primary UI copy */
  --fs-lg:       clamp(16px, 0.7vw + 11px, 22px);  /* data/value emphasis */

  /* ── Semantic State Colors ── */
  --clr-green:        #6ca965;                 /* correct / active / success */
  --clr-yellow:       #c8b653;                 /* present / warning / near */
  --clr-gray:         #787c7f;                 /* absent / disabled / neutral */
  --clr-empty:        #1a1a1a;                 /* unfilled tile background */
  --clr-empty-border: rgba(255,255,255,0.13);  /* unfilled tile border */
}
```

### Token Usage Summary

| Token | Used for |
|---|---|
| `--bg` | `<body>` background |
| `--card-dark` | Panel/card surfaces |
| `--surface` | Interactive surfaces: buttons, input backgrounds, list rows |
| `--surface-2` | Slightly elevated surfaces: active icon buttons |
| `--border` | All subtle defining lines and outlines |
| `--border-md` | Borders on focused/active states |
| `--text-pri` | Headings, values, primary labels |
| `--text-sec` | Secondary labels, sublabels, descriptions |
| `--text-dim` | Barely-visible hints — row numbers, placeholder text |
| `--accent` | Counters, warnings, urgency badges |
| `--radius` | Panel/card corners |
| `--radius-sm` | Inner component corners |
| `--font-ui` | All UI copy, labels, buttons |
| `--font-mono` | All data values, counts, scores, computed outputs |
| `--fs-2xs` / `--fs-xs` | Compact labels/chips with readability floor |
| `--fs-sm` / `--fs-md` / `--fs-lg` | Fluid body/value scale with clamp-based bounds |
| `--clr-green` | Correct state, active toggles, success banners |
| `--clr-yellow` | Present-but-wrong state, near-miss |
| `--clr-gray` | Absent/eliminated state |
| `--clr-empty` | Unfilled/waiting state background |

---

## 3. Typography

### Fonts

Both fonts are loaded from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap"
  rel="stylesheet"
/>
```

| Font | Weights loaded | Role |
|---|---|---|
| `Inter` | 300, 400, 500, 600 | All prose, labels, buttons, body copy |
| `Space Mono` | 400, 700 | All data: computed values, counts, scores, keys |

### Type Scale

The app uses a fluid type scale with explicit minimums so text remains legible as panels and rows compress.

| Usage | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Panel section label | Space Mono | `var(--fs-2xs)` | 700 | `text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-dim)` |
| Input text | Space Mono | `clamp(16px, 0.9vw + 11px, 20px)` | 700 | `letter-spacing: 0.18em; text-transform: uppercase` |
| Tile letter | Space Mono | `clamp(15px, 0.75vw + 10px, 18px)` | 700 | `letter-spacing: 0.02em; text-transform: uppercase` |
| Primary CTA button | Space Mono | `var(--fs-md)` | 700 | `letter-spacing: 0.08em; text-transform: uppercase` |
| Secondary buttons | Space Mono | `var(--fs-xs)` | 400 | `letter-spacing: 0.06em; text-transform: uppercase` |
| Stat value | Space Mono | `var(--fs-lg)` | 700 | `letter-spacing: -0.02em` |
| Guess word | Space Mono | `clamp(13px, 0.6vw + 10px, 16px)` | 700 | `letter-spacing: 0.1em; text-transform: uppercase` |
| Chip/badge text | Space Mono | `var(--fs-2xs)` to `var(--fs-xs)` | 700 | `letter-spacing: 0.04–0.1em; text-transform: uppercase` |
| Header title | Inter | `var(--fs-md)` | 600 | `letter-spacing: 0.06em; text-transform: uppercase` |
| Header subtitle | Space Mono | `var(--fs-xs)` | 400 | `color: var(--text-sec)` |
| Toggle label | Inter | `var(--fs-sm)` | 500 | `line-height: 1.3` |
| Toggle description | Space Mono | `var(--fs-2xs)` | 400 | `color: var(--text-dim); letter-spacing: 0.02em` |
| Placeholder text | Inter | `var(--fs-md)` | 400 | `color: var(--text-sec); line-height: 1.55` |
| Footer credit | Space Mono | `var(--fs-2xs)` | 400 | `color: var(--text-dim); letter-spacing: 0.04em` |

### Minimum Readability Rules

1. Do not introduce new `8px` or `9px` text in production UI.
2. If space is tight, reduce letter-spacing or padding before reducing font size.
3. Reserve sub-`11px` text for passive metadata only (never primary actions, counts, or required instructions).
4. Validate text at `320px` width and at panel-min-width states.

### Relative Sizing Spec: Tags, Buttons, Indicators

Use these relative sizes to keep interactive controls visually balanced and easier to hit.

| Component | Relative Size | Typical Target |
|---|---|---|
| Header tags (`.setting-tag`) | `~0.8x` secondary button text | `12-14px` text, `5px 10px` padding |
| Header mode link (`.mode-link`) | `~1.0x` secondary button text | `13-14px` text, `6px 10px` padding |
| Settings icon button (`.icon-btn`) | `~1.25x` header tag height | `40x34px` target, icon `18px` |
| Header timer badge (`.guesses-left-badge`) | `~1.1x` header tag size | `13-14px` text, `6px 12px` padding |
| Primary CTA (`.btn-analyze`) | `~1.3x` secondary button text | `15-18px` text, `16px` vertical padding |
| Secondary action (`.btn-reset`) | baseline action size | `12-14px` text, `13px` vertical padding |
| Status chips (`.known-chip`) | match secondary action text | `12-14px` text, `5px 10px` padding |
| Stat labels (`.stat-lbl`) | `~0.75x` stat values | `10px` uppercase labels |

### Touch/Click Targets

1. Any persistent action control should be at least `34px` tall on desktop.
2. Primary actions should be at least `44px` tall on mobile.
3. Icon-only controls should keep a minimum `34x34px` hit area.

### Anti-aliasing

```css
html, body {
  -webkit-font-smoothing: antialiased;
}
```

Set globally. Critical for crisp text on dark backgrounds.

### The Two-Font Rule

Use **`Space Mono`** for anything derived from data: a score, a computed count, a word output, a key name, a percentage. Use **`Inter`** for anything the designer wrote: instructions, labels, settings descriptions, confirmations. When both appear together (e.g. a label above a value), the visual contrast between proportional and monospace is itself an alignment cue — the user reads the label with Inter, then locks onto the monospace value below it.

---

## 4. Page-Level Layout

The layout is three regions: a fixed full-width header, a viewport-locked main work area, and a non-floating footer docked at the bottom of the app shell.

```
┌─────────────────────────────────────────────────────┐
│ .header (fixed, full-width, frosted glass)           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  .main (height: 100vh; overflow: hidden)            │
│    └── .solver-layout (or any panel layout)         │
│         ├── .left-panel  (fixed width, flex col)   │
│         └── .right-panel (flex: 1, scrolls inside) │
│                                                     │
├─────────────────────────────────────────────────────┤
│ .footer (docked bottom strip, non-floating)         │
└─────────────────────────────────────────────────────┘
```

### `.header`

```css
.header {
  position: fixed;
  top: 0; left: 0; right: 0;
  padding: 18px 28px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border);
  background: rgba(43,43,43,0.92);
  backdrop-filter: blur(8px);
}
```

- Full-width, not corner-anchored.
- Frosted glass effect: semi-transparent background + `backdrop-filter: blur(8px)`.
- `border-bottom` draws a subtle separator without visual weight.
- `z-index: 10` keeps it above panel content.
- All header children align in a single flex row. Status items (badges, tags) push right with `margin-left: auto` on the first right-aligned element.

**Header elements:**

| Class | Purpose |
|---|---|
| `.header-title` | App name — 14px/600/uppercase/letter-spaced |
| `.header-dot` | 6×6px status dot — background color signals state |
| `.header-sub` | Monospace subtitle — mode name, context label |
| `.header-icon-group` | Flex group of `.icon-btn` — settings, debug, etc. |
| `.header-tags` | Flex group of `.setting-tag` — active state indicators |
| `.guesses-left-badge` | Accent-colored count badge — pushed to right with `margin-left: auto` |

### Non-Moving Indicator Rail

Status indicators must remain visually stable while the user interacts with the board. Use a fixed-position header rail for all passive indicators (turns used, hypothesis count, mode, remaining guesses).

```css
.header { position: fixed; top: 0; left: 0; right: 0; }
.header-tags { display: flex; gap: 6px; margin-left: 10px; }
.guesses-left-badge { margin-left: auto; }
```

Rules:

1. Indicator chips are passive (`cursor: default`) and never shift location based on state value changes.
2. Keep indicator width growth predictable by using monospace (`Space Mono`) and concise labels.
3. Update text content only; do not animate position, scale, or reorder.
4. Place actionable controls (settings buttons) outside the indicator rail so status and actions are visually distinct.

### `.main`

```css
.main {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
  padding: 72px 16px 16px;  /* top padding accounts for fixed header */
}

/* Centered training layouts (index / zen / pattern-zen) */
.idx-main { align-items: center; }
.zen-main { align-items: center; }
```

- **`height: 100vh; overflow: hidden`** — the no-scroll contract. The page never scrolls.
- `padding-top: 72px` accounts for the fixed header height.
- Base `.main` uses `align-items: flex-start` for dashboard-style pages (for example analysis).
- Training pages opt into vertical centering with page-specific wrappers (`.idx-main`, `.zen-main`, `.pz-main`) so the play area stays centered whether settings are open or closed.

### `.solver-layout` (Two-Panel Layout)

```css
.solver-layout {
  display: flex;
  gap: 16px;
  width: 100%;
  max-width: 1280px;
  height: 100%;
  align-items: stretch;
}
```

A flex row that fills the available main area. Left panel is fixed-width; right panel grows to fill the rest. Both panels are `align-items: stretch` so they reach the same height.

```css
.left-panel  { flex: 0 0 340px; min-width: 180px; display: flex; flex-direction: column; overflow: hidden; }
.right-panel { flex: 1; min-width: 0; overflow-y: auto; overflow-x: hidden; }
```

The right panel is the only element in the page that scrolls. Apply a styled thin scrollbar to maintain the minimal aesthetic:

```css
.right-panel {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.right-panel::-webkit-scrollbar       { width: 4px; }
.right-panel::-webkit-scrollbar-track { background: transparent; }
.right-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
```

### `.footer`

```css
.footer {
  height: 42px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  background: rgba(17,17,17,0.55);
}
```

Contains `.footer-credit` — monospace dim text, centered and unobtrusive. Because the footer sits in normal flow (`margin-top: auto`) instead of fixed overlay, it never floats above panel content and does not steal pointer space from interactive UI.

---

## 5. The Panel System

All content lives in `.panel` containers. Panels are the primary layout unit — they replace the "card" abstraction when working in a multi-panel no-scroll layout.

### Base `.panel`

```css
.panel {
  background: var(--card-dark);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: 0 12px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3);
  padding: 22px 20px 20px;
}
```

- Dark surface (`#111111`), full border-radius, subtle border, layered shadow.
- **Double-layer shadow**: a large diffuse shadow beneath (depth) and a tight shadow just below the edge (lift). Never use a single shadow.
- Panels can also use the `.card` class from the previous system — the naming is interchangeable; the CSS pattern is the same.

### Panel Title (`.panel-title`)

```css
.panel-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-sec);
  margin-bottom: 18px;
  font-family: var(--font-mono);
}
```

Used as a section header inside a panel. Small, quiet, all-caps monospace. Section labels that appear mid-panel (not at the top) use `.section-label` with `color: var(--text-dim)` — even dimmer.

### Placeholder State

When a panel region has no computed output yet, use an integrated help panel that sits on the same panel surface (no extra floating card chrome).

```css
.placeholder-state { max-width: 720px; margin: 0 auto; padding: 8px 2px 2px; background: transparent; border: none; }
.placeholder-badge { width: fit-content; margin: 0 auto; padding: 8px 14px; border: 1px solid var(--border-md); border-radius: 10px; font-family: var(--font-mono); }
.placeholder-section + .placeholder-section { border-top: 1px solid var(--border); padding-top: 16px; }
.placeholder-row { display: grid; grid-template-columns: 108px 1fr; gap: 12px; }
.placeholder-row kbd { min-height: 26px; border: 1px solid var(--border-md); border-radius: 6px; }
```

Pattern rules:

1. Do not nest the default panel inside another elevated card unless that screen explicitly needs modal emphasis.
2. Use a two-column grid row (`label` + `description`) for controls and mode descriptions so copy aligns vertically.
3. Keep a separate `Tips` list (bullets), not mixed with key rows, to preserve scannability.
4. Keep the panel informational and non-blocking: it should transition away naturally when real results render.

### Loading State

```css
.loading-state { display: flex; align-items: center; gap: 10px; padding: 20px; color: var(--text-sec); font-size: 12px; font-family: var(--font-mono); }
@keyframes spin { to { transform: rotate(360deg); } }
.spinner { width: 16px; height: 16px; border: 2px solid var(--border-md); border-top-color: var(--text-sec); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
```

---

## 6. State Indicators & Semantic Color

**The core rule:** color is an indicator, never decoration. Every color usage maps to a discrete state.

| Color | Token | State | Usage |
|---|---|---|---|
| Green | `--clr-green` `#6ca965` | Correct / Active / Success | Correct tile, active toggle, solved banner, answer chip |
| Yellow | `--clr-yellow` `#c8b653` | Present / Near / Caution | Wrong-position tile, near-miss score fills |
| Gray | `--clr-gray` `#787c7f` | Absent / Eliminated | Not-in-word tile, eliminated letter chip |
| Orange | `--accent` `#c97f50` | Urgency / Counter / Warning | Remaining guess badge, warning banner, round counter |
| White | `--text-pri` `#f0f0f0` | Primary / Neutral action | CTA button background, primary text |

### Tile State Classes

Tiles are the primary state-indicator component — a 44×44px clickable element that cycles through states:

```css
.tile {
  width: 44px; height: 44px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono);
  font-size: 17px; font-weight: 700;
  letter-spacing: 0.02em; text-transform: uppercase;
  cursor: pointer; user-select: none;
  transition: transform 0.08s, box-shadow 0.12s, background 0.12s, border-color 0.12s;
  border: 2px solid var(--clr-empty-border);
  background: var(--clr-empty);
  color: var(--text-dim);
}
```

| Modifier class | Background | Border | Text | Meaning |
|---|---|---|---|---|
| (empty) | `--clr-empty` | `--clr-empty-border` | `--text-dim` | No letter entered |
| `.has-letter` | `rgba(120,124,127,0.18)` | `--clr-gray` | `--text-pri` | Letter typed, unconfirmed |
| `.state-gray` | `--clr-gray` | `--clr-gray` | `#fff` | Letter absent from word |
| `.state-yellow` | `--clr-yellow` | `--clr-yellow` | `#fff` | Letter present, wrong position |
| `.state-green` | `--clr-green` | `--clr-green` | `#fff` | Letter correct, right position |
| `.auto-gray` | `rgba(120,124,127,0.45)` | `rgba(120,124,127,0.5)` | `rgba(255,255,255,0.5)` | Auto-eliminated (not interactive) |

**Hover behavior:** only `.has-letter` (unconfirmed) tiles are interactive. Confirmed tiles (`.locked .tile`) and auto-gray tiles disable hover.

```css
.tile.has-letter:not(.auto-gray):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.35);
}
```

**Tile flip animation** — play on state change:

```css
@keyframes tileFlip {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(0.1); }
  100% { transform: scaleY(1); }
}
.tile.flip { animation: tileFlip 0.22s ease-in-out; }
```

### Known Letter Chips (`.known-chip`)

Small badges that display eliminated/confirmed letters below the guess grid. Color matches the tile state it summarizes:

```css
.known-chip {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 700;
  padding: 3px 7px; border-radius: 5px;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.known-chip.chip-gray   { background: rgba(120,124,127,0.22); color: var(--clr-gray);   border: 1px solid rgba(120,124,127,0.3); }
.known-chip.chip-yellow { background: rgba(200,182,83,0.15);  color: var(--clr-yellow); border: 1px solid rgba(200,182,83,0.3); }
.known-chip.chip-green  { background: rgba(108,169,101,0.15); color: var(--clr-green);  border: 1px solid rgba(108,169,101,0.3); }
```

**Pattern:** state color at 10–22% opacity for background, state color at 28–30% opacity for border, full state color for text. This semi-transparent tinting pattern applies to all chip states throughout the system.

### Stats Bar (`.stat-chip`)

Flat chips that surface key computed metrics:

```css
.stats-bar { display: flex; gap: 10px; }
.stat-chip {
  flex: 1; padding: 11px 14px; border-radius: var(--radius-sm);
  background: var(--surface); border: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 3px;
}
.stat-val { font-family: var(--font-mono); font-size: 22px; font-weight: 700; color: var(--text-pri); letter-spacing: -0.02em; }
.stat-lbl { font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-sec); }
```

Modifier classes apply semantic color to the value:
```css
.stat-chip.stat-possible .stat-val { color: var(--clr-green); }
.stat-chip.stat-guesses  .stat-val { color: var(--accent); }
```

### Status Banners

Used to communicate conclusive states (success, warning) inside the results panel.

**Warning banner** — accent-tinted, for alerts and soft errors:
```css
.warn-banner {
  padding: 9px 12px; border-radius: 8px;
  background: rgba(201,127,80,0.1);
  border: 1px solid rgba(201,127,80,0.22);
  font-size: 11px; color: var(--accent);
  font-family: var(--font-mono); letter-spacing: 0.02em; line-height: 1.5;
}
```

**Success banner** — green-tinted, for solved/complete state:
```css
.solved-banner { padding: 12px 14px; border-radius: 8px; background: rgba(108,169,101,0.12); border: 1px solid rgba(108,169,101,0.3); text-align: center; }
.solved-word   { font-family: var(--font-mono); font-size: 24px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--clr-green); }
.solved-msg    { font-size: 11px; color: var(--text-sec); margin-top: 4px; letter-spacing: 0.02em; }
```

### Score Bar

A 4px horizontal progress fill — used inside list rows to give a visual weight to a numeric score:

```css
.score-bar  { width: 72px; height: 4px; border-radius: 2px; background: var(--surface); overflow: hidden; }
.score-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #6ca965, #c8b653); transition: width 0.3s; }
```

The green→yellow gradient reinforces the state color system: high scores are green, lower scores fade toward yellow.

### Answer Chip (`.answer-chip`)

Green-tinted word pills used to display possible answer words:

```css
.answer-chip {
  font-family: var(--font-mono); font-size: 12px; font-weight: 700;
  letter-spacing: 0.05em; text-transform: uppercase;
  padding: 5px 9px; border-radius: 6px;
  background: rgba(108,169,101,0.1);
  border: 1px solid rgba(108,169,101,0.22);
  color: var(--clr-green);
  transition: background 0.1s;
}
.answer-chip:hover { background: rgba(108,169,101,0.18); }
```

---

## 7. Reusable UI Components

### Primary CTA Button (`.btn-analyze`)

Full-width, white background, dark text — the highest-priority action on the screen:

```css
.btn-analyze {
  width: 100%; padding: 13px; border-radius: var(--radius-sm);
  background: var(--text-pri); color: #111;
  font-family: var(--font-mono); font-size: 13px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase;
  border: none; cursor: pointer;
  transition: opacity 0.12s, transform 0.08s;
}
.btn-analyze:hover    { opacity: 0.88; transform: translateY(-1px); }
.btn-analyze:active   { opacity: 0.78; transform: translateY(0); }
.btn-analyze:disabled { opacity: 0.22; cursor: not-allowed; transform: none; }
```

### Secondary Ghost Button (`.btn-reset`, `.btn-undo`)

Transparent, bordered, monospace — lower visual priority than the CTA:

```css
.btn-reset {
  flex: 1; padding: 10px; border-radius: var(--radius-sm);
  background: transparent; color: var(--text-sec);
  font-family: var(--font-mono); font-size: 11px; font-weight: 400;
  letter-spacing: 0.06em; text-transform: uppercase;
  border: 1px solid var(--border); cursor: pointer;
  transition: color 0.12s, border-color 0.12s, transform 0.08s;
}
.btn-reset:hover { color: var(--text-pri); border-color: var(--border-md); transform: translateY(-1px); }
```

`.btn-undo` follows the same pattern but dims to `opacity: 0.2` when `:disabled`, and its hover applies a semantic yellow tint:

```css
.btn-undo:hover:not(:disabled) {
  color: var(--clr-yellow);
  border-color: rgba(200,182,83,0.35);
  transform: translateY(-1px);
}
```

### Icon Button (`.icon-btn`)

A 24×24px compact square button for header controls (settings, debug, toggles):

```css
.icon-btn {
  width: 24px; height: 24px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent;
  color: var(--text-dim); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  transition: color 0.12s, border-color 0.12s, background 0.12s;
  user-select: none; padding: 0; line-height: 1;
}
.icon-btn:hover  { color: var(--text-sec); border-color: var(--border-md); background: var(--surface); }
.icon-btn.active { color: var(--text-pri); border-color: rgba(255,255,255,0.18); background: var(--surface-2); }
```

Group multiple icon buttons in `.header-icon-group { display: flex; gap: 6px; margin-left: 10px; }`.

### Setting Tag (`.setting-tag`)

A passive indicator chip in the header that displays the current state of a toggle. Controlled by CSS `:has()` — no JS required (see §10):

```css
.setting-tag {
  font-family: var(--font-mono); font-size: 8px; font-weight: 700;
  letter-spacing: 0.08em; padding: 2px 5px; border-radius: 4px;
  border: 1px solid transparent; color: var(--text-dim);
  background: transparent; cursor: default; user-select: none;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.setting-tag.on {
  color: var(--clr-green);
  background: rgba(108,169,101,0.12);
  border-color: rgba(108,169,101,0.25);
}
```

### Counter Badge (`.guesses-left-badge`)

An accent-colored count badge pushed to the far right of the header:

```css
.guesses-left-badge {
  margin-left: auto;
  font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  color: var(--accent); letter-spacing: 0.04em;
  background: rgba(201,127,80,0.1);
  border: 1px solid rgba(201,127,80,0.2);
  border-radius: 6px; padding: 3px 9px;
}
```

The semi-transparent accent tint matches the chip pattern: state color at ~10% opacity background, ~20% border.

### Inline Tooltip / Hover Indicator (`.hover-indicator`)

Use inline contextual tooltips embedded in the input panel instead of floating browser tooltips for prediction-heavy UIs.

```css
.hover-indicator-body {
  border: 1px solid var(--border-md);
  border-radius: 8px;
  height: 86px;
  padding: 8px 10px;
  background: var(--surface);
  display: grid;
  grid-template-rows: 18px 20px 20px;
  row-gap: 6px;
}
.hover-indicator-body.is-empty { color: var(--text-dim); font-family: var(--font-mono); }
```

Interaction rules:

1. Empty state copy must be visible by default, before any hover.
2. Hover/focus on an input cell swaps body content with contextual prediction data.
3. Tooltip lives in layout flow (no absolute floating popover), so it does not cover actionable controls.
4. Mirror `mouseenter` and keyboard `focus` behavior for accessibility parity.
5. Reset to empty state on `mouseleave` and `blur`.

### Text Input (`.word-input`)

```css
.word-input {
  width: 100%; padding: 12px 14px; border-radius: var(--radius-sm);
  background: var(--surface); border: 1px solid var(--border-md);
  color: var(--text-pri);
  font-family: var(--font-mono); font-size: 18px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  outline: none; text-align: center;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.word-input:focus {
  border-color: rgba(255,255,255,0.2);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.04);
}
.word-input::placeholder { color: var(--text-dim); font-size: 12px; letter-spacing: 0.06em; font-weight: 400; }
```

Large monospace text, centered, uppercase. The 3px transparent focus ring is barely visible but provides focus accessibility without glowing.

### Custom Toggle Switch

A CSS-only toggle — no JS required for visual state:

```html
<label class="toggle-switch">
  <input type="checkbox" id="myOption" />
  <span class="toggle-track"></span>
</label>
```

```css
.toggle-switch { position: relative; width: 30px; height: 17px; flex-shrink: 0; }
.toggle-switch input { display: none; }
.toggle-track {
  position: absolute; inset: 0; border-radius: 9px;
  background: var(--surface); border: 1px solid var(--border-md);
  transition: background 0.15s, border-color 0.15s; cursor: pointer;
}
.toggle-track::after {
  content: ''; position: absolute; left: 2px; top: 2px;
  width: 11px; height: 11px; border-radius: 50%;
  background: var(--text-dim); transition: transform 0.15s, background 0.15s;
}
.toggle-switch input:checked + .toggle-track                { background: rgba(108,169,101,0.22); border-color: rgba(108,169,101,0.42); }
.toggle-switch input:checked + .toggle-track::after         { transform: translateX(13px); background: var(--clr-green); }
```

### Circular Action Buttons

For primary floating actions (submit, next, close):

```css
/* White/high-priority variant */
.submit-btn, .next-btn {
  width: 44px; height: 44px; border-radius: 50%;
  background: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #111; transition: transform 0.12s, opacity 0.12s;
}
.submit-btn:hover, .next-btn:hover { transform: scale(1.06); }
.submit-btn:active, .next-btn:active { transform: scale(0.97); }

/* Ghost/outline variant */
.inspect-btn {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  color: rgba(255,255,255,0.8);
}
.inspect-btn:hover { background: rgba(255,255,255,0.25); transform: scale(1.06); }
```

Hover uses `scale()` not `translateY()` for circular elements. Square/rectangular elements use `translateY(-1px)`.

### Inline SVG Icons

Both icons use `stroke="currentColor"` to inherit button text color.

**Arrow right** — primary action direction cue:
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Eye** — reveal/inspect:
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
</svg>
```

### Guess List Row (`.guess-item`)

Used in ranked recommendation lists:

```css
.guess-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px; margin-bottom: 4px;
  border: 1px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}
.guess-item:hover { background: var(--surface); border-color: var(--border); }
.guess-rank { font-family: var(--font-mono); font-size: 9px; color: var(--text-dim); width: 14px; text-align: right; flex-shrink: 0; }
.guess-word { font-family: var(--font-mono); font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-pri); flex: 1; }
.guess-score { font-family: var(--font-mono); font-size: 11px; color: var(--text-sec); min-width: 50px; text-align: right; }
```

Pair with `.badge-answer` (green chip for valid answers) or `.badge-guess-only` (dim label for guess-only words) to indicate word status without cluttering the main display.

---

## 8. Side Settings Panels (Squeeze Layout)

Settings on active training pages (`index`, `zen`, `pattern-zen`) use an in-layout side panel, not a floating overlay.

### Layout Pattern

```css
.idx-layout,
.zen-layout,
.pz-layout {
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 1500px;
  align-items: center;
}

.idx-layout .idx-panel,
.zen-layout .zen-panel,
.pz-layout .pz-panel {
  flex: 1 1 auto;
  min-width: 0;
  transition: flex-basis 0.2s ease;
}

.idx-settings-side,
.zen-settings-side,
.pz-settings-side {
  flex: 0 0 25%;
  min-width: 300px;
  max-width: 420px;
  max-height: calc(100vh - 112px);
  overflow-y: auto;
  position: sticky;
  top: 86px;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
}

.idx-layout:not(.settings-open) .idx-settings-side,
.zen-layout:not(.settings-open) .zen-settings-side,
.pz-layout:not(.settings-open) .pz-settings-side {
  max-width: 0;
  min-width: 0;
  padding: 0;
  border-color: transparent;
  opacity: 0;
  transform: translateX(10px);
  pointer-events: none;
  overflow: hidden;
}

.idx-layout.settings-open .idx-panel,
.zen-layout.settings-open .zen-panel,
.pz-layout.settings-open .pz-panel {
  flex-basis: 75%;
}

.idx-layout:not(.settings-open) .idx-panel,
.zen-layout:not(.settings-open) .zen-panel,
.pz-layout:not(.settings-open) .pz-panel {
  flex-basis: 100%;
}

/* Scrollable lists inside scrollable settings panel (nested-scroll safe) */
.pz-settings-side .toggle-list {
  min-height: 160px;
  max-height: min(34vh, 320px);
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
```

### Nested Scroll Rules (Required)

When a settings panel is itself scrollable and also contains internal scroll regions (for example Integral Types), enforce nested-scroll containment:

1. The outer panel (`.pz-settings-side`, `.idx-settings-side`, `.zen-settings-side`) uses `overscroll-behavior: contain`.
2. Any inner scroller (for example `.toggle-list`) defines both min/max height and its own `overflow-y: auto`.
3. Inner scrollers must use `overscroll-behavior: contain` and `-webkit-overflow-scrolling: touch`.
4. In JS, stop propagation for `wheel` and `touchmove` on the inner scroller so the parent panel does not steal input.

Reference behavior:

```js
el.pzTypeToggles.addEventListener("wheel", (event) => {
  event.stopPropagation();
}, { passive: true });

el.pzTypeToggles.addEventListener("touchmove", (event) => {
  event.stopPropagation();
}, { passive: true });
```

### Interaction Contract

- `T` toggles settings open/close.
- `Escape` closes settings first; if settings are already closed, `Escape` toggles pause/resume for active rounds.
- Opening settings pauses the active round.
- Closing settings resumes only when settings caused the pause.
- Each side panel includes a dedicated close control (`.pz-close-btn` style).

### Pause Visual Contract

When paused, the equation area should show the same explicit placeholder text on all training pages:

```css
.pz-paused-placeholder {
  font-size: clamp(22px, 3.6vw, 40px);
  letter-spacing: 0.03em;
  color: var(--text-sec);
  font-family: var(--font-mono);
}
```

Render literal text `PAUSED` in the equation region, keep it visible, and hide reveal/judging controls until resumed.

---

## 9. Animations & Transitions

### Micro-interaction Summary

| Element type | Hover | Active |
|---|---|---|
| Rectangular buttons | `translateY(-1px)` | `translateY(0)` |
| Circular buttons | `scale(1.06)` | `scale(0.97)` |
| Icon buttons | background + border color shift | — |
| List rows | background fill | — |
| Tiles | `translateY(-1px)` + shadow | `translateY(0)` |

All transitions: **80–150 ms** for transform/opacity. **120–320 ms** for color/background.

### `fadeUp` — general entrance

Used for result sections and any element that appears dynamically:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fadeUp 0.22s ease-out both; }
```

Apply `.animate-in` to any newly rendered element to give it a soft entrance.

### `tileFlip` — state feedback

Play on a tile when its state changes (e.g. after submission):

```css
@keyframes tileFlip {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(0.1); }
  100% { transform: scaleY(1); }
}
.tile.flip { animation: tileFlip 0.22s ease-in-out; }
```

Add `.flip` immediately after changing the tile's state class. Remove it after the animation completes (use `animationend` event) so it can re-trigger.

### `pulseGreen` — success pulse

For drawing attention to a solved/complete element:

```css
@keyframes pulseGreen {
  0%, 100% { box-shadow: 0 0 0 0 rgba(108,169,101,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(108,169,101,0); }
}
```

### Card Enter / Exit (single-card apps)

For apps built around a single centered card transitioning between screens:

```css
@keyframes cardEnter {
  from { opacity: 0; transform: translateY(14px) scale(0.985); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
@keyframes cardExit {
  from { opacity: 1; transform: translateY(0)     scale(1); }
  to   { opacity: 0; transform: translateY(-10px) scale(0.99); }
}
.card--enter { animation: cardEnter 0.32s cubic-bezier(0.22, 1, 0.36, 1) both; }
.card--exit  { animation: cardExit  0.22s cubic-bezier(0.4, 0, 1, 1)    both; pointer-events: none; }
```

---

## 10. Pure CSS State Management

Use the CSS `:has()` selector to reflect checkbox states into the UI without JavaScript. This approach is appropriate for settings, modes, and toggles that only need to affect visual presentation.

### Pattern

```html
<input type="checkbox" id="optHardMode" hidden />
<span class="setting-tag" id="tagHardMode">HARD</span>
```

```css
/* Controlled via CSS — zero JavaScript */
body:has(#optHardMode:checked) #tagHardMode {
  color: #ff4444;
  background: rgba(255,68,68,0.18);
  border-color: rgba(255,68,68,0.55);
  text-shadow: 0 0 10px rgba(255,68,68,0.7);
  box-shadow: 0 0 8px rgba(255,68,68,0.25);
}
body:has(#optLookahead:checked) #tagLookahead {
  color: var(--clr-green);
  background: rgba(108,169,101,0.12);
  border-color: rgba(108,169,101,0.25);
}
```

When a feature is toggleable in the UI and has a visible indicator, drive that indicator from the checkbox state in CSS. The JS only needs to handle logic/behavior — not appearance.

### When to Use `:has()` vs JS class toggling

| Use `:has()` | Use JS class toggling |
|---|---|
| Passive state indicators (tags, badges) | Animated transitions that need sequencing |
| Visibility toggles driven by form state | States that depend on async operations |
| Styling changes within a single document scope | States that need to be reset programmatically |

---

## 11. Responsive Considerations

The primary layout targets desktop first and supports flexible compression by scaling specific dense regions (not global zooming). The no-scroll contract holds on larger screens. On smaller screens, the layout stacks vertically.

### Flexible Scaling Contract

In suit-row mode, `.suit-row-cards` are measured and scaled with JS (`scaleSuitRows`) so every suit stays in a single non-wrapping row when width is constrained.

- Scale only dense card regions, never the entire page.

---

## 12. Math Notation & KaTeX Compatibility

All rendered equations in this project use KaTeX. Template notation in `common_integrals.md` and runtime render paths must follow KaTeX-safe command usage.

### Required Command Style

Use built-in commands when available (`\sin`, `\cos`, `\tan`, `\sinh`, `\cosh`, `\tanh`, etc.).

For commands not reliably recognized by KaTeX in this project, use operator form:

- `\operatorname{sech}`
- `\operatorname{csch}`
- `\operatorname{coth}`

Examples:

```tex
\int \operatorname{csch}^2(u)\,du
\int \operatorname{sech}(u)\tanh(u)\,du
\int \operatorname{csch}(u)\operatorname{coth}(u)\,du
```

### Runtime Normalization Guard

Pattern Zen keeps a normalization step before calling `katex.render(...)` to rewrite unsupported aliases (for example `\csch`) into `\operatorname{...}`. Keep this guard in place even if templates are already clean, so imported or legacy patterns still render correctly.

### Authoring Rules for `common_integrals.md`

1. Prefer explicit `\operatorname{...}` for non-core function names.
2. Keep spacing explicit with `\,` only where visually necessary.
3. Test newly added formulas in Pattern Zen prompt and reveal states (both integrand and antiderivative).

- Keep text size independent from row scale via the type tokens and readability floors.
- If a region must scale below comfortable reading size, switch layout before shrinking text further.

### Mobile Breakpoint

```css
@media (max-width: 720px) {
  .main {
    height: auto;
    overflow: visible;
    padding: 60px 10px 60px;
  }
  .solver-layout {
    flex-direction: column;
    height: auto;
    align-items: stretch;
  }
  .left-panel { flex: none; width: 100%; max-height: 60vh; }
  .right-panel { overflow-y: visible; }
}
```

On mobile, the no-scroll contract is relaxed: the page scrolls naturally and panel internals simplify. Typography remains fluid, but readable floors still apply (`10px` minimum metadata, `11px+` controls, `12px+` descriptive copy).

---

## 13. How to Reuse in Another Project

### Minimal HTML Shell

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="header">
    <span class="header-title">My App</span>
    <span class="header-dot"></span>
    <span class="header-sub">context label</span>
  </header>

  <main class="main">
    <div class="solver-layout">
      <div class="left-panel panel">
        <!-- Controls go here -->
      </div>
      <div class="right-panel panel">
        <!-- Results go here -->
      </div>
    </div>
  </main>

  <footer class="footer">
    <span class="footer-credit">My App · 2026</span>
  </footer>
</body>
</html>
```

### Stripping Down for a New Project

The CSS is self-contained and requires no external frameworks. To adapt it:

1. **Keep** the Reset, `:root` tokens, `html/body`, `.header`, `.main`, `.footer`, `.panel`, animations.
2. **Keep** component classes you need: buttons, tiles, chips, banners, toggles.
3. **Remove** project-specific classes you don't need (`.tile`, `.known-chip`, `.solver-layout`, etc.).
4. **Change** token values in `:root` to match your design. The system only requires changes in one place.

### Core CSS sections in order

```
1.  Reset     (* + *::before + *::after)
2.  :root     (all tokens)
3.  html, body
4.  .header / header children
5.  .main / layout containers
6.  .footer / .footer-credit
7.  .panel    (base surface)
8.  State indicator components (tiles, chips, banners, bars)
9.  Interactive components     (buttons, inputs, toggles)

---

## 14. Integrated Help Panel, Indicators, Footer, Tooltips

Use this checklist when applying this style guide to a new project.

### A. Default Help Panel Should Blend In

1. Render default instructional content on the existing right/main panel surface.
2. Avoid secondary card backgrounds, heavy shadows, or extra borders around the whole help content.
3. Use section dividers and row-grid alignment for structure instead of container chrome.

### B. Non-Moving Indicators

1. Keep status indicators in the fixed header rail.
2. Treat indicators as passive readouts, not animated widgets.
3. Update text values only; avoid movement, reflow jumps, or order changes while data updates.

### C. Footer Behavior

1. Prefer a docked footer strip in document flow (`margin-top: auto`) over fixed overlay.
2. Keep footer informational and low contrast.
3. Ensure footer does not overlap controls on small screens.

### D. Tooltip Behavior

1. Prefer inline hover-indicator blocks for rich predictive context.
2. Keep tooltip height stable between empty and data states to prevent layout jump.
3. Support hover and keyboard focus equally.
4. Use semantic color only when tied to state meaning.
10. Side settings squeeze layout
11. Animations (@keyframes + utility classes)
12. Responsive (@media)
```

### Implementing the Card Transition Pattern (single-screen apps)

```javascript
function transitionTo(renderNextFn) {
  const card = document.querySelector('#app .card');
  if (!card) { renderNextFn(); return; }

  // 1. Play exit animation
  card.classList.add('card--exit');

  // 2. After animation, render next screen
  setTimeout(() => {
    renderNextFn();
    const newCard = document.querySelector('#app .card');
    if (newCard) newCard.classList.add('card--enter');
  }, 220); // must match cardExit duration
}
```

### Implementing the Overlay Toggle Pattern

```css
.my-overlay { position: absolute; inset: 0; opacity: 0; pointer-events: none; transition: opacity 0.18s ease; }
.my-panel.showing-overlay .my-overlay { opacity: 1; pointer-events: auto; }
```

```javascript
triggerBtn.addEventListener('mouseenter', () => panel.classList.add('showing-overlay'));
triggerBtn.addEventListener('mouseleave', () => panel.classList.remove('showing-overlay'));
overlay.addEventListener('mouseenter',   () => panel.classList.add('showing-overlay'));
overlay.addEventListener('mouseleave',   () => panel.classList.remove('showing-overlay'));
```

---

*This document tracks all CSS classes, token values, layout patterns, component behaviors, and design principles as they exist in the codebase. Update it when new patterns are introduced.*
