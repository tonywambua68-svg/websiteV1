-- Require checkout's county and town to match the selected active delivery zone,
-- and refuse overlapping or missing active delivery rates. This patches the
-- existing place_order function without replacing its stock, coupon, payment,
-- order-history, or notification logic. It changes no rows.
-- Apply only after reviewing the remote migration history and testing on staging.
do $$
declare
  v_definition text;
  v_old text := 'or exists (select 1 from unnest(dz.towns) t where lower(trim(t)) = lower(v_town))';
  v_new text := 'and exists (select 1 from unnest(dz.towns) t where lower(trim(t)) = lower(v_town))';
  v_select text := '  select dr.id, dr.rate_kes, dr.cod_eligible, dz.name,';
  v_guarded_select text := $guard$
  if (
    select count(*)
    from public.delivery_rates candidate_rate
    where candidate_rate.zone_id = v_delivery_zone_id
      and candidate_rate.is_active
      and candidate_rate.min_order <= v_subtotal
      and (candidate_rate.max_order is null or candidate_rate.max_order >= v_subtotal)
  ) <> 1 then
    raise exception 'Delivery rate is missing or ambiguous for this location and order amount';
  end if;

  select dr.id, dr.rate_kes, dr.cod_eligible, dz.name,$guard$;
  v_first_position integer;
begin
  select pg_get_functiondef('public.place_order(jsonb)'::regprocedure)
  into v_definition;

  v_first_position := strpos(v_definition, v_old);
  if v_first_position = 0 and strpos(v_definition, v_new) = 0 then
    raise exception 'Expected delivery-zone match clause was not found in place_order; review the live function before applying this migration';
  end if;

  if v_first_position > 0 then
    if strpos(substr(v_definition, v_first_position + length(v_old)), v_old) > 0 then
      raise exception 'More than one delivery-zone match clause was found; review place_order before applying this migration';
    end if;
    v_definition := replace(v_definition, v_old, v_new);
  end if;

  v_first_position := strpos(v_definition, v_select);
  if v_first_position = 0 then
    raise exception 'Expected delivery-rate selection was not found in place_order; review the live function before applying this migration';
  end if;
  if strpos(substr(v_definition, v_first_position + length(v_select)), v_select) > 0 then
    raise exception 'More than one delivery-rate selection was found; review place_order before applying this migration';
  end if;
  v_definition := replace(v_definition, v_select, v_guarded_select);
  execute v_definition;
end;
$$;
