create table if not exists public.order_sms_dispatches (
  order_id uuid primary key references public.orders(id) on delete cascade,
  status text not null check (status in ('sending', 'sent', 'failed')),
  provider_response jsonb,
  attempted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.order_sms_dispatches enable row level security;
revoke all on public.order_sms_dispatches from public, anon, authenticated;
grant all on public.order_sms_dispatches to service_role;
