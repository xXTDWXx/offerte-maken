delete from public.showroom_stock
where showroom = 'gent'
  and product_id in (
    'nieuwe-zwemspa-filter',
    'easy-water-chloortablet',
    'spa-duck',
    'insparation-coco',
    'opgietmiddel-klein-lavendel',
    'opgietmiddel-dennen',
    'badjas-sunspa',
    'bds-jumbo-jet',
    'bds-dico-jet',
    'bds-mini-jet',
    'spa-protector-240-cm',
    'wellness-aroma-lavendel',
    'wellness-aroma-clary-sage',
    'spa-balancer-1l',
    'calcium-booster',
    'leisure-time-defender',
    'spa-line-fragrance-eucalyptus',
    'wellness-aroma-eucalyptus'
  );
