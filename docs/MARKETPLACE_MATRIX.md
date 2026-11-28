# OREMITECH Marketplace — Competitive Matrix & Research Record

Status legend: NOT STARTED · RESEARCHED · PLANNED · IMPLEMENTING · IMPLEMENTED · TESTED · VERIFIED · BLOCKED

Research method: REA (`rea.tools`, `morluto/rea`) is a local MCP/native reverse-engineering tool installed via `npx rea-agents setup` (requires user approval + agent restart). It is NOT installed in this environment, so it was not used. Public pages were inspected with the available web fetch tool. Amazon returned an empty body (bot-blocked) — recorded as a limitation, not fabricated. Jumia Kenya returned full public markup (evidence below).

## Evidence — Jumia Kenya (https://www.jumia.co.ke/)
Observed in public HTML: header with Search + Account + Wishlist + Cart; Help Center + Live Chat + WhatsApp (`wa.me/254711011011`); top category nav + "Official Stores"; "Your Recent Finds" / "Pick Up From Where You Left Off"; deal carousels (Black Friday, Flash Sales, Banger Deals, Clearance); product cards with rating (e.g. `3.9 (2344)`), `KSh` price, struck-through previous price and `-18%`; Flash Sales with countdown `01d : 22h : 23m` and `N items in stock`; coupon codes (`Use Code TBFH100 | Orders Above 2k`); brand storefronts (mlp-*-store); footer policy links (Returns, Warranty, Privacy).

## Evidence — Amazon (https://www.amazon.com/)
BLOCKED: empty response (anti-bot). Not used as a source of specific claims.

## Matrix (scope A–L)
| Area | Key competitor features | OREMITECH status | Notes / next |
|---|---|---|---|
| A Homepage | Hero, search, category tiles, carousels, recently viewed, campaigns | IMPLEMENTED/TESTED | Homepage Section Manager (DB) added; verify on staging |
| B Category | Grid, filters, sort, breadcrumbs, empty states | IMPLEMENTED | Verify filter/sort parity |
| C Product cards | Image, title, price, prev price, discount %, rating/count, badges, wishlist/compare/cart | IMPLEMENTED | ProductCard Step 1 done |
| D Product detail | Gallery, specs, reviews, related, Q&A, FBT | PARTIAL | Q&A + FBT missing |
| E Search | Autocomplete, suggestions, results, no-results | PARTIAL | Autocomplete/suggestions partial |
| F Cart/Checkout | Cart, qty, coupon, delivery, guest, confirmation | IMPLEMENTED | Server-side price validation to confirm |
| G Accounts | Login, profile, addresses, orders, tracking, wishlist | IMPLEMENTED | Verify |
| H Wishlist/Compare | Persist, move to cart, compare diffs | IMPLEMENTED | Verify |
| I Promotions | Campaigns, flash sales, coupons, countdowns | IMPLEMENTED | Marketing admin + DB; verify on staging |
| J Support | Contact, help centre, FAQ, live chat/WhatsApp | PARTIAL | Help centre + live chat missing |
| K Trust | Verified reviews, warranty, returns, delivery info | PARTIAL | Policy/help pages missing |
| L Other | Brand pages, guides, recently viewed, 404/empty | PARTIAL | Laptop Finder, buying guides, policy pages missing |

## Build order (status)
1. Homepage Section Manager — IMPLEMENTED, TESTED (DB/RLS), staging deployed; admin CRUD pending owner login.
2. Reviews moderation — IMPLEMENTED, TESTED (RLS), staging deployed.
3. Laptop Finder — IMPLEMENTING (this turn).
4. Help centre + policy pages — PLANNED.
5. Product Q&A + frequently-bought-together — PLANNED.
6. Search autocomplete parity — PLANNED.

## Blockers / config
- Amazon fetch blocked (anti-bot).
- REA not installed (needs approval + restart).
- Admin CRUD tests need an owner/manager login.
- M-Pesa Daraja / SMTP / Africa's Talking creds for notifications.