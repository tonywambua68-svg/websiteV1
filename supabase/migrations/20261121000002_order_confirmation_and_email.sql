-- Secure customer order lookup for the confirmation/invoice page. Access
-- requires both the exact order number and its normalized contact phone.
create or replace function public.get_order_confirmation(p_number text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  select * into v_order
  from public.orders
  where order_number = upper(trim(p_number))
    and guest_phone = public.normalize_phone(p_phone);

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', product_name,
    'quantity', quantity,
    'unit_price', unit_price,
    'line_total', line_total,
    'fulfilment', fulfilment
  ) order by id), '[]'::jsonb)
  into v_items
  from public.order_items
  where order_id = v_order.id;

  return jsonb_build_object(
    'found', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'created_at', v_order.created_at,
    'customer_name', v_order.guest_name,
    'delivery_location', v_order.delivery_location,
    'payment_method', v_order.payment_method,
    'status', v_order.status,
    'payment_status', coalesce((
      select pr.status from public.payment_records pr
      where pr.order_id = v_order.id
      order by pr.created_at desc
      limit 1
    ), 'unpaid'),
    'currency', v_order.currency,
    'subtotal', v_order.subtotal,
    'discount', v_order.discount,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'requires_supplier_confirmation', v_order.requires_supplier_confirmation,
    'items', v_items
  );
end;
$$;

revoke all on function public.get_order_confirmation(text, text) from public;
grant execute on function public.get_order_confirmation(text, text) to anon, authenticated;

-- One outbound customer confirmation attempt per order. Service role only;
-- customer clients cannot read or alter delivery state for transactional mail.
create table if not exists public.order_email_dispatches (
  order_id uuid not null references public.orders(id) on delete cascade,
  email_type text not null check (email_type = 'order_confirmation'),
  status text not null check (status in ('sending', 'sent', 'failed')),
  attempted_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key (order_id, email_type)
);

alter table public.order_email_dispatches enable row level security;
