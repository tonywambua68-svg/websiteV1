-- OREMITECH: genuine product rating summary from PUBLISHED reviews only.
-- Additive, idempotent, read-only. Does not modify existing tables/views/RLS.
-- Powers real star ratings + review counts on product cards (no fabricated data).

create or replace function public.product_rating_summary()
returns table (product_id uuid, avg_rating numeric, review_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    pr.product_id,
    round(avg(pr.rating)::numeric, 1) as avg_rating,
    count(*)::bigint as review_count
  from public.product_reviews pr
  where pr.status = 'published'
  group by pr.product_id;
$$;

grant execute on function public.product_rating_summary() to anon, authenticated;