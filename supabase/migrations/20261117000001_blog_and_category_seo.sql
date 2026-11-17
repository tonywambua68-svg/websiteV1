-- OREMITECH blog and category SEO migration
-- Adds blog articles, blog categories, and SEO fields to product categories
-- Apply after 20261112000000_oremitech_schema.sql

-- ---------------------------------------------------------------------------
-- Blog categories
-- ---------------------------------------------------------------------------

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  seo_title text,
  seo_description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Blog articles
-- ---------------------------------------------------------------------------

create table if not exists public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  featured_image_url text,
  featured_image_alt text,
  category_id uuid references public.blog_categories (id) on delete set null,
  author_id uuid references public.profiles (id),
  seo_title text,
  seo_description text,
  seo_focus_keyword text,
  seo_secondary_keywords text,
  seo_social_title text,
  seo_social_description text,
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived', 'scheduled')),
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SEO fields on product categories
-- ---------------------------------------------------------------------------

alter table public.categories
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_focus_keyword text,
  add column if not exists seo_social_title text,
  add column if not exists seo_social_description text;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_blog_articles_slug on public.blog_articles (slug);
create index if not exists idx_blog_articles_status on public.blog_articles (publication_status);
create index if not exists idx_blog_articles_category on public.blog_articles (category_id);
create index if not exists idx_blog_articles_published_at on public.blog_articles (published_at);
create index if not exists idx_blog_categories_slug on public.blog_categories (slug);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.blog_categories enable row level security;
alter table public.blog_articles enable row level security;

-- Public read for published articles and active categories
create policy if not exists blog_categories_public_read on public.blog_categories
  for select using (is_active = true);

create policy if not exists blog_articles_public_read on public.blog_articles
  for select using (
    publication_status = 'published'
    and (scheduled_at is null or scheduled_at <= now())
  );

-- Staff can manage all blog content
create policy if not exists blog_staff_manage on public.blog_categories
  for all using (public.is_staff());

create policy if not exists blog_articles_staff_manage on public.blog_articles
  for all using (public.is_staff());

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger if not exists blog_categories_updated_at
  before update on public.blog_categories
  for each row execute function public.touch_updated_at();

create trigger if not exists blog_articles_updated_at
  before update on public.blog_articles
  for each row execute function public.touch_updated_at();
