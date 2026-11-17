# OREMITECH Database Documentation

Complete database schema, relationships, RLS policies, and migration guide for the OREMITECH Supabase (PostgreSQL) database.

---

## Overview

- **Database**: Supabase (PostgreSQL 15+)
- **Schema**: `public`
- **Migrations**: `supabase/migrations/`
- **RLS**: Enabled on all tables
- **Auth**: Supabase Auth (`auth.users`)

---

## Table Reference

### 1. Identity & Access

#### `profiles`
Extends `auth.users` with business data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, FK→auth.users(id) CASCADE | User ID |
| `full_name` | text | NOT NULL DEFAULT '' | Display name |
| `email` | text | | Email (synced from auth) |
| `phone` | text | | Kenyan phone (254 format) |
| `avatar_url` | text | | Profile image |
| `role` | app_role | NOT NULL DEFAULT 'customer' | Permission level |
| `account_status` | text | NOT NULL DEFAULT 'active' CHECK active/suspended | Account state |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | Auto-updated by trigger |

**Indexes**: PK on `id`

**RLS Policies**:
- Users: `SELECT/UPDATE` own profile
- Owner: `SELECT/UPDATE` all profiles
- Insert: Trigger `handle_new_user()` only

---

#### `app_role` (enum)
```sql
owner > manager > product_researcher > inventory_assistant > sales_assistant > customer
```

---

### 2. Catalogue

#### `categories`
Hierarchical product categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `parent_id` | uuid | FK→categories(id) SET NULL | Parent category |
| `name` | text | NOT NULL | Display name |
| `slug` | text | NOT NULL UNIQUE | URL identifier |
| `description` | text | NOT NULL DEFAULT '' | |
| `menu_group` | text | NOT NULL DEFAULT 'catalogue' | Mega-menu grouping |
| `sort_order` | int | NOT NULL DEFAULT 0 | Display order |
| `is_active` | boolean | NOT NULL DEFAULT true | Visibility |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**RLS**: Public `SELECT` where `is_active=true`. Staff `ALL`.

---

#### `brands`
Laptop/computer brands.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `name` | text | NOT NULL | e.g., HP, Dell |
| `slug` | text | NOT NULL UNIQUE | URL identifier |
| `is_active` | boolean | NOT NULL DEFAULT true | |
| `sort_order` | int | NOT NULL DEFAULT 0 | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**RLS**: Public `SELECT` where `is_active=true`. Staff `ALL`.

---

#### `products`
Core product catalogue (laptops, accessories, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `slug` | text | NOT NULL UNIQUE | URL slug |
| `name` | text | NOT NULL | Product name |
| `model` | text | | Specific model |
| `description` | text | NOT NULL DEFAULT '' | Rich text |
| `category_id` | uuid | NOT NULL FK→categories(id) | Required |
| `brand_id` | uuid | FK→brands(id) SET NULL | Optional |
| `processor_manufacturer` | text | | Intel/AMD/Apple |
| `processor_model` | text | | Core i5-8350U, M1, etc. |
| `processor_generation` | text | | 8th Gen, M-series |
| `ram` | text | | 8GB, 16GB DDR4 |
| `ram_type` | text | | DDR4, LPDDR4X |
| `storage_capacity` | text | | 256GB, 512GB, 1TB |
| `storage_type` | text | | SSD, NVMe |
| `screen_size` | text | | 14", 15.6" |
| `screen_resolution` | text | | 1920x1080, 2560x1600 |
| `graphics` | text | | Integrated, RTX 3050 |
| `operating_system` | text | | Windows 11 Pro, macOS |
| `keyboard_layout` | text | | US, UK, Kenyan |
| `battery_condition` | text | | Excellent, Good, Fair |
| `laptop_condition` | text | NOT NULL DEFAULT 'unspecified' | Grading |
| `warranty` | text | | e.g., "6 months" |
| `weight` | text | | 1.4kg |
| `colour` | text | | Silver, Space Gray |
| `selling_price` | numeric(12,2) | NOT NULL CHECK >= 0 | KSh |
| `comparison_price` | numeric(12,2) | CHECK > selling_price | RRP/Previous price |
| `featured` | boolean | NOT NULL DEFAULT false | Homepage highlight |
| `publication_status` | text | NOT NULL DEFAULT 'draft' CHECK enum | Workflow state |
| `seo_title` | text | | Meta title |
| `seo_description` | text | | Meta description |
| `review_note` | text | | Internal admin notes |
| `created_by` | uuid | FK→profiles(id) SET NULL | Creator |
| `approved_by` | uuid | FK→profiles(id) SET NULL | Approver |
| `approved_at` | timestamptz | | Approval timestamp |
| `published_at` | timestamptz | | Publication timestamp |
| `deleted_at` | timestamptz | | Soft delete |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Publication Status Enum**:
`draft` → `pending_approval` → `approved` → `published` / `rejected` / `archived`

**RLS**:
- Public: `SELECT` via `catalogue_products` view only
- Staff: `SELECT` all; `INSERT/UPDATE` per role (trigger guards)

**Triggers**:
- `products_guard` - Workflow enforcement
- `products_inventory` - Auto-create inventory_balances
- `products_activity` - Audit logging
- `products_sync_listing` - Sync research_listings status

---

#### `product_images`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `product_id` | uuid | FK→products(id) CASCADE |
| `url` | text | Supabase Storage path or external URL |
| `alt` | text | Alt text |
| `sort_order` | int | Display order |
| `is_primary` | boolean | Main image flag |
| `created_at` | timestamptz | |

---

#### `product_specifications`
Key-value technical specs beyond fixed columns.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `product_id` | uuid | FK→products(id) CASCADE |
| `spec_key` | text | e.g., "Ports", "Webcam" |
| `spec_value` | text | e.g., "2x USB-C, HDMI" |
| `sort_order` | int | |
| **Unique** | `(product_id, spec_key)` | |

---

#### `product_variants`
SKU variants (RAM/storage combos for same model).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `product_id` | uuid | FK→products(id) CASCADE |
| `sku` | text | Optional SKU |
| `label` | text | e.g., "16GB/512GB" |
| `selling_price` | numeric(12,2) | Variant price |
| `ram` | text | Override base RAM |
| `storage_capacity` | text | Override base storage |
| `is_active` | boolean | DEFAULT true |
| `created_at` | timestamptz | |

---

#### `product_tags` / `product_tag_links`
Many-to-many tagging system.

| Table | Columns |
|-------|---------|
| `product_tags` | id, name, slug (UNIQUE) |
| `product_tag_links` | product_id FK, tag_id FK, PK(product_id, tag_id) |

---

#### `product_costs` (Staff Only)
Purchase cost tracking (not exposed to public).

| Column | Type | Description |
|--------|------|-------------|
| `product_id` | uuid | PK, FK→products(id) CASCADE |
| `purchase_cost` | numeric(12,2) | Cost price KSh |
| `updated_at` | timestamptz | |
| `updated_by` | uuid | FK→profiles(id) |

**RLS**: Owner/Manager/Inventory only.

---

### 3. Inventory

#### `inventory_balances`
Real-time stock per product.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `product_id` | uuid | PK FK→products(id) CASCADE | |
| `owned_qty` | int | >= 0 | Own stock |
| `supplier_qty` | int | >= 0 | Supplier stock |
| `reserved_qty` | int | >= 0, <= owned_qty | Reserved for orders |
| `supplier_reserved_qty` | int | >= 0, <= supplier_qty | Reserved supplier |
| `damaged_qty` | int | >= 0 | Written off |
| `awaiting_verification_qty` | int | >= 0 | Pending physical check |
| `reorder_level` | int | >= 0 DEFAULT 1 | Low stock threshold |
| `updated_at` | timestamptz | DEFAULT now() | |

**Constraints**:
- `reserved_within_owned`: reserved_qty ≤ owned_qty
- `supplier_reserved_within`: supplier_reserved_qty ≤ supplier_qty

**Auto-created** by `products_inventory` trigger on product insert.

---

#### `suppliers`
Supplier directory (Nairobi-focused).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `supplier_name` | text | Legal name |
| `shop_name` | text | Trading name |
| `contact_person` | text | |
| `phone` | text | Normalized by trigger |
| `email` | text | |
| `physical_location` | text | Full address |
| `nairobi_area` | text | e.g., "CBD", "Westlands", "Kasarani" |
| `website_url` | text | |
| `supplier_type` | text | DEFAULT 'retailer' |
| `reliability_rating` | int | 1-5 CHECK |
| `verification_status` | text | DEFAULT 'unverified' CHECK enum |
| `notes` | text | |
| `created_by` | uuid | FK→profiles(id) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**RLS**: Staff only (not public).

---

#### `supplier_contacts`
Additional contacts per supplier.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `supplier_id` | uuid | FK→suppliers(id) CASCADE |
| `contact_person` | text | |
| `phone` | text | |
| `email` | text | |
| `role_title` | text | |
| `notes` | text | |
| `created_at` | timestamptz | |

---

#### `inventory_units`
Individual serialized units (for high-value items).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `product_id` | uuid | FK→products(id) CASCADE |
| `supplier_id` | uuid | FK→suppliers(id) SET NULL |
| `serial_number` | text | |
| `ownership` | text | CHECK: owned/supplier/awaiting_verification/reserved/sold/damaged |
| `status` | text | DEFAULT 'available' |
| `notes` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

#### `stock_movements`
Immutable audit trail of all stock changes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `product_id` | uuid | FK→products(id) |
| `movement_type` | text | CHECK: restock/adjustment/reserve/release/sale/damage/return/supplier_in/supplier_reserve/supplier_release |
| `quantity` | int | NOT NULL CHECK <> 0 |
| `bucket` | text | owned/supplier/damaged/awaiting_verification |
| `reference_type` | text | 'order', 'adjustment', etc. |
| `reference_id` | uuid | Link to order/adjustment |
| `notes` | text | |
| `actor_id` | uuid | FK→profiles(id) |
| `created_at` | timestamptz | DEFAULT now() |

**Index**: `(product_id, created_at DESC)`

---

### 4. Research & Verification

#### `research_listings`
Marketplace data from suppliers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `source_name` | text | e.g., "Jumia", "Kilimall", "Supplier WhatsApp" |
| `source_url` | text | UNIQUE where not null |
| `title` | text | Listing title |
| `advertised_price` | numeric(12,2) | Price seen |
| `advertised_specs` | jsonb | Parsed specs |
| `supplier_id` | uuid | FK→suppliers(id) SET NULL |
| `status` | text | CHECK: discovered/under_review/needs_physical_verification/verified/draft/approved/published/rejected/unavailable/expired |
| `permitted_source` | boolean | DEFAULT false (must be true per CHECK constraint) |
| `discovered_at` | timestamptz | |
| `collected_at` | timestamptz | |
| `expires_hint` | timestamptz | |
| `notes` | text | |
| `discovered_by` | uuid | FK→profiles(id) |
| `product_id` | uuid | FK→products(id) SET NULL (linked after verification) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Indexes**: Unique on `source_url` (partial where not null)

---

#### `sourcing_tasks`
Internal workflow for converting research to products.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `listing_id` | uuid | FK→research_listings(id) CASCADE |
| `product_id` | uuid | FK→products(id) SET NULL |
| `assigned_to` | uuid | FK→profiles(id) SET NULL |
| `title` | text | Task title |
| `status` | text | open/in_progress/completed/cancelled |
| `notes` | text | |
| `created_by` | uuid | FK→profiles(id) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

#### `product_verifications`
Physical inspection records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `product_id` | uuid | FK→products(id) SET NULL |
| `listing_id` | uuid | FK→research_listings(id) SET NULL |
| `supplier_id` | uuid | FK→suppliers(id) SET NULL |
| `verified_price` | numeric(12,2) | Confirmed price |
| `verified_specs` | jsonb | Confirmed specs |
| `condition` | text | Physical condition |
| `notes` | text | |
| `result` | text | DEFAULT 'pending' CHECK pending/verified/rejected |
| `verified_by` | uuid | FK→profiles(id) SET NULL |
| `verified_at` | timestamptz | |
| `created_at` | timestamptz | |

**RLS**: Staff only.

---

#### `verification_photos`
Photos attached to verifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `verification_id` | uuid | FK→product_verifications(id) CASCADE |
| `storage_path` | text | Supabase Storage path |
| `created_at` | timestamptz | |

---

#### `supplier_price_history`
Price tracking over time.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `supplier_id` | uuid | FK→suppliers(id) CASCADE |
| `product_id` | uuid | FK→products(id) SET NULL |
| `listing_id` | uuid | FK→research_listings(id) SET NULL |
| `price` | numeric(12,2) | Recorded price |
| `notes` | text | |
| `recorded_at` | timestamptz | DEFAULT now() |
| `recorded_by` | uuid | FK→profiles(id) |

---

### 5. Customers & Orders

#### `customers`
Guest + registered customer records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | UNIQUE FK→profiles(id) SET NULL (null = guest) |
| `full_name` | text | DEFAULT '' |
| `email` | text | |
| `phone` | text | Normalized |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

#### `customer_addresses`
Saved delivery addresses.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `customer_id` | uuid | FK→customers(id) CASCADE |
| `label` | text | DEFAULT 'Delivery' |
| `recipient_name` | text | |
| `phone` | text | |
| `location` | text | Full delivery address |
| `instructions` | text | e.g., "Blue gate, 3rd floor" |
| `is_default` | boolean | DEFAULT false |
| `created_at` | timestamptz | |

---

#### `carts` / `cart_items`
Persistent cart (synced with Zustand store).

| Table | Columns |
|-------|---------|
| `carts` | id PK, user_id FK→profiles(id) UNIQUE CASCADE, updated_at |
| `cart_items` | id PK, cart_id FK CASCADE, product_id FK CASCADE, variant_id FK SET NULL, quantity CHECK 1-10, UNIQUE(cart_id, product_id, variant_id) |

---

#### `orders`
Main order table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `order_number` | text | NOT NULL UNIQUE (format: OM-YYYYMMDD-XXXXXX) |
| `customer_id` | uuid | FK→customers(id) SET NULL |
| `user_id` | uuid | FK→profiles(id) SET NULL |
| `guest_name` | text | NOT NULL |
| `guest_phone` | text | NOT NULL (normalized) |
| `guest_email` | text | |
| `delivery_location` | text | NOT NULL |
| `delivery_instructions` | text | |
| `status` | text | NOT NULL DEFAULT 'pending' CHECK enum |
| `currency` | text | NOT NULL DEFAULT 'KES' |
| `subtotal` | numeric(12,2) | >= 0 |
| `discount` | numeric(12,2) | >= 0 DEFAULT 0 |
| `total` | numeric(12,2) | >= 0 |
| `coupon_code` | text | |
| `requires_supplier_confirmation` | boolean | DEFAULT false |
| `stock_committed` | boolean | DEFAULT false |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

**Order Status Enum**:
`pending` → `awaiting_supplier_confirmation` → `confirmed` → `awaiting_payment` → `paid` → `processing` → `ready_for_delivery` → `dispatched` → `delivered`
Alternate: `cancelled`, `refunded`

**Indexes**: `guest_phone`, `status`

---

#### `order_items`
Line items per order.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `order_id` | uuid | FK→orders(id) CASCADE |
| `product_id` | uuid | FK→products(id) SET NULL |
| `variant_id` | uuid | FK→product_variants(id) SET NULL |
| `product_name` | text | NOT NULL (snapshot) |
| `quantity` | int | > 0 |
| `unit_price` | numeric(12,2) | >= 0 (snapshot) |
| `line_total` | numeric(12,2) | >= 0 |
| `fulfilment` | text | NOT NULL CHECK 'owned'/'supplier' |

---

#### `order_item_costs`
Cost per line (profit calculation).

| Column | Type | Description |
|--------|------|-------------|
| `order_item_id` | uuid | PK FK→order_items(id) CASCADE |
| `purchase_cost` | numeric(12,2) | >= 0 |

---

#### `order_status_history`
Audit trail of status changes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `order_id` | uuid | FK→orders(id) CASCADE |
| `status` | text | New status |
| `note` | text | Reason |
| `actor_id` | uuid | FK→profiles(id) SET NULL |
| `created_at` | timestamptz | DEFAULT now() |

---

#### `payment_records`
Payment tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `order_id` | uuid | FK→orders(id) CASCADE |
| `provider` | text | CHECK: unassigned/manual/mpesa_daraja |
| `status` | text | CHECK: unpaid/pending/confirmed/failed/refunded |
| `amount` | numeric(12,2) | >= 0 |
| `currency` | text | DEFAULT 'KES' |
| `reference` | text | M-Pesa transaction ID |
| `confirmed_by` | uuid | FK→profiles(id) SET NULL |
| `created_at` | timestamptz | DEFAULT now() |

**RLS**: Staff only.

---

#### `shipments`
Delivery tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `order_id` | uuid | FK→orders(id) CASCADE |
| `method` | text | Courier/self-delivery |
| `destination` | text | |
| `status` | text | DEFAULT 'preparing' |
| `notes` | text | |
| `dispatched_at` | timestamptz | |
| `delivered_at` | timestamptz | |
| `created_at` | timestamptz | |

---

#### `returns` / `refunds`
Post-sale processes.

| Table | Key Columns |
|-------|-------------|
| `returns` | id, order_id, reason, status (requested/accepted/rejected/completed), created_by, created_at |
| `refunds` | id, order_id, payment_id, amount, reason, status (recorded/failed), restock boolean, created_by, created_at |

---

#### `customer_inquiries`
Contact form submissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `name` | text | NOT NULL |
| `phone` | text | |
| `email` | text | |
| `product_id` | uuid | FK→products(id) SET NULL |
| `message` | text | 5-2000 chars CHECK |
| `status` | text | DEFAULT 'open' CHECK open/answered/closed |
| `created_at` | timestamptz | |

---

### 6. Marketing & Operations

| Table | Purpose |
|-------|---------|
| `product_reviews` | Customer reviews (rating 1-5, pending approval) |
| `wishlists` | User saved products (user_id + product_id PK) |
| `coupons` | Discount codes (percent/fixed, usage limits) |
| `promotional_banners` | Homepage hero banners |
| `newsletter_subscriptions` | Email list |
| `expense_categories` | Chart of accounts |
| `expenses` | Business expenses |
| `activity_logs` | Full audit trail (actor, action, entity, details JSONB) |
| `business_settings` | Key-value store (single row per key) |
| `employee_tasks` | Internal task management |
| `notifications` | In-app notifications per user |

---

## Key Views

### `catalogue_products` (Public API)
**Security**: `security_barrier = true, security_invoker = false`

Exposes only published products with public-safe fields:
- Product details (name, specs, prices)
- Brand & category names/slugs
- Real-time availability (owned_available, supplier_available)
- Primary image URL + all images JSONB
- Active variants JSONB
- Extra specs JSONB
- `search_text` for full-text search

**WHERE**: `publication_status = 'published'` AND `deleted_at IS NULL` AND `category.is_active = true`

**RLS**: Public `SELECT` only.

---

### `listing_price_spans`
Aggregated min/max price per model from research listings.

---

## Important Functions

### `normalize_phone(raw text) → text`
Converts Kenyan numbers to `2547XXXXXXXX` format.
- `2547...` → unchanged
- `07...` → `254` + rest
- `7...` (9 digits) → `254` + number

### `place_order(payload jsonb) → jsonb`
**Atomic order creation** with row-level locks:
1. Validates payload (name, phone, location, items)
2. Locks `inventory_balances` FOR UPDATE
3. Checks stock (owned → supplier fallback)
4. Calculates totals + coupon
5. Creates order + items + payment_record
6. Reserves stock (updates inventory_balances)
7. Logs activity + notifies owner
8. Returns `{order_id, order_number, status, total, ...}`

**SECURITY DEFINER** - runs with elevated privileges.

### `track_order(p_number, p_phone) → jsonb`
Guest order lookup by order_number + phone.

### `adjust_stock(p_product_id, p_bucket, p_delta, p_notes)`
Staff-only stock adjustment with movement logging.

### `update_order_status(p_order_id, p_status, p_note)`
Enforces state machine transitions.

### `log_activity(p_action, p_entity, p_entity_id, p_details)`
Central audit logger.

### `current_profile_role() → app_role`
Returns role for current `auth.uid()`.

### `is_staff() / is_owner() → boolean`
Role checks for RLS policies.

---

## RLS Policies Summary

### Public Access
| Table/View | Policy |
|------------|--------|
| `catalogue_products` | `SELECT` for all (published only) |
| `categories` | `SELECT` where `is_active` |
| `brands` | `SELECT` where `is_active` |

### Customer Access
| Table | Policy |
|-------|--------|
| `profiles` | `SELECT/UPDATE` own |
| `customers` | `SELECT/INSERT` own (via trigger) |
| `customer_addresses` | `ALL` own |
| `carts` / `cart_items` | `ALL` own cart |
| `orders` | `SELECT` own (by user_id or guest_phone) |
| `order_items` | `SELECT` own |
| `payment_records` | `SELECT` own |
| `product_reviews` | `SELECT` published; `INSERT` own (pending) |
| `wishlists` | `ALL` own |
| `notifications` | `SELECT/UPDATE` own |

### Staff Access (by Role)
| Role | Tables |
|------|--------|
| `owner` | ALL tables full access |
| `manager` | products (approve/publish), orders, inventory, suppliers, employees |
| `product_researcher` | research_listings, sourcing_tasks, product_verifications, products (draft) |
| `inventory_assistant` | inventory_balances, stock_movements, suppliers, inventory_units |
| `sales_assistant` | orders (process), customers, shipments, returns |

**Implementation**: `profiles_guard` trigger prevents non-owners from changing roles. `tg_guard_product` enforces publication workflow.

---

## Migration Instructions

### Applying Migrations
```bash
# Via Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Run files in supabase/migrations/ in order:
# 1. 20261112000000_oremitech_schema.sql
# 2. 20261116000000_product_seo_fields.sql
```

### Creating New Migrations
```bash
supabase migration new <name>
# Edit generated file in supabase/migrations/
# Test locally: supabase db reset
# Push: supabase db push
```

### Schema Changes Checklist
- [ ] Add RLS policies for new tables
- [ ] Add indexes for query patterns
- [ ] Update `catalogue_products` view if product fields change
- [ ] Add trigger for `updated_at` if needed
- [ ] Document in this file
- [ ] Test RLS with different roles

---

## Security Rules

### Never
- ❌ Put service_role key in frontend
- ❌ Disable RLS on any table
- ❌ Allow public INSERT/UPDATE on core tables
- ❌ Store plaintext passwords
- ❌ Expose `product_costs` to public

### Always
- ✅ Use `security_invoker` views for public data
- ✅ Validate all inputs in PostgreSQL functions
- ✅ Use `SECURITY DEFINER` for privileged operations
- ✅ Lock rows with `FOR UPDATE` in stock operations
- ✅ Log all state changes via `log_activity()`

---

## Seed Data

### Required for Development
Run in Supabase SQL Editor after migrations:
```sql
-- Categories (Laptops, Desktops, Monitors, etc.)
-- Brands (HP, Dell, Lenovo, Apple, ASUS, Acer)
-- Admin user (assign role='owner' in profiles)
```

### Fallback Catalogue
Frontend includes `FALLBACK_CATALOGUE` in `src/data/fallbackCatalogue.ts` for zero-config demos.

---

## Backup & Recovery

### Supabase (Managed)
- Point-in-time recovery (PITR) enabled
- Daily backups retained 7 days (Pro) / 30 days (Enterprise)

### Manual Backup
```bash
# Schema only
pg_dump --schema-only -h <host> -U postgres postgres > schema.sql

# Data only (exclude auth)
pg_dump --data-only --exclude-table=auth.* -h <host> -U postgres postgres > data.sql
```

---

## Version History

| Migration | Date | Description |
|-----------|------|-------------|
| 20261112000000 | 2026-11-12 | Complete OREMITECH schema |
| 20261116000000 | 2026-11-16 | Added SEO fields to products |

---

*Keep this document updated with every migration.*