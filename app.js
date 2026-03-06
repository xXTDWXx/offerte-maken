// Sunspa catalogus + productfiche modal (robust / null-safe)
// Verwacht: assets/products.json
// Werkt met templates die (optioneel) data-open en/of data-link bevatten.

const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

// --- Catalog refs
const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const elSearch = document.getElementById('search');
const elType = document.getElementById('typeFilter');
const elSort = document.getElementById('sort');
const elClear = document.getElementById('btnClear');

const elStatus = document.getElementById('status');
const elChips = document.getElementById('activeChips');
const elMeta = document.getElementById('resultMeta');

const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');

// --- Modal refs (best-effort; als modal niet bestaat, blijft catalogus werken)
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

function euro(n) {
  const x = Number(n || 0);
  try {
    return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(x);
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



function buildTypeFilter(items) {
  if (!elType) return;
  const types = Array.from(new Set(items.map(p => p.type).filter(Boolean))).sort();
  elType.innerHTML = '<option value="">Alle types</option>' +
    types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

function productSearchBlob(p) {
  const specText = (p.specs || []).map(s => `${s.label}: ${s.value}`).join(' | ');
  const bullets = (p.bullets || []).join(' | ');
  return normalize([p.title, p.type, bullets, specText].join(' '));
}

function topSpecs(p) {
  const want = ['Aantal zitplaatsen', 'Aantal ligplaatsen', 'Aantal jets', 'Afmetingen', 'Inhoud', 'Stroom'];
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

function renderChips(q, type, sort) {
  if (!elChips || !elMeta) return;

  const chips = [];
  if (q) chips.push(`Zoek: ${escapeHtml(q)}`);
  if (type) chips.push(`Type: ${escapeHtml(type)}`);
  if (sort && sort !== 'relevance') {
    const map = { priceAsc: 'Prijs ↑', priceDesc: 'Prijs ↓', titleAsc: 'Titel A–Z' };
    chips.push(`Sort: ${map[sort] || sort}`);
  }

  elChips.innerHTML = chips.map(c => `<span class="chip">${c}</span>`).join('');
  elMeta.textContent = `${filtered.length} producten`;
}

function applyFilters() {
  const q = elSearch ? normalize(elSearch.value) : '';
  const type = elType ? elType.value : '';
  const sort = elSort ? elSort.value : 'relevance';

  filtered = products.filter(p => {
    if (type && p.type !== type) return false;
    if (q) return productSearchBlob(p).includes(q);
    return true;
  });

  if (sort === 'priceAsc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sort === 'priceDesc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sort === 'titleAsc') filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'nl'));

  renderChips(q, type, sort);
  renderGrid();
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

// --- Modal open/close (best-effort)
function openModal(p) {
  if (!modal) return; // als je geen modal HTML hebt, doet hij niks

  if (modalTitle) modalTitle.textContent = p.title || '—';
  if (modalPrice) modalPrice.textContent = `Prijs: ${euro(p.price || 0)}`;
  if (modalType) modalType.textContent = (p.type || '').toUpperCase();

  if (modalImg) {
    modalImg.src = p.image || '';
    modalImg.alt = p.title || 'Product';
    modalImg.style.display = p.image ? '' : 'none';
    modalImg.onerror = () => { modalImg.style.display = 'none'; };
  }

  if (modalSpecs) modalSpecs.innerHTML = specTableHtml(p);

  if (modalUrl) {
    modalUrl.href = p.url || '#';
    modalUrl.style.display = p.url ? '' : 'none';
  }

  if (modalPrint) modalPrint.onclick = () => printProductFiche(p);

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  afterOpenModal(p);
}


function closeModal() {
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (modal) {
  modal.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.matches('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });
}

function printProductFiche(p) {
  const win = window.open('', '_blank');
  const specs = (p.specs || []).map(s =>
    `<tr><td><strong>${escapeHtml(s.label)}</strong></td><td>${escapeHtml(s.value)}</td></tr>`
  ).join('');

  const img = p.image
    ? `<img src="${p.image}" style="width:100%;max-width:760px;border:1px solid #ddd;border-radius:12px;margin:10px 0">`
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
        <script>window.onload=()=>{window.print();}</script>
      </body>
    </html>
  `);
  win.document.close();
}

// --- Render
function renderGrid() {
  if (!elGrid || !tpl) return;
  elGrid.innerHTML = '';

  const frag = document.createDocumentFragment();

  for (const p of filtered) {
    const node = tpl.content.cloneNode(true);

    // image
    const img = node.querySelector('.card-img');
    if (img) {
      img.src = p.image || '';
      img.alt = p.title || 'Product';
      img.onerror = () => { img.style.display = 'none'; };
    }

    // badge/title/price/specs
    const badge = node.querySelector('[data-badge]');
    if (badge) badge.textContent = (p.type || '').toUpperCase();

    const title = node.querySelector('[data-title]');
    if (title) title.textContent = p.title || '';

    const price = node.querySelector('[data-price]');
    if (price) price.textContent = euro(p.price || 0);

    const specs = node.querySelector('[data-specs]');
    if (specs) specs.innerHTML = topSpecs(p);

    // OPTIONAL: if your template has a link
    const link = node.querySelector('[data-link]');
    if (link) {
      // als je een aparte productpagina gebruikt:
      // link.href = `product.html?id=${encodeURIComponent(p.id)}`;
      // Maar als je “zoals jouw site” wil: klik opent modal:
      link.href = '#';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(p);
      });
    }

    // OPTIONAL: if your template has a button with data-open
    const openBtn = node.querySelector('[data-open]');
    if (openBtn) {
      openBtn.addEventListener('click', () => openModal(p));
    } else {
      // fallback: maak de hele card klikbaar als er geen data-open is
      const card = node.querySelector('.card-link') || node.querySelector('.card') || node.firstElementChild;
      if (card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openModal(p));
      }
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


// --- Events (null-safe)
if (elSearch) elSearch.addEventListener('input', applyFilters);
if (elType) elType.addEventListener('change', applyFilters);
if (elSort) elSort.addEventListener('change', applyFilters);

if (elClear) {
  elClear.addEventListener('click', () => {
    if (elSearch) elSearch.value = '';
    if (elType) elType.value = '';
    if (elSort) elSort.value = 'relevance';
    applyFilters();
  });
}


// ===== Pricing rules =====
const PRICES = {
  install_jacuzzi: 695,
  install_swimspa: 895,
  install_barrel_sauna: 995,
  install_infrared: 450,
  install_sauna: 695,

  coverlift_unit: 189,
  maintenance_unit: 179,
  filter_unit: 45,
  swim_filterset_unit: 250
};

function typeNorm(type){ return (type || '').toString().toLowerCase(); }
function isSwimspa(type){ return typeNorm(type).includes('zwemspa') || typeNorm(type).includes('swim'); }
function isInfrared(type){ return typeNorm(type).includes('infrarood'); }
function isBarrelSauna(type){ return typeNorm(type).includes('barrel') && typeNorm(type).includes('sauna'); }
function isSauna(type){ return typeNorm(type).includes('sauna'); }
function isJacuzzi(type){
  const t = typeNorm(type);
  // als het geen sauna/infrarood/zwemspa is, behandelen we als jacuzzi
  return !isSwimspa(t) && !isInfrared(t) && !isSauna(t);
}
function installCost(type){
  if (isSwimspa(type)) return PRICES.install_swimspa;
  if (isBarrelSauna(type)) return PRICES.install_barrel_sauna;
  if (isInfrared(type)) return PRICES.install_infrared;
  if (isSauna(type)) return PRICES.install_sauna;
  return PRICES.install_jacuzzi;
}
function coverliftAllowed(type){
  // enkel bij jacuzzi en zwemspa
  return isJacuzzi(type) || isSwimspa(type);
}

// ===== Modal option refs (best-effort) =====
function $(id){ return document.getElementById(id); }

let currentProduct = null;

function readInt(el){
  const n = Number(el?.value || 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function updateOptionUI(){
  if (!currentProduct) return;

  const type = currentProduct.type || '';

  const optInstall = $('optInstall');
  const optInstallHint = $('optInstallHint');
  const optInstallPrice = $('optInstallPrice');

  const optCoverliftRow = $('optCoverliftRow');
  const optCoverliftQty = $('optCoverliftQty');
  const optCoverliftTotal = $('optCoverliftTotal');

  const optMaintQty = $('optMaintQty');
  const optMaintTotal = $('optMaintTotal');

  const optFilterQty = $('optFilterQty');
  const optFilterTotal = $('optFilterTotal');

  const optSwimFiltersetRow = $('optSwimFiltersetRow');
  const optSwimFiltersetQty = $('optSwimFiltersetQty');
  const optSwimFiltersetTotal = $('optSwimFiltersetTotal');

  const tProduct = $('optProductTotal');
  const tOptions = $('optOptionsTotal');
  const tGrand = $('optGrandTotal');

  const inst = installCost(type);
  if (optInstallHint) optInstallHint.textContent = `Installatiekost voor type “${type || 'jacuzzi'}”: ${euro(inst)}`;
  if (optInstallPrice) optInstallPrice.textContent = euro(inst);

  // Coverlift (alleen jacuzzi/zwemspa)
  const allowCoverlift = coverliftAllowed(type);
  if (optCoverliftRow) optCoverliftRow.style.display = allowCoverlift ? '' : 'none';
  if (!allowCoverlift && optCoverliftQty) optCoverliftQty.value = '0';

  // Zwemspa extra filterset
  const swim = isSwimspa(type);
  if (optSwimFiltersetRow) optSwimFiltersetRow.style.display = swim ? '' : 'none';
  if (!swim && optSwimFiltersetQty) optSwimFiltersetQty.value = '0';

  const installSelected = !!optInstall?.checked;
  const coverliftQty = allowCoverlift ? readInt(optCoverliftQty) : 0;
  const maintQty = readInt(optMaintQty);
  const filterQty = readInt(optFilterQty);
  const swimFiltersetQty = swim ? readInt(optSwimFiltersetQty) : 0;

  const installLine = installSelected ? inst : 0;
  const coverliftLine = coverliftQty * PRICES.coverlift_unit;
  const maintLine = maintQty * PRICES.maintenance_unit;
  const filterLine = filterQty * PRICES.filter_unit;
  const swimFiltersetLine = swimFiltersetQty * PRICES.swim_filterset_unit;

  if (optCoverliftTotal) optCoverliftTotal.textContent = euro(coverliftLine);
  if (optMaintTotal) optMaintTotal.textContent = euro(maintLine);
  if (optFilterTotal) optFilterTotal.textContent = euro(filterLine);
  if (optSwimFiltersetTotal) optSwimFiltersetTotal.textContent = euro(swimFiltersetLine);

  const productPrice = Number(currentProduct.price || 0);
  const optionsTotal = installLine + coverliftLine + maintLine + filterLine + swimFiltersetLine;
  const grand = productPrice + optionsTotal;

  if (tProduct) tProduct.textContent = euro(productPrice);
  if (tOptions) tOptions.textContent = euro(optionsTotal);
  if (tGrand) tGrand.textContent = euro(grand);
}

function wireOptionHandlers(){
  const ids = [
    'optInstall',
    'optCoverliftQty',
    'optMaintQty',
    'optFilterQty',
    'optSwimFiltersetQty'
  ];
  ids.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', updateOptionUI);
    el.addEventListener('change', updateOptionUI);
  });

  const btnAdd = $('btnAddToOffer');
  if (btnAdd){
    btnAdd.onclick = () => {
      if (!currentProduct) return;

      const type = currentProduct.type || '';
      const inst = installCost(type);
      const allowCoverlift = coverliftAllowed(type);
      const swim = isSwimspa(type);

      const payload = {
        productId: currentProduct.id,
        title: currentProduct.title,
        type: type,
        url: currentProduct.url || '',
        image: currentProduct.image || '',
        unit_price: Number(currentProduct.price || 0),

        options: {
          install: !!$('optInstall')?.checked,
          install_price: inst,

          cover_trap_included: true,
          cover_trap_price: 0,

          coverlift_qty: allowCoverlift ? readInt($('optCoverliftQty')) : 0,
          coverlift_unit: PRICES.coverlift_unit,

          maintenance_qty: readInt($('optMaintQty')),
          maintenance_unit: PRICES.maintenance_unit,

          extra_filter_qty: readInt($('optFilterQty')),
          extra_filter_unit: PRICES.filter_unit,

          swim_filterset_qty: swim ? readInt($('optSwimFiltersetQty')) : 0,
          swim_filterset_unit: PRICES.swim_filterset_unit
        }
      };

      const offer = getOffer();
      offer.push(payload);
      setOffer(offer);
      alert('Toegevoegd aan offerte.');
    };
  }
}

// ===== Koppel dit aan jouw bestaande openModal(p) =====
// Voeg op het einde van jouw huidige openModal(p) toe:
function afterOpenModal(p){
  currentProduct = p;

  // defaults
  const install = $('optInstall');
  if (install) install.checked = true;

  const coverliftQty = $('optCoverliftQty');
  if (coverliftQty) coverliftQty.value = '0';

  const maintQty = $('optMaintQty');
  if (maintQty) maintQty.value = '0';

  const filterQty = $('optFilterQty');
  if (filterQty) filterQty.value = '0';

  const swimFiltersetQty = $('optSwimFiltersetQty');
  if (swimFiltersetQty) swimFiltersetQty.value = '0';

  wireOptionHandlers();
  updateOptionUI();
}
