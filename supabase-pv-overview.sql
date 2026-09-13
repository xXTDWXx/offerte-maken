-- Additive update for the existing showroom cash register.
-- Apply once before publishing kassa-stock.js with PV support.
-- User confirmed that all historical receipts were paid via Bancontact.
begin;

alter table public.showroom_stock_sales
  add column if not exists payment_method text
  check (payment_method in ('Bancontact', 'Overschrijving'));

update public.showroom_stock_sales
  set payment_method = 'Bancontact'
  where payment_method is null;

-- Keep the existing two-argument RPC available to already-open cash registers.
-- The wrapper records the payment in the same transaction as the sale/stock.
create or replace function public.register_showroom_sale_with_payment(
  p_showroom text, p_items jsonb, p_payment_method text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale_id uuid;
begin
  if p_payment_method is null or p_payment_method not in ('Bancontact', 'Overschrijving') then
    raise exception 'Kies een geldige betaalwijze.';
  end if;
  if p_showroom is null or p_showroom not in ('gent', 'brugge') then
    raise exception 'Kies een geldige showroom.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Geen geldige producten om te verkopen.';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Geen producten om te verkopen.';
  end if;
  v_sale_id := public.register_showroom_sale(p_showroom, p_items);
  update public.showroom_stock_sales
    set payment_method = p_payment_method where id = v_sale_id;
  return v_sale_id;
end;
$$;

revoke all on function public.register_showroom_sale_with_payment(text, jsonb, text) from public;
grant execute on function public.register_showroom_sale_with_payment(text, jsonb, text) to anon, authenticated;

-- The existing administrator membership is the authorization source.
-- A user may only read their own membership and cannot add themselves.
alter table public.kassa_admins enable row level security;
grant select on public.kassa_admins to authenticated;
drop policy if exists kassa_admin_self_read on public.kassa_admins;
create policy kassa_admin_self_read on public.kassa_admins
  for select to authenticated using (user_id = (select auth.uid()));

alter table public.showroom_stock_sales enable row level security;
alter table public.showroom_stock_sale_items enable row level security;
drop policy if exists showroom_sales_read on public.showroom_stock_sales;
drop policy if exists showroom_sale_items_read on public.showroom_stock_sale_items;
create policy showroom_sales_read on public.showroom_stock_sales
  for select to authenticated
  using (exists (select 1 from public.kassa_admins where user_id = (select auth.uid())));
create policy showroom_sale_items_read on public.showroom_stock_sale_items
  for select to authenticated
  using (exists (select 1 from public.kassa_admins where user_id = (select auth.uid())));
revoke select on public.showroom_stock_sales, public.showroom_stock_sale_items from anon;
grant select on public.showroom_stock_sales, public.showroom_stock_sale_items to authenticated;

-- Some installations have the older export view; apply the same RLS there.
do $$
begin
  if to_regclass('public.showroom_sales_export') is not null then
    execute 'alter view public.showroom_sales_export set (security_invoker = true)';
    execute 'revoke select on public.showroom_sales_export from anon';
  end if;
end;
$$;
create index if not exists showroom_sales_sold_at_id_idx
  on public.showroom_stock_sales (sold_at desc, id);
create index if not exists showroom_sale_items_sale_id_idx
  on public.showroom_stock_sale_items (sale_id);

commit;
