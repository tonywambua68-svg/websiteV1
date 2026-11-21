-- OREMITECH product import / content / pricing / review / publishing system
-- Additive and reversible. Extends the existing supplier, product and finance structures.
-- Does not drop or recreate any existing table or data.
-- Apply after 20261118000001_fix_place_order_delivery.sql.

-- ---------------------------------------------------------------------------
-- Extend suppliers for multi-market sourcing (Nairobi, Kenya, China, international)
-- ---------------------------------------------------------------------------

alter table public.suppliers
  add column if not exists country text not null default 'Kenya',
  add column if not exists currency text not null default 'KES',
  add column if not exists source_kind text not null default 'nairobi_cbd';

-- source_kind is intentionally free text to avoid breaking existing rows; the
-- frontend offers: nairobi_cbd, kenya_other, china, international.

-- ---------------------------------------------------------------------------
-- Editable tiered markup rules (Phase 4)
-- ---------------------------------------------------------------------------

create table if not exists public.supplier_markup_tiers (
  id uuid primary key default gen_random_uuid(),
  min_price numeric(12,2) not null check (min_price >= 0),
  max_price numeric(12,2) check (max_price is null or max_price >= min_price),
  markup_pct numeric(5,2) not null check (markup_pct >= 0 and markup_pct <= 500),
  label text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_markup_tiers_min_unique unique (min_price)
);

-- Seed the approved initial tiers once. Safe to re-run.
insert into public.supplier_markup_tiers (min_price, max_price, markup_pct, label, sort_order)
values
  (0,       2000,   35, 'KSh 0 – 2,000',        1),
  (2000.01, 5000,   30, 'KSh 2,001 – 5,000',    2),
  (5000.01, 10000,  25, 'KSh 5,001 – 10,000',   3),
  (10000.01, 30000, 18, 'KSh 10,001 – 30,000',  4),
  (30000.01, 60000, 15, 'KSh 30,001 – 60,000',  5),
  (60000.01, null,  12, 'Above KSh 60,000',     6)
on conflict (min_price) do nothing;

-- ---------------------------------------------------------------------------
-- Product import staging (Phase 1, 2, 3, 5, 6)
-- One row per imported/entered product. Never published until owner approval.
-- ---------------------------------------------------------------------------

create table if not exists public.product_imports (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'manual' check (source_type in ('url', 'csv', 'manual')),
  source_url text,
  supplier_id uuid references public.suppliers (id) on delete set null,
  supplier_name text,
  source_kind text not null default 'nairobi_cbd',
  title text not null default '',
  model text,
  brand_name text,
  category_slug text not null default 'laptops',
  description text,
  specs jsonb not null default '{}'::jsonb,
  supplier_price numeric(12,2) check (supplier_price is null or supplier_price >= 0),
  supplier_currency text not null default 'KES',
  fx_rate_to_kes numeric(12,4) not null default 1 check (fx_rate_to_kes > 0),
  competitor_price numeric(12,2) check (competitor_price is null or competitor_price >= 0),
  availability_status text not null default 'supplier' check (availability_status in (
    'in_stock', 'supplier', 'preorder', 'out_of_stock', 'discontinued'
  )),
  availability_verified boolean not null default false,
  extraction_status text not null default 'pending' check (extraction_status in (
    'pending', 'extracted', 'manual', 'failed'
  )),
  extraction_notes text,
  content jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  pricing jsonb not null default '{}'::jsonb,
  completeness_score int not null default 0 check (completeness_score between 0 and 100),
  missing_fields text[] not null default '{}',
  status text not null default 'draft' check (status in (
    'draft', 'extracted', 'images_pending', 'in_review', 'approved', 'rejected', 'archived', 'published'
  )),
  approved_selling_price numeric(12,2) check (approved_selling_price is null or approved_selling_price >= 0),
  price_override_reason text,
  linked_product_id uuid references public.products (id) on delete set null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_imports_status on public.product_imports (status);
create index if not exists idx_product_imports_supplier on public.product_imports (supplier_id);
create index if not exists idx_product_imports_source_url on public.product_imports (source_url);

-- ---------------------------------------------------------------------------
-- Import images (Phase 2)
-- ---------------------------------------------------------------------------

create table if not exists public.product_import_images (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.product_imports (id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_product_import_images_import on public.product_import_images (import_id);

-- ---------------------------------------------------------------------------
-- Direct acquisition costs (Phase 4)
-- ---------------------------------------------------------------------------

create table if not exists public.acquisition_costs (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.product_imports (id) on delete cascade,
  label text not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'KES',
  is_estimated boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_acquisition_costs_import on public.acquisition_costs (import_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists supplier_markup_tiers_updated_at on public.supplier_markup_tiers;
create trigger supplier_markup_tiers_updated_at
  before update on public.supplier_markup_tiers
  for each row execute function public.touch_updated_at();

drop trigger if exists product_imports_updated_at on public.product_imports;
create trigger product_imports_updated_at
  before update on public.product_imports
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.supplier_markup_tiers enable row level security;
alter table public.product_imports enable row level security;
alter table public.product_import_images enable row level security;
alter table public.acquisition_costs enable row level security;

-- Markup tiers: staff read, owner/manager write.
drop policy if exists markup_tiers_staff_read on public.supplier_markup_tiers;
create policy markup_tiers_staff_read on public.supplier_markup_tiers
  for select to authenticated
  using (public.is_staff());

drop policy if exists markup_tiers_manage on public.supplier_markup_tiers;
create policy markup_tiers_manage on public.supplier_markup_tiers
  for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

-- Imports: staff with sourcing rights.
drop policy if exists product_imports_select on public.product_imports;
create policy product_imports_select on public.product_imports
  for select to authenticated
  using (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));

drop policy if exists product_imports_write on public.product_imports;
create policy product_imports_write on public.product_imports
  for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager', 'product_researcher'))
  with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));

-- Import images: same staffing rule.
drop policy if exists product_import_images_select on public.product_import_images;
create policy product_import_images_select on public.product_import_images
  for select to authenticated
  using (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));

drop policy if exists product_import_images_write on public.product_import_images;
create policy product_import_images_write on public.product_import_images
  for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager', 'product_researcher'))
  with check (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));

-- Acquisition costs: same staffing rule.
drop policy if exists acquisition_costs_select on public.acquisition_costs;
create policy acquisition_costs_select on public.acquisition_costs
  for select to authenticated
  using (public.current_profile_role() in ('owner', 'manager', 'product_researcher'));

drop policy if exists acquisition_costs_write on public.acquisition_costs;
create policy acquisition_costs_write on public.acquisition_costs
  for all to authenticated
  using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select on public.supplier_markup_tiers, public.product_imports, public.product_import_images, public.acquisition_costs to authenticated;
grant insert, update, delete on public.product_imports, public.product_import_images to authenticated;
grant insert, update, delete on public.supplier_markup_tiers, public.acquisition_costs to authenticated;
grant update (country, currency, source_kind) on public.suppliers to authenticated;

-- ---------------------------------------------------------------------------
-- Owner-only approval: managers and researchers may prepare imports but only
-- the owner may move an import into 'approved' (or 'published').
-- ---------------------------------------------------------------------------

create or replace function public.guard_import_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('approved', 'published')
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    if not public.is_owner() then
      raise exception 'Only the owner can approve or publish product imports';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists product_imports_guard_approval on public.product_imports;
create trigger product_imports_guard_approval
  before insert or update on public.product_imports
  for each row execute function public.guard_import_approval();

-- ---------------------------------------------------------------------------
-- Owner-only publish: create a live product from an approved import.
-- Idempotent: if already linked, returns the existing product id (no duplicates).
-- ---------------------------------------------------------------------------

create or replace function public.publish_product_import(p_import_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_import public.product_imports%rowtype;
  v_category uuid;
  v_brand uuid;
  v_product uuid;
  v_slug text;
  v_price numeric(12,2);
  v_content jsonb;
  v_seo jsonb;
begin
  if not public.is_owner() then
    raise exception 'Only the owner can publish products';
  end if;

  select * into v_import from public.product_imports where id = p_import_id for update;
  if not found then
    raise exception 'Import not found';
  end if;

  -- Prevent duplicate publication.
  if v_import.linked_product_id is not null then
    return v_import.linked_product_id;
  end if;
  if v_import.status = 'published' then
    raise exception 'This import is already published';
  end if;
  if v_import.status <> 'approved' then
    raise exception 'Approve the product before publishing';
  end if;

  v_price := coalesce(v_import.approved_selling_price, null);
  if v_price is null or v_price <= 0 then
    raise exception 'Set an approved selling price before publishing';
  end if;

  select id into v_category from public.categories where slug = v_import.category_slug and is_active limit 1;
  if v_category is null then
    select id into v_category from public.categories where slug = 'laptops' and is_active limit 1;
  end if;
  if v_category is null then
    raise exception 'No category available to publish into';
  end if;

  if v_import.brand_name is not null then
    select id into v_brand from public.brands
    where lower(name) = lower(v_import.brand_name) limit 1;
  end if;

  v_content := coalesce(v_import.content, '{}'::jsonb);
  v_seo := coalesce(v_import.seo, '{}'::jsonb);

  v_slug := coalesce(
    nullif(trim(v_seo->>'slug'), ''),
    trim(both '-' from regexp_replace(lower(v_import.title), '[^a-z0-9]+', '-', 'g'))
      || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
  );

  -- Ensure slug uniqueness without failing the publish.
  if exists (select 1 from public.products where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  insert into public.products (
    slug, name, model, description, category_id, brand_id,
    processor_manufacturer, processor_model, processor_generation,
    ram, ram_type, storage_capacity, storage_type, screen_size, screen_resolution,
    graphics, operating_system, keyboard_layout, battery_condition, weight, colour,
    selling_price, comparison_price, featured, laptop_condition, warranty,
    seo_title, seo_description, seo_focus_keyword, seo_secondary_keywords,
    seo_social_title, seo_social_description,
    publication_status, approved_by, approved_at, published_at, created_by
  ) values (
    v_slug,
    coalesce(nullif(v_import.title, ''), 'Imported product'),
    v_import.model,
    coalesce(nullif(v_content->>'long_description', ''), nullif(v_import.description, ''), ''),
    v_category,
    v_brand,
    v_import.specs->>'processor_manufacturer',
    v_import.specs->>'processor_model',
    v_import.specs->>'processor_generation',
    v_import.specs->>'ram',
    v_import.specs->>'ram_type',
    v_import.specs->>'storage_capacity',
    v_import.specs->>'storage_type',
    v_import.specs->>'screen_size',
    v_import.specs->>'screen_resolution',
    v_import.specs->>'graphics',
    v_import.specs->>'operating_system',
    v_import.specs->>'keyboard_layout',
    v_import.specs->>'battery_condition',
    v_import.specs->>'weight',
    v_import.specs->>'colour',
    v_price,
    null,
    false,
    coalesce(nullif(v_import.specs->>'laptop_condition', ''), 'unspecified'),
    nullif(v_import.specs->>'warranty', ''),
    nullif(v_seo->>'title', ''),
    nullif(v_seo->>'meta_description', ''),
    nullif(v_seo->>'focus_keyword', ''),
    nullif(v_seo->>'secondary_keywords', ''),
    nullif(v_seo->>'social_title', ''),
    nullif(v_seo->>'social_description', ''),
    'published',
    auth.uid(),
    now(),
    now(),
    v_import.created_by
  )
  returning id into v_product;

  -- Copy approved/selected images.
  insert into public.product_images (product_id, url, alt, sort_order, is_primary)
  select v_product, i.url, coalesce(i.alt, v_import.title), i.sort_order, i.is_primary
  from public.product_import_images i
  where i.import_id = p_import_id and i.status <> 'rejected'
  order by i.sort_order;

  -- Record acquisition cost for finance/P&L.
  if (v_import.pricing->>'total_acquisition_cost') is not null then
    insert into public.product_costs (product_id, purchase_cost, updated_by)
    values (v_product, coalesce((v_import.pricing->>'total_acquisition_cost')::numeric, 0), auth.uid())
    on conflict (product_id) do update set purchase_cost = excluded.purchase_cost, updated_at = now(), updated_by = excluded.updated_by;
  end if;

  update public.product_imports
    set linked_product_id = v_product, status = 'published', updated_at = now()
    where id = p_import_id;

  perform public.log_activity('product.published', 'product', v_product,
    jsonb_build_object('import_id', p_import_id, 'title', v_import.title));

  return v_product;
end;
$$;

revoke all on function public.publish_product_import(uuid) from public, anon, authenticated;
grant execute on function public.publish_product_import(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
-- 1. product_imports is a staging area layered on the existing supplier/product
--    tables. It is not a separate catalogue; publishing writes to public.products.
-- 2. Availability is stored with availability_verified so supplier claims are not
--    presented as confirmed stock until an administrator verifies them.
-- 3. No specs, prices or warranty claims are invented here; blank stays blank.
