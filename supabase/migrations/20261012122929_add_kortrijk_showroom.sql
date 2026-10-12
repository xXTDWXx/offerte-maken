-- Add Kortrijk without reseeding or changing existing showroom stock.
begin;
alter table public.showroom_stock drop constraint showroom_stock_showroom_check;
alter table public.showroom_stock add constraint showroom_stock_showroom_check
  check (showroom in ('gent', 'brugge', 'kortrijk'));
alter table public.showroom_stock_sales drop constraint showroom_stock_sales_showroom_check;
alter table public.showroom_stock_sales add constraint showroom_stock_sales_showroom_check
  check (showroom in ('gent', 'brugge', 'kortrijk'));

-- Preserve deployed function bodies, permissions, payment handling and admin checks.
-- Installations differ from the historical bootstrap SQL; only extend the allowlist.
do $migration$
declare
  signature text;
  function_oid regprocedure;
  definition text;
begin
  foreach signature in array array[
    'public.register_showroom_sale(text,jsonb)',
    'public.register_showroom_sale_with_payment(text,jsonb,text)',
    'public.set_showroom_stock(text,text,text,integer)',
    'public.clear_showroom_sales_month(text,date)'
  ] loop
    function_oid := to_regprocedure(signature);
    if function_oid is null then
      if signature = 'public.clear_showroom_sales_month(text,date)' then continue; end if;
      raise exception 'Required cash register function missing: %', signature;
    end if;
    definition := pg_get_functiondef(function_oid);
    if position('p_showroom not in (''gent'', ''brugge'')' in definition) > 0 then
      execute replace(definition, 'p_showroom not in (''gent'', ''brugge'')',
        'p_showroom not in (''gent'', ''brugge'', ''kortrijk'')');
    elsif position('p_showroom not in (''gent'', ''brugge'', ''kortrijk'')' in definition) = 0 then
      raise exception 'Unexpected showroom validation in %, review before migrating', signature;
    end if;
  end loop;
end;
$migration$;
commit;
