const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

/*
  Zet hier het pad naar jullie logo.
  Voorbeeld:
  const COMPANY_LOGO_URL = 'logo.png';
*/
const COMPANY_LOGO_URL = 'logo.svg';
const COMPANY_NAME = 'Sunspa Benelux';
const COMPANY_EMAIL = 'sunspabrugge@gmail.com';
const COMPANY_PHONE = '0483399967';
const COMPANY_WEBSITE = 'www.sunspabenelux.be';

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

function toPositiveInt(value) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function setNumberInputValue(input, value) {
  if (!input) return 0;
  const cleanValue = Math.max(0, toPositiveInt(value));
  input.value = String(cleanValue);
  return cleanValue;
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
  barrel_roof_design_unit: 899,
  barrel_infrared_module_unit: 699
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

  const optWarmtepompRow = $('optWarmtepompRow');
  const optWarmtepompQty = $('optWarmtepompQty');
  const optWarmtepompTotal = $('optWarmtepompTotal');

  const optBarrelStoveGroup = $('optBarrelStoveGroup');
  const optBarrelWoodStoveRow = $('optBarrelWoodStoveRow');
  const optBarrelWoodStove = $('optBarrelWoodStove');
  const optBarrelWoodStoveTotal = $('optBarrelWoodStoveTotal');

  const optBarrelElectricHeaterRow = $('optBarrelElectricHeaterRow');
  const optBarrelElectricHeater = $('optBarrelElectricHeater');
  const optBarrelElectricHeaterTotal = $('optBarrelElectricHeaterTotal');

  const optBarrelRoofGroup = $('optBarrelRoofGroup');
  const optBarrelRoofShingles = $('optBarrelRoofShingles');
  const optBarrelRoofShinglesTotal = $('optBarrelRoofShinglesTotal');
  const optBarrelRoofHeather = $('optBarrelRoofHeather');
  const optBarrelRoofHeatherTotal = $('optBarrelRoofHeatherTotal');
  const optBarrelRoofDesign = $('optBarrelRoofDesign');
  const optBarrelRoofDesignTotal = $('optBarrelRoofDesignTotal');

  const optBarrelInfraredModuleRow = $('optBarrelInfraredModuleRow');
  const optBarrelInfraredModule = $('optBarrelInfraredModule');
  const optBarrelInfraredModuleTotal = $('optBarrelInfraredModuleTotal');

  const tProduct = $('optProductTotal');
  const tOptions = $('optOptionsTotal');
  const tGrand = $('optGrandTotal');

  const inst = installCost(type);

  if (optInstallPrice) optInstallPrice.textContent = euro(inst);

  const allowExtraOptions = extraOptionsAllowed(type);
  const swim = isSwimspa(type);
  const outdoorSauna = isOutdoorSaunaWithRoofAndStove(type);
  const barrelSauna = isBarrelSauna(type);
  const sauna = isSauna(type);
  const showStoveGroup = outdoorSauna || sauna;
  const showElectricHeater = sauna;
  const showWoodStove = outdoorSauna;
  const showRoofGroup = outdoorSauna;
  const showInfraredModule = barrelSauna;

  if (optCoverTrapRow) optCoverTrapRow.style.display = allowExtraOptions ? '' : 'none';
  if (optCoverliftRow) optCoverliftRow.style.display = allowExtraOptions ? '' : 'none';
  if (optMaintRow) optMaintRow.style.display = allowExtraOptions ? '' : 'none';

  if (optCoverlift2Row) optCoverlift2Row.style.display = swim ? '' : 'none';
  if (optSwimFiltersetRow) optSwimFiltersetRow.style.display = swim ? '' : 'none';
  if (optWarmtepompRow) optWarmtepompRow.style.display = swim ? '' : 'none';

  if (!allowExtraOptions && optCoverlift) optCoverlift.checked = false;
  if (!allowExtraOptions && optMaint) optMaint.checked = false;
  if (!swim && optCoverlift2) optCoverlift2.checked = false;
  if (!swim && optSwimFilterset) optSwimFilterset.checked = false;
  if (!swim && optWarmtepompQty) optWarmtepompQty.value = '0';

  if (optBarrelStoveGroup) optBarrelStoveGroup.style.display = showStoveGroup ? '' : 'none';
  if (optBarrelWoodStoveRow) optBarrelWoodStoveRow.style.display = showWoodStove ? '' : 'none';
  if (optBarrelElectricHeaterRow) optBarrelElectricHeaterRow.style.display = showElectricHeater ? '' : 'none';

  if (optBarrelRoofGroup) optBarrelRoofGroup.style.display = showRoofGroup ? '' : 'none';
  if (optBarrelInfraredModuleRow) optBarrelInfraredModuleRow.style.display = showInfraredModule ? '' : 'none';

  if (!showWoodStove && optBarrelWoodStove) optBarrelWoodStove.checked = false;
  if (!showElectricHeater && optBarrelElectricHeater) optBarrelElectricHeater.checked = false;
  if (!showRoofGroup && optBarrelRoofShingles) optBarrelRoofShingles.checked = false;
  if (!showRoofGroup && optBarrelRoofHeather) optBarrelRoofHeather.checked = false;
  if (!showRoofGroup && optBarrelRoofDesign) optBarrelRoofDesign.checked = false;
  if (!showInfraredModule && optBarrelInfraredModule) optBarrelInfraredModule.checked = false;

  const warmtepompQty = swim ? toPositiveInt(optWarmtepompQty?.value) : 0;
  if (optWarmtepompQty && String(warmtepompQty) !== String(optWarmtepompQty.value)) {
    optWarmtepompQty.value = String(warmtepompQty);
  }

  const coverliftLine = (allowExtraOptions && optCoverlift?.checked) ? PRICES.coverlift_unit : 0;
  const coverlift2Line = (swim && optCoverlift2?.checked) ? PRICES.coverlift_unit : 0;
  const maintLine = (allowExtraOptions && optMaint?.checked) ? PRICES.maintenance_unit : 0;
  const swimFiltersetLine = (swim && optSwimFilterset?.checked) ? PRICES.swim_filterset_unit : 0;
  const warmtepompLine = warmtepompQty * PRICES.warmtepomp_unit;

  const barrelWoodStoveLine = (showWoodStove && optBarrelWoodStove?.checked) ? PRICES.barrel_wood_stove_unit : 0;
  const barrelElectricHeaterLine = (showElectricHeater && optBarrelElectricHeater?.checked) ? PRICES.barrel_electric_heater_unit : 0;
  const barrelRoofShinglesLine = (showRoofGroup && optBarrelRoofShingles?.checked) ? PRICES.barrel_roof_shingles_unit : 0;
  const barrelRoofHeatherLine = (showRoofGroup && optBarrelRoofHeather?.checked) ? PRICES.barrel_roof_heather_unit : 0;
  const barrelRoofDesignLine = (showRoofGroup && optBarrelRoofDesign?.checked) ? PRICES.barrel_roof_design_unit : 0;
  const barrelInfraredModuleLine = (showInfraredModule && optBarrelInfraredModule?.checked) ? PRICES.barrel_infrared_module_unit : 0;

  if (optCoverliftTotal) optCoverliftTotal.textContent = euro(coverliftLine);
  if (optCoverlift2Total) optCoverlift2Total.textContent = euro(coverlift2Line);
  if (optMaintTotal) optMaintTotal.textContent = euro(maintLine);
  if (optSwimFiltersetTotal) optSwimFiltersetTotal.textContent = euro(swimFiltersetLine);
  if (optWarmtepompTotal) optWarmtepompTotal.textContent = euro(warmtepompLine);
  if (optBarrelWoodStoveTotal) optBarrelWoodStoveTotal.textContent = euro(barrelWoodStoveLine);
  if (optBarrelElectricHeaterTotal) optBarrelElectricHeaterTotal.textContent = euro(barrelElectricHeaterLine);
  if (optBarrelRoofShinglesTotal) optBarrelRoofShinglesTotal.textContent = euro(barrelRoofShinglesLine);
  if (optBarrelRoofHeatherTotal) optBarrelRoofHeatherTotal.textContent = euro(barrelRoofHeatherLine);
  if (optBarrelRoofDesignTotal) optBarrelRoofDesignTotal.textContent = euro(barrelRoofDesignLine);
  if (optBarrelInfraredModuleTotal) optBarrelInfraredModuleTotal.textContent = euro(barrelInfraredModuleLine);

  const productPriceValue = Number(currentProduct.price || 0);
  const optionsTotal =
    inst +
    coverliftLine +
    coverlift2Line +
    maintLine +
    swimFiltersetLine +
    warmtepompLine +
    barrelWoodStoveLine +
    barrelElectricHeaterLine +
    barrelRoofShinglesLine +
    barrelRoofHeatherLine +
    barrelRoofDesignLine +
    barrelInfraredModuleLine;

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
    'optWarmtepompQty',
    'optBarrelWoodStove',
    'optBarrelElectricHeater',
    'optBarrelRoofShingles',
    'optBarrelRoofHeather',
    'optBarrelRoofDesign',
    'optBarrelInfraredModule'
  ];

  ids.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', updateOptionUI);
    el.addEventListener('change', updateOptionUI);
  });

  const optWarmtepompMinus = $('optWarmtepompMinus');
  const optWarmtepompPlus = $('optWarmtepompPlus');
  const optWarmtepompQty = $('optWarmtepompQty');

  if (optWarmtepompMinus && optWarmtepompQty) {
    optWarmtepompMinus.addEventListener('click', () => {
      const current = toPositiveInt(optWarmtepompQty.value);
      setNumberInputValue(optWarmtepompQty, current - 1);
      updateOptionUI();
    });
  }

  if (optWarmtepompPlus && optWarmtepompQty) {
    optWarmtepompPlus.addEventListener('click', () => {
      const current = toPositiveInt(optWarmtepompQty.value);
      setNumberInputValue(optWarmtepompQty, current + 1);
      updateOptionUI();
    });
  }
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

  const warmtepompQty = isSwimspa(type) ? toPositiveInt($('optWarmtepompQty')?.value) : 0;
  if (warmtepompQty > 0) {
    lines.push({
      label: `Warmtepomp incl. afstelling x ${warmtepompQty}`,
      price: warmtepompQty * PRICES.warmtepomp_unit
    });
  }

  if ($('optBarrelWoodStove')?.checked && isOutdoorSaunaWithRoofAndStove(type)) {
    lines.push({ label: 'Houtkachel + rookafvoer', price: PRICES.barrel_wood_stove_unit });
  }

  if ($('optBarrelElectricHeater')?.checked && isSauna(type)) {
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

  if ($('optBarrelInfraredModule')?.checked && isBarrelSauna(type)) {
    lines.push({ label: 'Infrarood module', price: PRICES.barrel_infrared_module_unit });
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

  const productTitleHtml = escapeHtml(currentProduct.title || '—');
  const productTypeHtml = escapeHtml(currentProduct.type || '—');

  const win = window.open('', '_blank');
  if (!win) return;

  win.document.open();
  win.document.write(`
    <!doctype html>
    <html lang="nl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offerte ${productTitleHtml}</title>
       <style>
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #f2f4f7;
    color: #1f2937;
    font-family: "Segoe UI", Arial, Helvetica, sans-serif;
    font-size: 14px;
    line-height: 1.4;
  }

  body {
    padding: 14px;
  }
  
 .info-grid-single {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}

.customer-card {
  width: 100%;
  max-width: none;
  display: block;
}

.customer-inline-grid {
  display: grid;
  gap: 10px 24px;
  width: 100%;
  grid-template-columns: 1fr 1fr;
}

.field-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.field-inline-full {
  grid-column: 1 / -1;
}

.label-inline {
  min-width: 70px;
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
  white-space: nowrap;
}

.line-inline {
  flex: 1;
  min-width: 0;
  border-bottom: 1.5px solid #64748b;
  height: 16px;
}

  .sheet {
    width: 100%;
    max-width: 920px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #d9e1ea;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 12px 34px rgba(15, 23, 42, 0.08);
  }

  .header {
    background: linear-gradient(135deg, #5f7fa4 0%, #7fa3ca 100%);
    color: #ffffff;
    padding: 28px 32px 26px;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }

  .brand {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    min-width: 0;
  }

  .offer-logo {
    width: 170px;
    max-width: 170px;
    height: auto;
    display: block;
    background: #ffffff;
    border-radius: 14px;
    padding: 8px 10px;
  }

  .brand-copy {
    min-width: 0;
  }

  .brand-title {
    margin: 0 0 10px 0;
    font-size: 42px;
    line-height: 0.98;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
  }

  .brand-meta {
    font-size: 15px;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.98);
  }

  .brand-meta div {
    margin: 2px 0;
  }

  .offer-meta {
    min-width: 280px;
    padding: 18px 22px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(3px);
  }

  .offer-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    padding: 4px 0;
  }

  .offer-meta-label {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
  }

  .offer-meta-value {
    font-size: 15px;
    font-weight: 800;
    color: #ffffff;
    text-align: right;
    white-space: nowrap;
  }

  .content {
    padding: 28px 32px 28px;
  }

  .intro {
    margin-bottom: 22px;
  }

  .intro h2 {
    margin: 0 0 10px 0;
    font-size: 32px;
    line-height: 1.1;
    font-weight: 800;
    color: #0f172a;
  }

  .intro p {
    margin: 0;
    font-size: 15px;
    color: #475569;
  }

  .info-grid {
    display: grid;
    gap: 18px;
    margin-bottom: 18px;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #d7e0e9;
    border-radius: 18px;
    padding: 18px 20px;
  }

  .card-title {
    margin: 0 0 14px 0;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #4f6f96;
  }

  .card-line {
    margin: 8px 0;
    font-size: 14px;
    color: #0f172a;
  }

  .card-line strong {
    font-weight: 800;
    display: inline-block;
    margin-bottom: 14px;
  }

  .product-highlight {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    background: #ffffff;
    border: 1px solid #d7e0e9;
    border-radius: 18px;
    padding: 18px 22px;
    margin-bottom: 18px;
  }

  .product-highlight-label {
    margin: 0 0 8px 0;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .product-highlight-title {
    margin: 0;
    font-size: 28px;
    line-height: 1.1;
    font-weight: 800;
    color: #0f172a;
  }

  .product-highlight-type {
    margin-top: 6px;
    font-size: 14px;
    color: #64748b;
  }

  .product-highlight-price {
    text-align: right;
    white-space: nowrap;
  }

  .product-highlight-price small {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .product-highlight-price strong {
    display: block;
    font-size: 30px;
    line-height: 1.05;
    font-weight: 800;
    color: #4f6f96;
  }

  .table-wrap {
    border: 1px solid #d7e0e9;
    border-radius: 18px;
    overflow: hidden;
    background: #ffffff;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    background: #eef3f8;
    color: #314f72;
    padding: 16px 18px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: left;
    border-bottom: 1px solid #d7e0e9;
  }

  tbody td {
    padding: 15px 18px;
    font-size: 14px;
    color: #0f172a;
    border-bottom: 1px solid #e9eef4;
    vertical-align: top;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  .col-num {
    width: 70px;
    font-weight: 800;
    color: #475569;
  }

  .col-desc {
    font-weight: 600;
  }

  .col-price {
    width: 190px;
    text-align: right;
    white-space: nowrap;
    font-weight: 800;
  }

  .summary {
    margin-top: 18px;
    display: flex;
    justify-content: flex-end;
  }

  .summary-box {
    width: 320px;
    border: 1px solid #d7e0e9;
    border-radius: 18px;
    overflow: hidden;
    background: #ffffff;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 14px 18px;
    border-bottom: 1px solid #e9eef4;
    font-size: 14px;
    color: #0f172a;
  }

  .summary-row:last-child {
    border-bottom: none;
  }

  .summary-row strong {
    font-weight: 800;
  }

  .summary-row.total {
    background: #f3f7fb;
    color: #314f72;
    font-size: 17px;
    font-weight: 800;
  }

  .terms {
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid #d7e0e9;
  }

  .terms-title {
    margin: 0 0 10px 0;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #314f72;
  }

  .terms ul {
    margin: 0;
    padding-left: 18px;
    color: #475569;
  }

  .terms li {
    margin: 8px 0;
    font-size: 13px;
    line-height: 1.35;
  }

  .footer {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid #d7e0e9;
    display: flex;
    justify-content: space-between;
    gap: 20px;
    font-size: 12px;
    color: #64748b;
  }

  .footer strong {
    color: #0f172a;
  }

  @media screen and (max-width: 820px) {
    .header-top,
    .info-grid,
    .product-highlight,
    .footer {

    }

    .offer-meta {
      margin-top: 18px;
      min-width: 0;
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

  @media print {
    html,
    body {
      width: 210mm;
      height: 297mm;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #1f2937 !important;
    }

    body {
      font-size: 11px !important;
      line-height: 1.28 !important;
    }
    
    @media print {

  .info-grid-single {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}

.customer-card {
  width: 100%;
  max-width: none;
  display: block;
}

.customer-inline-grid {
  display: grid;
  gap: 10px 24px;
  width: 100%;
  grid-template-columns: 1fr 1fr;
}

.field-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.field-inline-full {
  grid-column: 1 / -1;
}

.label-inline {
  min-width: 70px;
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
  white-space: nowrap;
}

.line-inline {
  flex: 1;
  min-width: 0;
  border-bottom: 1.5px solid #64748b;
  height: 16px;
}

    .sheet {
  width: 194mm !important;
  max-width: 194mm !important;
  min-height: auto !important;
  margin: 0 auto !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
  page-break-inside: avoid !important;
}

    .header {
      background: #ffffff !important;
      color: #274863 !important;
      border: 1px solid #cfd8e3 !important;
      border-radius: 10px !important;
      padding: 10mm 10mm 7mm 10mm !important;
    }

    .header-top {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      gap: 10mm !important;
    }

    .brand {
      display: flex !important;
      gap: 10px !important;
      align-items: flex-start !important;
    }

    .offer-logo {
      max-width: 42mm !important;
      width: 42mm !important;
      max-height: 20mm !important;
      background: #ffffff !important;
      border: 1px solid #dbe3ec !important;
      border-radius: 8px !important;
      padding: 3mm !important;
    }

    .brand-title {
      font-size: 20px !important;
      line-height: 1.05 !important;
      margin: 0 0 4px 0 !important;
      color: #274863 !important;
    }

    .brand-meta {
      font-size: 10.5px !important;
      line-height: 1.35 !important;
      color: #4b5f75 !important;
    }

    .offer-meta {
      min-width: 58mm !important;
      background: #f6f9fc !important;
      border: 1px solid #dbe3ec !important;
      border-radius: 10px !important;
      padding: 5mm 6mm !important;
      color: #274863 !important;
      backdrop-filter: none !important;
    }

    .offer-meta-row {
      gap: 8mm !important;
      padding: 1.5mm 0 !important;
    }

    .offer-meta-label,
    .offer-meta-value {
      color: #274863 !important;
      font-size: 10.5px !important;
    }

    .content {
      padding: 7mm 8mm 6mm 8mm !important;
    }

    .intro {
      margin-bottom: 5mm !important;
    }

    .intro h2 {
      font-size: 18px !important;
      margin: 0 0 2mm 0 !important;
      color: #0f172a !important;
    }

    .intro p {
      margin: 0 !important;
      font-size: 11px !important;
      color: #475569 !important;
    }

    .info-grid {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 4mm !important;
      margin-bottom: 5mm !important;
    }

    .card {
      border: 1px solid #dbe3ec !important;
      border-radius: 10px !important;
      padding: 5mm !important;
      background: #ffffff !important;
      page-break-inside: avoid !important;
    }

    .card-title {
      margin: 0 0 3mm 0 !important;
      font-size: 10px !important;
      letter-spacing: 0.06em !important;
      color: #407298 !important;
    }

    .card-line {
      margin: 1.5mm 0 !important;
      font-size: 11px !important;
      line-height: 1.3 !important;
    }

    .product-highlight {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 4mm !important;
      border: 1px solid #dbe3ec !important;
      border-radius: 10px !important;
      padding: 5mm 6mm !important;
      background: #ffffff !important;
      margin-bottom: 5mm !important;
      page-break-inside: avoid !important;
    }

    .product-highlight-label {
      font-size: 10px !important;
      letter-spacing: 0.06em !important;
      margin-bottom: 1mm !important;
      color: #64748b !important;
    }

    .product-highlight-title {
      font-size: 18px !important;
      margin: 0 !important;
      line-height: 1.1 !important;
    }

    .product-highlight-type {
      margin-top: 1mm !important;
      font-size: 10.5px !important;
      color: #64748b !important;
    }

    .product-highlight-price small {
      font-size: 9px !important;
      margin-bottom: 1mm !important;
      color: #64748b !important;
    }

    .product-highlight-price strong {
      font-size: 18px !important;
      color: #407298 !important;
    }

    .table-wrap {
      border: 1px solid #dbe3ec !important;
      border-radius: 10px !important;
      overflow: hidden !important;
      background: #ffffff !important;
      page-break-inside: avoid !important;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }

    thead th {
      background: #f4f7fa !important;
      color: #274863 !important;
      font-size: 10px !important;
      padding: 3.2mm 4mm !important;
      border-bottom: 1px solid #dbe3ec !important;
    }

    tbody td {
      padding: 3mm 4mm !important;
      border-bottom: 1px solid #edf2f7 !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
    }

    .col-num {
      width: 10mm !important;
    }

    .col-price {
      width: 34mm !important;
      text-align: right !important;
      white-space: nowrap !important;
    }

    .summary {
      margin-top: 4mm !important;
      display: flex !important;
      justify-content: flex-end !important;
    }

    .summary-box {
      width: 52mm !important;
      border: 1px solid #dbe3ec !important;
      border-radius: 10px !important;
      overflow: hidden !important;
      background: #ffffff !important;
      page-break-inside: avoid !important;
    }

    .summary-row {
      gap: 4mm !important;
      padding: 3mm 4mm !important;
      border-bottom: 1px solid #edf2f7 !important;
      font-size: 11px !important;
    }

    .summary-row.total {
      background: #f4f7fa !important;
      color: #274863 !important;
      font-size: 13px !important;
      font-weight: 800 !important;
    }

    .terms {
      margin-top: 5mm !important;
      padding-top: 4mm !important;
      border-top: 1px solid #dbe3ec !important;
      page-break-inside: avoid !important;
    }

    .terms-title {
      margin: 0 0 2mm 0 !important;
      font-size: 10px !important;
      color: #274863 !important;
    }

    .terms ul {
      margin: 0 !important;
      padding-left: 5mm !important;
    }

    .terms li {
      margin: 1.2mm 0 !important;
      font-size: 10px !important;
      line-height: 1.25 !important;
      color: #475569 !important;
    }

    .footer {
      margin-top: 4mm !important;
      padding-top: 3mm !important;
      border-top: 1px solid #dbe3ec !important;
      color: #64748b !important;
      font-size: 9.5px !important;
      display: flex !important;
      justify-content: space-between !important;
      gap: 6mm !important;
      page-break-inside: avoid !important;
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
                <div class="brand-copy">
                  <h1 class="brand-title">${'Offerte')}</h1>
                  <div class="brand-meta">${companyInfo || ''}</div>
                </div>
              </div>
              <div class="offer-meta">
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

      <div class="info-grid info-grid-single">
  <div class="card customer-card">
    <div class="card-title">Klantgegevens</div>

    <div class="customer-inline-grid">
      <div class="field-inline">
        <span class="label-inline">Naam</span>
        <span class="line-inline"></span>
      </div>

      <div class="field-inline">
        <span class="label-inline">Telefoon</span>
        <span class="line-inline"></span>
      </div>

      <div class="field-inline">
        <span class="label-inline">Adres</span>
        <span class="line-inline"></span>
      </div>

      <div class="field-inline">
        <span class="label-inline">Telefoon 2</span>
        <span class="line-inline"></span>
      </div>

      <div class="field-inline">
        <span class="label-inline">Plaats</span>
        <span class="line-inline"></span>
      </div>

      <div class="field-inline">
        <span class="label-inline">Email</span>
        <span class="line-inline"></span>
      </div>

      
    </div>
  </div>
</div>

            <div class="product-highlight">
              <div>
                <div class="product-highlight-label">Geselecteerd product</div>
                <h3 class="product-highlight-title">${productTitleHtml}</h3>
              </div>
              <div class="product-highlight-price">
                <small>Totaal offertebedrag</small>
                <strong>${euro(total)}</strong>
              </div>
            </div>

            <div class="table-wrap">
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
            </div>

            <div class="summary">
              <div class="summary-box">
                <div class="summary-row">
                  <span>Subtotaal</span>
                  <strong>${euro(total)}</strong>
                </div>
                <div class="summary-row">
                  <span>21% BTW</span>
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
                <li>Prijzen zijn in euro en tenzij anders vermeld inclusief 21% btw.</li>
                <li>Levering en plaatsing volgens afgesproken voorwaarden (goede doorgang & hulp).</li>
                <li>Kraankosten exclusief.</li>
              </ul>
            </div>

            <div class="footer">
              <div>Met vriendelijke groeten,<br><strong>Team Sunspa Brugge/Lievegem</strong></div>
              <div>Dit document werd automatisch opgesteld op ${formatDateBelgium(today)}.</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 250);
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
  if ($('optWarmtepompQty')) $('optWarmtepompQty').value = '0';
  if ($('optBarrelWoodStove')) $('optBarrelWoodStove').checked = false;
  if ($('optBarrelElectricHeater')) $('optBarrelElectricHeater').checked = false;
  if ($('optBarrelRoofShingles')) $('optBarrelRoofShingles').checked = false;
  if ($('optBarrelRoofHeather')) $('optBarrelRoofHeather').checked = false;
  if ($('optBarrelRoofDesign')) $('optBarrelRoofDesign').checked = false;
  if ($('optBarrelInfraredModule')) $('optBarrelInfraredModule').checked = false;

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
