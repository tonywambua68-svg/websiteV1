# OREMITECH Design System

Official design tokens and component specifications for the OREMITECH e-commerce platform. All development must reference these tokens rather than inventing new values.

The system is a **premium technology-retail** identity: deep navy and charcoal structure, crisp white surfaces, light-grey page background, and electric blue as the primary interactive colour with cyan accents. Green is reserved strictly for functional status (in-stock, success, payment confirmed).

---

## Brand Mark

The official logo (`public/logo.svg`, `src/components/Logo.tsx`) is a rounded square with:

| Element | HEX | Meaning |
|---------|-----|---------|
| Background square | `#0a1f1c` | Deep navy/charcoal mark background |
| Vertical bar | `#f5a31a` | Amber accent |
| Wedge | `#0b7a63` | Teal accent (used sparingly) |

The interface must stay visually consistent with this mark. The amber and teal are **small controlled accents only** — the dominant UI colour is electric blue.

---

## Colour Palette

### Structure & Surfaces

| Token | HEX | Usage |
|-------|-----|-------|
| `--color-ink` | `#101820` | Primary text, dark header/footer, near-black |
| `--color-dark-bg` | `#101820` | Header / footer background |
| `--color-surface` | `#FFFFFF` | Crisp white container |
| `--color-card` | `#FFFFFF` | Product card background |
| `--color-page` | `#F4F6F8` | Light-grey marketplace page background |
| `--color-mist` | `#F4F6F8` | Alias for page background |

### Primary Interactive

| Token | HEX | Usage |
|-------|-----|-------|
| `--color-primary` | `#087BFF` | Electric blue — primary CTAs, links, active states |
| `--color-primary-hover` | `#0062CC` | Hover for primary |
| `--color-cyan` | `#00C8E8` | Cyan accent (icons, highlights) |
| `--color-accent` | `#00C8E8` | Alias for cyan |

### Neutrals

| Token | HEX | Usage |
|-------|-----|-------|
| `--color-line` | `#E2E8F0` | Borders, dividers |
| `--color-border-subtle` | `#EDF2F7` | Extra-subtle borders |
| `--color-muted` | `#64748B` | Secondary / placeholder text |
| `--color-text-secondary` | `#475569` | Secondary text |

### Functional / Status (green used here only)

| Token | HEX | Usage |
|-------|-----|-------|
| `--color-success` / `--color-emerald` | `#16A34A` | In-stock, success, payment confirmed |
| `--color-warning` | `#F59E0B` | Low stock, warnings |
| `--color-amber` | `#F5A31A` | Ratings, special badges, logo accent |
| `--color-error` | `#DC2626` | Discounts, errors, destructive, out-of-stock |

**Rule:** do not use green as a brand/section colour. Do not make every section blue or black — balance white cards on the light-grey page with navy header/footer.

---

## Typography

```css
font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
font-feature-settings: "rlig" 1, "calt" 1;
-webkit-font-smoothing: antialiased;
text-rendering: optimizeLegibility;
```

Display headings use the `font-display` utility. Weights: 800–900 for headings, 600–700 for card titles, 500 for body.

---

## Spacing, Radius, Shadow

- Base spacing unit: **4px**. Section spacing: `mt-8` → `mt-14`.
- Radius: buttons/inputs `0.5rem`, cards `0.625rem`, hero/major panels `0.75rem` (`rounded-xl`).
- Shadows are soft and low-contrast (`shadow-sm` → `shadow-lg`). Avoid heavy glows except the primary button.

---

## Components

### Buttons (`.btn`)

| Class | Background | Text | Use |
|-------|-----------|------|-----|
| `.btn-primary` / `.btn-amber` | `--color-primary` | white | Primary CTAs (Add to cart, Checkout, Search) |
| `.btn-dark` | `--color-ink` | white | Dark sections |
| `.btn-emerald` / `.btn-success` | `--color-success` | white | Order / confirmation actions only |
| `.btn-outline` | white | ink | Secondary actions |
| `.btn-light` | translucent white | white | On dark backgrounds |

Sizes: `.btn` (42px), `.btn-sm` (34px), `.btn-lg` (48px). Minimum touch target 44px on mobile.

### Inputs (`.input`)

White background, `--color-line` border, `--color-primary` focus ring (`0 0 0 3px rgba(8,123,255,.15)`), height 42px.

### Cards

- `.card` — white, `--color-line` border, `0.625rem` radius, subtle shadow.
- `.market-card` — product grid card; white, hover lifts (`translateY(-2px)`) with slate border + soft shadow.
- `.market-card-image` — 1:1, white, `object-contain`, padded.
- `.market-badge-discount` red, `.market-badge-new` blue, `.market-badge-hot` amber.

### Chips (`.chip` / `.chip-on`)

Pill filters; `.chip-on` fills with `--color-primary`.

### Header

Three tiers: (1) slim dark announcement/trust bar (`#0b1117`), (2) main navy bar (`--color-ink`) with logo, location, prominent search, account/wishlist/cart with live count, (3) slate sub-nav (`#1e293b`) with category links + deals. Cart badge uses amber; wishlist badge uses error red.

### Footer

`--color-ink` background, white text, newsletter input + subscribe button.

---

## Layout

- `.wrap` container: max `1280px` (→ `1440px` at ≥1440px), responsive inline padding 16→40px.
- Product grid: 2 col (mobile) → 3 (sm) → 4 (lg) → 6 (xl/2xl).
- Mobile-first. Mega menu desktop-only; `CategoryDrawer` + `MobileBottomNav` on mobile.

---

## Accessibility

- Focus ring: `2px solid var(--color-primary)` with 2px offset.
- Selection: primary blue background, white text.
- Respect `prefers-reduced-motion` (disable transforms/animations).
- Maintain WCAG AA contrast; green text only on light backgrounds for status.

---

## Enforcement

1. Use only the tokens above; reference CSS variables, not hardcoded hex.
2. Use component classes (`.btn-primary`, `.card`, `.market-card`, `.chip`).
3. Green is functional-only. Dominant brand colour is electric blue.
4. Maintain 44px touch targets and mobile-first layouts.
5. Do not publish unverified claims (warranty, delivery times, discounts) in UI copy.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-11-16 | Initial green/teal system |
| 2.0 | 2026-11-16 | Darker forest/emerald theme |
| 3.0 | 2026-11-27 | Premium navy/charcoal + electric-blue system; green reduced to functional status; aligned with live `src/index.css` and logo |