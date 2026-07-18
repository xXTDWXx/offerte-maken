alter table public.showroom_stock_sales
  add column if not exists total_amount numeric(10, 2) not null default 0;

alter table public.showroom_stock_sale_items
  add column if not exists line_total numeric(10, 2) not null default 0;

update public.showroom_stock_sale_items
set line_total = round((quantity * unit_price)::numeric, 2)
where line_total = 0;

update public.showroom_stock_sales sales
set total_amount = coalesce(items.total_amount, 0)
from (
  select sale_id, round(sum(line_total)::numeric, 2) as total_amount
  from public.showroom_stock_sale_items
  group by sale_id
) items
where sales.id = items.sale_id
  and sales.total_amount = 0;

create or replace function public.register_showroom_sale(
  p_showroom text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_product_id text;
  v_product_title text;
  v_quantity integer;
  v_unit_price numeric(10, 2);
  v_line_total numeric(10, 2);
  v_total_amount numeric(10, 2) := 0;
begin
  if p_showroom not in ('gent', 'brugge') then
    raise exception 'Ongeldige showroom: %', p_showroom;
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Geen producten om te verkopen.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'product_id', '');
    v_quantity := (v_item->>'quantity')::integer;

    if v_product_id is null then
      raise exception 'Product zonder product_id kan niet verkocht worden.';
    end if;

    if v_quantity <= 0 then
      raise exception 'Aantal moet groter zijn dan 0 voor %.', v_product_id;
    end if;
  end loop;

  insert into public.showroom_stock_sales (showroom, total_amount)
  values (p_showroom, 0)
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := v_item->>'product_id';
    v_product_title := coalesce(nullif(v_item->>'title', ''), v_product_id);
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := coalesce((v_item->>'unit_price')::numeric, 0);
    v_line_total := round((v_quantity * v_unit_price)::numeric, 2);
    v_total_amount := v_total_amount + v_line_total;

    update public.showroom_stock
      set quantity = greatest(0, quantity - v_quantity),
          product_title = v_product_title,
          updated_at = now()
      where showroom = p_showroom
        and product_id = v_product_id;

    if not found then
      insert into public.showroom_stock (
        showroom,
        product_id,
        product_title,
        quantity
      ) values (
        p_showroom,
        v_product_id,
        v_product_title,
        0
      )
      on conflict (showroom, product_id) do update set
        product_title = excluded.product_title,
        quantity = greatest(0, public.showroom_stock.quantity),
        updated_at = now();
    end if;

    insert into public.showroom_stock_sale_items (
      sale_id,
      product_id,
      product_title,
      quantity,
      unit_price,
      line_total
    ) values (
      v_sale_id,
      v_product_id,
      v_product_title,
      v_quantity,
      v_unit_price,
      v_line_total
    );
  end loop;

  update public.showroom_stock_sales
  set total_amount = round(v_total_amount::numeric, 2)
  where id = v_sale_id;

  return v_sale_id;
end;
$$;

create or replace function public.clear_showroom_sales_month(
  p_showroom text,
  p_month date
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
  v_month_start timestamptz;
  v_month_end timestamptz;
begin
  if auth.uid() is null or not exists (
    select 1
      from public.kassa_admins
      where user_id = auth.uid()
  ) then
    raise exception 'Geen toegang tot maandverkoop wissen.';
  end if;

  if p_showroom not in ('gent', 'brugge') then
    raise exception 'Ongeldige showroom: %', p_showroom;
  end if;

  if p_month is null then
    raise exception 'Maand ontbreekt.';
  end if;

  v_month_start := date_trunc('month', p_month)::timestamptz;
  v_month_end := v_month_start + interval '1 month';

  delete from public.showroom_stock_sales
  where showroom = p_showroom
    and sold_at >= v_month_start
    and sold_at < v_month_end;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.register_showroom_sale(text, jsonb) to anon;
grant execute on function public.clear_showroom_sales_month(text, date) to authenticated;
revoke execute on function public.clear_showroom_sales_month(text, date) from anon;

create or replace view public.showroom_sales_export as
select
  sales.id as sale_id,
  sales.showroom,
  sales.sold_at,
  items.product_id,
  items.product_title,
  items.quantity,
  items.unit_price,
  coalesce(items.line_total, round((items.quantity * items.unit_price)::numeric, 2)) as line_total,
  coalesce(sales.total_amount, totals.total_amount, 0) as total_amount
from public.showroom_stock_sales sales
join public.showroom_stock_sale_items items on items.sale_id = sales.id
left join (
  select
    sale_id,
    round(sum(coalesce(line_total, round((quantity * unit_price)::numeric, 2)))::numeric, 2) as total_amount
  from public.showroom_stock_sale_items
  group by sale_id
) totals on totals.sale_id = sales.id;

grant select on public.showroom_sales_export to anon;
grant select on public.showroom_sales_export to authenticated;
