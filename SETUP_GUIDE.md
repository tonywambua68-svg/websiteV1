# OREMITECH E-Commerce — Complete System Setup Guide

This guide covers deployment, environment configuration, database setup, and user roles for the **OREMITECH** laptop e-commerce platform.

---

## 1. Business Parameters
- **Company Name:** OREMITECH
- **Jurisdiction:** Kenya
- **Base Currency:** KES (Kenyan Shillings - `KSh`)
- **Timezone:** Africa/Nairobi (`UTC+3`, EAT)
- **Primary Product Catalogue:** Laptops (Business, Gaming, Student, Workstations) & Computer Accessories (Monitors, NVMe SSDs, Peripherals).

---

## 2. Infrastructure Setup (Supabase Free Tier)

### Step 2.1: Create Project
1. Log in to [Supabase](https://supabase.com).
2. Create a new project called `oremitech-ecommerce` (select the closest region, e.g. South Africa/Europe/Middle East).
3. Save your database password securely.

### Step 2.2: Execute Schema Migration
1. In the Supabase project dashboard, open **SQL Editor**.
2. Open `supabase/migrations/20261112000000_oremitech_schema.sql` from this repository.
3. Paste the contents into the SQL Editor and click **Run**.
4. This script sets up:
   - Types and enums (`app_role`, `availability`, `order_status`).
   - Tables with Row Level Security (RLS) enabled.
   - Atomic functions (`place_web_order`, `advance_order_status`, `record_payment_reference`, `adjust_stock_balance`).
   - The public-facing `catalogue_products` view.
   - Initial category, brand, and business settings seed data.

### Step 2.3: Configure Storage Buckets
1. In Supabase dashboard -> **Storage**, verify the `product-images` bucket.
2. Ensure public read access is enabled so product images can load on the customer storefront.

---

## 3. Environment Variables

Create `.env` based on `.env.example`:

```env
# Required Supabase Connection
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Business Branding
VITE_SITE_NAME=OREMITECH
VITE_SITE_TAGLINE=Verified laptops and computer accessories in Kenya
VITE_CURRENCY=KES
VITE_TIMEZONE=Africa/Nairobi

# Contact Channels
VITE_WHATSAPP_NUMBER=254700000000
VITE_STORE_EMAIL=support@oremitech.co.ke
VITE_STORE_LOCATION=Nairobi, Kenya

# Optional Analytics
VITE_GA_MEASUREMENT_ID=
VITE_GSC_VERIFICATION=
```

> **IMPORTANT:** Never expose the `service_role` key in frontend environment variables. All frontend interactions use the anon key with PostgreSQL Row Level Security enforcing permissions.

---

## 4. Staff Roles & Initial Owner Promotion

The system recognizes 5 staff roles and 1 customer role:
1. `owner`: Unrestricted administrative, financial, employee, and publication authority.
2. `manager`: Operational and catalog management.
3. `product_researcher`: Sourcing market scans and research queue logging.
4. `inventory_assistant`: Stock receipts, count adjustments, and warehouse ledger.
5. `sales_assistant`: Customer order coordination and dispatch logging.
6. `customer`: Public customer shopping, order tracking, and profile.

### Promoting the First Owner:
1. Go to the storefront `/login` and sign up with your email.
2. In Supabase **SQL Editor**, run:
   ```sql
   update public.profiles
   set role = 'owner', account_status = 'active'
   where email = 'your-owner-email@oremitech.co.ke';
   ```
3. Refresh your session or sign in to access `/admin`.

---

## 5. Verification & Quality Assurance Pipeline

1. **Discovery:** Staff logs public laptop listings under `/employee` or `/admin/research`.
2. **Physical Check:** Staff physically tests display, keyboard, ports, and battery health, logging diagnostic findings.
3. **Owner Approval:** Owner signs off on selling price, margin, and condition.
4. **Publishing:** Approved products immediately become visible in the customer storefront.

---

## 6. Cloudflare Pages Deployment

1. Connect the GitHub repository to Cloudflare Pages.
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Environment variables: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Cloudflare Pages uses `public/_redirects` to handle single-page application routing smoothly.
