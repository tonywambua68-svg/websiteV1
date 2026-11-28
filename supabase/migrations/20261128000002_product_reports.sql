-- OREMITECH: customer product reports (incorrect info). Additive, idempotent.
create table if not exists public.product_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  reason text not null check (reason in ('spec', 'image', 'price', 'condition', 'availability', 'other')),
  details text check (details is null or char_length(details) <= 2000),
  name text check (name is null or char_length(name) <= 120),
  contact text check (contact is null or char_length(contact) <= 120),
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists product_reports_product_idx on public.product_reports (product_id);
create index if not exists product_reports_status_idx on public.product_reports (status, created_at);

alter table public.product_reports enable row level security;

-- Anyone (including anonymous shoppers) may submit a report.
drop policy if exists product_reports_insert on public.product_reports;
create policy product_reports_insert on public.product_reports
  for insert with check (true);

-- Only owners/managers may read and triage reports.
drop policy if exists product_reports_manage on public.product_reports;
create policy product_reports_manage on public.product_reports
  for select using (public.current_profile_role() in ('owner', 'manager'));
drop policy if exists product_reports_update on public.product_reports;
create policy product_reports_update on public.product_reports
  for update using (public.current_profile_role() in ('owner', 'manager'))
  with check (public.current_profile_role() in ('owner', 'manager'));

grant insert on public.product_reports to anon, authenticated;
grant select, update on public.product_reports to authenticated;