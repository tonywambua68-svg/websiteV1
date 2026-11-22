-- OREMITECH blog category SEO fields
-- Adds seo_focus_keyword, seo_social_title, seo_social_description to blog_categories
-- Apply after 20261117000001_blog_and_category_seo.sql

alter table public.blog_categories
  add column if not exists seo_focus_keyword text,
  add column if not exists seo_social_title text,
  add column if not exists seo_social_description text;

create index if not exists idx_blog_categories_slug on public.blog_categories (slug);

comment on column public.blog_categories.seo_focus_keyword is 'Primary target keyword for category SEO';
comment on column public.blog_categories.seo_social_title is 'Open Graph / social title override';
comment on column public.blog_categories.seo_social_description is 'Open Graph / social description override';
