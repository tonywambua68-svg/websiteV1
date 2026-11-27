-- OREMITECH: review purchase verification
-- Prevents arbitrary users from posting reviews for products they never bought.
-- Additive and idempotent. Staff (owner/manager) are exempt for moderation/testing.
-- Apply via the normal Supabase migration pipeline after reviewing on staging.

-- Returns true when the current user may review the given product:
--   - staff (owner/manager) always may, OR
--   - the user has at least one DELIVERED order containing the product.
create or replace function public.has_purchased_product(p_product_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    public.current_profile_role() in ('owner', 'manager')
    or exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_id = p_product_id
        and o.user_id = auth.uid()
        and o.status = 'delivered'
    );
$$;

grant execute on function public.has_purchased_product(uuid) to anon, authenticated;

-- Enforce purchase verification on insert (in addition to the pending-moderation trigger).
create or replace function public.tg_reviews_require_purchase()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.has_purchased_product(new.product_id) then
    raise exception 'Reviews are limited to verified purchasers of this product.';
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_require_purchase on public.product_reviews;
create trigger reviews_require_purchase
  before insert on public.product_reviews
  for each row execute function public.tg_reviews_require_purchase();