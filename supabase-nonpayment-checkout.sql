-- Allow non-payment stock registrations without adding sales revenue.
-- CREATE OR REPLACE preserves the existing function owner and execution grants.
ALTER TABLE public.showroom_stock_sales
  DROP CONSTRAINT showroom_stock_sales_payment_method_check;
ALTER TABLE public.showroom_stock_sales
  ADD CONSTRAINT showroom_stock_sales_payment_method_check
  CHECK (payment_method IN ('Bancontact', 'Overschrijving', 'Eigen gebruik', 'Cadeau klant'));

CREATE OR REPLACE FUNCTION public.register_showroom_sale_with_payment(
  p_showroom text, p_items jsonb, p_payment_method text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_sale_id uuid;
  v_items jsonb := p_items;
BEGIN
  IF p_payment_method IS NULL OR p_payment_method NOT IN
    ('Bancontact', 'Overschrijving', 'Eigen gebruik', 'Cadeau klant') THEN
    RAISE EXCEPTION 'Kies een geldige betaalwijze of registratie.';
  END IF;
  IF p_showroom IS NULL OR p_showroom NOT IN ('gent', 'brugge', 'kortrijk') THEN
    RAISE EXCEPTION 'Kies een geldige showroom.';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Geen geldige producten om te verkopen.';
  END IF;
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Geen producten om te verkopen.';
  END IF;

  IF p_payment_method IN ('Eigen gebruik', 'Cadeau klant') THEN
    SELECT jsonb_agg(item || jsonb_build_object('unit_price', 0, 'line_total', 0) ORDER BY position)
      INTO v_items
      FROM jsonb_array_elements(p_items) WITH ORDINALITY AS items(item, position);
  END IF;

  v_sale_id := public.register_showroom_sale(p_showroom, v_items);
  UPDATE public.showroom_stock_sales
    SET payment_method = p_payment_method WHERE id = v_sale_id;
  RETURN v_sale_id;
END;
$function$;
