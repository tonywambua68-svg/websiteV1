-- OREMITECH delivery foundation migration
-- Adds delivery zones, delivery rates, and delivery-related columns to orders and shipments
-- Apply after 20261117000001_blog_and_category_seo.sql
-- No delivery prices are seeded. The owner must configure rates after obtaining actual quotes.

-- ---------------------------------------------------------------------------
-- Delivery zones
-- ---------------------------------------------------------------------------

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  counties text[] not null default '{}',
  towns text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Delivery rates
-- ---------------------------------------------------------------------------

create table if not exists public.delivery_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.delivery_zones (id) on delete cascade,
  min_order numeric(12,2) not null default 0 check (min_order >= 0),
  max_order numeric(12,2) check (max_order >= 0),
  rate_kes numeric(12,2) not null check (rate_kes >= 0),
  cod_eligible boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_rates_max_gte_min check (max_order is null or max_order >= min_order)
);

-- ---------------------------------------------------------------------------
-- Delivery-related columns on orders
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  add column if not exists payment_method text,
  add column if not exists cod_collection_confirmed boolean not null default false,
  add column if not exists delivery_zone_id uuid references public.delivery_zones (id),
  add column if not exists delivery_zone_name text,
  add column if not exists delivery_method text;

-- ---------------------------------------------------------------------------
-- Delivery-related extensions to shipments
-- ---------------------------------------------------------------------------

alter table public.shipments
  add column if not exists provider text,
  add column if not exists rider_name text,
  add column if not exists rider_phone text,
  add column if not exists waybill text,
  add column if not exists expected_delivery_at timestamptz,
  add column if not exists delivery_confirmed_at timestamptz,
  add column if not exists proof_of_delivery_ref text,
  add column if not exists condition_noted_at_handover text,
  add column if not exists delivery_attempts int not null default 0 check (delivery_attempts >= 0);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- delivery_zones.name already has a unique index from the unique constraint;
-- idx_delivery_zones_name removed as redundant.
create index if not exists idx_delivery_zones_active on public.delivery_zones (is_active);

-- (zone_id, is_active) composite covers zone_id-only lookups;
-- idx_delivery_rates_zone removed as redundant.
create index if not exists idx_delivery_rates_active on public.delivery_rates (zone_id, is_active);

-- idx_orders_delivery_fee removed: low selectivity, not useful for actual queries.
create index if not exists idx_orders_payment_method on public.orders (payment_method);
create index if not exists idx_orders_delivery_zone on public.orders (delivery_zone_id);
create index if not exists idx_shipments_order on public.shipments (order_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.delivery_zones enable row level security;
alter table public.delivery_rates enable row level security;

-- Public can read active zones and rates (needed for checkout fee calculation)
drop policy if exists delivery_zones_public_read on public.delivery_zones;
create policy delivery_zones_public_read on public.delivery_zones
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists delivery_rates_public_read on public.delivery_rates;
create policy delivery_rates_public_read on public.delivery_rates
  for select to anon, authenticated
  using (is_active = true);

-- Staff can manage zones and rates
drop policy if exists delivery_zones_staff_manage on public.delivery_zones;
create policy delivery_zones_staff_manage on public.delivery_zones
  for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

drop policy if exists delivery_rates_staff_manage on public.delivery_rates;
create policy delivery_rates_staff_manage on public.delivery_rates
  for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists delivery_zones_updated_at on public.delivery_zones;
create trigger delivery_zones_updated_at
  before update on public.delivery_zones
  for each row execute function public.touch_updated_at();

drop trigger if exists delivery_rates_updated_at on public.delivery_rates;
create trigger delivery_rates_updated_at
  before update on public.delivery_rates
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select on public.delivery_zones, public.delivery_rates to anon, authenticated;
grant select, insert, update, delete on public.delivery_zones, public.delivery_rates to authenticated;

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
-- 1. delivery_zone_id on orders is a FK to delivery_zones; delivery_zone_name is a
--    snapshot for order history (zones may be renamed).
-- 2. get-delivery-fees provides the checkout estimate. place_order independently
--    selects the active matching rate from delivery_rates and calculates the
--    final total; the checkout's displayed fee is not trusted by the database.
-- 3. public.is_staff() governs who can manage delivery config. Ensure it only
--    includes roles authorized to set rates/zones (owner, manager).
-- 4. Rate tier overlap (multiple active rates for one zone covering the same
--    order range) is not enforced at the DB level; enforce in application logic.
