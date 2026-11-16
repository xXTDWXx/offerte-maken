// Exact Black Friday prices checked on sunspabenelux.nl on 16 November 2026.
// Sources: https://www.sunspabenelux.nl/jacuzzi-sale/
// https://www.sunspabenelux.nl/sauna-kopen-5/aanbiedingen-saunas/
// X5L/X6L/X7L/X8L are not in this catalogue and are intentionally not added.
// Amounts include VAT. The VAT-equivalent discount is NOT a 21% price reduction.
(function () {
  'use strict';
  const startsAt = Date.parse('2026-11-16T00:00:00+01:00');
  const endsAt = Date.parse('2026-12-01T00:00:00+01:00');
  // Product ID, Sunspa reference price, exact promotional price, stock-only condition.
  const rows = [
  [
    "spa::sunspa-phantom",
    6595,
    4995,
    false
  ],
  [
    "spa::sunspa-atlantica",
    6895,
    5250,
    false
  ],
  [
    "spa::sunspa-riviera",
    7495,
    5750,
    false
  ],
  [
    "spa::myspa-nashville",
    7250,
    5991.74,
    true
  ],
  [
    "spa::myspa-quebec",
    7750,
    6404.96,
    true
  ],
  [
    "spa::myspa-double-dutch",
    8695,
    7185.95,
    true
  ],
  [
    "spa::bullfrog-a5l-luxury",
    15660,
    12942.15,
    true
  ],
  [
    "spa::bullfrog-a6l-luxury",
    17415,
    14392.56,
    true
  ],
  [
    "spa::bullfrog-a7d-luxury",
    21529,
    17792.56,
    true
  ],
  [
    "spa::bullfrog-a7l-luxury",
    21529,
    17792.56,
    true
  ],
  [
    "spa::bullfrog-a8l-luxury",
    24554,
    20292.56,
    true
  ],
  [
    "spa::bullfrog-a6l-choice",
    15669.5,
    12950,
    true
  ],
  [
    "spa::bullfrog-a7d-choice",
    19783,
    16349.59,
    true
  ],
  [
    "spa::bullfrog-a7l-choice",
    19783,
    16349.59,
    true
  ],
  [
    "spa::bullfrog-a8l-choice",
    22808.5,
    18850,
    true
  ],
  [
    "spa::bullfrog-stil7",
    19965,
    16500,
    true
  ],
  [
    "spa::bullfrog-stil5",
    17242.5,
    14250,
    true
  ],
  [
    "spa::bullfrog-a9l-select",
    30492,
    25200,
    true
  ],
  [
    "spa::bullfrog-a8l-select",
    27467,
    22700,
    true
  ],
  [
    "spa::bullfrog-a7l-select",
    23958,
    19800,
    true
  ],
  [
    "spa::bullfrog-a7d-select",
    23958,
    19800,
    true
  ],
  [
    "spa::bullfrog-a5l-select",
    18089,
    14949.59,
    true
  ],
  [
    "spa::bullfrog-a6l-select",
    19541,
    16149.59,
    true
  ],
  [
    "spa::bullfrog-m9",
    31642,
    26150.41,
    true
  ],
  [
    "spa::bullfrog-m8",
    29282,
    24200,
    true
  ],
  [
    "spa::bullfrog-m7",
    27225,
    22500,
    true
  ],
  [
    "spa::bullfrog-m6",
    26499,
    21900,
    true
  ],
  [
    "sauna::i160c-infrarood-sauna",
    4950,
    4090.91,
    true
  ],
  [
    "sauna::i170-infrarood-sauna",
    4450,
    3677.69,
    true
  ],
  [
    "sauna::traditionele-combi-sauna",
    6500,
    3250,
    false
  ],
  [
    "sauna::sumum-hemlock-3-persoons-infrarood-sauna",
    6250,
    5165.29,
    true
  ],
  [
    "sauna::lucca-finse-sauna-cabine",
    4995,
    4128.1,
    true
  ],
  [
    "sauna::sauna-cabine-cedar-outdoor",
    7950,
    6570.25,
    true
  ],
  [
    "sauna::barrelsauna-tr170-–-halfglas",
    4195,
    3466.94,
    true
  ],
  [
    "sauna::barrelsauna-tr400-–-half-glas",
    9095,
    7516.53,
    true
  ],
  [
    "sauna::barrelsauna-tr400",
    8395,
    6938.02,
    true
  ]
];
  const offers = new Map(rows.map(([id, originalPrice, actionPrice, stockOnly]) => [
    id, Object.freeze({ originalPrice, actionPrice, stockOnly,
      discount: Math.round((originalPrice - actionPrice) * 100) / 100 })
  ]));

  function getAction(product, now = Date.now()) {
    if (!product || product.showroomOffer || now < startsAt || now >= endsAt) return null;
    return offers.get(product.id) || null;
  }

  function price(product, now = Date.now()) {
    return Number(product?.showroomOffer?.total ?? getAction(product, now)?.actionPrice ?? product?.price ?? 0);
  }

  function label() {
    return window.SunspaI18n?.isFrench?.()
      ? "Black Friday · jusqu'au 30/11/2026"
      : 'Black Friday · t/m 30/11/2026';
  }

  function conditions(product) {
    if (!getAction(product)?.stockOnly) return '';
    return window.SunspaI18n?.isFrench?.()
      ? 'Uniquement sur les modèles en stock.'
      : 'Alleen geldig op voorraadmodellen.';
  }

  window.SunspaPromotions = { getAction, price, label, conditions };
})();
