-- Create Supabase Storage bucket for product images
-- Public read access for customers, authenticated write for staff

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Public read access to product images
create policy if not exists "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Staff can upload product images
create policy if not exists "Staff can upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
  and (
    select role from public.profiles where id = auth.uid()
  ) in ('owner', 'manager', 'product_researcher', 'inventory_assistant', 'sales_assistant')
);

-- Staff can update product images
create policy if not exists "Staff can update product images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
  and (
    select role from public.profiles where id = auth.uid()
  ) in ('owner', 'manager', 'product_researcher', 'inventory_assistant', 'sales_assistant')
);

-- Staff can delete product images
create policy if not exists "Staff can delete product images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
  and (
    select role from public.profiles where id = auth.uid()
  ) in ('owner', 'manager', 'product_researcher', 'inventory_assistant', 'sales_assistant')
);
