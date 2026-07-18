create table if not exists public.showroom_stock (
  showroom text not null check (showroom in ('gent', 'brugge')),
  product_id text not null,
  product_title text not null,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (showroom, product_id)
);

create table if not exists public.showroom_stock_sales (
  id uuid primary key default gen_random_uuid(),
  showroom text not null check (showroom in ('gent', 'brugge')),
  sold_at timestamptz not null default now(),
  total_amount numeric(10, 2) not null default 0
);

create table if not exists public.showroom_stock_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.showroom_stock_sales(id) on delete cascade,
  product_id text not null,
  product_title text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null default 0,
  line_total numeric(10, 2) not null default 0
);

create table if not exists public.kassa_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

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

create or replace function public.set_showroom_stock(
  p_showroom text,
  p_product_id text,
  p_product_title text,
  p_quantity integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1
      from public.kassa_admins
      where user_id = auth.uid()
  ) then
    raise exception 'Geen toegang tot voorraadbeheer.';
  end if;

  if p_showroom not in ('gent', 'brugge') then
    raise exception 'Ongeldige showroom: %', p_showroom;
  end if;

  if nullif(p_product_id, '') is null then
    raise exception 'Product ontbreekt.';
  end if;

  if p_quantity < 0 then
    raise exception 'Voorraad mag niet onder 0 gaan.';
  end if;

  insert into public.showroom_stock (
    showroom,
    product_id,
    product_title,
    quantity
  ) values (
    p_showroom,
    p_product_id,
    coalesce(nullif(p_product_title, ''), p_product_id),
    p_quantity
  )
  on conflict (showroom, product_id) do update set
    product_title = excluded.product_title,
    quantity = excluded.quantity,
    updated_at = now();
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

alter table public.showroom_stock enable row level security;
alter table public.showroom_stock_sales enable row level security;
alter table public.showroom_stock_sale_items enable row level security;
alter table public.kassa_admins enable row level security;

create policy "showroom_stock_read"
  on public.showroom_stock
  for select
  using (true);

create policy "showroom_sales_read"
  on public.showroom_stock_sales
  for select
  using (true);

create policy "showroom_sale_items_read"
  on public.showroom_stock_sale_items
  for select
  using (true);

grant select on public.showroom_stock to anon;
grant select on public.showroom_stock_sales to anon;
grant select on public.showroom_stock_sale_items to anon;
grant select on public.showroom_sales_export to anon;
grant select on public.showroom_sales_export to authenticated;
grant execute on function public.register_showroom_sale(text, jsonb) to anon;
grant execute on function public.set_showroom_stock(text, text, text, integer) to authenticated;
grant execute on function public.clear_showroom_sales_month(text, date) to authenticated;
revoke execute on function public.set_showroom_stock(text, text, text, integer) from anon;
revoke execute on function public.clear_showroom_sales_month(text, date) from anon;

do $$
begin
  alter publication supabase_realtime add table public.showroom_stock;
exception
  when duplicate_object then null;
end;
$$;

delete from public.showroom_stock;

insert into public.showroom_stock (showroom, product_id, product_title, quantity) values
  ('gent', 'melpool-chloorgranulaat-55-g-1kg', 'Melpool Chloorgranulaat 55/G', 31),
  ('gent', 'melpool-chloortabletten-90-20-1kg', 'Melpool Chloortabletten 90/20', 32),
  ('gent', 'melpool-ph-plus', 'Melpool pH +', 12),
  ('gent', 'melpool-ph-min', 'Melpool pH -', 11),
  ('gent', 'melpool-ta-alkaliteit', 'Melpool TA + Alkaliteit increaser', 10),
  ('gent', 'aquafinesse-pakket', 'Aquafinesse pakket', 2),
  ('gent', 'spa-balancer-chloorvrij', 'Spa Balancer Spa Balancer - Chloorvrije', 0),
  ('gent', 'spa-balancer-ultrashock', 'Spa Balancer Spa Balancer Ultrashock - Chloorvrije', 1),
  ('gent', 'aquacheck-teststrips-ph-chloor', 'Aquacheck Teststrips pH & Chloor', 18),
  ('gent', 'spagoedkoop-brood-kussentje', 'SpaGoedkoop.be Brood kussentje', 18),
  ('gent', 'sunspa-filter-klein', 'Sunspa Filter klein', 24),
  ('gent', 'sunspa-filter-groot', 'Sunspa Filter groot', 11),
  ('gent', 'fox-spa-filter', 'Fox spa filter', 2),
  ('gent', 'fox-spa-kussen', 'Fox spa kussen', 2),
  ('gent', 'myspa-hoek-kussen', 'SpaGoedkoop.be Myspa Hoek kussen', 3),
  ('gent', 'myspa-vogue-filter', 'MySpa & Vogue filter', 2),
  ('gent', 'spa-line-cover-shine', 'Spa Line Spa Cover Shine', 6),
  ('gent', 'spa-line-tube-clean', 'Spa Line Spa Tube Clean', 10),
  ('gent', 'spa-line-metal-clean', 'Spa Line Spa Metal Clean', 7),
  ('gent', 'spa-line-defense', 'Spa Line Spa Defense', 13),
  ('gent', 'spa-line-foam-down', 'Spa Line Spa Foam Down', 8),
  ('gent', 'spa-line-spa-aroma-sensual', 'Spa Line Spa Aroma', 1),
  ('gent', 'spa-line-bright', 'Spa Line Spa Line Bright', 4),
  ('gent', 'filter-explore-san-marino-new-york', 'Filter Explore | san marino | New york', 1),
  ('gent', 'filterset-zwemspa', 'Filterset zwemspa', 1),
  ('gent', 'spa-line-ph-minus', 'Spa Line Spa pH Minus', 13),
  ('gent', 'spa-line-ph-plus', 'Spa Line Spa pH Plus', 9),
  ('gent', 'chloordrijver', 'Chloordrijver', 3),
  ('gent', 'insparation-wellness-geurtjes', 'Wellness - Eucalyptus', 11),
  ('gent', 'spa-line-clear-water', 'Spa Line Spa Clear Water', 0),
  ('gent', 'spa-line-fast-gloss', 'Spa Line Fast Gloss', 0),
  ('gent', 'halu-hoofdsteun', 'HaLu hoofdsteun', 12),
  ('gent', 'bullfrog-filter', 'Bullfrog filter', 0),
  ('gent', 'spa-balancer-75cl', 'Spa Balancer 75 CL', 3),
  ('gent', 'renew', 'Renew', 9),
  ('gent', 'estelle-filter-cleaner', 'Estelle filter cleaner', 2),
  ('gent', 'spa-line-citrus-clean', 'Spa Line Citrus Clean', 1),
  ('gent', 'leisure-time-filter-clean', 'Leisure Time Filter Clean', 12),
  ('gent', 'grote-rugsteun', 'Grote Rugsteun', 2),
  ('gent', 'kleine-ruggesteun', 'Kleine ruggesteun', 0),
  ('gent', 'spa-vac-waterstofzuiger', 'Spa Vac Waterstofzuiger', 1),
  ('gent', 'korte-lamp-300w', 'Korte lamp 300w', 6),
  ('gent', 'lange-lamp', 'Lange Lamp I4H', 0),
  ('gent', 'drijvende-bartafel', 'Drijvende bartafel', 3),
  ('gent', 'coverlift-beugel', 'Coverlift beugel', 3),
  ('brugge', 'melpool-chloorgranulaat-55-g-1kg', 'Melpool Chloorgranulaat 55/G', 15),
  ('brugge', 'melpool-chloortabletten-90-20-1kg', 'Melpool Chloortabletten 90/20', 25),
  ('brugge', 'melpool-ph-plus', 'Melpool pH +', 19),
  ('brugge', 'melpool-ph-min', 'Melpool pH -', 20),
  ('brugge', 'melpool-ta-alkaliteit', 'Melpool TA + Alkaliteit increaser', 7),
  ('brugge', 'aquafinesse-pakket', 'Aquafinesse pakket', 0),
  ('brugge', 'spa-balancer-chloorvrij', 'Spa Balancer Spa Balancer - Chloorvrije', 0),
  ('brugge', 'spa-balancer-ultrashock', 'Spa Balancer Spa Balancer Ultrashock - Chloorvrije', 1),
  ('brugge', 'aquacheck-teststrips-ph-chloor', 'Aquacheck Teststrips pH & Chloor', 14),
  ('brugge', 'spagoedkoop-brood-kussentje', 'SpaGoedkoop.be Brood kussentje', 9),
  ('brugge', 'sunspa-filter-klein', 'Sunspa Filter klein', 19),
  ('brugge', 'sunspa-filter-groot', 'Sunspa Filter groot', 23),
  ('brugge', 'fox-spa-filter', 'Fox spa filter', 0),
  ('brugge', 'fox-spa-kussen', 'Fox spa kussen', 0),
  ('brugge', 'myspa-hoek-kussen', 'SpaGoedkoop.be Myspa Hoek kussen', 0),
  ('brugge', 'myspa-vogue-filter', 'MySpa & Vogue filter', 0),
  ('brugge', 'spa-line-cover-shine', 'Spa Line Spa Cover Shine', 11),
  ('brugge', 'spa-line-tube-clean', 'Spa Line Spa Tube Clean', 3),
  ('brugge', 'spa-line-metal-clean', 'Spa Line Spa Metal Clean', 3),
  ('brugge', 'spa-line-defense', 'Spa Line Spa Defense', 0),
  ('brugge', 'spa-line-foam-down', 'Spa Line Spa Foam Down', 3),
  ('brugge', 'spa-line-spa-aroma-sensual', 'Spa Line Spa Aroma', 4),
  ('brugge', 'spa-line-bright', 'Spa Line Spa Line Bright', 6),
  ('brugge', 'filter-explore-san-marino-new-york', 'Filter Explore | san marino | New york', 19),
  ('brugge', 'filterset-zwemspa', 'Filterset zwemspa', 1),
  ('brugge', 'spa-line-ph-minus', 'Spa Line Spa pH Minus', 0),
  ('brugge', 'spa-line-ph-plus', 'Spa Line Spa pH Plus', 9),
  ('brugge', 'chloordrijver', 'Chloordrijver', 9),
  ('brugge', 'spa-line-clear-water', 'Spa Line Spa Clear Water', 0),
  ('brugge', 'nieuwe-zwemspa-filter', 'Nieuwe zwemspa filter', 2),
  ('brugge', 'easy-water-chloortablet', 'Easy Water chloortablet', 2),
  ('brugge', 'spa-line-fast-gloss', 'Spa Line Fast Gloss', 4),
  ('brugge', 'spa-duck', 'Spa Duck', 2),
  ('brugge', 'opgietmiddel-dennen', 'Opgietmiddel dennen', 4),
  ('brugge', 'insparation-coco', 'InSPAration Coco Lime', 1),
  ('brugge', 'opgietmiddel-klein-lavendel', 'Opgietmiddel klein lavendel', 2),
  ('brugge', 'halu-hoofdsteun', 'HaLu hoofdsteun', 14),
  ('brugge', 'bullfrog-filter', 'Bullfrog filter', 8),
  ('brugge', 'badjas-sunspa', 'Badjas Sunspa', 8),
  ('brugge', 'spa-protector-240-cm', 'Spa protector 240 cm', 1),
  ('brugge', 'bds-jumbo-jet', 'BDS jumbo jet', 5),
  ('brugge', 'bds-dico-jet', 'BDS dico jet', 4),
  ('brugge', 'bds-mini-jet', 'BDS mini jet', 7),
  ('brugge', 'wellness-aroma-lavendel', 'Wellness aroma Lavendel', 4),
  ('brugge', 'wellness-aroma-clary-sage', 'Wellness aroma Clary Sage', 5),
  ('brugge', 'wellness-aroma-eucalyptus', 'Wellness aroma Eucalyptus', 10),
  ('brugge', 'spa-balancer-1l', 'Spa Balancer 1 L', 4),
  ('brugge', 'spa-balancer-75cl', 'Spa Balancer 75 CL', 8),
  ('brugge', 'calcium-booster', 'Calcium Booster', 5),
  ('brugge', 'renew', 'Renew', 1),
  ('brugge', 'estelle-filter-cleaner', 'Estelle filter cleaner', 0),
  ('brugge', 'spa-line-citrus-clean', 'Spa Line Citrus Clean', 0),
  ('brugge', 'leisure-time-filter-clean', 'Leisure Time Filter Clean', 0),
  ('brugge', 'leisure-time-defender', 'Leisure Time Defender', 0),
  ('brugge', 'spa-line-fragrance-eucalyptus', 'Spa Line Fragrance Eucalyptus', 0),
  ('brugge', 'grote-rugsteun', 'Grote Rugsteun', 0),
  ('brugge', 'kleine-ruggesteun', 'Kleine ruggesteun', 0),
  ('brugge', 'spa-vac-waterstofzuiger', 'Spa Vac Waterstofzuiger', 0),
  ('brugge', 'korte-lamp-300w', 'Korte lamp 300w', 0),
  ('brugge', 'lange-lamp', 'Lange Lamp I4H', 0),
  ('brugge', 'drijvende-bartafel', 'Drijvende bartafel', 2),
  ('brugge', 'coverlift-beugel', 'Coverlift beugel', 0)
on conflict (showroom, product_id) do update set
  product_title = excluded.product_title,
  quantity = excluded.quantity,
  updated_at = now();

