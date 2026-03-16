// Sunspa catalogus + productfiche modal + offerte-opties

const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();
const OFFER_KEY = 'sunspa_offer_v1';

// --- Catalog refs
const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const elSearch = document.getElementById('search');
const elBrand = document.getElementById('brandFilter');
const elType = document.getElementById('typeFilter');
const elSort = document.getElementById('sort');
const elClear = document.getElementById('btnClear');

const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');

// --- Modal refs
const modal = document.getElementById('productModal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const modalType = document.getElementById('modalType');
const modalSpecs = document.getElementById('modalSpecs');
const modalUrl = document.getElementById('modalUrl');
const modalPrint = document.getElementById('modalPrint');

let products = [];
let filtered = [];
let currentProduct = null;
let optionHandlersWired = false;

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

function normalize(s) {
  return (s ?? '').toString().toLowerCase().trim();
}

function escapeHtml(s) {
  return (s ?? '').toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getOffer() {
  try {
    return JSON.parse(localStorage.getItem(OFFER_KEY) || '[]');
  } catch {
    return [];
  }
}

function setOffer(lines) {
  localStorage.setItem(OFFER_KEY, JSON.stringify(lines));
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

function typeNorm(type) {
  return (type || '').toString().toLowerCase();
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

function isSauna(type) {
  return typeNorm(type).includes('sauna');
}

function isJacuzzi(type) {
  const t = typeNorm(type);
  return !isSwimspa(t) && !isInfrared(t) && !isSauna(t);
}

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

function readInt(el) {
  const n = Number(el?.value || 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/**
 * Haal merk op uit:
 * 1. p.brand
 * 2. p.merk
 * 3. specs[].label === "Merk"
 */
function getBrand(p) {
  if (!p || typeof p !== 'object') return '';

  if (p.brand) return String(p.brand).trim();
  if (p.merk) return String(p.merk).trim();

  const specs = Array.isArray(p.specs) ? p.specs : [];
  const specBrand = specs.find(s => normalize(s?.label) === 'merk');

  if (specBrand?.value) return String(specBrand.value).trim();

  return '';
}

async function loadProducts({ force = false } = {}) {
  const url = force ? `${PRODUCTS_URL}?t=${Date.now()}` : PRODUCTS_URL;
  const res = await fetch(url, { cache: force ? 'no-store' : 'default' });
  if (!res.ok) throw new Error(`Kan products.json niet laden (${res.status})`);
  const json = await res.json();

  const items = Array.isArray(json) ? json : (json.products || []);
  if (!Array.isArray(items)) return [];
  return items;
}

function buildBrandFilter(items) {
  if (!elBrand) return;

  const brands = Array.from(
    new Set(
      items
        .map(getBrand)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'nl'));

  elBrand.innerHTML =
    '<option value="">Alle merken</option>' +
    brands.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
}

function buildTypeFilter(items) {
  if (!elType) return;

  const types = Array.from(
    new Set(items.map(p => p.type).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'nl'));

  elType.innerHTML =
    '<option value="">Alle types</option>' +
    types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

function productSearchBlob(p) {
  const specText = (p.specs || []).map(s => `${s.label}: ${s.value}`).join(' | ');
  const bullets = (p.bullets || []).join(' | ');
  const brand = getBrand(p);
  return normalize([p.title, p.type, brand, bullets, specText].join(' '));
}

function topSpecs(p) {
  const want = ['Afmetingen', 'Aantal zitplaatsen', 'Aantal ligplaatsen', 'Aantal jets'];
  const specs = Array.isArray(p.specs) ? p.specs : [];
  const picked = [];

  for (const key of want) {
    const found = specs.find(s => normalize(s.label) === normalize(key));
    if (found) picked.push(`${escapeHtml(found.label)}: ${escapeHtml(found.value)}`);
  }

  if (!picked.length) {
    for (const s of specs.slice(0, 3)) {
      picked.push(`${escapeHtml(s.label)}: ${escapeHtml(s.value)}`);
    }
  }

  return picked.slice(0, 4).join('<br>');
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

function applyFilters() {
  const q = elSearch ? normalize(elSearch.value) : '';
  const brand = elBrand ? elBrand.value : '';
  const type = elType ? elType.value : '';
  const sort = elSort ? elSort.value : 'relevance';

  filtered = products.filter(p => {
    const pBrand = getBrand(p);

    if (brand && pBrand !== brand) return false;
    if (type && p.type !== type) return false;
    if (q) return productSearchBlob(p).includes(q);
    return true;
  });

  if (sort === 'priceAsc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sort === 'priceDesc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sort === 'titleAsc') filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'nl'));

  renderGrid();
}

function updateOptionUI() {
  if (!currentProduct) return;

  const type = currentProduct.type || '';

  const optInstall = $('optInstall');
  const optInstallPrice = $('optInstallPrice');

  const optCoverTrapRow = $('optCoverTrapRow');
  const optCoverliftRow = $('optCoverliftRow');
  const optCoverlift = $('optCoverlift');
  const optCoverliftTotal = $('optCoverliftTotal');

  const optMaintRow = $('optMaintRow');
  const optMaint = $('optMaint');
  const optMaintTotal = $('optMaintTotal');

  const optSwimFiltersetRow = $('optSwimFiltersetRow');
  const optSwimFiltersetQty = $('optSwimFiltersetQty');

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

  if (optInstallPrice) {
    optInstallPrice.textContent = euro(inst);
  }

  const allowExtraOptions = extraOptionsAllowed(type);

  if (optCoverTrapRow) optCoverTrapRow.style.display = allowExtraOptions ? '' : 'none';
  if (optCoverliftRow) optCoverliftRow.style.display = allowExtraOptions ? '' : 'none';
  if (optMaintRow) optMaintRow.style.display = allowExtraOptions ? '' : 'none';

  if (!allowExtraOptions && optCoverlift) optCoverlift.checked = false;
  if (!allowExtraOptions && optMaint) optMaint.checked = false;

  const swim = isSwimspa(type);
  if (optSwimFiltersetRow) optSwimFiltersetRow.style.display = swim ? '' : 'none';
  if (!swim && optSwimFiltersetQty) optSwimFiltersetQty.value = '0';

  const barrel = isBarrelSauna(type);

  if (optBarrelStoveGroup) optBarrelStoveGroup.style.display = barrel ? '' : 'none';
  if (optBarrelRoofGroup) optBarrelRoofGroup.style.display = barrel ? '' : 'none';

  if (!barrel && optBarrelWoodStove) optBarrelWoodStove.checked = false;
  if (!barrel && optBarrelElectricHeater) optBarrelElectricHeater.checked = false;
  if (!barrel && optBarrelRoofShingles) optBarrelRoofShingles.checked = false;
  if (!barrel && optBarrelRoofHeather) optBarrelRoofHeather.checked = false;
  if (!barrel && optBarrelRoofDesign) optBarrelRoofDesign.checked = false;

  const installSelected = !!optInstall?.checked;
  const coverliftSelected = allowExtraOptions ? !!optCoverlift?.checked : false;
  const maintSelected = allowExtraOptions ? !!optMaint?.checked : false;
  const swimFiltersetQty = swim ? readInt(optSwimFiltersetQty) : 0;

  const barrelWoodStoveSelected = barrel ? !!optBarrelWoodStove?.checked : false;
  const barrelElectricHeaterSelected = barrel ? !!optBarrelElectricHeater?.checked : false;
  const barrelRoofShinglesSelected = barrel ? !!optBarrelRoofShingles?.checked : false;
  const barrelRoofHeatherSelected = barrel ? !!optBarrelRoofHeather?.checked : false;
  const barrelRoofDesignSelected = barrel ? !!optBarrelRoofDesign?.checked : false;

  const installLine = installSelected ? inst : 0;
  const coverliftLine = coverliftSelected ? PRICES.coverlift_unit : 0;
  const maintLine = maintSelected ? PRICES.maintenance_unit : 0;
  const swimFiltersetLine = swimFiltersetQty * PRICES.swim_filterset_unit;

  const barrelWoodStoveLine = barrelWoodStoveSelected ? PRICES.barrel_wood_stove_unit : 0;
  const barrelElectricHeaterLine = barrelElectricHeaterSelected ? PRICES.barrel_electric_heater_unit : 0;
  const barrelRoofShinglesLine = barrelRoofShinglesSelected ? PRICES.barrel_roof_shingles_unit : 0;
  const barrelRoofHeatherLine = barrelRoofHeatherSelected ? PRICES.barrel_roof_heather_unit : 0;
  const barrelRoofDesignLine = barrelRoofDesignSelected ? PRICES.barrel_roof_design_unit : 0;

  if (optCoverliftTotal) optCoverliftTotal.textContent = euro(coverliftLine);
  if (optMaintTotal) optMaintTotal.textContent = euro(maintLine);
  if (optBarrelWoodStoveTotal) optBarrelWoodStoveTotal.textContent = euro(barrelWoodStoveLine);
  if (optBarrelElectricHeaterTotal) optBarrelElectricHeaterTotal.textContent = euro(barrelElectricHeaterLine);
  if (optBarrelRoofShinglesTotal) optBarrelRoofShinglesTotal.textContent = euro(barrelRoofShinglesLine);
  if (optBarrelRoofHeatherTotal) optBarrelRoofHeatherTotal.textContent = euro(barrelRoofHeatherLine);
  if (optBarrelRoofDesignTotal) optBarrelRoofDesignTotal.textContent = euro(barrelRoofDesignLine);

  const productPrice = Number(currentProduct.price || 0);
  const optionsTotal =
    installLine +
    coverliftLine +
    maintLine +
    swimFiltersetLine +
    barrelWoodStoveLine +
    barrelElectricHeaterLine +
    barrelRoofShinglesLine +
    barrelRoofHeatherLine +
    barrelRoofDesignLine;

  const grand = productPrice + optionsTotal;

  if (tProduct) tProduct.textContent = euro(productPrice);
  if (tOptions) tOptions.textContent = euro(optionsTotal);
  if (tGrand) tGrand.textContent = euro(grand);
}

function wireOptionHandlers() {
  if (optionHandlersWired) return;
  optionHandlersWired = true;

  const ids = [
    'optInstall',
    'optCoverlift',
    'optMaint',
    'optSwimFiltersetQty',
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

  const btnAdd = $('btnAddToOffer');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      if (!currentProduct) return;

      const type = currentProduct.type || '';
      const inst = installCost(type);
      const allowExtraOptions = extraOptionsAllowed(type);
      const swim = isSwimspa(type);
      const barrel = isBarrelSauna(type);

      let barrelStove = '';
      if (barrel && $('optBarrelWoodStove')?.checked) barrelStove = 'wood';
      if (barrel && $('optBarrelElectricHeater')?.checked) barrelStove = 'electric';

      let barrelRoof = '';
      if (barrel && $('optBarrelRoofShingles')?.checked) barrelRoof = 'shingles';
      if (barrel && $('optBarrelRoofHeather')?.checked) barrelRoof = 'heather';
      if (barrel && $('optBarrelRoofDesign')?.checked) barrelRoof = 'design';

      const payload = {
        productId: currentProduct.id,
        title: currentProduct.title,
        type: currentProduct.type || '',
        brand: getBrand(currentProduct),
        url: currentProduct.url || '',
        image: currentProduct.image || '',
        unit_price: Number(currentProduct.price || 0),
        qty: 1,
        options: {
          install: !!$('optInstall')?.checked,
          install_price: inst,

          cover_trap_included: allowExtraOptions,
          cover_trap_price: 0,

          coverlift: allowExtraOptions ? !!$('optCoverlift')?.checked : false,
          coverlift_unit: PRICES.coverlift_unit,

          maintenance: allowExtraOptions ? !!$('optMaint')?.checked : false,
          maintenance_unit: PRICES.maintenance_unit,

          swim_filterset_qty: swim ? readInt($('optSwimFiltersetQty')) : 0,
          swim_filterset_unit: PRICES.swim_filterset_unit,

          barrel_stove: barrel ? barrelStove : '',
          barrel_wood_stove_unit: PRICES.barrel_wood_stove_unit,
          barrel_electric_heater_unit: PRICES.barrel_electric_heater_unit,

          barrel_roof: barrel ? barrelRoof : '',
          barrel_roof_shingles_unit: PRICES.barrel_roof_shingles_unit,
          barrel_roof_heather_unit: PRICES.barrel_roof_heather_unit,
          barrel_roof_design_unit: PRICES.barrel_roof_design_unit
        }
      };

      const offer = getOffer();
      offer.push(payload);
      setOffer(offer);
      alert('Toegevoegd aan offerte.');
    });
  }
}

function afterOpenModal(p) {
  currentProduct = p;

  const install = $('optInstall');
  if (install) install.checked = true;

  const coverlift = $('optCoverlift');
  if (coverlift) coverlift.checked = false;

  const maint = $('optMaint');
  if (maint) maint.checked = false;

  const swimFiltersetQty = $('optSwimFiltersetQty');
  if (swimFiltersetQty) swimFiltersetQty.value = '0';

  const barrelWoodStove = $('optBarrelWoodStove');
  if (barrelWoodStove) barrelWoodStove.checked = false;

  const barrelElectricHeater = $('optBarrelElectricHeater');
  if (barrelElectricHeater) barrelElectricHeater.checked = false;

  const barrelRoofShingles = $('optBarrelRoofShingles');
  if (barrelRoofShingles) barrelRoofShingles.checked = false;

  const barrelRoofHeather = $('optBarrelRoofHeather');
  if (barrelRoofHeather) barrelRoofHeather.checked = false;

  const barrelRoofDesign = $('optBarrelRoofDesign');
  if (barrelRoofDesign) barrelRoofDesign.checked = false;

  wireOptionHandlers();
  updateOptionUI();
}

function openModal(p) {
  if (!modal) return;

  if (modalTitle) modalTitle.textContent = p.title || '—';
  if (modalPrice) modalPrice.textContent = `Prijs: ${euro(p.price || 0)}`;
  if (modalType) modalType.textContent = (p.type || '').toUpperCase();

  if (modalImg) {
    modalImg.src = p.image || '';
    modalImg.alt = p.title || 'Product';
    modalImg.style.display = p.image ? '' : 'none';
    modalImg.onerror = () => {
      modalImg.style.display = 'none';
    };
  }

  if (modalSpecs) modalSpecs.innerHTML = specTableHtml(p);

  if (modalUrl) {
    modalUrl.href = p.url || '#';
    modalUrl.style.display = p.url ? '' : 'none';
  }

  if (modalPrint) modalPrint.onclick = () => printProductFiche(p);

  modal.setAttribute('aria-hidden', 'false');
  afterOpenModal(p);
}

function closeModal() {
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
}

if (modal) {
  modal.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.matches('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });
}

function printProductFiche(p) {
  const specs = (p.specs || []).map(s =>
    `<tr><td><strong>${escapeHtml(s.label)}</strong></td><td>${escapeHtml(s.value)}</td></tr>`
  ).join('');

  const img = p.image
    ? `<img src="${p.image}" style="width:100%;max-width:760px;border:1px solid #ddd;border-radius:12px;margin:10px 0">`
    : '';

  const brand = getBrand(p);
  const brandRow = brand
    ? `<tr><td><strong>Merk</strong></td><td>${escapeHtml(brand)}</td></tr>`
    : '';

  const win = window.open('', '_blank');
  if (!win) return;

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
        <table>
          ${brandRow}
          ${specs}
        </table>
        <script>window.onload=()=>{window.print();}</script>
      </body>
    </html>
  `);
  win.document.close();
}

function renderGrid() {
  if (!elGrid || !tpl) return;
  elGrid.innerHTML = '';

  const frag = document.createDocumentFragment();

  for (const p of filtered) {
    const node = tpl.content.cloneNode(true);

    const img = node.querySelector('.card-img');
    if (img) {
      img.src = p.image || '';
      img.alt = p.title || 'Product';
      img.onerror = () => {
        img.style.display = 'none';
      };
    }

    const badge = node.querySelector('[data-badge]');
    if (badge) badge.textContent = (p.type || '').toUpperCase();

    const title = node.querySelector('[data-title]');
    if (title) title.textContent = p.title || '';

    const price = node.querySelector('[data-price]');
    if (price) price.textContent = euro(p.price || 0);

    const specs = node.querySelector('[data-specs]');
    if (specs) specs.innerHTML = topSpecs(p);

    const openBtn = node.querySelector('[data-open]');
    if (openBtn) {
      openBtn.addEventListener('click', () => openModal(p));
    }

    frag.appendChild(node);
  }

  elGrid.appendChild(frag);
}

function showError(msg) {
  if (!errorBox || !errorText) return;
  errorBox.style.display = '';
  errorText.textContent = msg;
}

async function init() {
  products = await loadProducts({ force: false });
  buildBrandFilter(products);
  buildTypeFilter(products);
  applyFilters();
}

if (elSearch) elSearch.addEventListener('input', applyFilters);
if (elBrand) elBrand.addEventListener('change', applyFilters);
if (elType) elType.addEventListener('change', applyFilters);
if (elSort) elSort.addEventListener('change', applyFilters);

if (elClear) {
  elClear.addEventListener('click', () => {
    if (elSearch) elSearch.value = '';
    if (elBrand) elBrand.value = '';
    if (elType) elType.value = '';
    if (elSort) elSort.value = 'relevance';
    applyFilters();
  });
}

init().catch(e => {
  console.error(e);
  showError(String(e.message || e));
});
