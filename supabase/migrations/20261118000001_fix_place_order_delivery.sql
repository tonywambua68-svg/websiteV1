-- OREMITECH: Fix place_order for delivery foundation
-- 1. Adds delivery columns to orders (idempotent)
-- 2. Replaces place_order to validate delivery fees server-side
-- Depends on: 20261117000002_delivery_foundation.sql (delivery_zones, delivery_rates tables)
-- Apply both migrations before using checkout with delivery.

-- ---------------------------------------------------------------------------
-- Delivery columns on orders (idempotent)
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  add column if not exists payment_method text,
  add column if not exists cod_collection_confirmed boolean not null default false,
  add column if not exists delivery_zone_id uuid references public.delivery_zones (id),
  add column if not exists delivery_zone_name text,
  add column if not exists delivery_method text,
  add column if not exists checkout_token text;

create unique index if not exists orders_checkout_token_uq
  on public.orders (checkout_token) where checkout_token is not null;

-- ---------------------------------------------------------------------------
-- Updated place_order function
-- Accepts a single jsonb payload. Validates delivery fee server-side against
-- delivery_rates. Never trusts frontend-submitted prices.
-- ---------------------------------------------------------------------------

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_phone text;
  v_email text;
  v_location text;
  v_instructions text;
  v_coupon text;
  v_grouped jsonb;
  r record;
  v_pid uuid;
  v_pid_text text;
  v_qty int;
  v_variant uuid;
  v_variant_text text;
  v_product public.products%rowtype;
  v_price numeric(12,2);
  v_label text;
  v_variant_label text;
  v_owned_free int;
  v_supplier_free int;
  v_fulfilment text;
  v_lines jsonb := '[]'::jsonb;
  v_remaining jsonb := '{}'::jsonb;
  v_ids uuid[];
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_supplier boolean := false;
  v_order_id uuid;
  v_number text;
  v_status text;
  v_customer_id uuid;
  v_user uuid;
  v_coupon_row public.coupons%rowtype;
  -- Delivery fields
  v_delivery_zone_id uuid;
  v_delivery_zone_id_text text;
  v_delivery_zone_name text;
  v_delivery_method text;
  v_payment_method text;
  v_payment_reference text;
  v_checkout_token text;
  v_county text;
  v_town text;
  v_delivery_fee numeric(12,2) := 0;
  v_rate_id uuid;
  v_cod_eligible boolean := false;
  v_existing_order public.orders%rowtype;
begin
  v_user := auth.uid();
  v_name := nullif(trim(coalesce(payload->>'customer_name', '')), '');
  v_phone := public.normalize_phone(coalesce(payload->>'phone', ''));
  v_email := nullif(trim(coalesce(payload->>'email', '')), '');
  v_location := nullif(trim(coalesce(payload->>'delivery_location', '')), '');
  v_instructions := nullif(trim(coalesce(payload->>'delivery_instructions', '')), '');
  v_coupon := nullif(upper(trim(coalesce(payload->>'coupon_code', ''))), '');
  v_checkout_token := nullif(trim(coalesce(payload->>'checkout_token', '')), '');
  if v_checkout_token is null then
    v_checkout_token := gen_random_uuid()::text;
  end if;
  if char_length(v_checkout_token) > 100 then
    raise exception 'Invalid checkout request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_checkout_token, 0));

  select * into v_existing_order from public.orders where checkout_token = v_checkout_token;
  if found then
    if v_existing_order.guest_phone <> v_phone or (v_existing_order.user_id is distinct from v_user) then
      raise exception 'Checkout request does not match the customer';
    end if;
    return jsonb_build_object(
      'order_id', v_existing_order.id,
      'order_number', v_existing_order.order_number,
      'status', v_existing_order.status,
      'payment_status', coalesce((select pr.status from public.payment_records pr where pr.order_id = v_existing_order.id order by pr.created_at desc limit 1), 'unpaid'),
      'total', v_existing_order.total,
      'currency', v_existing_order.currency,
      'delivery_fee', v_existing_order.delivery_fee,
      'requires_supplier_confirmation', v_existing_order.requires_supplier_confirmation
    );
  end if;

  -- Delivery fields from payload (validated server-side)
  v_delivery_zone_id_text := nullif(trim(coalesce(payload->>'delivery_zone_id', '')), '');
  if v_delivery_zone_id_text is not null
     and v_delivery_zone_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Delivery is not available for this location';
  end if;
  v_delivery_zone_id := v_delivery_zone_id_text::uuid;
  v_delivery_zone_name := nullif(trim(coalesce(payload->>'delivery_zone_name', '')), '');
  v_delivery_method := nullif(trim(coalesce(payload->>'delivery_method', '')), '');
  v_payment_method := nullif(trim(coalesce(payload->>'payment_method', '')), '');
  v_payment_reference := nullif(upper(trim(coalesce(payload->>'payment_reference', ''))), '');
  v_county := nullif(trim(coalesce(payload->>'county', '')), '');
  v_town := nullif(trim(coalesce(payload->>'town', '')), '');

  if v_name is null or char_length(v_name) < 2 then
    raise exception 'Enter the customer name';
  end if;
  if v_phone is null or char_length(v_phone) < 11 then
    raise exception 'Enter a valid Kenyan phone number';
  end if;
  if v_location is null or char_length(v_location) < 3 then
    raise exception 'Enter the delivery location';
  end if;
  if jsonb_typeof(payload->'items') is distinct from 'array'
     or jsonb_array_length(payload->'items') < 1
     or jsonb_array_length(payload->'items') > 20 then
    raise exception 'An order must contain between 1 and 20 lines';
  end if;

  -- Group items keeping product_id and variant_id as text (frontend may send slugs)
  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', product_id_text,
    'variant_id', variant_id_text,
    'quantity', quantity
  )), '[]'::jsonb)
  into v_grouped
  from (
    select
      value->>'product_id' as product_id_text,
      nullif(value->>'variant_id', '') as variant_id_text,
      sum((value->>'quantity')::int) as quantity
    from jsonb_array_elements(payload->'items')
    group by 1, 2
  ) s;

  -- Resolve product IDs (UUID or slug) to UUIDs for inventory locking
  select coalesce(array_agg(distinct p.id), '{}')
  into v_ids
  from jsonb_array_elements(v_grouped) item
  join public.products p
    on (
      case
        when item.value->>'product_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then p.id = (item.value->>'product_id')::uuid
        else false
      end
      or p.slug = item.value->>'product_id'
    );

  perform 1
  from public.inventory_balances
  where product_id = any (v_ids)
  order by product_id
  for update;

  -- Build remaining inventory keyed by resolved product UUID
  for r in
    select p.id as product_id, i.owned_qty - i.reserved_qty as owned_free, i.supplier_qty - i.supplier_reserved_qty as supplier_free
    from public.inventory_balances i
    join public.products p on p.id = i.product_id
    where p.id = any (v_ids)
  loop
    v_remaining := v_remaining || jsonb_build_object(
      r.product_id::text,
      jsonb_build_object('owned', r.owned_free, 'supplier', r.supplier_free)
    );
  end loop;

  for r in select value as item from jsonb_array_elements(v_grouped)
  loop
    v_pid_text := r.item->>'product_id';
    v_variant_text := nullif(r.item->>'variant_id', '');
    v_qty := (r.item->>'quantity')::int;

    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'Quantity must be between 1 and 10';
    end if;

    -- Resolve product by UUID or slug
    v_variant := null;
    v_variant_label := null;
    if v_pid_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select * into v_product from public.products where id = v_pid_text::uuid;
    else
      select * into v_product from public.products where slug = v_pid_text;
    end if;
    if not found or v_product.deleted_at is not null or v_product.publication_status <> 'published' then
      raise exception 'A product in the cart is not available';
    end if;

    v_pid := v_product.id;

    if not (v_remaining ? v_pid::text) then
      raise exception 'Inventory is missing for a product';
    end if;

    v_price := v_product.selling_price;
    v_label := v_product.name;
    if v_variant_text is not null then
      if v_variant_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'That product option is not available';
      end if;
      select pv.selling_price, pv.label
      into v_price, v_variant_label
      from public.product_variants pv
      where pv.id = v_variant_text::uuid and pv.product_id = v_pid and pv.is_active;
      if not found then
        raise exception 'That product option is not available';
      end if;
      v_variant := v_variant_text::uuid;
      v_label := v_product.name || ' — ' || v_variant_label;
    end if;

    v_owned_free := coalesce((v_remaining->(v_pid::text)->>'owned')::int, 0);
    v_supplier_free := coalesce((v_remaining->(v_pid::text)->>'supplier')::int, 0);

    if v_owned_free >= v_qty then
      v_fulfilment := 'owned';
      v_remaining := jsonb_set(v_remaining, array[v_pid::text, 'owned'], to_jsonb(v_owned_free - v_qty));
    elsif v_supplier_free >= v_qty then
      v_fulfilment := 'supplier';
      v_supplier := true;
      v_remaining := jsonb_set(v_remaining, array[v_pid::text, 'supplier'], to_jsonb(v_supplier_free - v_qty));
    else
      raise exception 'Not enough stock for %', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_price * v_qty);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_pid,
      'variant_id', v_variant,
      'name', v_label,
      'quantity', v_qty,
      'unit_price', v_price,
      'fulfilment', v_fulfilment
    ));
  end loop;

  if v_coupon is not null then
    select * into v_coupon_row
    from public.coupons
    where code = v_coupon
      and is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
      and (usage_limit is null or used_count < usage_limit)
    for update;
    if not found then
      raise exception 'That coupon cannot be applied';
    end if;
    if v_coupon_row.min_order is not null and v_subtotal < v_coupon_row.min_order then
      raise exception 'That coupon cannot be applied';
    end if;
    if v_coupon_row.discount_type = 'percent' then
      v_discount := round(v_subtotal * (v_coupon_row.amount / 100.0), 2);
    else
      v_discount := least(v_coupon_row.amount, v_subtotal);
    end if;
    v_discount := least(v_discount, v_subtotal);
  end if;

  -- --- Server-side delivery fee validation ---
  -- Never trust frontend-submitted delivery_fee. Look up the rate for this
  -- zone and order subtotal from delivery_rates.
  if v_delivery_zone_id is null then
    raise exception 'Delivery zone is required';
  end if;
  if v_county is null or v_town is null then
    raise exception 'County and town are required for delivery';
  end if;
  if v_payment_method is null or v_payment_method not in ('mpesa_paybill', 'cash_on_delivery') then
    raise exception 'Choose a supported payment method';
  end if;
  if v_payment_reference is not null and v_payment_reference !~ '^[A-Z0-9]{4,20}$' then
    raise exception 'Enter a valid M-PESA transaction code';
  end if;

  select dr.id, dr.rate_kes, dr.cod_eligible, dz.name,
         case when lower(dz.name) like '%nairobi%' then 'standard' else 'parcel' end
  into v_rate_id, v_delivery_fee, v_cod_eligible, v_delivery_zone_name, v_delivery_method
  from public.delivery_rates dr
  join public.delivery_zones dz on dz.id = dr.zone_id and dz.is_active
  where dr.zone_id = v_delivery_zone_id
    and dr.is_active
    and (
      exists (select 1 from unnest(dz.counties) c where lower(trim(c)) = lower(v_county))
      or exists (select 1 from unnest(dz.towns) t where lower(trim(t)) = lower(v_town))
    )
    and dr.min_order <= v_subtotal
    and (dr.max_order is null or dr.max_order >= v_subtotal)
  order by dr.min_order desc
  limit 1;

  if not found then
    raise exception 'Delivery is not available for this location and order amount';
  end if;
  if v_payment_method = 'cash_on_delivery' and not v_cod_eligible then
    raise exception 'Cash on delivery is not available for this delivery zone';
  end if;

  v_total := v_subtotal - v_discount + v_delivery_fee;
  v_status := case when v_supplier then 'awaiting_supplier_confirmation' else 'pending' end;
  v_number := 'OM-' || to_char(now() at time zone 'Africa/Nairobi', 'YYYYMMDD')
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  if v_user is not null then
    select id into v_customer_id from public.customers where user_id = v_user;
  end if;

  insert into public.orders (
    order_number, customer_id, user_id, guest_name, guest_phone, guest_email,
    delivery_location, delivery_instructions, status, subtotal, discount, total,
    coupon_code, requires_supplier_confirmation,
    delivery_fee, payment_method, delivery_zone_id, delivery_zone_name, delivery_method, checkout_token
  ) values (
    v_number, v_customer_id, v_user, v_name, v_phone, v_email,
    v_location, v_instructions, v_status, v_subtotal, v_discount, v_total,
    v_coupon, v_supplier,
    v_delivery_fee, v_payment_method, v_delivery_zone_id, v_delivery_zone_name, v_delivery_method, v_checkout_token
  ) returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, quantity, unit_price, line_total, fulfilment
  )
  select
    v_order_id,
    (line->>'product_id')::uuid,
    nullif(line->>'variant_id', '')::uuid,
    line->>'name',
    (line->>'quantity')::int,
    (line->>'unit_price')::numeric,
    (line->>'unit_price')::numeric * (line->>'quantity')::int,
    line->>'fulfilment'
  from jsonb_array_elements(v_lines) line;

  insert into public.order_item_costs (order_item_id, purchase_cost)
  select oi.id, pc.purchase_cost
  from public.order_items oi
  join public.product_costs pc on pc.product_id = oi.product_id
  where oi.order_id = v_order_id;

  for r in select value as item from jsonb_array_elements(v_lines)
  loop
    if r.item->>'fulfilment' = 'owned' then
      update public.inventory_balances
        set reserved_qty = reserved_qty + (r.item->>'quantity')::int,
            updated_at = now()
        where product_id = (r.item->>'product_id')::uuid;
      insert into public.stock_movements (product_id, movement_type, quantity, bucket, reference_type, reference_id, notes, actor_id)
      values (
        (r.item->>'product_id')::uuid, 'reserve', (r.item->>'quantity')::int,
        'owned', 'order', v_order_id, 'Reserved for ' || v_number, v_user
      );
    else
      update public.inventory_balances
        set supplier_reserved_qty = supplier_reserved_qty + (r.item->>'quantity')::int,
            updated_at = now()
        where product_id = (r.item->>'product_id')::uuid;
      insert into public.stock_movements (product_id, movement_type, quantity, bucket, reference_type, reference_id, notes, actor_id)
      values (
        (r.item->>'product_id')::uuid, 'supplier_reserve', (r.item->>'quantity')::int,
        'supplier', 'order', v_order_id, 'Supplier reservation for ' || v_number, v_user
      );
    end if;
  end loop;

  if v_coupon is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon_row.id;
  end if;

  if v_payment_method = 'mpesa_paybill' then
    insert into public.payment_records (order_id, provider, status, amount, currency, reference)
    values (v_order_id, 'manual', 'pending', v_total, 'KES', v_payment_reference);
  else
    insert into public.payment_records (order_id, provider, status, amount, currency)
    values (v_order_id, 'unassigned', 'unpaid', v_total, 'KES');
  end if;

  insert into public.order_status_history (order_id, status, note, actor_id)
  values (v_order_id, v_status, 'Order recorded. Payment has not been confirmed.', v_user);

  perform public.log_activity('order.created', 'order', v_order_id, jsonb_build_object('order_number', v_number, 'total', v_total));

  insert into public.notifications (user_id, title, body, href)
  select p.id, 'New order ' || v_number, v_name || ' placed an order', '/admin/orders'
  from public.profiles p
  where p.role = 'owner' and p.account_status = 'active';

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_number,
    'status', v_status,
    'payment_status', 'unpaid',
    'total', v_total,
    'currency', 'KES',
    'delivery_fee', v_delivery_fee,
    'requires_supplier_confirmation', v_supplier
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (re-assert after create or replace)
-- ---------------------------------------------------------------------------

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Indexes for delivery lookups
-- ---------------------------------------------------------------------------

create index if not exists idx_orders_delivery_zone on public.orders (delivery_zone_id);
create index if not exists idx_orders_delivery_fee on public.orders (delivery_fee);

-- Prevent customers and staff from promoting their own profiles through the
-- broad self-update policy in the base schema. Owners retain staff management.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_owner())
  with check (
    (id = auth.uid()
      and role = public.current_profile_role()
      and account_status = 'active')
    or public.is_owner()
  );
