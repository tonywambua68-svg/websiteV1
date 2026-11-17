-- OREMITECH business schema for Supabase PostgreSQL.
-- Apply with the Supabase CLI or the SQL editor. Do not put the service role key in the frontend.
-- The first owner is assigned with SQL (see docs/EMPLOYEES.md). Nobody can grant themselves owner from the app.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.app_role as enum (
    'owner',
    'manager',
    'product_researcher',
    'inventory_assistant',
    'sales_assistant',
    'customer'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.normalize_phone(raw text)
returns text
language plpgsql
immutable
as $$
declare
  d text;
begin
  d := regexp_replace(coalesce(raw, ''), '[^0-9]', '', 'g');
  if d like '254%' and char_length(d) >= 12 then
    return d;
  elsif d like '0%' and char_length(d) = 10 then
    return '254' || substr(d, 2);
  elsif char_length(d) = 9 then
    return '254' || d;
  else
    return d;
  end if;
end;
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(auth.role(), '') = 'service_role'
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,
  role public.app_role not null default 'customer',
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and account_status = 'active'
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() in (
    'owner', 'manager', 'product_researcher', 'inventory_assistant', 'sales_assistant'
  )
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'owner'
$$;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  menu_group text not null default 'catalogue',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  model text,
  description text not null default '',
  category_id uuid not null references public.categories (id),
  brand_id uuid references public.brands (id),
  processor_manufacturer text,
  processor_model text,
  processor_generation text,
  ram text,
  ram_type text,
  storage_capacity text,
  storage_type text,
  screen_size text,
  screen_resolution text,
  graphics text,
  operating_system text,
  keyboard_layout text,
  battery_condition text,
  laptop_condition text not null default 'unspecified',
  warranty text,
  weight text,
  colour text,
  selling_price numeric(12,2) not null check (selling_price >= 0),
  comparison_price numeric(12,2),
  featured boolean not null default false,
  publication_status text not null default 'draft' check (publication_status in (
    'draft', 'pending_approval', 'approved', 'published', 'rejected', 'archived'
  )),
  seo_title text,
  seo_description text,
  review_note text,
  created_by uuid references public.profiles (id),
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comparison_price_chk check (comparison_price is null or comparison_price > selling_price)
);

create table if not exists public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  purchase_cost numeric(12,2) not null check (purchase_cost >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  spec_key text not null,
  spec_value text not null,
  sort_order int not null default 0,
  unique (product_id, spec_key)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text,
  label text not null,
  selling_price numeric(12,2) not null check (selling_price >= 0),
  ram text,
  storage_capacity text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table if not exists public.product_tag_links (
  product_id uuid not null references public.products (id) on delete cascade,
  tag_id uuid not null references public.product_tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_balances (
  product_id uuid primary key references public.products (id) on delete cascade,
  owned_qty int not null default 0 check (owned_qty >= 0),
  supplier_qty int not null default 0 check (supplier_qty >= 0),
  reserved_qty int not null default 0 check (reserved_qty >= 0),
  supplier_reserved_qty int not null default 0 check (supplier_reserved_qty >= 0),
  damaged_qty int not null default 0 check (damaged_qty >= 0),
  awaiting_verification_qty int not null default 0 check (awaiting_verification_qty >= 0),
  reorder_level int not null default 1 check (reorder_level >= 0),
  updated_at timestamptz not null default now(),
  constraint reserved_within_owned check (reserved_qty <= owned_qty),
  constraint supplier_reserved_within check (supplier_reserved_qty <= supplier_qty)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  shop_name text,
  contact_person text,
  phone text,
  email text,
  physical_location text,
  nairobi_area text,
  website_url text,
  supplier_type text not null default 'retailer',
  reliability_rating int check (reliability_rating is null or reliability_rating between 1 and 5),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'pending', 'verified', 'blocked')),
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  contact_person text not null,
  phone text,
  email text,
  role_title text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  supplier_id uuid references public.suppliers (id),
  serial_number text,
  ownership text not null check (ownership in (
    'owned', 'supplier', 'awaiting_verification', 'reserved', 'sold', 'damaged'
  )),
  status text not null default 'available',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  movement_type text not null check (movement_type in (
    'restock', 'adjustment', 'reserve', 'release', 'sale', 'damage', 'return', 'supplier_in', 'supplier_reserve', 'supplier_release'
  )),
  quantity int not null check (quantity <> 0),
  bucket text not null,
  reference_type text,
  reference_id uuid,
  notes text,
  actor_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Research
-- ---------------------------------------------------------------------------

create table if not exists public.research_listings (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text,
  title text not null,
  advertised_price numeric(12,2),
  advertised_specs jsonb not null default '{}'::jsonb,
  supplier_id uuid references public.suppliers (id),
  status text not null default 'discovered' check (status in (
    'discovered', 'under_review', 'needs_physical_verification', 'verified',
    'draft', 'approved', 'published', 'rejected', 'unavailable', 'expired'
  )),
  permitted_source boolean not null default false,
  discovered_at timestamptz not null default now(),
  collected_at timestamptz not null default now(),
  expires_hint timestamptz,
  notes text,
  discovered_by uuid references public.profiles (id),
  product_id uuid references public.products (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_permitted_chk check (permitted_source)
);

create unique index if not exists research_source_url_unique
  on public.research_listings (source_url)
  where source_url is not null;

create table if not exists public.sourcing_tasks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.research_listings (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  assigned_to uuid references public.profiles (id),
  title text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_verifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  listing_id uuid references public.research_listings (id) on delete set null,
  supplier_id uuid references public.suppliers (id),
  verified_price numeric(12,2),
  verified_specs jsonb not null default '{}'::jsonb,
  condition text,
  notes text,
  result text not null default 'pending' check (result in ('pending', 'verified', 'rejected')),
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.verification_photos (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.product_verifications (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_price_history (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  listing_id uuid references public.research_listings (id) on delete set null,
  price numeric(12,2) not null check (price >= 0),
  notes text,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id)
);

-- ---------------------------------------------------------------------------
-- Customers and orders
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null default '',
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  label text not null default 'Delivery',
  recipient_name text not null,
  phone text not null,
  location text not null,
  instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  quantity int not null check (quantity > 0 and quantity <= 10),
  unique (cart_id, product_id, variant_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers (id),
  user_id uuid references public.profiles (id),
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  delivery_location text not null,
  delivery_instructions text,
  status text not null default 'pending' check (status in (
    'pending', 'awaiting_supplier_confirmation', 'confirmed', 'awaiting_payment',
    'paid', 'processing', 'ready_for_delivery', 'dispatched', 'delivered',
    'cancelled', 'refunded'
  )),
  currency text not null default 'KES',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null check (total >= 0),
  coupon_code text,
  requires_supplier_confirmation boolean not null default false,
  stock_committed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id),
  variant_id uuid references public.product_variants (id),
  product_name text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  fulfilment text not null check (fulfilment in ('owned', 'supplier'))
);

create table if not exists public.order_item_costs (
  order_item_id uuid primary key references public.order_items (id) on delete cascade,
  purchase_cost numeric(12,2) not null check (purchase_cost >= 0)
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  actor_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null check (provider in ('unassigned', 'manual', 'mpesa_daraja')),
  status text not null check (status in ('unpaid', 'pending', 'confirmed', 'failed', 'refunded')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'KES',
  reference text,
  confirmed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  method text,
  destination text,
  status text not null default 'preparing',
  notes text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  reason text not null,
  status text not null default 'requested' check (status in ('requested', 'accepted', 'rejected', 'completed')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  payment_id uuid references public.payment_records (id),
  amount numeric(12,2) not null check (amount >= 0),
  reason text,
  status text not null default 'recorded' check (status in ('recorded', 'failed')),
  restock boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  product_id uuid references public.products (id) on delete set null,
  message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Marketing and operations
-- ---------------------------------------------------------------------------

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 2 and 2000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create table if not exists public.wishlists (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  amount numeric(12,2) not null check (amount > 0),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  min_order numeric(12,2),
  usage_limit int,
  used_count int not null default 0 check (used_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.promotional_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  href text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.expense_categories (id),
  amount numeric(12,2) not null check (amount >= 0),
  incurred_on date not null default (now() at time zone 'Africa/Nairobi')::date,
  vendor text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.business_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table if not exists public.employee_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text,
  assigned_to uuid references public.profiles (id),
  assigned_by uuid references public.profiles (id),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists products_publication_idx on public.products (publication_status) where deleted_at is null;
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_brand_idx on public.products (brand_id);
create index if not exists orders_phone_idx on public.orders (guest_phone);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists movements_product_idx on public.stock_movements (product_id, created_at desc);
create index if not exists activity_created_idx on public.activity_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Profile bootstrap and privilege guard
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'customer'), '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  on conflict (id) do nothing;

  insert into public.customers (user_id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'customer'), '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.tg_guard_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_service_role() then
    new.updated_at := now();
    return new;
  end if;

  if old.role = 'owner' and new.role is distinct from 'owner' then
    if (
      select count(*) from public.profiles
      where role = 'owner' and account_status = 'active' and id <> old.id
    ) < 1 then
      raise exception 'Keep at least one active owner';
    end if;
  end if;

  if new.role is distinct from old.role or new.account_status is distinct from old.account_status then
    if public.current_profile_role() is distinct from 'owner' then
      raise exception 'Only the owner can change roles or account status';
    end if;
  end if;

  if public.current_profile_role() is distinct from 'owner' and new.id is distinct from auth.uid() then
    raise exception 'You can only edit your own profile';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.tg_guard_profile();

-- ---------------------------------------------------------------------------
-- Product guards
-- ---------------------------------------------------------------------------

create or replace function public.tg_guard_product()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.app_role;
begin
  if tg_op = 'INSERT' then
    new.publication_status := 'draft';
    new.approved_by := null;
    new.approved_at := null;
    new.published_at := null;
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_at := now();
    return new;
  end if;

  if auth.uid() is null or public.is_service_role() then
    new.updated_at := now();
    return new;
  end if;

  actor := public.current_profile_role();

  if new.deleted_at is distinct from old.deleted_at and actor is distinct from 'owner' then
    raise exception 'Only the owner can archive products';
  end if;

  if new.publication_status is distinct from old.publication_status
     and new.publication_status not in ('draft', 'pending_approval')
     and actor is distinct from 'owner' then
    raise exception 'Only the owner can approve or publish products';
  end if;

  if actor is distinct from 'owner' then
    new.approved_by := old.approved_by;
    new.approved_at := old.approved_at;
    new.published_at := old.published_at;
    if old.publication_status = 'published' then
      new.publication_status := 'draft';
      new.published_at := null;
    end if;
  end if;

  if new.publication_status in ('approved', 'published')
     and old.publication_status is distinct from new.publication_status then
    if not exists (
      select 1 from public.product_verifications v
      where v.product_id = new.id and v.result = 'verified'
    ) then
      raise exception 'A verified physical check is required before approval or publication';
    end if;
  end if;

  if new.publication_status = 'published'
     and old.publication_status is distinct from 'published'
     and old.publication_status is distinct from 'approved' then
    raise exception 'Approve the product before publishing';
  end if;

  if new.publication_status = 'approved' and old.publication_status is distinct from 'approved' then
    new.approved_by := auth.uid();
    new.approved_at := now();
  end if;

  if new.publication_status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.tg_product_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory_balances (product_id) values (new.id)
  on conflict (product_id) do nothing;
  return new;
end;
$$;

create or replace function public.log_activity(
  p_action text,
  p_entity text,
  p_entity_id uuid,
  p_details jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
end;
$$;

create or replace function public.tg_product_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity('product.created', 'product', new.id, jsonb_build_object('name', new.name));
  elsif tg_op = 'UPDATE' then
    if new.selling_price is distinct from old.selling_price then
      perform public.log_activity(
        'price.changed', 'product', new.id,
        jsonb_build_object('from', old.selling_price, 'to', new.selling_price)
      );
    end if;
    if new.publication_status is distinct from old.publication_status and new.publication_status = 'approved' then
      perform public.log_activity('product.approved', 'product', new.id, '{}'::jsonb);
    end if;
    if new.publication_status is distinct from old.publication_status and new.publication_status = 'published' then
      perform public.log_activity('product.published', 'product', new.id, '{}'::jsonb);
    end if;
    perform public.log_activity(
      'product.updated', 'product', new.id,
      jsonb_build_object('publication_status', new.publication_status)
    );
  end if;
  return new;
end;
$$;

create or replace function public.tg_sync_listing_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.publication_status is distinct from old.publication_status
     and new.publication_status in ('approved', 'published', 'draft', 'rejected') then
    update public.research_listings
      set status = new.publication_status, updated_at = now()
      where product_id = new.id
        and status not in ('rejected', 'unavailable', 'expired');
  end if;
  return new;
end;
$$;

drop trigger if exists products_guard on public.products;
create trigger products_guard
  before insert or update on public.products
  for each row execute function public.tg_guard_product();

drop trigger if exists products_inventory on public.products;
create trigger products_inventory
  after insert on public.products
  for each row execute function public.tg_product_inventory();

drop trigger if exists products_activity on public.products;
create trigger products_activity
  after insert or update on public.products
  for each row execute function public.tg_product_activity();

drop trigger if exists products_sync_listing on public.products;
create trigger products_sync_listing
  after update on public.products
  for each row execute function public.tg_sync_listing_status();

create or replace function public.tg_reviews_pending()
returns trigger
language plpgsql
as $$
begin
  if public.current_profile_role() is distinct from 'owner'
     and public.current_profile_role() is distinct from 'manager' then
    new.status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_force_pending on public.product_reviews;
create trigger reviews_force_pending
  before insert on public.product_reviews
  for each row execute function public.tg_reviews_pending();

create or replace function public.tg_listing_url()
returns trigger
language plpgsql
as $$
begin
  if new.source_url is not null and length(trim(new.source_url)) = 0 then
    new.source_url := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists listings_url on public.research_listings;
create trigger listings_url
  before insert or update on public.research_listings
  for each row execute function public.tg_listing_url();

-- ---------------------------------------------------------------------------
-- Public catalogue (no purchase cost, no supplier identity)
-- ---------------------------------------------------------------------------

create or replace view public.catalogue_products
with (security_barrier = true, security_invoker = false) as
select
  p.id,
  p.slug,
  p.name,
  p.model,
  p.description,
  p.selling_price,
  p.comparison_price,
  p.featured,
  p.laptop_condition,
  p.warranty,
  p.processor_manufacturer,
  p.processor_model,
  p.processor_generation,
  p.ram,
  p.ram_type,
  p.storage_capacity,
  p.storage_type,
  p.screen_size,
  p.screen_resolution,
  p.graphics,
  p.operating_system,
  p.keyboard_layout,
  p.battery_condition,
  p.weight,
  p.colour,
  p.seo_title,
  p.seo_description,
  p.published_at,
  p.created_at,
  b.name as brand_name,
  b.slug as brand_slug,
  c.name as category_name,
  c.slug as category_slug,
  c.menu_group,
  greatest(i.owned_qty - i.reserved_qty, 0) as owned_available,
  greatest(i.supplier_qty - i.supplier_reserved_qty, 0) as supplier_available,
  case
    when greatest(i.owned_qty - i.reserved_qty, 0) > 0 then 'in_stock'
    when greatest(i.supplier_qty - i.supplier_reserved_qty, 0) > 0 then 'supplier'
    else 'unavailable'
  end as availability,
  (
    select im.url from public.product_images im
    where im.product_id = p.id
    order by im.is_primary desc, im.sort_order, im.created_at
    limit 1
  ) as image_url,
  (
    select coalesce(
      jsonb_agg(jsonb_build_object('url', im.url, 'alt', coalesce(im.alt, p.name)) order by im.is_primary desc, im.sort_order),
      '[]'::jsonb
    )
    from public.product_images im
    where im.product_id = p.id
  ) as images,
  (
    select coalesce(
      jsonb_agg(jsonb_build_object(
        'id', v.id, 'label', v.label, 'selling_price', v.selling_price,
        'ram', v.ram, 'storage_capacity', v.storage_capacity
      ) order by v.selling_price),
      '[]'::jsonb
    )
    from public.product_variants v
    where v.product_id = p.id and v.is_active
  ) as variants,
  (
    select coalesce(jsonb_object_agg(s.spec_key, s.spec_value), '{}'::jsonb)
    from public.product_specifications s
    where s.product_id = p.id
  ) as extra_specs,
  lower(concat_ws(' ',
    p.name, p.model, p.processor_manufacturer, p.processor_model, p.processor_generation,
    p.ram, p.storage_capacity, p.storage_type, b.name, c.name, p.colour
  )) as search_text
from public.products p
join public.categories c on c.id = p.category_id
left join public.brands b on b.id = p.brand_id
join public.inventory_balances i on i.product_id = p.id
where p.publication_status = 'published'
  and p.deleted_at is null
  and c.is_active = true;

create or replace view public.listing_price_spans
with (security_barrier = true, security_invoker = true) as
select
  lower(trim(title)) as model_key,
  min(advertised_price) as min_price,
  max(advertised_price) as max_price,
  count(*)::int as listings
from public.research_listings
where advertised_price is not null
group by 1;

-- ---------------------------------------------------------------------------
-- Orders, stock, payments
-- ---------------------------------------------------------------------------

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_phone text;
  v_email text;
  v_location text;
  v_instructions text;
  v_coupon text;
  v_grouped jsonb;
  r record;
  v_pid uuid;
  v_qty int;
  v_variant uuid;
  v_product public.products%rowtype;
  v_price numeric(12,2);
  v_label text;
  v_variant_label text;
  v_owned_free int;
  v_supplier_free int;
  v_fulfilment text;
  v_lines jsonb := '[]'::jsonb;
  v_remaining jsonb := '{}'::jsonb;
  v_ids uuid[];
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_supplier boolean := false;
  v_order_id uuid;
  v_number text;
  v_status text;
  v_customer_id uuid;
  v_user uuid;
  v_coupon_row public.coupons%rowtype;
begin
  v_user := auth.uid();
  v_name := nullif(trim(coalesce(payload->>'customer_name', '')), '');
  v_phone := public.normalize_phone(coalesce(payload->>'phone', ''));
  v_email := nullif(trim(coalesce(payload->>'email', '')), '');
  v_location := nullif(trim(coalesce(payload->>'delivery_location', '')), '');
  v_instructions := nullif(trim(coalesce(payload->>'delivery_instructions', '')), '');
  v_coupon := nullif(upper(trim(coalesce(payload->>'coupon_code', ''))), '');

  if v_name is null or char_length(v_name) < 2 then
    raise exception 'Enter the customer name';
  end if;
  if v_phone is null or char_length(v_phone) < 11 then
    raise exception 'Enter a valid Kenyan phone number';
  end if;
  if v_location is null or char_length(v_location) < 3 then
    raise exception 'Enter the delivery location';
  end if;
  if jsonb_typeof(payload->'items') is distinct from 'array'
     or jsonb_array_length(payload->'items') < 1
     or jsonb_array_length(payload->'items') > 20 then
    raise exception 'An order must contain between 1 and 20 lines';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', product_id,
    'variant_id', variant_id,
    'quantity', quantity
  )), '[]'::jsonb)
  into v_grouped
  from (
    select
      (value->>'product_id')::uuid as product_id,
      nullif(value->>'variant_id', '')::uuid as variant_id,
      sum((value->>'quantity')::int) as quantity
    from jsonb_array_elements(payload->'items')
    group by 1, 2
  ) s;

  select coalesce(array_agg(distinct (value->>'product_id')::uuid), '{}')
  into v_ids
  from jsonb_array_elements(v_grouped);

  perform 1
  from public.inventory_balances
  where product_id = any (v_ids)
  order by product_id
  for update;

  for r in
    select product_id, owned_qty - reserved_qty as owned_free, supplier_qty - supplier_reserved_qty as supplier_free
    from public.inventory_balances
    where product_id = any (v_ids)
  loop
    v_remaining := v_remaining || jsonb_build_object(
      r.product_id::text,
      jsonb_build_object('owned', r.owned_free, 'supplier', r.supplier_free)
    );
  end loop;

  for r in select value as item from jsonb_array_elements(v_grouped)
  loop
    v_pid := (r.item->>'product_id')::uuid;
    v_qty := (r.item->>'quantity')::int;
    v_variant := nullif(r.item->>'variant_id', '')::uuid;

    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'Quantity must be between 1 and 10';
    end if;

    select * into v_product from public.products where id = v_pid;
    if not found or v_product.deleted_at is not null or v_product.publication_status <> 'published' then
      raise exception 'A product in the cart is not available';
    end if;

    if not (v_remaining ? v_pid::text) then
      raise exception 'Inventory is missing for a product';
    end if;

    v_price := v_product.selling_price;
    v_label := v_product.name;
    if v_variant is not null then
      select pv.selling_price, pv.label
      into v_price, v_variant_label
      from public.product_variants pv
      where pv.id = v_variant and pv.product_id = v_pid and pv.is_active;
      if not found then
        raise exception 'That product option is not available';
      end if;
      v_label := v_product.name || ' — ' || v_variant_label;
    end if;

    v_owned_free := coalesce((v_remaining->(v_pid::text)->>'owned')::int, 0);
    v_supplier_free := coalesce((v_remaining->(v_pid::text)->>'supplier')::int, 0);

    if v_owned_free >= v_qty then
      v_fulfilment := 'owned';
      v_remaining := jsonb_set(v_remaining, array[v_pid::text, 'owned'], to_jsonb(v_owned_free - v_qty));
    elsif v_supplier_free >= v_qty then
      v_fulfilment := 'supplier';
      v_supplier := true;
      v_remaining := jsonb_set(v_remaining, array[v_pid::text, 'supplier'], to_jsonb(v_supplier_free - v_qty));
    else
      raise exception 'Not enough stock for %', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_price * v_qty);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_pid,
      'variant_id', v_variant,
      'name', v_label,
      'quantity', v_qty,
      'unit_price', v_price,
      'fulfilment', v_fulfilment
    ));
  end loop;

  if v_coupon is not null then
    select * into v_coupon_row
    from public.coupons
    where code = v_coupon
      and is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
      and (usage_limit is null or used_count < usage_limit);
    if not found then
      raise exception 'That coupon cannot be applied';
    end if;
    if v_coupon_row.min_order is not null and v_subtotal < v_coupon_row.min_order then
      raise exception 'That coupon cannot be applied';
    end if;
    if v_coupon_row.discount_type = 'percent' then
      v_discount := round(v_subtotal * (v_coupon_row.amount / 100.0), 2);
    else
      v_discount := least(v_coupon_row.amount, v_subtotal);
    end if;
    v_discount := least(v_discount, v_subtotal);
  end if;

  v_total := v_subtotal - v_discount;
  v_status := case when v_supplier then 'awaiting_supplier_confirmation' else 'pending' end;
  v_number := 'OM-' || to_char(now() at time zone 'Africa/Nairobi', 'YYYYMMDD')
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  if v_user is not null then
    select id into v_customer_id from public.customers where user_id = v_user;
  end if;

  insert into public.orders (
    order_number, customer_id, user_id, guest_name, guest_phone, guest_email,
    delivery_location, delivery_instructions, status, subtotal, discount, total,
    coupon_code, requires_supplier_confirmation
  ) values (
    v_number, v_customer_id, v_user, v_name, v_phone, v_email,
    v_location, v_instructions, v_status, v_subtotal, v_discount, v_total,
    v_coupon, v_supplier
  ) returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, quantity, unit_price, line_total, fulfilment
  )
  select
    v_order_id,
    (line->>'product_id')::uuid,
    nullif(line->>'variant_id', '')::uuid,
    line->>'name',
    (line->>'quantity')::int,
    (line->>'unit_price')::numeric,
    (line->>'unit_price')::numeric * (line->>'quantity')::int,
    line->>'fulfilment'
  from jsonb_array_elements(v_lines) line;

  insert into public.order_item_costs (order_item_id, purchase_cost)
  select oi.id, pc.purchase_cost
  from public.order_items oi
  join public.product_costs pc on pc.product_id = oi.product_id
  where oi.order_id = v_order_id;

  for r in select value as item from jsonb_array_elements(v_lines)
  loop
    if r.item->>'fulfilment' = 'owned' then
      update public.inventory_balances
        set reserved_qty = reserved_qty + (r.item->>'quantity')::int,
            updated_at = now()
        where product_id = (r.item->>'product_id')::uuid;
      insert into public.stock_movements (product_id, movement_type, quantity, bucket, reference_type, reference_id, notes, actor_id)
      values (
        (r.item->>'product_id')::uuid, 'reserve', (r.item->>'quantity')::int,
        'owned', 'order', v_order_id, 'Reserved for ' || v_number, v_user
      );
    else
      update public.inventory_balances
        set supplier_reserved_qty = supplier_reserved_qty + (r.item->>'quantity')::int,
            updated_at = now()
        where product_id = (r.item->>'product_id')::uuid;
      insert into public.stock_movements (product_id, movement_type, quantity, bucket, reference_type, reference_id, notes, actor_id)
      values (
        (r.item->>'product_id')::uuid, 'supplier_reserve', (r.item->>'quantity')::int,
        'supplier', 'order', v_order_id, 'Supplier reservation for ' || v_number, v_user
      );
    end if;
  end loop;

  if v_coupon is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon_row.id;
  end if;

  insert into public.payment_records (order_id, provider, status, amount, currency)
  values (v_order_id, 'unassigned', 'unpaid', v_total, 'KES');

  insert into public.order_status_history (order_id, status, note, actor_id)
  values (v_order_id, v_status, 'Order recorded. Payment has not been confirmed.', v_user);

  perform public.log_activity('order.created', 'order', v_order_id, jsonb_build_object('order_number', v_number, 'total', v_total));

  insert into public.notifications (user_id, title, body, href)
  select p.id, 'New order ' || v_number, v_name || ' placed an order', '/admin/orders'
  from public.profiles p
  where p.role = 'owner' and p.account_status = 'active';

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_number,
    'status', v_status,
    'payment_status', 'unpaid',
    'total', v_total,
    'currency', 'KES',
    'requires_supplier_confirmation', v_supplier
  );
end;
$$;

create or replace function public.track_order(p_number text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
  v_history jsonb;
begin
  select * into v_order
  from public.orders
  where order_number = upper(trim(p_number))
    and guest_phone = public.normalize_phone(p_phone);

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', product_name,
    'quantity', quantity,
    'unit_price', unit_price,
    'line_total', line_total,
    'fulfilment', fulfilment
  )), '[]'::jsonb)
  into v_items
  from public.order_items
  where order_id = v_order.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'status', status,
    'note', note,
    'created_at', created_at
  ) order by created_at), '[]'::jsonb)
  into v_history
  from public.order_status_history
  where order_id = v_order.id;

  return jsonb_build_object(
    'found', true,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'total', v_order.total,
    'currency', v_order.currency,
    'requires_supplier_confirmation', v_order.requires_supplier_confirmation,
    'delivery_location', v_order.delivery_location,
    'created_at', v_order.created_at,
    'items', v_items,
    'history', v_history,
    'payment_status', coalesce((
      select pr.status from public.payment_records pr
      where pr.order_id = v_order.id
      order by case pr.status when 'confirmed' then 0 when 'pending' then 1 else 2 end, pr.created_at desc
      limit 1
    ), 'unpaid')
  );
end;
$$;

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_bucket text,
  p_delta int,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_profile_role() not in ('owner', 'manager', 'inventory_assistant') then
    raise exception 'You cannot adjust stock';
  end if;
  if p_delta = 0 then
    raise exception 'Enter a quantity other than zero';
  end if;
  if p_bucket not in ('owned', 'supplier', 'damaged', 'awaiting_verification') then
    raise exception 'Unknown stock bucket';
  end if;

  perform 1 from public.inventory_balances where product_id = p_product_id for update;
  if not found then
    raise exception 'Product inventory was not found';
  end if;

  if p_bucket = 'owned' then
    update public.inventory_balances
      set owned_qty = owned_qty + p_delta, updated_at = now()
      where product_id = p_product_id;
  elsif p_bucket = 'supplier' then
    update public.inventory_balances
      set supplier_qty = supplier_qty + p_delta, updated_at = now()
      where product_id = p_product_id;
  elsif p_bucket = 'damaged' then
    update public.inventory_balances
      set damaged_qty = damaged_qty + p_delta, updated_at = now()
      where product_id = p_product_id;
  else
    update public.inventory_balances
      set awaiting_verification_qty = awaiting_verification_qty + p_delta, updated_at = now()
      where product_id = p_product_id;
  end if;

  insert into public.stock_movements (product_id, movement_type, quantity, bucket, notes, actor_id)
  values (
    p_product_id,
    case
      when p_bucket = 'damaged' then 'damage'
      when p_bucket = 'supplier' then 'supplier_in'
      when p_delta > 0 then 'restock'
      else 'adjustment'
    end,
    p_delta,
    p_bucket,
    coalesce(p_notes, 'Stock adjustment'),
    auth.uid()
  );

  perform public.log_activity(
    'stock.adjusted', 'product', p_product_id,
    jsonb_build_object('bucket', p_bucket, 'delta', p_delta, 'notes', p_notes)
  );
end;
$$;

create or replace function public.update_order_status(p_order_id uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  line record;
  v_ok boolean := false;
begin
  if public.current_profile_role() not in ('owner', 'manager', 'sales_assistant') then
    raise exception 'You cannot update orders';
  end if;
  if p_status in ('paid', 'refunded') then
    raise exception 'Record a confirmed payment or refund. This action does not mark an order paid.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  v_ok :=
    (v_order.status = 'pending' and p_status in ('awaiting_supplier_confirmation', 'confirmed', 'awaiting_payment', 'cancelled'))
    or (v_order.status = 'awaiting_supplier_confirmation' and p_status in ('confirmed', 'cancelled'))
    or (v_order.status = 'confirmed' and p_status in ('awaiting_payment', 'processing', 'cancelled'))
    or (v_order.status = 'awaiting_payment' and p_status in ('processing', 'cancelled'))
    or (v_order.status = 'paid' and p_status = 'processing')
    or (v_order.status = 'processing' and p_status = 'ready_for_delivery')
    or (v_order.status = 'ready_for_delivery' and p_status = 'dispatched')
    or (v_order.status = 'dispatched' and p_status = 'delivered');

  if not v_ok then
    raise exception 'That status change is not allowed';
  end if;

  if p_status = 'cancelled' then
    if v_order.stock_committed then
      raise exception 'Stock already left the shelf. Open a return instead of cancelling.';
    end if;
    for line in
      select * from public.order_items where order_id = p_order_id order by product_id
    loop
      perform 1 from public.inventory_balances where product_id = line.product_id for update;
      if line.fulfilment = 'owned' then
        update public.inventory_balances
          set reserved_qty = reserved_qty - line.quantity, updated_at = now()
          where product_id = line.product_id;
        insert into public.stock_movements (product_id, movement_type, quantity, bucket, reference_type, reference_id, notes, actor_id)
        values (line.product_id, 'release', -line.quantity, 'owned', 'order', p_order_id, 'Reservation released', auth.uid());
      else
        update public.inventory_balances
          set supplier_reserved_qty = supplier_reserved_qty - line.quantity, updated_at = now()
          where product_id = line.product_id;
        insert into public.stock_movements (product_id, movement_type, quantity, bucket, reference_type, reference_id, notes, actor_id)
        values (line.product_id, 'supplier_release', -line.quantity, 'supplier', 'order', p_order_id, 'Supplier reservation released', auth.uid());
      end if;
    end loop;
  end if;

  if p_status = 'dispatched' and not v_order.stock_committed then
    for line in
      select * from public.order_items where order_id = p_order_id order by product_id
    loop
      perform 1 from public.inventory_balances where product_id = line.product_id for update;
      if line.fulfilment = 'owned' then
        update public.inventory_balances
          set owned_qty = owned_qty - line.quantity,
              reserved_qty = reserved_qty - line.quantity,
              updated_at = now()
          where product_id = line.product_id;
        insert into public.stock_movements (product_id, movement_type, quantity, bucket, reference_type, reference_id, notes, actor_id)
        values (line.product_id, 'sale', -line.quantity, 'owned', 'order', p_order_id, 'Dispatched', auth.uid());
      else
        update public.inventory_balances
          set supplier_qty = supplier_qty - line.quantity,
              supplier_reserved_qty = supplier_reserved_qty - line.quantity,
              updated_at = now()
          where product_id = line.product_id;
        insert into public.stock_movements (product_id, movement_type, quantity, bucket, reference_type, reference_id, notes, actor_id)
        values (line.product_id, 'sale', -line.quantity, 'supplier', 'order', p_order_id, 'Supplier-backed item dispatched', auth.uid());
      end if;
    end loop;
    insert into public.shipments (order_id, destination, status, dispatched_at, notes)
    values (p_order_id, v_order.delivery_location, 'dispatched', now(), p_note);
  end if;

  if p_status = 'delivered' then
    update public.shipments set status = 'delivered', delivered_at = now() where order_id = p_order_id;
  end if;

  update public.orders
    set status = p_status,
        stock_committed = stock_committed or p_status = 'dispatched',
        updated_at = now()
    where id = p_order_id;

  insert into public.order_status_history (order_id, status, note, actor_id)
  values (p_order_id, p_status, p_note, auth.uid());

  perform public.log_activity('order.updated', 'order', p_order_id, jsonb_build_object('status', p_status));
end;
$$;

create or replace function public.record_payment(
  p_order_id uuid,
  p_provider text,
  p_status text,
  p_reference text,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if public.current_profile_role() not in ('owner', 'manager', 'sales_assistant') then
    raise exception 'You cannot record payments';
  end if;
  if p_provider not in ('manual', 'mpesa_daraja') then
    raise exception 'Unknown payment provider';
  end if;
  if p_status not in ('pending', 'confirmed', 'failed') then
    raise exception 'Unknown payment status';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status = 'awaiting_supplier_confirmation' then
    raise exception 'Confirm supplier availability before recording payment';
  end if;
  if v_order.status in ('cancelled', 'refunded') then
    raise exception 'This order cannot take a payment';
  end if;
  if p_status = 'confirmed' then
    if p_reference is null or char_length(trim(p_reference)) < 4 then
      raise exception 'A payment reference from the provider is required';
    end if;
    if p_amount is distinct from v_order.total then
      raise exception 'The confirmed amount must match the order total';
    end if;
  end if;

  insert into public.payment_records (order_id, provider, status, amount, currency, reference, confirmed_by)
  values (
    p_order_id, p_provider, p_status, coalesce(p_amount, v_order.total), 'KES',
    nullif(trim(coalesce(p_reference, '')), ''),
    case when p_status = 'confirmed' then auth.uid() else null end
  );

  if p_status = 'confirmed' and v_order.status <> 'paid' then
    update public.orders set status = 'paid', updated_at = now() where id = p_order_id;
    insert into public.order_status_history (order_id, status, note, actor_id)
    values (p_order_id, 'paid', 'Payment confirmed with reference ' || trim(p_reference), auth.uid());
  end if;

  perform public.log_activity('payment.recorded', 'order', p_order_id, jsonb_build_object('status', p_status, 'provider', p_provider));
end;
$$;

create or replace function public.open_return(p_order_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if public.current_profile_role() not in ('owner', 'manager', 'sales_assistant') then
    raise exception 'You cannot open returns';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception 'Enter a reason';
  end if;
  insert into public.returns (order_id, reason, created_by)
  values (p_order_id, trim(p_reason), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.record_refund(
  p_order_id uuid,
  p_amount numeric,
  p_reason text,
  p_restock boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  line record;
begin
  if public.current_profile_role() not in ('owner', 'manager') then
    raise exception 'Only an owner or manager can record a refund';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status not in ('paid', 'processing', 'ready_for_delivery', 'dispatched', 'delivered') then
    raise exception 'This order has no confirmed payment to refund';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > v_order.total then
    raise exception 'Enter a refund amount up to the order total';
  end if;

  insert into public.refunds (order_id, amount, reason, restock, created_by)
  values (p_order_id, p_amount, p_reason, coalesce(p_restock, false), auth.uid());

  if coalesce(p_restock, false) and v_order.stock_committed then
    for line in select * from public.order_items where order_id = p_order_id and fulfilment = 'owned'
    loop
      update public.inventory_balances
        set owned_qty = owned_qty + line.quantity, updated_at = now()
        where product_id = line.product_id;
      insert into public.stock_movements (product_id, movement_type, quantity, bucket, reference_type, reference_id, notes, actor_id)
      values (line.product_id, 'return', line.quantity, 'owned', 'order', p_order_id, 'Restocked after refund', auth.uid());
    end loop;
  end if;

  update public.orders set status = 'refunded', updated_at = now() where id = p_order_id;
  insert into public.order_status_history (order_id, status, note, actor_id)
  values (p_order_id, 'refunded', coalesce(p_reason, 'Refund recorded'), auth.uid());
  perform public.log_activity('refund.recorded', 'order', p_order_id, jsonb_build_object('amount', p_amount));
end;
$$;

create or replace function public.decide_product(p_id uuid, p_decision text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if public.current_profile_role() is distinct from 'owner' then
    raise exception 'Only the owner can approve or publish products';
  end if;

  if p_decision = 'approved' then
    update public.products
      set publication_status = 'approved', review_note = p_note
      where id = p_id and deleted_at is null;
  elsif p_decision = 'published' then
    update public.products
      set publication_status = 'published', review_note = p_note
      where id = p_id and deleted_at is null and publication_status = 'approved';
  elsif p_decision = 'rejected' then
    update public.products
      set publication_status = 'rejected', review_note = p_note
      where id = p_id and deleted_at is null;
  elsif p_decision = 'changes' then
    update public.products
      set publication_status = 'draft', review_note = p_note
      where id = p_id and deleted_at is null;
  else
    raise exception 'Unknown decision';
  end if;

  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'The product could not be updated. Approve it before publishing, and keep a verification on file.';
  end if;
end;
$$;

create or replace function public.promote_listing_to_draft(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.research_listings%rowtype;
  v_product uuid;
  v_category uuid;
  v_slug text;
begin
  if public.current_profile_role() not in ('owner', 'manager', 'product_researcher') then
    raise exception 'You cannot create a product from research';
  end if;

  select * into v_listing from public.research_listings where id = p_listing_id for update;
  if not found then
    raise exception 'Listing not found';
  end if;
  if v_listing.product_id is not null then
    raise exception 'This listing is already linked to a product';
  end if;

  select id into v_category from public.categories where slug = 'laptops' and is_active limit 1;
  if v_category is null then
    raise exception 'Create the Laptops category first';
  end if;

  v_slug := trim(both '-' from regexp_replace(lower(v_listing.title), '[^a-z0-9]+', '-', 'g'))
    || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.products (slug, name, description, category_id, selling_price, laptop_condition, created_by)
  values (
    v_slug,
    v_listing.title,
    coalesce(v_listing.notes, 'Draft created from a research listing. Specifications must be verified.'),
    v_category,
    coalesce(v_listing.advertised_price, 0),
    'unspecified',
    auth.uid()
  )
  returning id into v_product;

  update public.research_listings
    set product_id = v_product, status = 'draft', updated_at = now()
    where id = p_listing_id;

  perform public.log_activity('listing.promoted', 'listing', p_listing_id, jsonb_build_object('product_id', v_product));
  return v_product;
end;
$$;

create or replace function public.public_business_settings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'business_name', coalesce((select value from public.business_settings where key = 'business_name'), 'OREMITECH'),
    'tagline', coalesce((select value from public.business_settings where key = 'tagline'), 'Verified laptops and computer accessories in Kenya'),
    'currency', coalesce((select value from public.business_settings where key = 'currency'), 'KES'),
    'timezone', coalesce((select value from public.business_settings where key = 'timezone'), 'Africa/Nairobi'),
    'whatsapp_e164', coalesce((select value from public.business_settings where key = 'whatsapp_e164'), ''),
    'store_email', coalesce((select value from public.business_settings where key = 'store_email'), ''),
    'store_location', coalesce((select value from public.business_settings where key = 'store_location'), ''),
    'ga_measurement_id', coalesce((select nullif(value, '') from public.business_settings where key = 'ga_measurement_id'), ''),
    'gsc_verification', coalesce((select nullif(value, '') from public.business_settings where key = 'gsc_verification'), '')
  )
$$;

create or replace function public.sales_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.current_profile_role() not in ('owner', 'manager', 'sales_assistant') then
    raise exception 'You cannot view sales totals';
  end if;
  return jsonb_build_object(
    'orders', (select count(*) from public.orders),
    'open_orders', (select count(*) from public.orders where status not in ('delivered', 'cancelled', 'refunded')),
    'paid_orders', (select count(*) from public.orders where status in ('paid', 'processing', 'ready_for_delivery', 'dispatched', 'delivered')),
    'paid_total', (select coalesce(sum(total), 0) from public.orders where status in ('paid', 'processing', 'ready_for_delivery', 'dispatched', 'delivered'))
  );
end;
$$;

create or replace function public.finance_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_sales numeric;
  v_cost numeric;
  v_expenses numeric;
begin
  if public.current_profile_role() is distinct from 'owner' then
    raise exception 'Only the owner can view profit reports';
  end if;
  select coalesce(sum(total), 0) into v_sales
  from public.orders
  where status in ('paid', 'processing', 'ready_for_delivery', 'dispatched', 'delivered');

  select coalesce(sum(oi.quantity * oic.purchase_cost), 0) into v_cost
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.order_item_costs oic on oic.order_item_id = oi.id
  where o.status in ('paid', 'processing', 'ready_for_delivery', 'dispatched', 'delivered');

  select coalesce(sum(amount), 0) into v_expenses from public.expenses;

  return jsonb_build_object(
    'sales_total', v_sales,
    'known_product_cost', v_cost,
    'expenses_total', v_expenses,
    'gross_profit_estimate', v_sales - v_cost - v_expenses,
    'note', 'Profit uses recorded purchase costs. Lines without a purchase cost are excluded from cost, so treat the figure as an estimate.'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_costs enable row level security;
alter table public.product_images enable row level security;
alter table public.product_specifications enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_tags enable row level security;
alter table public.product_tag_links enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_contacts enable row level security;
alter table public.inventory_units enable row level security;
alter table public.stock_movements enable row level security;
alter table public.research_listings enable row level security;
alter table public.sourcing_tasks enable row level security;
alter table public.product_verifications enable row level security;
alter table public.verification_photos enable row level security;
alter table public.supplier_price_history enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_costs enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payment_records enable row level security;
alter table public.shipments enable row level security;
alter table public.returns enable row level security;
alter table public.refunds enable row level security;
alter table public.customer_inquiries enable row level security;
alter table public.product_reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.coupons enable row level security;
alter table public.promotional_banners enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.activity_logs enable row level security;
alter table public.business_settings enable row level security;
alter table public.employee_tasks enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or public.is_owner()
  or (public.is_staff() and role <> 'customer')
);
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_owner())
  with check (id = auth.uid() or public.is_owner());

-- Taxonomy
create policy categories_public_read on public.categories for select using (is_active or public.is_staff());
create policy categories_write on public.categories for all using (
  public.current_profile_role() in ('owner', 'manager')
) with check (public.current_profile_role() in ('owner', 'manager'));

create policy brands_public_read on public.brands for select using (is_active or public.is_staff());
create policy brands_write on public.brands for all using (
  public.current_profile_role() in ('owner', 'manager')
) with check (public.current_profile_role() in ('owner', 'manager'));

-- Products: anonymous clients use catalogue_products, not this table.
create policy products_staff_select on public.products for select using (public.is_staff());
create policy products_staff_insert on public.products for insert with check (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher')
);
create policy products_staff_update on public.products for update using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher')
) with check (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher')
);

create policy costs_owner on public.product_costs for all using (
  public.current_profile_role() in ('owner', 'manager')
) with check (public.current_profile_role() in ('owner', 'manager'));

create policy images_staff on public.product_images for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));
create policy specs_staff on public.product_specifications for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));
create policy variants_staff on public.product_variants for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));
create policy tags_read on public.product_tags for select using (true);
create policy tags_write on public.product_tags for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));
create policy tag_links_staff on public.product_tag_links for all using (public.is_staff())
  with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));

-- Inventory is readable by staff. Writes go through adjust_stock / place_order.
create policy inventory_staff_read on public.inventory_balances for select using (public.is_staff());
create policy units_staff on public.inventory_units for all using (
  public.current_profile_role() in ('owner', 'manager', 'inventory_assistant')
) with check (public.current_profile_role() in ('owner', 'manager', 'inventory_assistant'));
create policy movements_staff_read on public.stock_movements for select using (public.is_staff());

create policy suppliers_staff on public.suppliers for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant'));
create policy supplier_contacts_staff on public.supplier_contacts for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant'));

create policy research_staff on public.research_listings for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));
create policy sourcing_staff on public.sourcing_tasks for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));
create policy verification_staff on public.product_verifications for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant'));
create policy verification_photos_staff on public.verification_photos for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant'));
create policy price_history_staff on public.supplier_price_history for all using (
  public.current_profile_role() in ('owner', 'manager', 'product_researcher')
) with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));

-- Customers
create policy customers_select on public.customers for select using (
  user_id = auth.uid()
  or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);
create policy customers_update on public.customers for update using (
  user_id = auth.uid() or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
) with check (
  user_id = auth.uid() or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);
create policy addresses_rw on public.customer_addresses for all using (
  exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
  or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
) with check (
  exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
  or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);

create policy carts_own on public.carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cart_items_own on public.cart_items for all using (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
);

create policy orders_select on public.orders for select using (
  user_id = auth.uid()
  or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);
create policy order_items_select on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);
create policy order_history_select on public.order_status_history for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);
create policy payments_select on public.payment_records for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);
create policy costs_line_owner on public.order_item_costs for select using (
  public.current_profile_role() in ('owner', 'manager')
);
create policy shipments_select on public.shipments for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);
create policy returns_select on public.returns for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  or public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);
create policy refunds_staff on public.refunds for select using (
  public.current_profile_role() in ('owner', 'manager')
);

create policy inquiries_insert on public.customer_inquiries for insert with check (
  char_length(name) > 1 and char_length(message) between 5 and 2000
);
create policy inquiries_staff on public.customer_inquiries for select using (
  public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);
create policy inquiries_staff_update on public.customer_inquiries for update using (
  public.current_profile_role() in ('owner', 'manager', 'sales_assistant')
);

create policy reviews_read on public.product_reviews for select using (
  status = 'published' or user_id = auth.uid() or public.current_profile_role() in ('owner', 'manager')
);
create policy reviews_insert on public.product_reviews for insert with check (user_id = auth.uid());
create policy reviews_moderate on public.product_reviews for update using (
  public.current_profile_role() in ('owner', 'manager')
);

create policy wishlist_own on public.wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy coupons_staff on public.coupons for all using (
  public.current_profile_role() in ('owner', 'manager')
) with check (public.current_profile_role() in ('owner', 'manager'));

create policy banners_public on public.promotional_banners for select using (is_active or public.current_profile_role() in ('owner', 'manager'));
create policy banners_write on public.promotional_banners for all using (
  public.current_profile_role() in ('owner', 'manager')
) with check (public.current_profile_role() in ('owner', 'manager'));

create policy newsletter_insert on public.newsletter_subscriptions for insert with check (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
create policy newsletter_staff on public.newsletter_subscriptions for select using (
  public.current_profile_role() in ('owner', 'manager')
);

create policy expense_categories_staff on public.expense_categories for select using (
  public.current_profile_role() in ('owner', 'manager')
);
create policy expense_categories_write on public.expense_categories for all using (public.is_owner()) with check (public.is_owner());
create policy expenses_staff on public.expenses for all using (
  public.current_profile_role() in ('owner', 'manager')
) with check (public.current_profile_role() in ('owner', 'manager'));

create policy activity_read on public.activity_logs for select using (
  public.is_owner()
  or (public.current_profile_role() = 'manager')
  or actor_id = auth.uid()
);

create policy settings_owner on public.business_settings for all using (public.is_owner()) with check (public.is_owner());

create policy tasks_read on public.employee_tasks for select using (
  public.current_profile_role() in ('owner', 'manager') or assigned_to = auth.uid()
);
create policy tasks_write on public.employee_tasks for insert with check (
  public.current_profile_role() in ('owner', 'manager')
);
create policy tasks_update on public.employee_tasks for update using (
  public.current_profile_role() in ('owner', 'manager') or assigned_to = auth.uid()
) with check (
  public.current_profile_role() in ('owner', 'manager') or assigned_to = auth.uid()
);

create policy notifications_own on public.notifications for select using (user_id = auth.uid());
create policy notifications_read on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants
-- Supabase grants table access to anon/authenticated by default. Revoke first.
-- ---------------------------------------------------------------------------

revoke all on table
  public.profiles, public.categories, public.brands, public.products, public.product_costs,
  public.product_images, public.product_specifications, public.product_variants, public.product_tags,
  public.product_tag_links, public.inventory_balances, public.suppliers, public.supplier_contacts,
  public.inventory_units, public.stock_movements, public.research_listings, public.sourcing_tasks,
  public.product_verifications, public.verification_photos, public.supplier_price_history,
  public.customers, public.customer_addresses, public.carts, public.cart_items, public.orders,
  public.order_items, public.order_item_costs, public.order_status_history, public.payment_records,
  public.shipments, public.returns, public.refunds, public.customer_inquiries, public.product_reviews,
  public.wishlists, public.coupons, public.promotional_banners, public.newsletter_subscriptions,
  public.expense_categories, public.expenses, public.activity_logs, public.business_settings,
  public.employee_tasks, public.notifications
from anon, authenticated;

grant select on public.categories, public.brands, public.product_tags, public.promotional_banners to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.products to authenticated;
grant select, insert, update, delete on public.product_costs, public.product_images, public.product_specifications,
  public.product_variants, public.product_tag_links to authenticated;
grant select, insert, update, delete on public.product_tags to authenticated;
grant select on public.inventory_balances, public.stock_movements to authenticated;
grant select, insert, update, delete on public.inventory_units to authenticated;
grant select, insert, update, delete on public.suppliers, public.supplier_contacts to authenticated;
grant select, insert, update, delete on public.research_listings, public.sourcing_tasks, public.product_verifications,
  public.verification_photos, public.supplier_price_history to authenticated;
grant select, update on public.customers to authenticated;
grant select, insert, update, delete on public.customer_addresses, public.carts, public.cart_items, public.wishlists to authenticated;
grant select on public.orders, public.order_items, public.order_status_history, public.payment_records, public.shipments, public.returns to authenticated;
grant select on public.order_item_costs, public.refunds to authenticated;
grant insert on public.customer_inquiries, public.newsletter_subscriptions to anon, authenticated;
grant select, update on public.customer_inquiries to authenticated;
grant select, insert on public.product_reviews to anon, authenticated;
grant update on public.product_reviews to authenticated;
grant select, insert, update, delete on public.coupons, public.promotional_banners, public.expenses to authenticated;
grant select on public.newsletter_subscriptions, public.expense_categories, public.activity_logs to authenticated;
grant select, insert, update, delete on public.expense_categories, public.business_settings, public.employee_tasks to authenticated;
grant select, update on public.notifications to authenticated;

grant select on public.catalogue_products to anon, authenticated;
grant select on public.listing_price_spans to authenticated;

revoke all on function public.log_activity(text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.place_order(jsonb) from public;
revoke all on function public.track_order(text, text) from public;
revoke all on function public.adjust_stock(uuid, text, int, text) from public;
revoke all on function public.update_order_status(uuid, text, text) from public;
revoke all on function public.record_payment(uuid, text, text, text, numeric) from public;
revoke all on function public.open_return(uuid, text) from public;
revoke all on function public.record_refund(uuid, numeric, text, boolean) from public;
revoke all on function public.decide_product(uuid, text, text) from public;
revoke all on function public.promote_listing_to_draft(uuid) from public;
revoke all on function public.public_business_settings() from public;
revoke all on function public.sales_summary() from public;
revoke all on function public.finance_summary() from public;

grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.public_business_settings() to anon, authenticated;
grant execute on function public.adjust_stock(uuid, text, int, text) to authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;
grant execute on function public.record_payment(uuid, text, text, text, numeric) to authenticated;
grant execute on function public.open_return(uuid, text) to authenticated;
grant execute on function public.record_refund(uuid, numeric, text, boolean) to authenticated;
grant execute on function public.decide_product(uuid, text, text) to authenticated;
grant execute on function public.promote_listing_to_draft(uuid) to authenticated;
grant execute on function public.sales_summary() to authenticated;
grant execute on function public.finance_summary() to authenticated;

-- ---------------------------------------------------------------------------
-- Seed taxonomy and settings only. No invented products, reviews, or orders.
-- ---------------------------------------------------------------------------

insert into public.categories (name, slug, description, menu_group, sort_order) values
  ('Laptops', 'laptops', 'Laptop computers', 'laptops', 10),
  ('Computer accessories', 'computer-accessories', 'Accessories for computers', 'accessories-root', 20)
on conflict (slug) do nothing;

insert into public.categories (name, slug, parent_id, description, menu_group, sort_order)
select v.name, v.slug, c.id, v.description, v.menu_group, v.sort_order
from (values
  ('Business laptops', 'business-laptops', 'Laptops for office work', 'use', 11),
  ('Gaming laptops', 'gaming-laptops', 'Laptops for games', 'use', 12),
  ('Student laptops', 'student-laptops', 'Laptops for study', 'use', 13),
  ('Workstations', 'workstations', 'Professional workstations', 'use', 14)
) as v(name, slug, description, menu_group, sort_order)
join public.categories c on c.slug = 'laptops'
on conflict (slug) do nothing;

insert into public.categories (name, slug, parent_id, description, menu_group, sort_order)
select v.name, v.slug, c.id, v.description, 'accessories', v.sort_order
from (values
  ('Keyboards', 'keyboards', 'Keyboards', 21),
  ('Mice', 'mice', 'Mice', 22),
  ('Monitors', 'monitors', 'Monitors', 23),
  ('Storage devices', 'storage-devices', 'Storage devices', 24),
  ('Chargers', 'chargers', 'Chargers and adapters', 25),
  ('Networking equipment', 'networking-equipment', 'Networking equipment', 26)
) as v(name, slug, description, sort_order)
join public.categories c on c.slug = 'computer-accessories'
on conflict (slug) do nothing;

insert into public.brands (name, slug, sort_order) values
  ('HP', 'hp', 1),
  ('Dell', 'dell', 2),
  ('Lenovo', 'lenovo', 3),
  ('Apple', 'apple', 4),
  ('Acer', 'acer', 5),
  ('ASUS', 'asus', 6)
on conflict (slug) do nothing;

insert into public.business_settings (key, value) values
  ('business_name', 'OREMITECH'),
  ('tagline', 'Verified laptops and computer accessories in Kenya'),
  ('currency', 'KES'),
  ('timezone', 'Africa/Nairobi'),
  ('country', 'Kenya'),
  ('whatsapp_e164', ''),
  ('store_email', ''),
  ('store_location', ''),
  ('ga_measurement_id', ''),
  ('gsc_verification', '')
on conflict (key) do nothing;

insert into public.expense_categories (name) values
  ('Rent'), ('Stock purchases'), ('Delivery'), ('Airtime and data'), ('Other')
on conflict (name) do nothing;

-- Storage bucket for product and verification photos. Ignored if storage is unavailable.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('product-images', 'product-images', true)
    on conflict (id) do nothing;

    if not exists (
      select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'product_images_public_read'
    ) then
      create policy product_images_public_read on storage.objects
        for select using (bucket_id = 'product-images');
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'product_images_staff_write'
    ) then
      create policy product_images_staff_write on storage.objects
        for insert to authenticated
        with check (
          bucket_id = 'product-images'
          and public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant')
        );
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'product_images_staff_update'
    ) then
      create policy product_images_staff_update on storage.objects
        for update to authenticated
        using (
          bucket_id = 'product-images'
          and public.current_profile_role() in ('owner', 'manager', 'product_researcher', 'inventory_assistant')
        );
    end if;
  end if;
end $$;
