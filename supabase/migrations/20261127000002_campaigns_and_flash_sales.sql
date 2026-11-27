-- OREMITECH: offers, campaigns and flash sales
-- Additive, idempotent. Coupons and promotional_banners already exist.
-- Apply via the Supabase migration pipeline (review on staging first).

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  accent text not null default 'primary',
  href text not null default '/shop?offers=1',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.flash_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  promo_price numeric(12,2) not null check (promo_price > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  stock_limit int check (stock_limit > 0),
  units_sold int not null default 0 check (units_sold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, starts_at)
);

create index if not exists flash_sales_product_idx on public.flash_sales (product_id);
create index if not exists campaigns_active_idx on public.campaigns (is_active, starts_at);

alter table public.campaigns enable row level security;
alter table public.flash_sales enable row level security;

-- Public can read active rows; admins (owner/manager) see and manage everything.
drop policy if exists campaigns_read on public.campaigns;
create policy campaigns_read on public.campaigns for select
  using (is_active = true or public.current_profile_role() in ('owner', 'manager'));

drop policy if exists campaigns_write on public.campaigns;
create policy campaigns_write on public.campaigns for all
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

drop policy if exists flash_sales_read on public.flash_sales;
create policy flash_sales_read on public.flash_sales for select
  using (is_active = true or public.current_profile_role() in ('owner', 'manager'));

drop policy if exists flash_sales_write on public.flash_sales;
create policy flash_sales_write on public.flash_sales for all
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

grant select on public.campaigns, public.flash_sales to anon, authenticated;
grant insert, update, delete on public.campaigns, public.flash_sales to authenticated;