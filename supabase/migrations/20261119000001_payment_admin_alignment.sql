-- Payment reference intake and admin RPC alignment.
-- Apply after the OREMITECH core and delivery migrations.

-- Restrict profile self-edits to personal fields. Role and account status must
-- only be changed by owner-authorized server functions.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

create or replace function public.set_profile_status(p_profile_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then raise exception 'Only the owner can change staff account status'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'Unknown account status'; end if;
  if p_profile_id = auth.uid() and p_status = 'suspended' then
    raise exception 'The owner account cannot suspend itself';
  end if;
  update public.profiles set account_status = p_status, updated_at = now() where id = p_profile_id;
  if not found then raise exception 'Staff profile not found'; end if;
  perform public.log_activity('profile.status_changed', 'profile', p_profile_id, jsonb_build_object('status', p_status));
end;
$$;

revoke all on function public.set_profile_status(uuid, text) from public, anon;
grant execute on function public.set_profile_status(uuid, text) to authenticated;

alter table public.payment_records
  add column if not exists provider_request_id text,
  add column if not exists provider_receipt text;

create unique index if not exists payment_records_provider_request_id_uq
  on public.payment_records (provider_request_id)
  where provider_request_id is not null;

create unique index if not exists payment_records_provider_receipt_uq
  on public.payment_records (provider_receipt)
  where provider_receipt is not null;

create or replace function public.submit_payment_reference(
  p_order_number text,
  p_phone text,
  p_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_reference text := upper(trim(coalesce(p_reference, '')));
  v_payment_id uuid;
begin
  if v_reference !~ '^[A-Z0-9]{4,20}$' then
    raise exception 'Enter a valid M-PESA transaction code';
  end if;

  select * into v_order
  from public.orders
  where order_number = upper(trim(coalesce(p_order_number, '')))
    and guest_phone = public.normalize_phone(coalesce(p_phone, ''))
  for update;

  if not found then
    raise exception 'Order was not found';
  end if;
  if v_order.payment_method <> 'mpesa_paybill' then
    raise exception 'This order does not accept M-PESA PayBill references';
  end if;
  if v_order.status in ('cancelled', 'refunded', 'paid') then
    raise exception 'This order cannot accept a payment reference';
  end if;
  if exists (
    select 1 from public.payment_records pr
    where upper(pr.reference) = v_reference and pr.order_id <> v_order.id
  ) then
    raise exception 'That M-PESA transaction code is already linked to another order';
  end if;

  select id into v_payment_id
  from public.payment_records
  where order_id = v_order.id
    and provider in ('manual', 'unassigned', 'mpesa_daraja')
    and status in ('unpaid', 'pending', 'failed')
  order by created_at desc
  limit 1
  for update;

  if v_payment_id is null then
    raise exception 'No pending payment was found for this order';
  end if;

  update public.payment_records
  set provider = 'manual', status = 'pending', amount = v_order.total,
      currency = 'KES', reference = v_reference
  where id = v_payment_id;

  return jsonb_build_object('submitted', true, 'status', 'pending');
end;
$$;

revoke all on function public.submit_payment_reference(text, text, text) from public;
grant execute on function public.submit_payment_reference(text, text, text) to anon, authenticated;

create or replace function public.record_payment(
  p_order_id uuid,
  p_provider text,
  p_status text,
  p_reference text,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_reference text := nullif(upper(trim(coalesce(p_reference, ''))), '');
  v_payment_id uuid;
begin
  if public.current_profile_role() not in ('owner', 'manager', 'sales_assistant') then
    raise exception 'You cannot record payments';
  end if;
  if p_provider not in ('manual', 'mpesa_daraja') then
    raise exception 'Unknown payment provider';
  end if;
  if p_status not in ('pending', 'confirmed', 'failed') then
    raise exception 'Unknown payment status';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status = 'awaiting_supplier_confirmation' then
    raise exception 'Confirm supplier availability before recording payment';
  end if;
  if v_order.status in ('cancelled', 'refunded') then
    raise exception 'This order cannot take a payment';
  end if;

  if p_status = 'confirmed' then
    if v_reference is null or char_length(v_reference) < 4 then
      raise exception 'A payment reference from the provider is required';
    end if;
    if p_amount is distinct from v_order.total then
      raise exception 'The confirmed amount must match the order total';
    end if;
    if exists (
      select 1 from public.payment_records pr
      where upper(pr.reference) = v_reference and pr.order_id <> p_order_id
    ) then
      raise exception 'That payment reference is already linked to another order';
    end if;
  end if;

  select id into v_payment_id
  from public.payment_records
  where order_id = p_order_id
    and (
      upper(reference) = v_reference
      or (p_provider = 'manual' and provider = 'unassigned' and status = 'unpaid')
      or (p_provider = 'manual' and provider = 'manual' and status = 'pending' and reference is null)
    )
  order by case when upper(reference) = v_reference then 0 else 1 end, created_at desc
  limit 1
  for update;

  if v_payment_id is not null then
    if exists (select 1 from public.payment_records where id = v_payment_id and status = 'confirmed') then
      if p_status = 'confirmed' and exists (
        select 1 from public.payment_records where id = v_payment_id and upper(reference) = v_reference and amount = p_amount
      ) then
        return;
      end if;
      raise exception 'This payment has already been confirmed';
    end if;
    update public.payment_records
    set provider = p_provider, status = p_status,
        amount = coalesce(p_amount, v_order.total), currency = 'KES',
        reference = v_reference,
        confirmed_by = case when p_status = 'confirmed' then auth.uid() else null end
    where id = v_payment_id;
  else
    insert into public.payment_records (order_id, provider, status, amount, currency, reference, confirmed_by)
    values (p_order_id, p_provider, p_status, coalesce(p_amount, v_order.total), 'KES', v_reference,
      case when p_status = 'confirmed' then auth.uid() else null end);
  end if;

  if p_status = 'confirmed' and v_order.status <> 'paid' then
    update public.orders set status = 'paid', updated_at = now() where id = p_order_id;
    insert into public.order_status_history (order_id, status, note, actor_id)
    values (p_order_id, 'paid', 'Payment confirmed with reference ' || v_reference, auth.uid());
  end if;
  perform public.log_activity('payment.recorded', 'order', p_order_id,
    jsonb_build_object('status', p_status, 'provider', p_provider));
end;
$$;

revoke all on function public.record_payment(uuid, text, text, text, numeric) from public, anon;
grant execute on function public.record_payment(uuid, text, text, text, numeric) to authenticated;

-- Reserve a single in-flight STK attempt before contacting Safaricom. This
-- makes repeated requests idempotently fail before a second charge is sent.
create or replace function public.prepare_mpesa_stk_payment(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_payment_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'Not authorized'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_method <> 'mpesa_paybill' or v_order.status in ('cancelled', 'refunded', 'paid', 'awaiting_supplier_confirmation') then
    raise exception 'This order cannot start an M-PESA payment';
  end if;
  if exists (select 1 from public.payment_records where order_id = p_order_id and status = 'confirmed') then
    raise exception 'This order is already paid';
  end if;
  if exists (select 1 from public.payment_records where order_id = p_order_id and provider = 'mpesa_daraja' and status = 'pending') then
    raise exception 'An M-PESA request is already pending for this order';
  end if;
  select id into v_payment_id
  from public.payment_records
  where order_id = p_order_id and status in ('unpaid', 'pending', 'failed')
  order by created_at desc limit 1 for update;
  if v_payment_id is null then raise exception 'No pending payment record exists'; end if;
  update public.payment_records
  set provider = 'mpesa_daraja', status = 'pending', amount = v_order.total,
      currency = 'KES', reference = null, provider_request_id = null, provider_receipt = null
  where id = v_payment_id;
  return v_payment_id;
end;
$$;

create or replace function public.begin_mpesa_stk_payment(p_payment_id uuid, p_checkout_request_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Not authorized'; end if;
  if p_checkout_request_id is null or length(trim(p_checkout_request_id)) < 4 then
    raise exception 'Invalid provider request reference';
  end if;
  update public.payment_records
  set
      reference = p_checkout_request_id, provider_request_id = p_checkout_request_id
  where id = p_payment_id and provider = 'mpesa_daraja' and status = 'pending' and provider_request_id is null;
  if not found then raise exception 'STK attempt is no longer pending'; end if;
end;
$$;

create or replace function public.fail_mpesa_stk_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Not authorized'; end if;
  update public.payment_records set status = 'failed'
  where id = p_payment_id and provider = 'mpesa_daraja' and status = 'pending' and provider_request_id is null;
end;
$$;

create or replace function public.finish_mpesa_stk_callback(
  p_checkout_request_id text,
  p_result_code integer,
  p_receipt text,
  p_amount numeric,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payment_records%rowtype;
  v_order public.orders%rowtype;
  v_phone text;
begin
  if auth.role() <> 'service_role' then raise exception 'Not authorized'; end if;
  select pr.* into v_payment
  from public.payment_records pr
  where pr.provider_request_id = p_checkout_request_id
    and pr.provider = 'mpesa_daraja'
  for update;
  if not found then raise exception 'Payment request not found'; end if;
  if v_payment.status = 'confirmed' then
    return jsonb_build_object('status', 'already_processed');
  end if;
  select * into v_order from public.orders where id = v_payment.order_id for update;
  if not found then raise exception 'Order not found'; end if;

  if p_result_code = 0 then
    v_phone := public.normalize_phone(coalesce(p_phone, ''));
    if p_amount is null or p_amount is distinct from v_payment.amount or p_amount is distinct from v_order.total then
      raise exception 'Provider amount does not match the order total';
    end if;
    if v_phone is null or v_phone <> v_order.guest_phone then
      raise exception 'Provider phone does not match the order';
    end if;
    if p_receipt is null or length(trim(p_receipt)) < 4 then
      raise exception 'Provider receipt is missing';
    end if;
    if exists (select 1 from public.payment_records where provider_receipt = upper(trim(p_receipt)) and id <> v_payment.id) then
      raise exception 'Provider receipt has already been used';
    end if;
    update public.payment_records
    set status = 'confirmed', reference = upper(trim(p_receipt)), provider_receipt = upper(trim(p_receipt))
    where id = v_payment.id;
    if v_order.status in ('cancelled', 'refunded') then
      insert into public.order_status_history (order_id, status, note, actor_id)
      values (v_order.id, v_order.status, 'M-PESA payment arrived after the order was cancelled or refunded; review required.', null);
      perform public.log_activity('payment.received_after_cancellation', 'order', v_order.id,
        jsonb_build_object('provider', 'mpesa_daraja'));
      return jsonb_build_object('status', 'review_required');
    end if;
    if v_order.status <> 'paid' then
      update public.orders set status = 'paid', updated_at = now() where id = v_order.id;
      insert into public.order_status_history (order_id, status, note, actor_id)
      values (v_order.id, 'paid', 'M-PESA payment confirmed by provider callback', null);
    end if;
    perform public.log_activity('payment.recorded', 'order', v_order.id,
      jsonb_build_object('status', 'confirmed', 'provider', 'mpesa_daraja'));
    return jsonb_build_object('status', 'confirmed');
  end if;

  update public.payment_records set status = 'failed' where id = v_payment.id;
  return jsonb_build_object('status', 'failed');
end;
$$;

revoke all on function public.prepare_mpesa_stk_payment(uuid) from public, anon, authenticated;
revoke all on function public.begin_mpesa_stk_payment(uuid, text) from public, anon, authenticated;
revoke all on function public.fail_mpesa_stk_payment(uuid) from public, anon, authenticated;
revoke all on function public.finish_mpesa_stk_callback(text, integer, text, numeric, text) from public, anon, authenticated;
grant execute on function public.prepare_mpesa_stk_payment(uuid) to service_role;
grant execute on function public.begin_mpesa_stk_payment(uuid, text) to service_role;
grant execute on function public.fail_mpesa_stk_payment(uuid) to service_role;
grant execute on function public.finish_mpesa_stk_callback(text, integer, text, numeric, text) to service_role;

-- This is the function name used by the existing order admin page.
-- Keep the underlying transition and role validation in update_order_status.
