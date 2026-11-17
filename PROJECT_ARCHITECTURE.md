# OREMITECH Project Architecture

Complete technical architecture documentation for the OREMITECH e-commerce platform.

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| React Router | 6.x | Client-side routing |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first styling |
| Zustand | 4.x | Global state management |
| Lucide React | Latest | Icon library |
| TypeScript | 5.x | Type safety |

### Backend / Infrastructure
| Technology | Purpose |
|------------|---------|
| Supabase (PostgreSQL) | Primary database, auth, realtime |
| Cloudflare Workers / Wrangler | Serverless edge functions |
| Supabase Auth | Authentication (email/password, OAuth) |
| Supabase Storage | Product images, verification photos |

### Development Tools
- ESLint + Prettier for code quality
- GitHub Actions for CI/CD
- Vercel for preview deployments

---

## Frontend Architecture

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── editor/          # Rich text editor
│   ├── seo/             # SEO components
│   ├── CategoryDrawer.tsx
│   ├── CompareBar.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Logo.tsx
│   ├── MegaMenu.tsx
│   ├── NovaAssistant.tsx
│   ├── NovaChat.tsx
│   ├── ProductCard.tsx
│   ├── SearchBox.tsx
│   ├── SetupNotice.tsx
│   └── ...
├── pages/               # Route components
│   ├── admin/           # Admin dashboard pages
│   ├── employee/        # Employee portal pages
│   ├── AboutUs.tsx
│   ├── Account.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   ├── Contact.tsx
│   ├── FAQ.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── OrderTracking.tsx
│   ├── ProductDetail.tsx
│   ├── ResetPassword.tsx
│   ├── Shop.tsx
│   └── Wishlist.tsx
├── store/               # Zustand state stores
│   ├── authStore.ts
│   ├── cartStore.ts
│   ├── compareStore.ts
│   ├── orderStore.ts
│   ├── productStore.ts
│   ├── recentlyViewedStore.ts
│   ├── settingsStore.ts
│   └── wishlistStore.ts
├── lib/                 # Core utilities & clients
│   ├── api.ts           # API helpers
│   ├── auth.ts          # Auth utilities
│   ├── commerce.ts      # Price/spec formatting
│   ├── csv.ts           # CSV import/export
│   ├── domain.ts        # Type definitions & mappers
│   ├── permissions.ts   # Role-based access
│   ├── search.ts        # Search utilities
│   ├── shopping.ts      # Cart/order logic
│   └── supabase.ts      # Supabase client
├── data/                # Static data & fallbacks
│   ├── fallbackCatalogue.ts
│   └── megaMenu.ts
├── types/               # Global TypeScript types
│   └── index.ts
├── App.tsx              # Route configuration
├── index.css            # Global styles + design tokens
└── main.tsx             # Entry point
```

### State Management (Zustand)

Each store is a separate module with a single responsibility:

| Store | Responsibility | Persistence |
|-------|---------------|-------------|
| `authStore` | User session, profile, roles | localStorage |
| `cartStore` | Cart items, quantities, totals | localStorage |
| `productStore` | Product listings, filters, search | Memory + fallback |
| `wishlistStore` | Saved product IDs | localStorage |
| `compareStore` | Products for comparison | localStorage |
| `recentlyViewedStore` | Recently viewed product IDs | localStorage |
| `settingsStore` | Site settings, business info | Memory |
| `orderStore` | Order history, tracking | Memory |

**Pattern**: Each store exports a hook (`useXStore`) with typed selectors and actions.

### Routing Structure

```
/
├── /shop                    # Product catalogue with filters
├── /product/:slug           # Product detail page
├── /cart                    # Shopping cart
├── /checkout                # Checkout flow
├── /order-tracking          # Guest order lookup
├── /wishlist                # Saved items
├── /login                   # Auth (login/register)
├── /register                # Registration
├── /account                 # Customer account
├── /reset-password          # Password reset
├── /about                   # About page
├── /faq                     # FAQ
├── /contact                 # Contact form
├── /admin/                  # Admin dashboard (protected)
│   ├── /dashboard
│   ├── /products
│   ├── /products/new
│   ├── /products/edit/:id
│   ├── /categories
│   ├── /brands
│   ├── /inventory
│   ├── /orders
│   ├── /research
│   ├── /suppliers
│   ├── /employees
│   ├── /finance
│   └── /settings
└── /employee/               # Employee portal (protected)
```

### Component Patterns

#### Server-State Pattern (ProductStore)
```typescript
// 1. Try Supabase
// 2. On failure/empty, fallback to local seed data
// 3. Always return consistent CatalogueProduct type
```

#### Optimistic UI Updates
- Cart/wishlist updates are instant (local state)
- Background sync with Supabase
- Rollback on failure with user notification

#### Responsive Design
- Mobile-first Tailwind classes
- `.wrap` container with responsive padding
- Product grid: 2 col (mobile) → 6 col (2XL)
- Mega menu desktop-only, CategoryDrawer mobile

---

## Backend Architecture

### Supabase Database (PostgreSQL)

**Connection**: Anon client only in frontend (`src/lib/supabase.ts`)
- Service role key **never** in frontend code
- All sensitive operations via Supabase Edge Functions or direct DB access

### Database Schema Overview

#### Core Entities
```
profiles (auth.users extension)
├── id (uuid, PK, FK→auth.users)
├── full_name, email, phone
├── role (app_role enum)
└── account_status

categories
├── id, parent_id (self-ref)
├── name, slug, description
├── menu_group, sort_order
└── is_active

brands
├── id, name, slug
├── is_active, sort_order

products
├── id, slug, name, model
├── description, category_id, brand_id
├── specs: processor, RAM, storage, screen, etc.
├── laptop_condition, warranty
├── selling_price, comparison_price
├── featured, publication_status
├── seo_title, seo_description
├── created_by, approved_by, published_at
└── deleted_at (soft delete)

product_images (1:N)
product_specifications (1:N)
product_variants (1:N)
product_costs (1:1)

inventory_balances (1:1 per product)
├── owned_qty, supplier_qty
├── reserved_qty, supplier_reserved_qty
├── damaged_qty, awaiting_verification_qty
└── reorder_level

suppliers
├── id, supplier_name, shop_name
├── contact_person, phone, email
├── physical_location, nairobi_area
├── supplier_type, reliability_rating
├── verification_status
└── notes
```

#### Order & Commerce
```
customers (guest + registered)
carts / cart_items

orders
├── order_number (OM-YYYYMMDD-XXXXXX)
├── customer_id, user_id
├── guest_name, guest_phone, guest_email
├── delivery_location, instructions
├── status (pending → awaiting_supplier_confirmation → confirmed → awaiting_payment → paid → processing → ready_for_delivery → dispatched → delivered)
├── subtotal, discount, total
├── coupon_code
├── requires_supplier_confirmation
└── stock_committed

order_items (1:N)
├── product_id, variant_id
├── quantity, unit_price, line_total
└── fulfilment ('owned'|'supplier')

payment_records
├── provider ('unassigned'|'manual'|'mpesa_daraja')
├── status ('unpaid'|'pending'|'confirmed'|'failed'|'refunded')
└── reference

shipments, returns, refunds
```

#### Research & Verification
```
research_listings (supplier marketplace data)
sourcing_tasks (internal workflow)
product_verifications (physical inspection)
verification_photos
supplier_price_history
```

#### Marketing & Operations
```
product_reviews, wishlists, coupons
promotional_banners, newsletter_subscriptions
expense_categories, expenses
activity_logs, employee_tasks
notifications, business_settings
```

### Database Functions (PostgreSQL)

| Function | Purpose |
|----------|---------|
| `normalize_phone()` | Standardize Kenyan phone numbers to 254 format |
| `current_profile_role()` | Get current user's role |
| `is_staff()` / `is_owner()` | Role checks |
| `place_order(payload)` | Atomic order creation with stock reservation |
| `track_order(number, phone)` | Guest order lookup |
| `adjust_stock(bucket, delta)` | Inventory adjustments (staff only) |
| `update_order_status(status)` | State machine transitions |
| `log_activity()` | Audit trail |

### Triggers
- `on_auth_user_created` → auto-create profile + customer
- `products_guard` → enforce publication workflow
- `products_inventory` → auto-create inventory_balances
- `products_activity` → audit log
- `profiles_guard` → prevent unauthorized role changes

### Row Level Security (RLS)
All tables have RLS enabled. Policies enforce:
- Customers: own data only
- Staff: scoped by role (owner/manager/researcher/inventory/sales)
- Public: `catalogue_products` view only (published, active categories)

---

## Authentication & Authorization

### Supabase Auth
- Email/password registration
- Email confirmation flow
- Password reset via email
- Session persistence (localStorage)

### Role System (`app_role` enum)
| Role | Permissions |
|------|-------------|
| `owner` | Full access, role management, delete products |
| `manager` | Approve/publish products, manage orders, inventory |
| `product_researcher` | Create research listings, source products |
| `inventory_assistant` | Stock adjustments, supplier management |
| `sales_assistant` | Order processing, customer communication |
| `customer` | Shopping, orders, wishlist, reviews |

### Route Guards
- `Guard` component wraps protected routes
- Admin routes → `AdminLayout` with role check
- Employee routes → `EmployeeLayout` with staff check
- Permissions defined in `src/lib/permissions.ts`

---

## Key Data Flows

### Product Catalogue
```
Supabase: catalogue_products view
  → filters applied (category, brand, price, specs)
  → paginated results (24/page)
  → mapped to CatalogueProduct type
  → Zustand productStore
  → Shop page + ProductCard components
  → Fallback to local seed data if Supabase unavailable
```

### Cart → Checkout → Order
```
User adds to cart
  → cartStore.addItem() → optimistic UI + localStorage
  → Checkout page
  → place_order() RPC (atomic)
    - Locks inventory_balances rows
    - Reserves stock (owned → supplier fallback)
    - Creates order + order_items + payment_record
    - Logs activity + notifications
  → Success → clear cart → redirect to tracking
```

### Supplier Confirmation Flow
```
Order with supplier items
  → status: awaiting_supplier_confirmation
  → Admin/Sales Assistant confirms
  → status: confirmed → awaiting_payment
  → Customer pays (M-Pesa Daraja or manual)
  → payment_record.confirmed
  → status: paid → processing
  → Dispatch → delivered
```

### Research → Product Pipeline
```
Researcher discovers supplier listing
  → research_listings (status: discovered)
  → Sourcing task assigned
  → Physical verification (product_verifications)
  → If verified → create Product (draft)
  → Owner approves → approved
  → Owner publishes → published
  → Auto-sync to catalogue_products view
```

---

## API & Integration

### Supabase Client (`src/lib/supabase.ts`)
```typescript
// Anon client only
// Auto-refresh token, persist session
// Returns null if env vars missing
```

### Commerce Utilities (`src/lib/commerce.ts`)
- `formatKES()` - KSh formatting
- `specSummary()` - Processor/RAM/Storage summary
- `availabilityLabel()` - Human-readable stock status
- `conditionLabel()` - Laptop condition display

### Search (`src/lib/search.ts`)
- `searchPattern()` - Wildcard pattern builder
- Client-side fallback filtering (`filterFallback`)

### Permissions (`src/lib/permissions.ts`)
- Role hierarchy
- Route access matrix
- Home page redirects by role

---

## Deployment

### Build Process
```bash
npm run build
# → Vite production build
# → Outputs to dist/
# → Static assets + index.html
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon public key |

### Hosting
- **Production**: Cloudflare Pages / Vercel / Netlify (static)
- **Edge Functions**: Cloudflare Workers (Wrangler)
- **Database**: Supabase Cloud (managed PostgreSQL)

### CI/CD (GitHub Actions)
- Lint + typecheck on PR
- Preview deployments
- Production on main branch merge

---

## Performance Considerations

### Frontend
- Code splitting by route (React.lazy + Suspense)
- Product images lazy-loaded
- Zustand selectors prevent unnecessary re-renders
- Tailwind CSS purged in production

### Database
- Indexes on: publication_status, category_id, brand_id, guest_phone, status
- `catalogue_products` view with `security_barrier`
- Pagination via `.range()` (24 items)
- Fallback seed data for zero-downtime deploys

### Caching
- Browser cache for static assets
- Supabase query caching (stale-while-revalidate pattern in stores)
- LocalStorage for cart/wishlist persistence

---

## Security

### Frontend
- No service role key in bundle
- Input validation on all forms
- XSS prevention via React escaping
- CSP headers via hosting platform

### Database
- RLS on all tables
- Triggers enforce business rules
- `security_invoker` on sensitive views
- Soft deletes (`deleted_at`) for audit

### Payments
- M-Pesa Daraja integration (server-side only)
- Payment records linked to orders
- Idempotency via order_number + provider reference

---

## Monitoring & Debugging

### Activity Logs
All critical actions logged to `activity_logs` table:
- Product CRUD, price changes, approvals
- Order creation, status transitions
- Stock adjustments
- User role changes

### Error Tracking
- Console errors in development
- Supabase error responses mapped via `errorText()`

### Database
- `pg_stat_statements` for query performance
- Supabase dashboard for connection pool, storage

---

## Scaling Considerations

### Database
- Read replicas for catalogue queries
- Partition `stock_movements` by date
- Archive old orders (soft delete + partitioning)

### Frontend
- CDN for images (Supabase Storage + Cloudflare)
- Service Worker for offline cart
- Virtualized lists for large catalogues

### Search
- Full-text search via PostgreSQL `tsvector` or Meilisearch
- Current: `ilike` with `search_text` trigram index

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-11-16 | 1.0 | Initial architecture documentation |

---

*This document must be updated with any architectural changes. Review quarterly.*