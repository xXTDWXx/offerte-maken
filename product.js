const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

/*
  Zet hier het pad naar jullie logo.
  Voorbeeld:
  const COMPANY_LOGO_URL = 'logo.png';
*/
const COMPANY_LOGO_URL = 'logo.png';
const COMPANY_NAME = 'Sunspa';
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
  const createdAt = new Date();
  const validUntil = addDays(createdAt, 14);
  const lines = getSelectedOfferLines();

  const productPriceValue = Number(currentProduct.price || 0);
  const optionsOnly = lines
    .filter(line => line.label !== (currentProduct.title || 'Product'))
    .reduce((sum, line) => sum + Number(line.price || 0), 0);

  const grandTotal = lines.reduce((sum, line) => sum + Number(line.price || 0), 0);

  const offerRowsHtml = lines.map(line => `
    <tr>
      <td>${escapeHtml(line.label)}</td>
      <td class="amount">${euro(line.price)}</td>
    </tr>
  `).join('');

  const specsHtml = (currentProduct.specs || []).length
    ? (currentProduct.specs || []).map(s => `
        <tr>
          <td>${escapeHtml(s.label || '')}</td>
          <td>${escapeHtml(s.value || '')}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="2">Geen specificaties beschikbaar.</td></tr>`;

  const logoHtml = COMPANY_LOGO_URL
    ? `<img src="${escapeHtml(COMPANY_LOGO_URL)}" alt="Logo" class="logo" onerror="this.style.display='none'">`
    : '';

  const productImageHtml = currentProduct.image
    ? `<img src="${escapeHtml(currentProduct.image)}" alt="" class="product-image" onerror="this.style.display='none'">`
    : '';

  const contactParts = [
    COMPANY_PHONE ? `Tel: ${escapeHtml(COMPANY_PHONE)}` : '',
    COMPANY_EMAIL ? `E-mail: ${escapeHtml(COMPANY_EMAIL)}` : '',
    COMPANY_WEBSITE ? `${escapeHtml(COMPANY_WEBSITE)}` : ''
  ].filter(Boolean).join(' &nbsp;•&nbsp; ');

  const html = `
    <!doctype html>
    <html lang="nl">
    <head>
      <meta charset="utf-8">
      <title>Offerte - ${escapeHtml(currentProduct.title || 'Product')}</title>
      <style>
        @page {
          size: A4;
          margin: 16mm;
        }

        * { box-sizing: border-box; }

        body {
          margin: 36px;
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .header {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:24px;
          padding-bottom:20px;
          border-bottom:2px solid #111827;
        }

        .logo {
          max-width:220px;
          max-height:90px;
          object-fit:contain;
          display:block;
        }

        .company {
          text-align:right;
          font-size:12px;
          line-height:1.6;
          color:#374151;
        }

        .title-row {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:24px;
          margin-top:28px;
          margin-bottom:24px;
        }

        .title h1 {
          margin:0;
          font-size:34px;
          letter-spacing:.5px;
        }

        .title .subtitle {
          margin-top:8px;
          color:#6b7280;
          font-size:14px;
        }

        .offer-meta {
          min-width:230px;
          border:1px solid #d1d5db;
          border-radius:12px;
          overflow:hidden;
        }

        .offer-meta-row {
          display:flex;
          justify-content:space-between;
          gap:16px;
          padding:10px 14px;
          border-bottom:1px solid #e5e7eb;
          font-size:13px;
        }

        .offer-meta-row:last-child { border-bottom:0; }

        .label {
          color:#6b7280;
          font-weight:600;
        }

        .content-grid {
          grid-template-columns:1.1fr .9fr;
          gap:22px;
          margin-bottom:24px;
        }

        .card {
          border:1px solid #d1d5db;
          border-radius:14px;
          padding:18px;
        }

        .card-title {
          font-size:14px;
          font-weight:700;
          color:#111827;
          letter-spacing:.3px;
          text-transform:uppercase;
          margin-bottom:12px;
        }

        .customer-line {
          margin-bottom:8px;
          font-size:14px;
          line-height:1.5;
        }

        .product-image {
          width:100%;
          max-height:240px;
          object-fit:cover;
          border-radius:12px;
          border:1px solid #e5e7eb;
          margin-top:12px;
        }

        table {
          width:100%;
          border-collapse:collapse;
        }

        .offer-table th {
          text-align:left;
          font-size:12px;
          text-transform:uppercase;
          letter-spacing:.4px;
          color:#6b7280;
          padding:12px 0;
          border-bottom:1px solid #d1d5db;
        }

        .offer-table td {
          padding:12px 0;
          border-bottom:1px solid #eceff3;
          vertical-align:top;
          font-size:14px;
        }

        .amount {
          text-align:right;
          white-space:nowrap;
          font-weight:600;
        }

        .totals-box {
          width:360px;
          margin-left:auto;
          margin-top:18px;
          border:1px solid #d1d5db;
          border-radius:14px;
          overflow:hidden;
        }

        .totals-row {
          display:flex;
          justify-content:space-between;
          gap:16px;
          padding:12px 16px;
          border-bottom:1px solid #e5e7eb;
          font-size:14px;
        }

        .totals-row:last-child { border-bottom:0; }

        .totals-row.final {
          background:#111827;
          color:#fff;
          font-size:18px;
          font-weight:700;
        }

        .section {
          margin-top:26px;
        }

        .section h2 {
          margin:0 0 12px 0;
          font-size:16px;
          text-transform:uppercase;
          letter-spacing:.4px;
        }

        .spec-table td {
          padding:10px 0;
          border-bottom:1px solid #eceff3;
          font-size:14px;
        }

        .spec-table td:first-child {
          width:36%;
          font-weight:700;
        }

        .note-box {
          margin-top:28px;
          padding:16px 18px;
          border:1px solid #d1d5db;
          border-radius:14px;
          background:#f9fafb;
          font-size:13px;
          line-height:1.7;
          color:#374151;
        }

        .footer {
          margin-top:26px;
          padding-top:16px;
          border-top:1px solid #d1d5db;
          font-size:12px;
          color:#6b7280;
          display:flex;
          justify-content:space-between;
          gap:18px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>${logoHtml}</div>
        <div class="company">
          <div><strong>${escapeHtml(COMPANY_NAME)}</strong></div>
          ${contactParts ? `<div>${contactParts}</div>` : ''}
        </div>
      </div>

      <div class="title-row">
        <div class="title">
          <h1>OFFERTE</h1>
          <div class="subtitle">
            ${escapeHtml(currentProduct.title || '')}
            ${currentProduct.type ? `• ${escapeHtml(currentProduct.type)}` : ''}
          </div>
        </div>

        <div class="offer-meta">
          <div class="offer-meta-row">
            <span class="label">Offertedatum</span>
            <strong>${formatDateBelgium(createdAt)}</strong>
          </div>
          <div class="offer-meta-row">
            <span class="label">Geldig tot</span>
            <strong>${formatDateBelgium(validUntil)}</strong>
          </div>
          <div class="offer-meta-row">
            <span class="label">Geldigheid</span>
            <strong>14 dagen</strong>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-title">Klantgegevens</div>
          <div class="customer-line"><strong>Naam:</strong> ${escapeHtml(customer.name || '')}</div>
          <div class="customer-line"><strong>Straat:</strong> ${escapeHtml(customer.street || '')}</div>
          <div class="customer-line"><strong>Gemeente:</strong> ${escapeHtml(customer.city || '')}</div>
          <div class="customer-line"><strong>Gsm:</strong> ${escapeHtml(customer.phone || '')}</div>
        </div>

        
      </div>

      <div class="section">
        <table class="offer-table">
          <thead>
            <tr>
              <th>Omschrijving</th>
              <th class="amount">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            ${offerRowsHtml}
          </tbody>
        </table>

        <div class="totals-box">
          <div class="totals-row">
            <span>Product</span>
            <strong>${euro(productPriceValue)}</strong>
          </div>
          <div class="totals-row">
            <span>Opties + levering</span>
            <strong>${euro(optionsOnly)}</strong>
          </div>
          <div class="totals-row final">
            <span>Totaal incl. btw</span>
            <strong>${euro(grandTotal)}</strong>
          </div>
        </div>
      </div>

    

      <div class="note-box">
        <strong>Opmerkingen</strong><br>
        • Deze offerte is 14 dagen geldig vanaf offertedatum.<br>
        • Alle vermelde bedragen zijn inclusief btw.<br>
        • Kraankosten zijn niet inbegrepen, tenzij anders schriftelijk vermeld.<br>
        • Afbeeldingen dienen ter illustratie en kunnen afwijken van het uiteindelijke product.
      </div>

      <div class="footer">
        <div>${escapeHtml(COMPANY_NAME)}</div>
        <div>Offerte automatisch gegenereerd via productpagina</div>
      </div>

      <script>
        window.onload = function () {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up geblokkeerd. Sta pop-ups toe om de offerte te printen.');
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
}

function renderProduct(p) {
  currentProduct = p;

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
