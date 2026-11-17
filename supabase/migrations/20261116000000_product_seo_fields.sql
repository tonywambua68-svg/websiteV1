-- Add product-level SEO fields to the products table
-- These columns complement the existing seo_title and seo_description columns

alter table public.products
  add column if not exists seo_focus_keyword text,
  add column if not exists seo_secondary_keywords text,
  add column if not exists seo_social_title text,
  add column if not exists seo_social_description text;

-- Add comments for documentation
comment on column public.products.seo_focus_keyword is 'Primary target keyword for SEO';
comment on column public.products.seo_secondary_keywords is 'Comma-separated secondary keywords';
comment on column public.products.seo_social_title is 'Open Graph / social sharing title';
comment on column public.products.seo_social_description is 'Open Graph / social sharing description';

-- Refresh the catalogue_products view to include new columns
create or replace view public.catalogue_products as
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
  p.seo_focus_keyword,
  p.seo_secondary_keywords,
  p.seo_social_title,
  p.seo_social_description,
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
join public.inventory_balances i on i.product_id = p.id;

-- Grant select on the view to anon and authenticated roles
grant select on public.catalogue_products to anon, authenticated;
