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

  insert into public.showroom_stock_sales (showroom)
  values (p_showroom)
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := v_item->>'product_id';
    v_product_title := coalesce(nullif(v_item->>'title', ''), v_product_id);
    v_quantity := (v_item->>'quantity')::integer;

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
      unit_price
    ) values (
      v_sale_id,
      v_product_id,
      v_product_title,
      v_quantity,
      coalesce((v_item->>'unit_price')::numeric, 0)
    );
  end loop;

  return v_sale_id;
end;
$$;

delete from public.showroom_stock
where showroom = 'brugge'
  and product_id = 'insparation-wellness-geurtjes';

insert into public.showroom_stock (showroom, product_id, product_title, quantity) values
  ('brugge', 'drijvende-bartafel', 'Drijvende bartafel', 2)
on conflict (showroom, product_id) do update set
  product_title = excluded.product_title,
  quantity = excluded.quantity,
  updated_at = now();
