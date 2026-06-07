create table if not exists public.kassa_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.kassa_admins enable row level security;

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

grant execute on function public.set_showroom_stock(text, text, text, integer) to authenticated;
revoke execute on function public.set_showroom_stock(text, text, text, integer) from anon;
