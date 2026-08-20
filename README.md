# Imara Tech — Online Electronics Store (Kenya)

A premium, mobile-first e-commerce prototype for a **new Kenyan online electronics business**.
Built with **React + Vite + TypeScript + Tailwind CSS**.

> Honesty-first by design: no fake reviews, no invented ratings, no physical-store claims.
> Orders are placed online or via **WhatsApp**, paid with **M-PESA PayBill**.

## ✨ Features

- 🏠 Homepage — hero, categories, live deal countdown, AI product finder ("Zuri"), buying guides
- 🛍️ Shop — 30+ demo products, live search with suggestions, 8 filter types, 5 sort options
- 📦 Product pages — gallery views, specs, bundle builder, related products
- 🛒 Cart + checkout — promo code `IMARA5`, M-PESA PayBill instructions, delivery options
- 💬 **Order via WhatsApp** on products, cart and confirmation screens (pre-filled messages)
- 🟢 **M-PESA PayBill** payment flow with step-by-step "How to pay" guide
- 🚚 Order tracking — 8-status timeline (Order Received → Delivered), clearly labelled **Demo Tracking**
- ❤️ Wishlist · ⚖️ Compare (up to 3) · 👤 Account (orders, addresses, profile, support tickets)
- 📄 Editable policy pages — Delivery, Returns, Privacy, Terms
- 📱 Full mobile experience with bottom tab bar and slide menus

## 🚀 Run it

```bash
npm install
npm run dev        # local development → http://localhost:5173
npm run build      # production build → dist/
```

## ⚙️ Configure your business details

Everything you need to personalise lives in **`src/config.ts`** — no other code changes needed.

| Setting | Variable | Example |
|---|---|---|
| WhatsApp ordering number | `WHATSAPP_NUMBER` | `"254712345678"` *(international format, digits only, no `+`)* |
| M-PESA PayBill number | `MPESA_PAYBILL_NUMBER` | `"522123"` |
| PayBill account note | `MPESA_ACCOUNT_NOTE` | free text shown to customers |
| TikTok | `SOCIALS.tiktok` | full profile URL |
| Instagram | `SOCIALS.instagram` | full profile URL |
| X (Twitter) | `SOCIALS.x` | full profile URL |
| Facebook | `SOCIALS.facebook` | full profile URL |
| Email / phone / hours | `BUSINESS.*` | free text |
| Delivery options & fees | `DELIVERY_OPTIONS`, `FREE_DELIVERY_AT` | edit the array |

Legal/policy wording is edited in **`src/data/policies.ts`**.

Until configured, WhatsApp buttons and social icons show a polite *"not configured yet"*
notice — the site never invents your details.

## 🧭 Demo vs. real

**Works for real:** navigation, search, filters, cart, wishlist, compare, promo codes,
checkout validation, WhatsApp deep-links, tracking UI, everything persists in your browser
(localStorage).

**Demo only:** product catalogue (fictional brands), the demo account, order creation
(no backend), payment verification (manual via WhatsApp in real life), the AI finder
(rule-based), support tickets, newsletter.

## 🔐 Accounts & security (demo-grade)

The store includes a full account system: **register, sign in, sign out, profile
editing, avatar colour, and password change**.

- Passwords are **never stored in plain text** — they are stretched with
  **PBKDF2-SHA-256** (120,000 iterations, random per-user salt) via the browser's
  Web Crypto API (`src/lib/crypto.ts`).
- Sessions use CSPRNG tokens with a configurable expiry (`AUTH.sessionDays`),
  plus **brute-force lockout** after repeated failed logins.
- `/account` is a **protected route** — visitors are redirected to `/auth`.
- One user can never read another user's data through the app: the service layer
  (`src/lib/auth.ts`) only ever exposes the *current session's* user.
- **Honest limitation:** this is a frontend-only app, so accounts live in the
  browser (localStorage). It is clearly labelled demo-grade in the UI. To go
  live, swap the internals of `src/lib/auth.ts` for a real backend
  (Supabase / Firebase / Node / WooCommerce) — **nothing else changes**.

Tune it in `src/config.ts` → `AUTH` (session length, hashing cost, lockout).

## 🎨 Selling this as a template

Everything a buyer needs to customise is centralised:

| What | Where |
|---|---|
| Business name, WhatsApp, PayBill, socials, delivery, auth | `src/config.ts` |
| Colours, fonts, buttons, animations | `src/index.css` (`@theme` tokens) |
| Products & prices | `src/data/products.ts` |
| Text, FAQs, guides, tracking statuses | `src/data/content.ts` |
| Legal pages | `src/data/policies.ts` |

No branding is hard-coded in components — change one file, restyle the whole store.

## 📈 Roadmap to production

1. Add your real products & prices in `src/data/products.ts`
2. Set `WHATSAPP_NUMBER` + `MPESA_PAYBILL_NUMBER` in `src/config.ts`
3. Write your real policies in `src/data/policies.ts`
4. Replace `src/lib/auth.ts` internals with a real auth backend
5. Later: connect WooCommerce (products/orders via REST API) and automatic M-PESA verification

## 📁 Project structure

```
src/
  config.ts            ← YOUR BUSINESS SETTINGS (start here)
  data/products.ts     ← catalogue & prices
  data/content.ts      ← FAQs, tracking statuses, demo account data
  data/policies.ts     ← editable legal pages
  components/          ← Header, ProductCard, CartDrawer, AIFinder, Contact…
  pages/               ← Home, Shop, Product, Cart, Checkout, Account…
  lib/store.tsx        ← cart / wishlist / orders state (localStorage)
```

## 🔐 Accounts & security

The store has a real authentication layer (`src/lib/auth.ts` + `src/lib/crypto.ts`):

- **Passwords** — hashed with PBKDF2-SHA-256 (120,000 iterations, random per-user
  salt, Web Crypto API). Plaintext is never stored; only hash + salt persist.
- **Sessions** — random 256-bit tokens, expire after `AUTH.sessionDays` (config.ts).
- **Brute-force lockout** — 5 failures per email → temporary lock (`AUTH.*` in config.ts).
- **Safe errors** — "Invalid email or password" never reveals whether an email exists.
- **Protected routes** — `/account` redirects to `/auth` when signed out.
- **First account = administrator** (WordPress-style installer rule); later accounts are customers.

### Development demo admin

Create a `.env` file (already gitignored — see `.env.example`):

```env
VITE_DEMO_ADMIN_NAME=Tony (Admin)
VITE_DEMO_ADMIN_EMAIL=tony@example.com
VITE_DEMO_ADMIN_PASSWORD=tony@123
VITE_DEMO_ADMIN_PHONE=0143198930
```

Restart `npm run dev` — the admin is seeded (hashed) on first load. Sign in at **/auth**.

### Before selling/deploying the template

1. **Delete `.env`** and rebuild — no credentials are shipped; the first person to
   register becomes the administrator.
2. Never commit `.env` (`.gitignore` already protects it).
3. Connect a real backend (Supabase / Firebase / WooCommerce) — swap **only**
   `src/lib/auth.ts`; every page and guard keeps working unchanged. Until then:
   *"Demo accounts — passwords are hashed and stored in this browser only.
   Connect a backend before going live."*

## License

Prototype created for design exploration and learning. Product brands and demo data are fictional.
