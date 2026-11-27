-- Homepage Section Manager: admin-controlled customer-facing homepage sections.
-- Safe to apply on top of the existing schema. Additive only.

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  subtitle text check (subtitle is null or char_length(subtitle) <= 300),
  layout text not null default 'carousel' check (layout in ('carousel', 'grid', 'banner')),
  product_ids uuid[] not null default '{}',
  banner_image text,
  banner_link text,
  cta_text text,
  position integer not null default 100,
  is_visible boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_sections_position_idx on public.homepage_sections (position, created_at);

alter table public.homepage_sections enable row level security;

-- Public (storefront) can only read sections that are visible and within their schedule window.
drop policy if exists homepage_sections_public_read on public.homepage_sections;
create policy homepage_sections_public_read on public.homepage_sections
  for select using (
    is_visible = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

-- Owners and managers have full control (read all, create, edit, delete).
drop policy if exists homepage_sections_manage on public.homepage_sections;
create policy homepage_sections_manage on public.homepage_sections
  for all using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));