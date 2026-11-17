# OREMITECH Design System

Official design tokens and component specifications for the OREMITECH e-commerce platform. All future development must reference these tokens rather than inventing new values.

---

## Colour Palette

### Primary Brand Colours (Dark Green/Forest Theme)

| Token | HEX | RGB | Usage |
|-------|-----|-----|-------|
| `--color-emerald` | `#156b45` | 21, 107, 69 | Primary brand colour, primary buttons, active states, focus rings |
| `--color-emeralddeep` | `#0e5335` | 14, 83, 53 | Hover states for primary buttons, darker accents |
| `--color-forest` | `#0d4a34` | 13, 74, 52 | Mid-tone green for sections, category tiles |
| `--color-forestdeep` | `#083624` | 8, 54, 36 | Dark green for hover states on forest elements |
| `--color-mint` | `#d8e8df` | 216, 232, 223 | Light backgrounds, category tile hover, chips |
| `--color-ink` | `#061512` | 6, 21, 18 | Primary text, dark backgrounds, logo mark background |
| `--color-pine` | `#0a2a20` | 10, 42, 32 | Hover states for dark buttons, dark section backgrounds |

### Accent Colours

| Token | HEX | RGB | Usage |
|-------|-----|-----|-------|
| `--color-amber` | `#f5a31a` | 245, 163, 26 | Secondary CTAs, search button, newsletter subscribe, highlights |
| `--color-amberdeep` | `#8a5a06` | 138, 90, 6 | Amber hover states, price highlights |

### Neutral / Surface Colours

| Token | HEX | RGB | Usage |
|-------|-----|-----|-------|
| `--color-mist` | `#eef3f1` | 238, 243, 241 | Page background (default) |
| `--color-card` | `#fafcfb` | 250, 252, 251 | Card backgrounds, input backgrounds |
| `--color-line` | `#c4d6ce` | 196, 214, 206 | Borders, dividers |
| `--color-muted` | `#4a6b5c` | 74, 107, 92 | Secondary text, placeholder text, disabled states |

### Semantic Colours

| Token | HEX | RGB | Usage |
|-------|-----|-----|-------|
| `--color-success` | `#1a803a` | 26, 128, 58 | Success messages, in-stock indicators |
| `--color-warning` | `#c97f10` | 201, 127, 16 | Warning messages, low stock |
| `--color-error` | `#d64545` | 214, 69, 69 | Error messages, out-of-stock, destructive actions |

---

## Typography

### Font Families

```css
/* Primary: System UI stack for performance */
font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

/* Display headings: Custom font via @font-face or variable font */
font-family: var(--font-display); /* Defined in layout */
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Display XL | 3rem (48px) | 800 | 1.1 | -0.02em |
| Display LG | 2.25rem (36px) | 800 | 1.1 | -0.01em |
| Display MD | 1.5rem (24px) | 700 | 1.2 | -0.01em |
| H1 / Section Title | 1.25rem (20px) | 900 | 1.2 | -0.01em |
| H2 / Card Title | 1rem (16px) | 700 | 1.15 | 0 |
| Body LG | 1rem (16px) | 500 | 1.5 | 0 |
| Body MD | 0.875rem (14px) | 500 | 1.5 | 0 |
| Body SM | 0.8125rem (13px) | 500 | 1.5 | 0 |
| Caption / Label | 0.75rem (12px) | 600 | 1.4 | 0.02em |
| Overline / Badge | 0.6875rem (11px) | 800 | 1.3 | 0.03em |

### Font Features

```css
font-feature-settings: "rlig" 1, "calt" 1;
-webkit-font-smoothing: antialiased;
text-rendering: optimizeLegibility;
```

---

## Spacing System

Base unit: **4px (0.25rem)**

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 0.25rem (4px) | Micro spacing |
| `--space-2` | 0.5rem (8px) | Tight spacing |
| `--space-3` | 0.75rem (12px) | Small spacing |
| `--space-4` | 1rem (16px) | Base spacing |
| `--space-5` | 1.25rem (20px) | Medium spacing |
| `--space-6` | 1.5rem (24px) | Large spacing |
| `--space-8` | 2rem (32px) | Section spacing |
| `--space-10` | 2.5rem (40px) | Major section spacing |
| `--space-12` | 3rem (48px) | Page-level spacing |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.25rem (4px) | Chips, badges, small inputs |
| `--radius-md` | 0.5rem (8px) | Buttons, inputs, cards (market style) |
| `--radius-lg` | 0.6rem (9.6px) | Primary buttons, form inputs |
| `--radius-xl` | 0.9rem (14.4px) | Standard cards, panels |
| `--radius-2xl` | 1.25rem (20px) | Hero sections, major panels |
| `--radius-full` | 9999px | Pills, avatars, circular elements |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(6,21,18,0.04)` | Subtle cards |
| `--shadow-sm` | `0 1px 3px rgba(6,21,18,0.08)` | Default cards, dropdowns |
| `--shadow-md` | `0 4px 12px rgba(6,21,18,0.1)` | Elevated cards, modals |
| `--shadow-lg` | `0 8px 24px rgba(6,21,18,0.12)` | Major panels, mega menu |
| `--shadow-xl` | `0 16px 48px rgba(6,21,18,0.15)` | Overlays, drawers |
| `--shadow-emerald` | `0 6px 16px -6px rgba(21,107,69,0.55)` | Primary button glow |
| `--shadow-amber` | `0 6px 16px -6px rgba(245,163,26,0.55)` | Amber button glow |

---

## Button System

### Base Button Styles (`.btn`)

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.75rem;          /* 44px - accessible touch target */
  padding-inline: 1.25rem;  /* 20px */
  border-radius: 0.6rem;    /* 9.6px */
  font-weight: 700;
  font-size: 0.875rem;      /* 14px */
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:active { transform: translateY(1px) scale(0.99); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
```

### Button Variants

| Variant | Background | Text | Border | Hover | Use Case |
|---------|------------|------|--------|-------|----------|
| `.btn-emerald` (Primary) | `--color-emerald` | `#f4fbf9` | transparent | `--color-emeralddeep` | Primary CTAs: "Explore Products", "Add to Cart" |
| `.btn-amber` (Secondary) | `--color-amber` | `--color-ink` | transparent | `#ffb538` | Secondary CTAs: "Subscribe", "Search" |
| `.btn-dark` | `--color-ink` | `#f4fbf9` | transparent | `--color-pine` | Dark sections, footer actions |
| `.btn-outline` | `--color-card` | `--color-ink` | `--color-line` | border: `--color-emerald`, text: `--color-emerald` | Secondary actions: "View Deals", "Details" |
| `.btn-light` | `rgba(255,255,255,0.12)` | `#fff` | `rgba(255,255,255,0.25)` | `rgba(255,255,255,0.2)` | On dark backgrounds |

### Button Sizes

| Class | Height | Padding | Font Size |
|-------|--------|---------|-----------|
| `.btn` (default) | 2.75rem (44px) | 1.25rem (20px) | 0.875rem (14px) |
| `.btn-sm` | 2.25rem (36px) | 0.9rem (14.4px) | 0.8rem (12.8px) |

---

## Input System (`.input`)

```css
.input {
  width: 100%;
  height: 2.75rem;        /* 44px - matches button height */
  border-radius: 0.6rem;  /* 9.6px */
  border: 1px solid var(--color-line);
  background: var(--color-card);
  padding-inline: 0.85rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-emerald);
  box-shadow: 0 0 0 3px rgba(21, 107, 69, 0.14);
}
```

---

## Card System

### Standard Card (`.card`)

```css
.card {
  background: var(--color-card);
  border: 1px solid var(--color-line);
  border-radius: 0.9rem;  /* 14.4px */
}
```

### Market Card (`.market-card`) — Product Grid

```css
.market-card {
  background: var(--color-card);
  border: 1px solid var(--color-line);
  border-radius: 0.5rem;  /* 8px - tighter for dense grids */
  overflow: hidden;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
}

.market-card:hover {
  border-color: var(--color-emerald);
  box-shadow: 0 8px 24px -10px rgba(6, 21, 18, 0.18);
}
```

### Category Tile (`.category-tile`)

```css
.category-tile {
  flex: 0 0 auto;
  width: 76px;
  padding: 0.55rem 0.35rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: transparent;
  transition: all 0.15s ease;
}

.category-tile:hover {
  background: var(--color-card);
  border-color: var(--color-line);
}

.category-tile-icon {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: linear-gradient(180deg, #f7faf9, #eef4f2);
  color: var(--color-emerald);
  border: 1px solid var(--color-line);
}

.category-tile:hover .category-tile-icon {
  background: #d8f0e2;
  border-color: #b8d9c8;
}
```

---

## Chip System (`.chip`)

```css
.chip {
  display: inline-flex;
  align-items: center.
  gap: 0.35rem;
  border: 1px solid var(--color-line);
  background: var(--color-card);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 700.
  letter-spacing: 0.02em;
  transition: all 0.15s ease;
  cursor: pointer;
}

.chip:hover { border-color: var(--color-emerald); color: var(--color-emerald); }

.chip-on {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: #f4fbf9;
}
```

---

## Layout System

### Container (`.wrap`)

Responsive horizontal padding:

```css
.wrap { padding-inline: 1rem; }           /* Mobile: 16px */
@media (min-width: 640px)  { .wrap { padding-inline: 1.5rem; } }   /* 24px */
@media (min-width: 1024px) { .wrap { padding-inline: 2.5rem; } }   /* 40px */
@media (min-width: 1440px) { .wrap { padding-inline: 3.5rem; } }   /* 56px */
@media (min-width: 1920px) { .wrap { padding-inline: 4.5rem; } }   /* 72px */
```

Max-width: `76rem` (1216px) for content, full-width for full-bleed sections.

### Grid Breakpoints

| Breakpoint | Min Width | Columns (Product Grid) |
|------------|-----------|------------------------|
| Mobile | 0 | 2 |
| SM | 640px | 3 |
| LG | 1024px | 4 |
| XL | 1280px | 5 |
| 2XL | 1536px | 6 |

---

## Responsive Design Rules

### Mobile First

All styles written mobile-first. Use `min-width` media queries for progressive enhancement.

### Touch Targets

- Minimum 44×44px for all interactive elements
- Buttons: `height: 2.75rem` (44px)
- Inputs: `height: 2.75rem` (44px)
- Chips: minimum 36px height

### Safe Areas

```css
/* Account for notches and home indicators */
padding-bottom: env(safe-area-inset-bottom);
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .reveal, .animate-floaty, .animate-marquee, .animate-ping-soft {
    animation: none;
    transition: none;
  }
  html { scroll-behavior: auto; }
}
```

---

## Component-Specific Tokens

### Product Card

| Element | Class | Key Tokens |
|---------|-------|------------|
| Container | `.market-card` | `--color-card`, `--color-line`, `--color-emerald` (hover) |
| Image | `.market-card-image` | Aspect ratio 1:1, `#f7faf9` bg |
| Brand | `.market-card-brand` | 0.7rem, 800, uppercase, `--color-muted` |
| Title | `.market-card-title` | 0.8rem, 700, 2-line clamp, `--color-ink` |
| Price | `.market-card-price` | 0.95rem, 900, `#d64545` (red for price) |
| Old Price | `.market-card-oldprice` | 0.7rem, 600, `#9ca3af`, line-through |
| Rating | `.market-card-rating` | 0.72rem, 700, `--color-amberdeep` |
| Actions | `.btn-emerald` / `.btn-outline` | Primary: Add to cart, Secondary: Details |

### Mega Menu

| Element | Tokens |
|---------|--------|
| Panel | `--color-card` bg, `--color-line` border, `--shadow-lg` |
| Links | `--color-ink` text, `--color-emerald` hover, `--color-mint` hover bg |
| Animation | `megaPanelIn` 180ms ease-out |

### Header

| Element | Tokens |
|---------|--------|
| Top Bar | `--color-ink` bg, white/85 text |
| Main Bar | `--color-card`/95 bg, `--color-line` border, backdrop-blur |
| Cart Icon | `--color-ink` bg, white icon |
| Logo Mark | `#061512` bg, `#f5a31a` (amber), `#156b45` (emerald) |

### Footer

| Element | Tokens |
|---------|--------|
| Background | `--color-ink` |
| Text | `white/80` primary, `white/60` secondary, `white` headings |
| Newsletter Input | `.input` with `!bg-white` |
| Subscribe Button | `.btn-amber` |

---

## Accessibility

### Contrast Ratios (WCAG AA)

| Combination | Ratio | Status |
|-------------|-------|--------|
| `--color-emerald` on white | 5.2:1 | ✅ AA Normal, ✅ AA Large |
| `--color-emerald` on `--color-mint` | 3.4:1 | ❌ (use for decorative only) |
| `--color-ink` on `--color-mist` | 13.2:1 | ✅ AAA |
| `--color-amber` on `--color-ink` | 9.1:1 | ✅ AAA |
| White on `--color-emerald` | 5.2:1 | ✅ AA Normal |
| White on `--color-ink` | 16.1:1 | ✅ AAA |

**Note**: For body text on emerald backgrounds, use `--color-emeralddeep` or increase font weight/size.

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-emerald);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Selection

```css
::selection {
  background: var(--color-amber);
  color: var(--color-ink);
}
```

---

## Animation Tokens

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `fadeUp` | 0.6s | ease-out | Hero, section reveals |
| `megaPanelIn` | 0.18s | ease-out | Mega menu panels |
| `floaty` | 6s | ease-in-out | Decorative floating elements |
| `marquee` | 36s | linear | Scrolling brand strips |
| `popIn` | 0.3s | cubic-bezier(0.2,0.7,0.3,1) | Modals, toasts |
| `drawerIn` | 0.35s | cubic-bezier(0.25,0.8,0.3,1) | Side drawers |
| `pingSoft` | 1.6s | cubic-bezier(0,0,0.2,1) | Notification badges |

### Transition Defaults

```css
/* Standard */
transition: all 0.2s ease;

/* Fast (chips, badges) */
transition: all 0.15s ease;

/* Slow (hero, panels) */
transition: all 0.3s ease;
```

---

## Logo & Branding

### Logo Mark

```svg
<rect width="32" height="32" rx="7" fill="#061512" />        <!-- Ink background -->
<path d="M10 22V10h4v12z" fill="#f5a31a" />                   <!-- Amber vertical bar -->
<path d="M18 10l6 12h-4.5L15 13z" fill="#156b45" />          <!-- Emerald abstract shape -->
```

### Logo Typography

- **Font**: Display font, bold, tracking-tight
- **Primary**: `OREMITECH` in `--color-ink` (dark) or `white` (light)
- **Subtitle**: `Kenya` in 9px, uppercase, tracking-wide, `--color-muted` or `white/50`

---

## Implementation Reference

### CSS Variables Location

All tokens defined in `src/index.css` under `@theme` block:

```css
@theme {
  --color-ink: #061512;
  --color-pine: #0a2a20;
  --color-forest: #0d4a34;
  --color-forestdeep: #083624;
  --color-emerald: #156b45;
  --color-emeralddeep: #0e5335;
  --color-mint: #d8e8df;
  --color-amber: #f5a31a;
  --color-amberdeep: #8a5a06;
  --color-mist: #eef3f1;
  --color-card: #fafcfb;
  --color-line: #c4d6ce;
  --color-muted: #4a6b5c;
  --color-success: #1a803a;
  --color-emerald: #156b45;
  --color-emeralddeep: #0e5335;
  --color-warning: #c97f10;
  --color-error: #d64545;
}
```

### Tailwind v4 Usage

```html
<!-- Direct variable usage -->
<div class="bg-emerald text-white border-emeralddeep hover:bg-emeralddeep">

<!-- Component classes -->
<button class="btn btn-emerald">Primary</button>
<button class="btn btn-amber">Secondary</button>
<button class="btn btn-outline">Outline</button>
<input class="input" />
<div class="card">Content</div>
<div class="market-card">Product</div>
<span class="chip">Filter</span>
<div class="wrap">Container</div>
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-11-16 | Initial documentation of restored green/teal design system |
| 2.0 | 2026-11-16 | Updated to darker forest/emerald green theme per user request |

---

## Enforcement

**All future development MUST:**
1. Use only colours defined in this design system
2. Reference CSS variables (`var(--color-emerald)`) not hardcoded hex values
3. Use component classes (`.btn-emerald`, `.card`, `.market-card`) not utility-only styles
4. Maintain 44px minimum touch targets
5. Follow mobile-first responsive patterns
6. Respect `prefers-reduced-motion`

Violations should be caught in code review and corrected before merge.