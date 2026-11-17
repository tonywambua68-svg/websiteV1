# OREMITECH — Laptop & Computer Accessories E-Commerce Platform

Official production repository for **OREMITECH**, an electronics and laptop e-commerce platform operating in Kenya.

- **Default Currency:** KES (Kenyan Shillings)
- **Timezone:** Africa/Nairobi (EAT, UTC+3)
- **Primary Market:** Delivery across all 47 Kenya counties
- **Hardware Specialty:** Business laptops, gaming laptops, student laptops, workstations, monitors, and computer accessories.

---

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** | Complete design tokens: colours, typography, spacing, components, responsive rules |
| **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** | Frontend, backend, database, auth, data flows, deployment |
| **[DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md)** | All 44 tables, relationships, RLS policies, functions, migrations |
| **[FEATURES_AND_STATUS.md](FEATURES_AND_STATUS.md)** | Completed/in-progress/planned features, bugs, production checklist |
| **[AI_DEVELOPER_GUIDE.md](AI_DEVELOPER_GUIDE.md)** | **MANDATORY** rules for all future AI assistants |

---

## 🏗️ Architecture Overview

The system is designed to be scalable, secure, and production-ready within free-tier deployment budgets (Cloudflare Pages + Supabase PostgreSQL):

```
┌────────────────────────────────────────────────────────┐
│               OREMITECH Customer Storefront            │
│   (AliExpress-inspired fast filters, mega menu, search)│
└──────────────────────────┬─────────────────────────────┘
                           │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌──────────────────────────┐┌─────────────────────────────┐
│  Owner Admin Dashboard   ││  Employee Operations Portal │
│  (/admin - Role: owner)  ││  (/employee - Restr. staff) │
└────────────┬─────────────┘└─────────────┬───────────────┘
             │                            │
             └─────────────┬──────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             Supabase PostgreSQL 15 Database            │
│  - 44 Relational Tables with Row Level Security (RLS)  │
│  - Supabase Auth linked to `profiles` table            │
│  - Physically owned vs supplier-backed stock tracking  │
│  - Strict research & physical verification pipeline    │
│  - Stored procedures for atomic checkout & stock ledger│
└────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4 (design tokens via `@theme`) |
| **State** | Zustand (persisted + server sync) |
| **Database** | Supabase PostgreSQL 15 (migrations in `supabase/migrations/`) |
| **Auth** | Supabase Auth + custom `profiles` table with 6 roles |
| **Hosting** | Cloudflare Pages (SPA with `public/_redirects`) |
| **Payments** | M-Pesa Daraja (ready for sandbox/production) |

### Authentication & RBAC

| Role | Permissions |
|------|-------------|
| `owner` | Full authority: employees, settings, approvals, P&L |
| `manager` | Operations: approve/publish products, manage orders, inventory |
| `product_researcher` | Sourcing: research listings, verification tasks |
| `inventory_assistant` | Stock: receipts, counts, movements, suppliers |
| `sales_assistant` | Orders: dispatch, status coordination, customers |
| `customer` | Shopping: cart, wishlist, tracking, profile |

---

## 🎨 Design System (Dark Forest Green Theme)

**Primary**: `--color-emerald` (#156b45) — Dark forest green
**Accent**: `--color-amber` (#f5a31a) — Gold/yellow

```
┌─────────────────────────────────────────────┐
│  Button Hierarchy                           │
├─────────────────────────────────────────────┤
│  .btn-emerald   → Primary CTA (Add to Cart)│
│  .btn-amber     → Secondary (Search, Sub)  │
│  .btn-outline   → Ghost (View Deals)       │
└─────────────────────────────────────────────┘
```

**Key Rules**:
- NEVER hardcode colours — use CSS variables (`var(--color-emerald)`)
- NEVER redesign working layouts without explicit request
- Mobile-first responsive (2 col mobile → 6 col 2XL)
- 44px minimum touch targets
- Documented in full at **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)**

---

## 🚀 Quick Setup & Local Development

### 1. Prerequisites
- Node.js v18+
- npm or yarn
- Free Supabase project ([supabase.com](https://supabase.com))

### 2. Installation
```bash
git clone <repo-url>
cd websiteV1-main
npm install
```

### 3. Environment Variables
```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
VITE_SITE_NAME=OREMITECH
VITE_CURRENCY=KES
VITE_TIMEZONE=Africa/Nairobi
```

> ⚠️ **Never** put the Supabase service-role key in frontend environment variables.

### 4. Database Migration
1. Supabase Dashboard → **SQL Editor**
2. Run `supabase/migrations/20261112000000_oremitech_schema.sql`
3. Run `supabase/migrations/20261116000000_product_seo_fields.sql`

This creates:
- 44 tables with RLS
- `catalogue_products` view (public API)
- Atomic functions (`place_order`, `track_order`, `adjust_stock`)
- Seed data: categories, brands, business settings

### 5. Create First Owner
```sql
-- After registering at /login with owner email:
update public.profiles
set role = 'owner', account_status = 'active'
where email = 'owner@oremitech.co.ke';
```

### 6. Run Development
```bash
npm run dev
# Visit http://localhost:5173
```

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run build:check` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint (if configured) |

---

## 🛡️ Sourcing & Verification Pipeline

Products follow an auditable pipeline:

```
DISCOVERED → NEEDS_PHYSICAL_VERIFICATION → VERIFIED → OWNER_APPROVAL → PUBLISHED
```

1. **DISCOVERED** — Research finds supplier listing
2. **NEEDS_PHYSICAL_VERIFICATION** — In-person diagnostic test
3. **VERIFIED** — Actual specs, photos, negotiated price logged
4. **OWNER_APPROVAL** — Owner reviews margin, condition, warranty
5. **PUBLISHED** — Live on customer storefront

---

## 🚚 Inventory Model

| Bucket | Description |
|--------|-------------|
| **Owned** | Physically at OREMITECH Nairobi — same-day delivery |
| **Supplier** | Verified with trusted distributors — confirm before dispatch |
| **Reserved** | Locked during active orders — prevents overselling |

---

## 🔐 Security & Compliance

- ✅ RLS enabled on all 44 tables
- ✅ Service role key never in frontend
- ✅ All mutations via `SECURITY DEFINER` RPC functions
- ✅ `FOR UPDATE` row locking for stock operations
- ✅ Immutable audit trail (`activity_logs`)
- ✅ Kenyan Data Protection Act 2019 awareness
- ✅ Consumer protection refund workflow

---

## 🚢 Cloudflare Pages Deployment

1. Connect repository to **Cloudflare Pages**
2. Framework: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
4. Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_NAME` = `OREMITECH`
5. `public/_redirects` handles SPA routing

---

## 📊 Project Structure

```
websiteV1-main/
├── public/                 # Static assets, _redirects
├── supabase/
│   └── migrations/         # SQL schema migrations
├── src/
│   ├── components/         # Reusable UI (Header, MegaMenu, ProductCard, etc.)
│   ├── pages/              # Route components (Shop, Cart, Admin, Employee)
│   ├── store/              # Zustand stores (cart, auth, products, etc.)
│   ├── lib/                # Core utils (supabase, commerce, permissions)
│   ├── data/               # Fallback catalogue, mega menu config
│   ├── types/              # TypeScript types
│   ├── index.css           # Design tokens + global styles
│   ├── App.tsx             # Route configuration
│   └── main.tsx            # Entry point
├── DESIGN_SYSTEM.md        # Design tokens & rules
├── PROJECT_ARCHITECTURE.md # Technical architecture
├── DATABASE_DOCUMENTATION.md # Complete DB reference
├── FEATURES_AND_STATUS.md  # Feature tracking
├── AI_DEVELOPER_GUIDE.md   # Mandatory AI rules
└── README.md               # This file
```

---

## 🎯 Key Business Logic

### Order Flow
```
Cart → Checkout → place_order() RPC
  → Lock inventory_balances
  → Reserve stock (owned → supplier)
  → Create order + items + payment_record
  → Log activity + notify owner
  → Status: pending / awaiting_supplier_confirmation
```

### Stock Management
- `inventory_balances` per product (owned/supplier/reserved)
- `stock_movements` immutable audit log
- `adjust_stock()` for manual adjustments (staff only)

### Research → Product
```
research_listings → sourcing_tasks → product_verifications
  → products (draft) → approved → published
  → Auto-sync to catalogue_products view
```

---

## 📝 For Future Developers

**READ BEFORE CODING:**
1. `DESIGN_SYSTEM.md` — Use only documented tokens
2. `AI_DEVELOPER_GUIDE.md` — Mandatory rules (enforced)
3. `DATABASE_DOCUMENTATION.md` — Check before schema changes
4. `PROJECT_ARCHITECTURE.md` — Understand data flows

**NEVER:**
- ❌ Hardcode colours / spacing
- ❌ Create duplicate database tables
- ❌ Put service role key in frontend
- ❌ Bypass RLS or RPC functions
- ❌ Deploy without `npm run build` success

---

## 🔗 External Links

- **Supabase Dashboard**: [app.supabase.com](https://app.supabase.com)
- **Cloudflare Pages**: [dash.cloudflare.com](https://dash.cloudflare.com)
- **M-Pesa Daraja Portal**: [developer.safaricom.co.ke](https://developer.safaricom.co.ke)

---

*Last updated: 2026-11-16*