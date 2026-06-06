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
  sold_at timestamptz not null default now()
);

create table if not exists public.showroom_stock_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.showroom_stock_sales(id) on delete cascade,
  product_id text not null,
  product_title text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null default 0
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
  v_available integer;
begin
  if p_showroom not in ('gent', 'brugge') then
    raise exception 'Ongeldige showroom: %', p_showroom;
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Geen producten om te verkopen.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select quantity
      into v_available
      from public.showroom_stock
      where showroom = p_showroom
        and product_id = v_item->>'product_id'
      for update;

    if v_available is null then
      raise exception 'Product % bestaat niet in voorraad %.', v_item->>'product_id', p_showroom;
    end if;

    if v_available < (v_item->>'quantity')::integer then
      raise exception 'Te weinig voorraad voor %: beschikbaar %, gevraagd %.',
        v_item->>'title',
        v_available,
        (v_item->>'quantity')::integer;
    end if;
  end loop;

  insert into public.showroom_stock_sales (showroom)
  values (p_showroom)
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.showroom_stock
      set quantity = quantity - (v_item->>'quantity')::integer,
          product_title = coalesce(nullif(v_item->>'title', ''), product_title),
          updated_at = now()
      where showroom = p_showroom
        and product_id = v_item->>'product_id';

    insert into public.showroom_stock_sale_items (
      sale_id,
      product_id,
      product_title,
      quantity,
      unit_price
    ) values (
      v_sale_id,
      v_item->>'product_id',
      coalesce(nullif(v_item->>'title', ''), v_item->>'product_id'),
      (v_item->>'quantity')::integer,
      coalesce((v_item->>'unit_price')::numeric, 0)
    );
  end loop;

  return v_sale_id;
end;
$$;

alter table public.showroom_stock enable row level security;
alter table public.showroom_stock_sales enable row level security;
alter table public.showroom_stock_sale_items enable row level security;

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
grant execute on function public.register_showroom_sale(text, jsonb) to anon;

do $$
begin
  alter publication supabase_realtime add table public.showroom_stock;
exception
  when duplicate_object then null;
end;
$$;

delete from public.showroom_stock;

insert into public.showroom_stock (showroom, product_id, product_title, quantity) values
  ('gent', 'melpool-chloorgranulaat-55-g-1kg', 'Melpool Chloorgranulaat 55/G', 28),
  ('gent', 'melpool-chloortabletten-90-20-1kg', 'Melpool Chloortabletten 90/20', 45),
  ('gent', 'melpool-ph-plus', 'Melpool pH +', 8),
  ('gent', 'melpool-ph-min', 'Melpool pH -', 20),
  ('gent', 'melpool-ta-alkaliteit', 'Melpool TA + Alkaliteit increaser', 10),
  ('gent', 'aquafinesse-pakket', 'Aquafinesse pakket', 2),
  ('gent', 'spa-balancer-chloorvrij', 'Spa Balancer Spa Balancer - Chloorvrije', 0),
  ('gent', 'spa-balancer-ultrashock', 'Spa Balancer Spa Balancer Ultrashock - Chloorvrije', 1),
  ('gent', 'aquacheck-teststrips-ph-chloor', 'Aquacheck Teststrips pH & Chloor', 19),
  ('gent', 'spagoedkoop-brood-kussentje', 'SpaGoedkoop.be Brood kussentje', 18),
  ('gent', 'sunspa-filter-klein', 'Sunspa Filter klein', 26),
  ('gent', 'sunspa-filter-groot', 'Sunspa Filter groot', 12),
  ('gent', 'fox-spa-filter', 'Fox spa filter', 0),
  ('gent', 'fox-spa-kussen', 'Fox spa kussen', 2),
  ('gent', 'myspa-hoek-kussen', 'SpaGoedkoop.be Myspa Hoek kussen', 3),
  ('gent', 'myspa-vogue-filter', 'MySpa & Vogue filter', 2),
  ('gent', 'spa-line-cover-shine', 'Spa Line Spa Cover Shine', 6),
  ('gent', 'spa-line-tube-clean', 'Spa Line Spa Tube Clean', 11),
  ('gent', 'spa-line-metal-clean', 'Spa Line Spa Metal Clean', 7),
  ('gent', 'spa-line-defense', 'Spa Line Spa Defense', 10),
  ('gent', 'spa-line-foam-down', 'Spa Line Spa Foam Down', 13),
  ('gent', 'spa-line-spa-aroma-sensual', 'Spa Line Spa Aroma', 1),
  ('gent', 'spa-line-bright', 'Spa Line Spa Line Bright', 4),
  ('gent', 'filter-explore-san-marino-new-york', 'Filter Explore | san marino | New york', 1),
  ('gent', 'filterset-zwemspa', 'Filterset zwemspa', 0),
  ('gent', 'spa-line-ph-minus', 'Spa Line Spa pH Minus', 13),
  ('gent', 'spa-line-ph-plus', 'Spa Line Spa pH Plus', 9),
  ('gent', 'chloordrijver', 'Chloordrijver', 3),
  ('gent', 'insparation-wellness-geurtjes', 'InSPAration Wellness - verschillende geurtjes', 0),
  ('gent', 'spa-line-clear-water', 'Spa Line Spa Clear Water', 0),
  ('gent', 'nieuwe-zwemspa-filter', 'Nieuwe zwemspa filter', 0),
  ('gent', 'easy-water-chloortablet', 'Easy Water chloortablet', 0),
  ('gent', 'spa-line-fast-gloss', 'Spa Line Fast Gloss', 0),
  ('gent', 'spa-duck', 'Spa Duck', 0),
  ('gent', 'opgietmiddel-dennen', 'Opgietmiddel dennen', 0),
  ('gent', 'insparation-coco', 'InSPAration Coco Lime', 0),
  ('gent', 'opgietmiddel-klein-lavendel', 'Opgietmiddel klein lavendel', 0),
  ('gent', 'halu-hoofdsteun', 'HaLu hoofdsteun', 12),
  ('gent', 'bullfrog-filter', 'Bullfrog filter', 0),
  ('gent', 'badjas-sunspa', 'Badjas Sunspa', 0),
  ('gent', 'spa-protector-240-cm', 'Spa protector 240 cm', 0),
  ('gent', 'bds-jumbo-jet', 'BDS jumbo jet', 0),
  ('gent', 'bds-dico-jet', 'BDS dico jet', 0),
  ('gent', 'bds-mini-jet', 'BDS mini jet', 0),
  ('gent', 'wellness-aroma-lavendel', 'Wellness aroma Lavendel', 0),
  ('gent', 'wellness-aroma-clary-sage', 'Wellness aroma Clary Sage', 0),
  ('gent', 'wellness-aroma-eucalyptus', 'Wellness aroma Eucalyptus', 11),
  ('gent', 'spa-balancer-1l', 'Spa Balancer 1 L', 0),
  ('gent', 'spa-balancer-75cl', 'Spa Balancer 75 CL', 3),
  ('gent', 'calcium-booster', 'Calcium Booster', 0),
  ('gent', 'renew', 'Renew', 9),
  ('gent', 'estelle-filter-cleaner', 'Estelle filter cleaner', 2),
  ('gent', 'spa-line-citrus-clean', 'Spa Line Citrus Clean', 1),
  ('gent', 'leisure-time-filter-clean', 'Leisure Time Filter Clean', 8),
  ('gent', 'leisure-time-defender', 'Leisure Time Defender', 0),
  ('gent', 'spa-line-fragrance-eucalyptus', 'Spa Line Fragrance Eucalyptus', 0),
  ('gent', 'grote-rugsteun', 'Grote Rugsteun', 2),
  ('gent', 'kleine-ruggesteun', 'Kleine ruggesteun', 0),
  ('gent', 'spa-vac-waterstofzuiger', 'Spa Vac Waterstofzuiger', 1),
  ('gent', 'korte-lamp-300w', 'Korte lamp 300w', 6),
  ('gent', 'lange-lamp', 'Lange Lamp I4H', 0),
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
  ('brugge', 'insparation-wellness-geurtjes', 'InSPAration Wellness - verschillende geurtjes', 0),
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
  ('brugge', 'lange-lamp', 'Lange Lamp I4H', 0)
on conflict (showroom, product_id) do update set
  product_title = excluded.product_title,
  quantity = excluded.quantity,
  updated_at = now();

