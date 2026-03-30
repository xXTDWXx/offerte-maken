const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

/*
  Zet hier het pad naar jullie logo.
  Voorbeeld:
  const COMPANY_LOGO_URL = 'logo.png';
*/
const COMPANY_LOGO_URL = 'logo.png';
const COMPANY_NAME = 'Sunspa Benelux';
const COMPANY_EMAIL = '';
const COMPANY_PHONE = '';
const COMPANY_WEBSITE = '';

const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');
const productPage = document.getElementById('productPage');

const productImg = document.getElementById('productImg');
const productTitle = document.getElementById('productTitle');
const productPrice = document.getElementById('productPrice');
const productType = document.getElementById('productType');
const productSpecs = document.getElementById('productSpecs');
const productUrl = document.getElementById('productUrl');
const productPrint = document.getElementById('productPrint');
const offerPrint = document.getElementById('offerPrint');

const customerName = document.getElementById('customerName');
const customerStreet = document.getElementById('customerStreet');
const customerCity = document.getElementById('customerCity');
const customerPhone = document.getElementById('customerPhone');

let currentProduct = null;
let optionHandlersWired = false;
let customerHandlersWired = false;

function $(id) {
  return document.getElementById(id);
}

function isBullfrogProduct(product) {
  return product?.merk?.toLowerCase() === 'bullfrog';
}

function toggleBullfrogUi(product) {
  const hide = isBullfrogProduct(product);

  document.querySelectorAll('.options, .totals').forEach(el => {
    el.style.display = hide ? 'none' : '';
  });
}

function euro(n) {
  const x = Number(n || 0);
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR'
    }).format(x);
  } catch {
    return '€' + x.toFixed(2);
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateBelgium(date) {
  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function typeNorm(type) {
  return String(type || '').toLowerCase();
}

function isSwimspa(type) {
  const t = typeNorm(type);
  return t.includes('zwemspa') || t.includes('swim');
}

function isInfrared(type) {
  return typeNorm(type).includes('infrarood');
}

function isBarrelSauna(type) {
  const t = typeNorm(type);
  return t.includes('barrel') && t.includes('sauna');
}

function isSaunaPod(type) {
  const t = typeNorm(type);
  return t.includes('sauna pod') || t.includes('pod sauna') || t.includes('saunapod');
}

function isSauna(type) {
  return typeNorm(type).includes('sauna');
}

function isOutdoorSaunaWithRoofAndStove(type) {
  return isBarrelSauna(type) || isSaunaPod(type);
}

function isJacuzzi(type) {
  const t = typeNorm(type);
  return !isSwimspa(t) && !isInfrared(t) && !isSauna(t);
}

const PRICES = {
  install_jacuzzi: 695,
  install_swimspa: 895,
  install_barrel_sauna: 995,
  install_infrared: 450,
  install_sauna: 695,

  coverlift_unit: 189,
  maintenance_unit: 179,
  swim_filterset_unit: 250,
  warmtepomp_unit: 2795,

  barrel_wood_stove_unit: 1245,
  barrel_electric_heater_unit: 495,
  barrel_roof_shingles_unit: 399,
  barrel_roof_heather_unit: 849,
  barrel_roof_design_unit: 899
};

function installCost(type) {
  if (isSwimspa(type)) return PRICES.install_swimspa;
  if (isBarrelSauna(type)) return PRICES.install_barrel_sauna;
  if (isInfrared(type)) return PRICES.install_infrared;
  if (isSauna(type)) return PRICES.install_sauna;
  return PRICES.install_jacuzzi;
}

function extraOptionsAllowed(type) {
  return isJacuzzi(type) || isSwimspa(type);
}

function specTableHtml(p) {
  const specs = Array.isArray(p.specs) ? p.specs : [];
  if (!specs.length) return '<div class="small">Geen specificaties beschikbaar.</div>';

  return specs.map(s => `
    <div class="spec-row">
      <strong>${escapeHtml(s.label || '')}</strong>
      <span>${escapeHtml(s.value || '')}</span>
    </div>
  `).join('');
}

async function loadProducts() {
  const res = await fetch(PRODUCTS_URL);
  if (!res.ok) throw new Error(`Kan products.json niet laden (${res.status})`);

  const json = await res.json();
  const items = Array.isArray(json) ? json : (json.products || []);
  return Array.isArray(items) ? items : [];
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || '';
}

function showError(msg) {
  if (!errorBox || !errorText) return;
  errorBox.style.display = '';
  errorText.textContent = msg;
}

function getCustomerData() {
  return {
    name: customerName ? customerName.value.trim() : '',
    street: customerStreet ? customerStreet.value.trim() : '',
    city: customerCity ? customerCity.value.trim() : '',
    phone: customerPhone ? customerPhone.value.trim() : ''
  };
}

function wireCustomerHandlers() {
  if (customerHandlersWired) return;
  customerHandlersWired = true;

  [customerName, customerStreet, customerCity, customerPhone].forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => {});
  });
}

function updateOptionUI() {
  if (!currentProduct) return;

  const type = currentProduct.type || '';

  const optInstallPrice = $('optInstallPrice');

  const optCoverTrapRow = $('optCoverTrapRow');

  const optCoverliftRow = $('optCoverliftRow');
  const optCoverlift = $('optCoverlift');
  const optCoverliftTotal = $('optCoverliftTotal');

  const optCoverlift2Row = $('optCoverlift2Row');
  const optCoverlift2 = $('optCoverlift2');
  const optCoverlift2Total = $('optCoverlift2Total');

  const optMaintRow = $('optMaintRow');
  const optMaint = $('optMaint');
  const optMaintTotal = $('optMaintTotal');

  const optSwimFiltersetRow = $('optSwimFiltersetRow');
  const optSwimFilterset = $('optSwimFilterset');
  const optSwimFiltersetTotal = $('optSwimFiltersetTotal');

  const optBarrelStoveGroup = $('optBarrelStoveGroup');
  const optBarrelWoodStove = $('optBarrelWoodStove');
  const optBarrelWoodStoveTotal = $('optBarrelWoodStoveTotal');
  const optBarrelElectricHeater = $('optBarrelElectricHeater');
  const optBarrelElectricHeaterTotal = $('optBarrelElectricHeaterTotal');

  const optBarrelRoofGroup = $('optBarrelRoofGroup');
  const optBarrelRoofShingles = $('optBarrelRoofShingles');
  const optBarrelRoofShinglesTotal = $('optBarrelRoofShinglesTotal');
  const optBarrelRoofHeather = $('optBarrelRoofHeather');
  const optBarrelRoofHeatherTotal = $('optBarrelRoofHeatherTotal');
  const optBarrelRoofDesign = $('optBarrelRoofDesign');
  const optBarrelRoofDesignTotal = $('optBarrelRoofDesignTotal');

  const tProduct = $('optProductTotal');
  const tOptions = $('optOptionsTotal');
  const tGrand = $('optGrandTotal');

  const inst = installCost(type);

  if (optInstallPrice) optInstallPrice.textContent = euro(inst);

  const allowExtraOptions = extraOptionsAllowed(type);
  const swim = isSwimspa(type);
  const barrel = isOutdoorSaunaWithRoofAndStove(type);

  if (optCoverTrapRow) optCoverTrapRow.style.display = allowExtraOptions ? '' : 'none';
  if (optCoverliftRow) optCoverliftRow.style.display = allowExtraOptions ? '' : 'none';
  if (optMaintRow) optMaintRow.style.display = allowExtraOptions ? '' : 'none';

  if (optCoverlift2Row) optCoverlift2Row.style.display = swim ? '' : 'none';
  if (optSwimFiltersetRow) optSwimFiltersetRow.style.display = swim ? '' : 'none';

  if (!allowExtraOptions && optCoverlift) optCoverlift.checked = false;
  if (!allowExtraOptions && optMaint) optMaint.checked = false;
  if (!swim && optCoverlift2) optCoverlift2.checked = false;
  if (!swim && optSwimFilterset) optSwimFilterset.checked = false;

  if (optBarrelStoveGroup) optBarrelStoveGroup.style.display = barrel ? '' : 'none';
  if (optBarrelRoofGroup) optBarrelRoofGroup.style.display = barrel ? '' : 'none';

  if (!barrel && optBarrelWoodStove) optBarrelWoodStove.checked = false;
  if (!barrel && optBarrelElectricHeater) optBarrelElectricHeater.checked = false;
  if (!barrel && optBarrelRoofShingles) optBarrelRoofShingles.checked = false;
  if (!barrel && optBarrelRoofHeather) optBarrelRoofHeather.checked = false;
  if (!barrel && optBarrelRoofDesign) optBarrelRoofDesign.checked = false;

  const coverliftLine = (allowExtraOptions && optCoverlift?.checked) ? PRICES.coverlift_unit : 0;
  const coverlift2Line = (swim && optCoverlift2?.checked) ? PRICES.coverlift_unit : 0;
  const maintLine = (allowExtraOptions && optMaint?.checked) ? PRICES.maintenance_unit : 0;
  const swimFiltersetLine = (swim && optSwimFilterset?.checked) ? PRICES.swim_filterset_unit : 0;

  const barrelWoodStoveLine = (barrel && optBarrelWoodStove?.checked) ? PRICES.barrel_wood_stove_unit : 0;
  const barrelElectricHeaterLine = (barrel && optBarrelElectricHeater?.checked) ? PRICES.barrel_electric_heater_unit : 0;
  const barrelRoofShinglesLine = (barrel && optBarrelRoofShingles?.checked) ? PRICES.barrel_roof_shingles_unit : 0;
  const barrelRoofHeatherLine = (barrel && optBarrelRoofHeather?.checked) ? PRICES.barrel_roof_heather_unit : 0;
  const barrelRoofDesignLine = (barrel && optBarrelRoofDesign?.checked) ? PRICES.barrel_roof_design_unit : 0;

  if (optCoverliftTotal) optCoverliftTotal.textContent = euro(coverliftLine);
  if (optCoverlift2Total) optCoverlift2Total.textContent = euro(coverlift2Line);
  if (optMaintTotal) optMaintTotal.textContent = euro(maintLine);
  if (optSwimFiltersetTotal) optSwimFiltersetTotal.textContent = euro(swimFiltersetLine);
  if (optBarrelWoodStoveTotal) optBarrelWoodStoveTotal.textContent = euro(barrelWoodStoveLine);
  if (optBarrelElectricHeaterTotal) optBarrelElectricHeaterTotal.textContent = euro(barrelElectricHeaterLine);
  if (optBarrelRoofShinglesTotal) optBarrelRoofShinglesTotal.textContent = euro(barrelRoofShinglesLine);
  if (optBarrelRoofHeatherTotal) optBarrelRoofHeatherTotal.textContent = euro(barrelRoofHeatherLine);
  if (optBarrelRoofDesignTotal) optBarrelRoofDesignTotal.textContent = euro(barrelRoofDesignLine);

  const productPriceValue = Number(currentProduct.price || 0);
  const optionsTotal =
    inst +
    coverliftLine +
    coverlift2Line +
    maintLine +
    swimFiltersetLine +
    barrelWoodStoveLine +
    barrelElectricHeaterLine +
    barrelRoofShinglesLine +
    barrelRoofHeatherLine +
    barrelRoofDesignLine;

  const grand = productPriceValue + optionsTotal;

  if (tProduct) tProduct.textContent = euro(productPriceValue);
  if (tOptions) tOptions.textContent = euro(optionsTotal);
  if (tGrand) tGrand.textContent = euro(grand);
}

function wireOptionHandlers() {
  if (optionHandlersWired) return;
  optionHandlersWired = true;

  const ids = [
    'optCoverlift',
    'optCoverlift2',
    'optMaint',
    'optSwimFilterset',
    'optBarrelWoodStove',
    'optBarrelElectricHeater',
    'optBarrelRoofShingles',
    'optBarrelRoofHeather',
    'optBarrelRoofDesign'
  ];

  ids.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', updateOptionUI);
    el.addEventListener('change', updateOptionUI);
  });
}

function getSelectedOfferLines() {
  if (!currentProduct) return [];

  const type = currentProduct.type || '';
  const lines = [];

  lines.push({
    label: currentProduct.title || 'Product',
    price: Number(currentProduct.price || 0)
  });

  lines.push({
    label: 'Levering & installatie',
    price: installCost(type)
  });

  if (extraOptionsAllowed(type)) {
    lines.push({
      label: 'Cover & trap inclusief',
      price: 0
    });
  }

  if ($('optCoverlift')?.checked && extraOptionsAllowed(type)) {
    lines.push({ label: 'Coverlift', price: PRICES.coverlift_unit });
  }

  if ($('optCoverlift2')?.checked && isSwimspa(type)) {
    lines.push({ label: '2e Coverlift', price: PRICES.coverlift_unit });
  }

  if ($('optMaint')?.checked && extraOptionsAllowed(type)) {
    lines.push({ label: 'Onderhoudspakket', price: PRICES.maintenance_unit });
  }

  if ($('optSwimFilterset')?.checked && isSwimspa(type)) {
    lines.push({ label: 'Filterset (zwemspa)', price: PRICES.swim_filterset_unit });
  }

  if ($('optBarrelWoodStove')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Houtkachel + rookafvoer', price: PRICES.barrel_wood_stove_unit });
  }

  if ($('optBarrelElectricHeater')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Elektrische kachel 8 kW', price: PRICES.barrel_electric_heater_unit });
  }

  if ($('optBarrelRoofShingles')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Shingles dak', price: PRICES.barrel_roof_shingles_unit });
  }

  if ($('optBarrelRoofHeather')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Heidedak', price: PRICES.barrel_roof_heather_unit });
  }

  if ($('optBarrelRoofDesign')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Design dak', price: PRICES.barrel_roof_design_unit });
  }

  return lines;
}

function printProductFiche(p) {
  const win = window.open('', '_blank');
  if (!win) return;

  const specs = (p.specs || []).map(s =>
    `<tr><td><strong>${escapeHtml(s.label)}</strong></td><td>${escapeHtml(s.value)}</td></tr>`
  ).join('');

  const img = p.image
    ? `<img src="${escapeHtml(p.image)}" style="width:100%;max-width:760px;border:1px solid #ddd;border-radius:12px;margin:10px 0">`
    : '';

  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(p.title || 'Product')}</title>
        <style>
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:24px;color:#111}
          h1{margin:0 0 6px 0}
          .meta{color:#333;margin:0 0 10px 0}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          td{border-bottom:1px solid #eee;padding:8px 0;vertical-align:top}
          td:first-child{width:220px}
        </style>
      </head>
      <body>
        <h1>${escapeHtml(p.title || '')}</h1>
        <div class="meta">
          Type: ${escapeHtml(p.type || '—')}<br>
          Prijs: ${euro(p.price || 0)}
        </div>
        ${img}
        <table>${specs}</table>
        <script>window.onload=()=>window.print();</script>
      </body>
    </html>
  `);

  win.document.close();
}

function printOfferte() {
  if (!currentProduct) return;

  const customer = getCustomerData();
  const lines = getSelectedOfferLines();
  const total = lines.reduce((sum, l) => sum + Number(l.price || 0), 0);

  const today = new Date();
  const validUntil = addDays(today, 14);
  const offerNumber = `OFF-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const rows = lines.map((line, index) => `
    <tr>
      <td class="col-num">${index + 1}</td>
      <td class="col-desc">${escapeHtml(line.label)}</td>
      <td class="col-price">${euro(line.price)}</td>
    </tr>
  `).join('');

  const logoHtml = COMPANY_LOGO_URL
    ? `<img src="${escapeHtml(COMPANY_LOGO_URL)}" alt="${escapeHtml(COMPANY_NAME)}" class="offer-logo">`
    : '';

  const companyInfo = [
    COMPANY_NAME,
    COMPANY_PHONE,
    COMPANY_EMAIL,
    COMPANY_WEBSITE
  ].filter(Boolean).map(v => `<div>${escapeHtml(v)}</div>`).join('');

  const customerNameHtml = customer.name ? escapeHtml(customer.name) : '—';
  const customerStreetHtml = customer.street ? escapeHtml(customer.street) : '—';
  const customerCityHtml = customer.city ? escapeHtml(customer.city) : '—';
  const customerPhoneHtml = customer.phone ? escapeHtml(customer.phone) : '—';

  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`
    <!doctype html>
    <html lang="nl">
      <head>
        <meta charset="utf-8">
        <title>Offerte ${escapeHtml(currentProduct.title || '')}</title>
        <style>
          @page {
            size: A4;
            margin: 16mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #f3f6fa;
            color: #1f2937;
            font-family: "Segoe UI", Arial, Helvetica, sans-serif;
            font-size: 14px;
            line-height: 1.45;
          }

          body {
            padding: 24px;
          }

          .sheet {
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #dbe3ec;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
          }

          .header {
            background: linear-gradient(135deg, #407298 0%, #68a7d6 100%);
            color: #ffffff;
            padding: 28px 32px;
          }

          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
          }

          .brand {
            display: flex;
            gap: 18px;
            align-items: flex-start;
          }

          .offer-logo {
            max-width: 120px;
            max-height: 80px;
            object-fit: contain;
            background: #ffffff;
            border-radius: 12px;
            padding: 8px;
          }

          .brand-title {
            font-size: 28px;
            font-weight: 800;
            line-height: 1.1;
            margin: 0 0 8px 0;
          }

          .brand-meta {
            font-size: 13px;
            opacity: 0.95;
          }

          .offer-meta {
            min-width: 220px;
            background: rgba(255,255,255,0.14);
            border: 1px solid rgba(255,255,255,0.18);
            border-radius: 16px;
            padding: 14px 16px;
          }

          .offer-meta-row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 4px 0;
          }

          .offer-meta-label {
            font-weight: 700;
            opacity: 0.95;
          }

          .offer-meta-value {
            font-weight: 800;
            text-align: right;
          }

          .content {
            padding: 28px 32px 32px;
          }

          .intro {
            margin-bottom: 22px;
          }

          .intro h2 {
            margin: 0 0 8px 0;
            font-size: 22px;
            color: #0f172a;
          }

          .intro p {
            margin: 0;
            color: #475569;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-bottom: 24px;
          }

          .card {
            border: 1px solid #dbe3ec;
            border-radius: 16px;
            padding: 18px;
            background: #f8fbff;
          }

          .card-title {
            margin: 0 0 12px 0;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #407298;
            font-weight: 800;
          }

          .card-line {
            margin: 4px 0;
            color: #0f172a;
          }

          .product-highlight {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 18px;
            border: 1px solid #dbe3ec;
            border-radius: 16px;
            padding: 18px 20px;
            background: #ffffff;
            margin-bottom: 22px;
          }

          .product-highlight-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748b;
            font-weight: 800;
            margin-bottom: 6px;
          }

          .product-highlight-title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }

          .product-highlight-type {
            margin-top: 4px;
            color: #475569;
            font-weight: 600;
          }

          .product-highlight-price {
            white-space: nowrap;
            text-align: right;
          }

          .product-highlight-price small {
            display: block;
            color: #64748b;
            font-size: 12px;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 800;
          }

          .product-highlight-price strong {
            font-size: 26px;
            color: #407298;
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid #dbe3ec;
            border-radius: 16px;
            background: #ffffff;
          }

          thead th {
            background: #eef5fb;
            color: #274863;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            text-align: left;
            padding: 14px 16px;
            border-bottom: 1px solid #dbe3ec;
          }

          tbody td {
            padding: 14px 16px;
            border-bottom: 1px solid #edf2f7;
            vertical-align: top;
          }

          tbody tr:last-child td {
            border-bottom: none;
          }

          .col-num {
            width: 60px;
            color: #64748b;
            font-weight: 700;
          }

          .col-desc {
            color: #0f172a;
            font-weight: 600;
          }

          .col-price {
            width: 180px;
            text-align: right;
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
          }

          .summary {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
          }

          .summary-box {
            width: 320px;
            border: 1px solid #dbe3ec;
            border-radius: 16px;
            overflow: hidden;
            background: #ffffff;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 18px;
            border-bottom: 1px solid #edf2f7;
          }

          .summary-row:last-child {
            border-bottom: none;
          }

          .summary-row.total {
            background: #407298;
            color: #ffffff;
            font-size: 18px;
            font-weight: 800;
          }

          .terms {
            margin-top: 28px;
            border-top: 1px solid #dbe3ec;
            padding-top: 20px;
          }

          .terms-title {
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: 800;
            color: #274863;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          .terms ul {
            margin: 0;
            padding-left: 18px;
            color: #475569;
          }

          .terms li {
            margin: 6px 0;
          }

          .footer {
            margin-top: 28px;
            padding-top: 18px;
            border-top: 1px solid #dbe3ec;
            color: #64748b;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            gap: 20px;
          }

          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }

            .sheet {
              max-width: 100%;
              border: none;
              border-radius: 0;
              box-shadow: none;
            }
          }

          @media (max-width: 700px) {
            .header-top,
            .info-grid,
            .product-highlight,
            .footer {
              display: block;
            }

            .offer-meta {
              margin-top: 18px;
            }

            .product-highlight-price {
              margin-top: 14px;
              text-align: left;
            }

            .summary {
              justify-content: stretch;
            }

            .summary-box {
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="header-top">
              <div class="brand">
                ${logoHtml}
                <div>
                  <h1 class="brand-title">${escapeHtml(COMPANY_NAME || 'Offerte')}</h1>
                  <div class="brand-meta">${companyInfo || ''}</div>
                </div>
              </div>

              <div class="offer-meta">
                <div class="offer-meta-row">
                  <div class="offer-meta-label">Offertenummer</div>
                  <div class="offer-meta-value">${escapeHtml(offerNumber)}</div>
                </div>
                <div class="offer-meta-row">
                  <div class="offer-meta-label">Datum</div>
                  <div class="offer-meta-value">${formatDateBelgium(today)}</div>
                </div>
                <div class="offer-meta-row">
                  <div class="offer-meta-label">Geldig tot</div>
                  <div class="offer-meta-value">${formatDateBelgium(validUntil)}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="intro">
              <h2>Offerte</h2>
              <p>Bedankt voor uw interesse. Hieronder vindt u een overzicht van de geselecteerde configuratie en bijhorende opties.</p>
            </div>

            <div class="info-grid">
              <div class="card">
                <div class="card-title">Klantgegevens</div>
                <div class="card-line"><strong>Naam:</strong> ${customerNameHtml}</div>
                <div class="card-line"><strong>Adres:</strong> ${customerStreetHtml}</div>
                <div class="card-line"><strong>Plaats:</strong> ${customerCityHtml}</div>
                <div class="card-line"><strong>Telefoon:</strong> ${customerPhoneHtml}</div>
              </div>

              <div class="card">
                <div class="card-title">Leveringsgegevens</div>
                <div class="card-line"><strong>Firma:</strong> ${escapeHtml(COMPANY_NAME || '—')}</div>
                <div class="card-line"><strong>Producttype:</strong> ${escapeHtml(currentProduct.type || '—')}</div>
                <div class="card-line"><strong>Product:</strong> ${escapeHtml(currentProduct.title || '—')}</div>
                <div class="card-line"><strong>Referentie:</strong> ${escapeHtml(String(currentProduct.id || '—'))}</div>
              </div>
            </div>

            <div class="product-highlight">
              <div>
                <div class="product-highlight-label">Geselecteerd product</div>
                <h3 class="product-highlight-title">${escapeHtml(currentProduct.title || '—')}</h3>
                <div class="product-highlight-type">${escapeHtml(currentProduct.type || '—')}</div>
              </div>
              <div class="product-highlight-price">
                <small>Totaal offertebedrag</small>
                <strong>${euro(total)}</strong>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Omschrijving</th>
                  <th style="text-align:right">Prijs</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-box">
                <div class="summary-row">
                  <span>Subtotaal</span>
                  <strong>${euro(total)}</strong>
                </div>
                <div class="summary-row">
                  <span>BTW</span>
                  <strong>Incl.</strong>
                </div>
                <div class="summary-row total">
                  <span>Totaal</span>
                  <strong>${euro(total)}</strong>
                </div>
              </div>
            </div>

            <div class="terms">
              <h4 class="terms-title">Opmerkingen</h4>
              <ul>
                <li>Deze offerte is geldig tot en met ${formatDateBelgium(validUntil)}.</li>
                <li>Prijzen zijn in euro en tenzij anders vermeld inclusief btw.</li>
                <li>Levering en plaatsing volgens afgesproken voorwaarden.</li>
                <li>Eventuele bijkomende werken zijn niet inbegrepen tenzij expliciet vermeld.</li>
              </ul>
            </div>

            <div class="footer">
              <div>Met vriendelijke groeten,<br><strong>${escapeHtml(COMPANY_NAME || '')}</strong></div>
              <div>Dit document werd automatisch opgesteld op ${formatDateBelgium(today)}.</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  win.document.close();
}

function renderProduct(p) {
  currentProduct = p;

  toggleBullfrogUi(p);

  if (productTitle) productTitle.textContent = p.title || '—';
  if (productPrice) productPrice.textContent = `Prijs: ${euro(p.price || 0)}`;
  if (productType) productType.textContent = (p.type || '').toUpperCase();

  if (productImg) {
    productImg.src = p.image || '';
    productImg.alt = p.title || 'Product';
    productImg.style.display = p.image ? '' : 'none';
    productImg.onerror = () => {
      productImg.style.display = 'none';
    };
  }

  if (productSpecs) {
    productSpecs.innerHTML = specTableHtml(p);
  }

  if (productUrl) {
    productUrl.href = p.url || '#';
    productUrl.style.display = p.url ? '' : 'none';
  }

  if (productPrint) {
    productPrint.addEventListener('click', function () {
      printProductFiche(p);
    });
  }

  if (offerPrint) {
    offerPrint.addEventListener('click', function () {
      printOfferte();
    });
  }

  if ($('optInstall')) $('optInstall').checked = true;
  if ($('optCoverlift')) $('optCoverlift').checked = false;
  if ($('optCoverlift2')) $('optCoverlift2').checked = false;
  if ($('optMaint')) $('optMaint').checked = false;
  if ($('optSwimFilterset')) $('optSwimFilterset').checked = false;
  if ($('optBarrelWoodStove')) $('optBarrelWoodStove').checked = false;
  if ($('optBarrelElectricHeater')) $('optBarrelElectricHeater').checked = false;
  if ($('optBarrelRoofShingles')) $('optBarrelRoofShingles').checked = false;
  if ($('optBarrelRoofHeather')) $('optBarrelRoofHeather').checked = false;
  if ($('optBarrelRoofDesign')) $('optBarrelRoofDesign').checked = false;

  wireCustomerHandlers();
  wireOptionHandlers();
  updateOptionUI();

  if (productPage) productPage.style.display = '';
}

async function init() {
  const productId = getProductIdFromUrl();
  if (!productId) {
    showError('Geen product-id in de URL.');
    return;
  }

  const products = await loadProducts();
  const product = products.find(p => String(p.id) === String(productId));

  if (!product) {
    showError('Product niet gevonden.');
    return;
  }

  renderProduct(product);
}

init().catch(e => {
  console.error(e);
  showError(String(e.message || e));
});
