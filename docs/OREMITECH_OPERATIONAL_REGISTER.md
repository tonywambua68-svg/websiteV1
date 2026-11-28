# OREMITECH SOLUTIONS — Operational Register

Master record of every customer-facing page, business operation and its admin control.
Status: NOT STARTED · RESEARCHED · IMPLEMENTING · IMPLEMENTED · TESTED · VERIFIED · BLOCKED.
Rule: a feature is VERIFIED only after end-to-end testing, not because a page exists or the build passes.
Policy rule: unconfirmed business decisions are marked **DRAFT — OWNER APPROVAL REQUIRED** and must not be published as promises.

Legend for admin: ✅ exists · ➕ to build · n/a.

---

## 1. Homepage & promotional sections
- Route: `/`
- Purpose: shopping destination + campaigns.
- Customers: browse hero, categories, collections, flash sales, campaigns, DB-driven admin sections.
- Displays: real products, prices, ratings; active campaigns/flash sales; admin homepage sections.
- DB: `catalogue_products`, `campaigns`, `flash_sales`, `homepage_sections`, `product_reviews` (ratings via `product_rating_summary()`).
- Admin: Homepage Sections (✅), Marketing (✅ campaigns/flash/coupons).
- Rules: no invented prices/ratings/stock; only published reviews; sections honour visibility+schedule.
- Depends: ProductCard, stores, supabase.
- Test: sections CRUD→render; schedule; fallback when none.
- Status: IMPLEMENTED / TESTED (DB+RLS); admin CRUD VERIFIED-pending owner login.

## 2. Header, navigation & mega menu
- Route: global (Layout).
- Purpose: search, categories, account, wishlist, cart.
- Customers: search, navigate, open account/cart.
- Displays: logo (blue palette), search, cart count.
- DB: categories.
- Admin: Categories (✅).
- Rules: no dead links; active states.
- Status: IMPLEMENTED; consistency pass IMPLEMENTING.

## 3. Product cards
- Route: reused everywhere.
- Purpose: scannable product summary.
- Customers: view, wishlist, compare, quick-add, open details.
- Displays: image, title, brand, price, prev price, auto discount %, genuine rating/count, availability, condition.
- DB: `catalogue_products`, `product_reviews` (published) via `product_rating_summary()`.
- Admin: Products (✅).
- Rules: genuine data only; discount only if comparison>selling.
- Status: IMPLEMENTED / TESTED / VERIFIED (public).

## 4. Categories & subcategories
- Route: `/shop?category=…`
- Purpose: browse/filter/sort.
- Customers: filter, sort, paginate.
- Displays: grid, filters, count, empty state.
- DB: `catalogue_products`, `categories`.
- Admin: Categories (✅ parent/child via menu_group).
- Rules: only relevant filters; real counts.
- Status: IMPLEMENTED; hierarchy depth PARTIAL.

## 5. Product detail
- Route: `/product/:slug`
- Purpose: full product + reviews + related.
- Customers: gallery, specs, reviews (verified-purchase gated), add/cart/buy, wishlist, compare, share.
- DB: `catalogue_products`, `product_reviews`, `order_items`/`orders` (purchase check), related.
- Admin: Products, Reviews (✅).
- Rules: never invent specs/warranty; reviews pending→published.
- Status: IMPLEMENTED; Q&A + FBT NOT STARTED.

## 6. Search & filters
- Route: `/shop`
- Purpose: find products.
- Customers: text search, filters, sort.
- DB: `catalogue_products` (`search_text`).
- Admin: n/a (indexes).
- Rules: typo tolerance partial.
- Status: IMPLEMENTED; autocomplete PARTIAL.

## 7. Compare
- Route: `/compare`
- Purpose: compare specs.
- DB: none (local store, persisted).
- Status: IMPLEMENTED.

## 8. Laptop Finder
- Route: `/laptop-finder`
- Purpose: guided recommendation.
- DB: `catalogue_products`.
- Rules: real laptops only.
- Status: IMPLEMENTED / TESTED (public).

## 9. Cart
- Route: `/cart`
- Purpose: quantities, totals.
- DB: local store; server price validation at checkout.
- Status: IMPLEMENTED.

## 10. Checkout
- Route: `/checkout`
- Purpose: order placement.
- DB: `orders`, `order_items`, `delivery_zones`/`delivery_rates`, `coupons`.
- Rules: server-side price/stock/coupon validation; no unconfigured payment methods.
- Admin: Orders, Delivery, Coupons.
- Status: IMPLEMENTED; full payment integration BLOCKED (creds).

## 11. Registration & login
- Route: `/login`, `/register`, `/reset-password`
- DB: Supabase Auth, `profiles`.
- Status: IMPLEMENTED.

## 12. Account dashboard
- Route: `/account`
- Purpose: profile, orders, wishlist.
- DB: `profiles`, `orders`, `wishlists`.
- Status: IMPLEMENTED; addresses/requests/coupons sections PARTIAL.

## 13. Addresses
- DB: `profiles`/order snapshot. Admin: Customers.
- Status: PARTIAL.

## 14. Orders & tracking
- Route: `/account`, `/order-tracking`, `/order-confirmation/:n`
- DB: `orders`, `order_items`, fulfilment.
- Admin: Orders (✅ status updates).
- Status: IMPLEMENTED.

## 15. Wishlist
- Route: `/wishlist`; DB `wishlists`. Status: IMPLEMENTED.

## 16. Recently viewed
- Local storage component. Status: IMPLEMENTED.

## 17. Reviews & Q&A
- DB: `product_reviews`. Admin: Reviews (✅). Q&A NOT STARTED.
- Status: reviews IMPLEMENTED/TESTED; Q&A NOT STARTED.

## 18. Coupons & vouchers
- DB: `coupons`. Admin: Marketing (✅). Checkout validation server-side.
- Status: IMPLEMENTED; first-order/category rules PARTIAL.

## 19. Customer support
- Route: `/contact`, `/help` (new), `/faq`.
- DB: `customer_inquiries`.
- Admin: inquiries (✅ via existing? ➕ dedicated view).
- Status: contact/FAQ IMPLEMENTED; Help Centre IMPLEMENTING.

## 20. Product request
- Route: `/product-request` (new). DB: `customer_inquiries` (category=request).
- Admin: inquiries. Status: IMPLEMENTING.

## 21. Report a product
- Route: `/report-product` (new). DB: `customer_inquiries` (category=report).
- Status: IMPLEMENTING.

## 22. Delivery information
- Route: `/policies/delivery` (new). DB: `delivery_zones`, `delivery_rates`.
- Rules: **DRAFT — OWNER APPROVAL REQUIRED** (areas/times/fees).
- Status: IMPLEMENTING (draft).

## 23. Returns & refunds
- Route: `/policies/returns`. DB: `returns`.
- Rules: **DRAFT — OWNER APPROVAL REQUIRED** (window/conditions).
- Status: IMPLEMENTING (draft).

## 24. Warranty
- Route: `/policies/warranty`. Rules: **DRAFT — OWNER APPROVAL REQUIRED**.
- Status: IMPLEMENTING (draft).

## 25. Payment information
- Route: `/policies/payment`. Rules: **DRAFT — OWNER APPROVAL REQUIRED** (M-Pesa/bank/wallet).
- Status: IMPLEMENTING (draft).

## 26. How to Order
- Route: `/how-to-order`. Status: IMPLEMENTING.

## 27. About & Contact
- Route: `/about`, `/contact`. DB: `customer_inquiries`. Status: IMPLEMENTED.

## 28. Terms & Privacy
- Route: `/policies/terms`, `/policies/privacy`. **DRAFT — OWNER APPROVAL REQUIRED**.
- Status: IMPLEMENTING (draft).

## 29. Cookie policy
- Route: `/policies/cookies`. **DRAFT — OWNER APPROVAL REQUIRED**.
- Status: IMPLEMENTING (draft).

## 30. FAQs & Help Centre
- Route: `/faq`, `/help`. DB: `faqs` (if present) / static draft.
- Admin: FAQs (➕). Status: IMPLEMENTING.

## 31. Footer navigation
- Global. Grouped: Shop, Customer Care, Help & Policies, Company, Newsletter.
- Admin: footer nav (➕ later). Status: IMPLEMENTING.

---

## Admin modules (status)
- Dashboard ✅ · Products ✅ · Categories ✅ · Brands ✅ · Inventory ✅ · Suppliers ✅ · Orders ✅ · Customers ➕ · Reviews ✅ · Marketing (campaigns/flash/coupons) ✅ · Homepage Sections ✅ · Finance ✅ · Delivery Zones ✅ · Settings ✅ · Content (policies/FAQ/footer) ➕ · Inquiries view ➕.

## Blockers / config
- Admin CRUD verification needs owner/manager login.
- Payment (M-Pesa Daraja), email (SMTP), SMS/WhatsApp (Africa's Talking) creds.
- Owner must confirm all DRAFT policies before publishing.
- Live screenshots: not capturable in this environment (no image support); verify visually on staging.