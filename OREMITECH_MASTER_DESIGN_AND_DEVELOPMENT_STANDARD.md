# OREMITECH — Master Design & Development Standard

> **Permanent reference.** Read this before making any design or architectural change.
> The logo is the authority for brand colour. Do not change the theme without explicit owner approval.
> Update this file whenever an approved permanent decision changes.

Version 1.0 · Last updated 2026-11-27

---

## 1. Business Identity

- **Business:** OREMITECH SOLUTIONS
- **Website:** https://oremitech.co.ke
- **Market:** Kenya (KES only)
- **Category:** Technology retail & electronics
- **Slogan:** TECHNOLOGY. QUALITY. SMART CHOICES.
- **Catalogue:** Laptops, desktops/workstations, monitors, storage & SSDs, accessories, keyboards & mice, other electronics.
- **Customers:** students, ICT/CS learners, freelancers, professionals, business owners, remote workers, enthusiasts.
- **Positioning:** premium, reliable, simple, trustworthy technology retail.

---

## 2. Logo & Brand Identity Rules

The official mark is `public/logo.svg` and `src/components/Logo.tsx`:

| Element | HEX | Role |
|---------|-----|------|
| Rounded square background | `#0a1f1c` | Deep navy/charcoal mark background |
| Vertical bar | `#f5a31a` | Amber accent |
| Wedge | `#0b7a63` | Teal accent (sparingly) |

Rules:
- The logo is the single source of truth for brand colour.
- Amber + teal are **small controlled accents only**. The dominant UI colour is electric blue.
- Never redraw, recolour, or substitute the logo.
- Use the `Logo` component (`light` on dark backgrounds).

---

## 3. Permanent Colour Palette

Defined once in `src/index.css` under `@theme`. Consume via CSS variables / Tailwind utilities only — no ad-hoc hex.

### Structure & surfaces
| Token | HEX | Use |
|-------|-----|-----|
| `--color-ink` / `--color-dark-bg` | `#101820` | Text, header, footer |
| `--color-surface` / `--color-card` | `#FFFFFF` | Cards, containers |
| `--color-page` / `--color-mist` | `#F4F6F8` | Page background |

### Primary interactive
| Token | HEX | Use |
|-------|-----|-----|
| `--color-primary` | `#087BFF` | Electric blue — CTAs, links, active |
| `--color-primary-hover` | `#0062CC` | Hover |
| `--color-cyan` / `--color-accent` | `#00C8E8` | Cyan accent |

### Neutrals
| Token | HEX | Use |
|-------|-----|-----|
| `--color-line` | `#E2E8F0` | Borders |
| `--color-border-subtle` | `#EDF2F7` | Subtle borders |
| `--color-muted` | `#64748B` | Secondary text |
| `--color-text-secondary` | `#475569` | Secondary text |

### Functional / status (green here only)
| Token | HEX | Use |
|-------|-----|-----|
| `--color-success` / `--color-emerald` | `#16A34A` | In-stock, success, paid |
| `--color-warning` | `#F59E0B` | Low stock, warnings |
| `--color-amber` | `#F5A31A` | Ratings, special badges |
| `--color-error` | `#DC2626` | Discounts, errors, out-of-stock |

### Back-compat aliases (do not remove)
`--color-tealdeep` → `#0062CC`, `--color-mint` → `#EAF3FF`, `--color-emeralddeep` → `#15803D`.
These keep legacy references across admin/employee/blog styled correctly.

**Rules:** Green is functional-only. Do not make every section blue or black — balance white cards on the light-grey page with navy header/footer.

---

## 4. Design Tokens

- **Spacing:** 4px base unit; section rhythm `mt-8` → `mt-14`.
- **Radius:** buttons/inputs `0.5rem`, cards `0.625rem`, hero/panels `0.75rem` (`rounded-xl`), pills `999px`.
- **Shadows:** soft, low contrast (`shadow-xs` → `shadow-lg`); primary button may carry a subtle blue glow.
- **Container:** `.wrap` — max 1280px (1440px ≥1440px viewport), responsive inline padding 16→40px.
- **Grid:** product grid 2→3→4→6 cols (mobile→2XL).

---

## 5. Typography

`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial`.
Headings use `font-display`, weights 800–900; card titles 600–700; body 500.
Enable `font-feature-settings: "rlig" 1, "calt" 1` and antialiased smoothing (already global).

---

## 6. Component Standards

- **Buttons:** `.btn` + `.btn-primary` (primary), `.btn-dark`, `.btn-outline`, `.btn-light`, `.btn-emerald` (order/confirmation only). Sizes `.btn` 42px, `.btn-sm` 34px, `.btn-lg` 48px; 44px min touch target on mobile.
- **Inputs:** `.input` — white, `--color-line`, blue focus ring.
- **Cards:** `.card`, `.market-card` (product), `.market-card-image` 1:1 `object-contain`.
- **Chips:** `.chip` / `.chip-on` (blue fill).
- **Badges:** discount = error red, new = primary blue, hot = amber.
- Reuse these classes; do not restyle per-page.

---

## 7. Header & Navigation Standards

Three tiers (see `src/components/Header.tsx`):
1. Slim dark announcement/trust bar (`#0b1117`).
2. Main navy bar (`--color-ink`): logo, delivery location, prominent `SearchBox`, account, wishlist, cart with live count + value.
3. Slate sub-nav (`#1e293b`): "All Categories" mega-menu + quick category links + deals.

Mobile: `CategoryDrawer` + `MobileBottomNav`; search moves under the bar. Header is sticky and present on all storefront pages via `Layout`.

---

## 8. Homepage Structure

Order (see `src/pages/Home.tsx`):
1. **Full-width centred hero** (single column, no right-side panel) with carousel; CTAs: slide CTA + All Products + View Tech Deals.
2. Slim full-width assurance strip (Verified Specs · Delivery at Checkout · Support).
3. **Popular Categories** — image-based cards (real representative image pulled from live catalogue per `category_slug`), 6-up on desktop.
4. **Category collections** (Featured Laptops, Desktops, Monitors, Storage, Accessories) — each rendered only when it has published products.
5. Today's deals (only if genuine `comparison_price > selling_price`).
6. New arrivals. 7. Featured brands (real catalogue brands). 8. Recently viewed. 9. Why buy (honest copy).

**Product grid:** `grid-cols-2 → sm:3 → lg:4 → xl:5 → ≥1400px:6` (`PRODUCT_GRID`). Cards use `rounded-xl` (12px), 1px border, `object-contain` images, fixed title clamp for equal heights. No empty filler sections; no excessive duplication.

---

## 9. Product Page Standards

Gallery, title, brand/condition, price (genuine compare-at only), availability, quantity, Add to Cart + Buy Now, wishlist, WhatsApp/enquiry, specs table, description/reviews tabs, related, recently viewed. Warranty/delivery shown only when provided. Reviews require verified purchase (see §19).

---

## 10. Search Standards

`SearchBox` suggestions (name/brand/model/processor/RAM/storage) on real catalogue data; `Shop` filters (category, brand, price, processor, RAM, storage, condition, availability), sorting (featured/price/newest), result counts, active-filter chips, helpful empty state.

---

## 11. Cart Standards

Persistent (Zustand + localStorage), slide-out `CartDrawer` on add, quantity controls, removal, live totals, empty state, server-validated at order time. Works desktop + mobile.

---

## 12. Checkout Standards

Guest checkout supported. Collect name, phone, email, county, town, address. Delivery options/charges only from configured zones. Order summary with subtotal, delivery, discounts, total. Payment methods only those genuinely configured; **never mark paid without verified confirmation**. Duplicate-submit guarded; prices/availability re-validated server-side via `place_order` RPC.

---

## 13. Customer Account Standards

Register/login (Supabase Auth), profile edit, order history with details, order tracking (prefilled from account), wishlist. Preserve existing auth/RLS — no parallel auth.

---

## 14. Admin Design Standards

Same tokens as storefront. Preserve product CRUD, imports, images, inventory (owned vs supplier), suppliers, publishing workflow (draft→approved→published), orders, customers, reviews moderation, pricing, settings. Supplier stock never shown as owned. Imports stay draft until approved. Staff-only via RLS.

---

## 15. Responsive Standards

Mobile-first. Test 360/390/768/1280/1440. No horizontal overflow. ≥44px tap targets. Mega-menu desktop-only; drawers on mobile.

---

## 16. Accessibility Standards

Visible focus ring (blue), AA contrast, labelled controls, keyboard operable, respect `prefers-reduced-motion`.

---

## 17. Technical Architecture

React 18 + TS + Vite + Tailwind v4 + Zustand + React Router; Supabase (Postgres/Auth/Storage/RLS/RPC); Cloudflare/Wrangler deploy. Do not replace without approval. State stores in `src/store`, domain types in `src/lib/domain`, commerce helpers in `src/lib/commerce`.

---

## 18. Database Protection Rules

Never delete records, reset the DB, disable RLS/constraints, or expose the service-role key. Migrations are additive and reviewed on staging first. Soft deletes only. All sensitive writes validated server-side.

---

## 19. Business Honesty Requirements (non-negotiable)

Never invent: testimonials, reviews, stock, specs, discounts, warranty, delivery times/areas, payment methods, return policies, certifications, partnerships. When unknown, show neutral wording or leave unpublished. Reviews are limited to verified purchasers (`has_purchased_product` + moderation). No fake urgency/scarcity.

---

## 20. Testing Standards

Per task: `tsc --noEmit` then `npm run build` must pass; verify the actual interaction/data flow, not just that a component exists; check desktop + mobile. Live DB/payment flows require staging credentials.

---

## 21. Deployment Procedures

`npm run build` → static `dist/` via Wrangler/Cloudflare. Staging before production. Maintenance mode via `VITE_MAINTENANCE_MODE`. Never deploy destructive DB changes without review.

---

## 22. Change Management Rules

1. Inspect implementation. 2. Read this standard. 3. Identify what works. 4. Identify the real problem. 5. Smallest safe change. 6. Implement. 7. Test. 8. Desktop+mobile. 9. tsc. 10. build. 11. Update this doc. 12. Report. Never silently change the theme.

---

## Prioritised Transformation Roadmap

| # | Priority | Item | Status |
|---|----------|------|--------|
| 1 | P0 | Homepage hero full-width + remove side panel + categories below | ✅ Done |
| 2 | P0 | Remove unverified claims (40%, warranty, delivery, M-PESA/COD) | ✅ Done |
| 3 | P0 | Fix dead design tokens (tealdeep/mint/emeralddeep) | ✅ Done |
| 4 | P0 | Reviews: verified-purchase gating (migration + UI) | ✅ Done (apply migration) |
| 5 | P1 | Product reviews moderation workflow in admin | Verify |
| 6 | P1 | M-Pesa Daraja STK Push (needs credentials) | Blocked |
| 7 | P1 | Email/SMS order notifications (needs SMTP/AT) | Blocked |
| 8 | P1 | Full-text / trigram search + recent searches | Planned |
| 9 | P2 | Admin analytics dashboard | Planned |
| 10 | P2 | Code-split admin routes (reduce bundle) | Planned |
| 11 | P2 | PWA / offline cart | Planned |
| 12 | P3 | Loyalty/referral, B2B pricing | Backlog |

**Open business inputs needed:** confirmed delivery areas/times, warranty & return terms, approved payment methods, M-Pesa/SMTP/Africa's Talking credentials.