-- PV access is independent from the stock administrator's account/password.
-- Provision its Auth user separately; never store passwords in this repository.
begin;
create table if not exists public.kassa_pv_readers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.kassa_pv_readers enable row level security;
revoke all on public.kassa_pv_readers from anon, authenticated;
grant select on public.kassa_pv_readers to authenticated;
drop policy if exists kassa_pv_self_read on public.kassa_pv_readers;
create policy kassa_pv_self_read on public.kassa_pv_readers
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists showroom_sales_read on public.showroom_stock_sales;
create policy showroom_sales_read on public.showroom_stock_sales
  for select to authenticated
  using (
    exists (select 1 from public.kassa_admins where user_id = (select auth.uid()))
    or exists (select 1 from public.kassa_pv_readers where user_id = (select auth.uid()))
  );
drop policy if exists showroom_sale_items_read on public.showroom_stock_sale_items;
create policy showroom_sale_items_read on public.showroom_stock_sale_items
  for select to authenticated
  using (
    exists (select 1 from public.kassa_admins where user_id = (select auth.uid()))
    or exists (select 1 from public.kassa_pv_readers where user_id = (select auth.uid()))
  );

-- PV membership never grants stock-administration privileges.
insert into public.kassa_pv_readers (user_id)
select id from auth.users where email = 'sunspabrugge+kassapv@gmail.com'
on conflict (user_id) do nothing;
commit;
