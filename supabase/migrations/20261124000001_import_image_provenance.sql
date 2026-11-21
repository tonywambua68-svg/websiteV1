-- Product import image provenance and relevance.
-- Images extracted from supplier pages are now stored with their source,
-- verification state and a match confidence. Publishing copies only images
-- the administrator has explicitly approved.

alter table public.product_import_images
  add column if not exists source_url text,
  add column if not exists source_domain text,
  add column if not exists relevance text not null default 'unverified',
  add column if not exists method text,
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists verification_note text;

alter table public.product_import_images
  drop constraint if exists product_import_images_relevance_check;
alter table public.product_import_images
  add constraint product_import_images_relevance_check
  check (relevance in ('exact', 'likely', 'unverified', 'rejected'));

alter table public.product_imports
  add column if not exists image_query text;

update public.product_import_images
  set method = 'manual'
  where method is null;

create index if not exists idx_product_import_images_relevance
  on public.product_import_images (import_id, relevance);

-- Replaces the publish routine so only approved, non-rejected images are copied
-- to the catalogue. Pending or uncertain candidates are never published.
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

  if not exists (
    select 1 from public.product_import_images
    where import_id = p_import_id and status = 'approved' and relevance <> 'rejected'
  ) then
    raise exception 'Approve at least one verified product image before publishing';
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

  -- Copy only images the administrator approved.
  insert into public.product_images (product_id, url, alt, sort_order, is_primary)
  select v_product, i.url, coalesce(i.alt, v_import.title), i.sort_order, i.is_primary
  from public.product_import_images i
  where i.import_id = p_import_id
    and i.status = 'approved'
    and i.relevance <> 'rejected'
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
