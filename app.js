// Sunspa catalogus + productfiche modal + offerte-opties
// Verwacht: products.json in dezelfde map als index.html

const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();
const OFFER_KEY = 'sunspa_offer_v1';

// --- Catalog refs
const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const elSearch = document.getElementById('search');
const elType = document.getElementById('typeFilter');
const elSort = document.getElementById('sort');
const elClear = document.getElementById('btnClear');

const elSync = document.getElementById('btn-sync');
const elStatus = document.getElementById('status');
const elChips = document.getElementById('activeChips');
const elMeta = document.getElementById('resultMeta');

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

// ===== helpers =====
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

// ===== pricing rules =====
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

function coverliftAllowed(type) {
  return isJacuzzi(type) || isSwimspa(type);
}

function readInt(el) {
  const n = Number(el?.value || 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

// ===== data loading =====
async function loadProducts({ force = false } = {}) {
  const url = force ? `${PRODUCTS_URL}?t=${Date.now()}` : PRODUCTS_URL;
  const res = await fetch(url, { cache: force ? 'no-store' : 'default' });
  if (!res.ok) throw new Error(`Kan products.json niet laden (${res.status})`);
  const json = await res.json();

  const items = Array.isArray(json) ? json : (json.products || []);
  if (!Array.isArray(items)) return [];
  return items;
}

function buildTypeFilter(items) {
  if (!elType) return;
  const types = Array.from(new Set(items.map(p => p.type).filter(Boolean))).sort();
  elType.innerHTML =
    '<option value="">Alle types</option>' +
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

// ===== filters =====
function renderChips(q, type, sort) {
  if (!elChips || !elMeta) return;

  const chips = [];
  if (q) chips.push(`Zoek: ${escapeHtml(q)}`);
  if (type) chips.push(`Type: ${escapeHtml(type)}`);
  if (sort && sort !== 'relevance') {
    const map = {
      priceAsc: 'Prijs ↑',
      priceDesc: 'Prijs ↓',
      titleAsc: 'Titel A–Z'
    };
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

// ===== modal options =====
function updateOptionUI() {
  if (!currentProduct) return;

  const type = currentProduct.type || '';

  const optInstall = $('optInstall');
  const optInstallPrice = $('optInstallPrice');

  const optCoverliftRow = $('optCoverliftRow');
  const optCoverlift = $('optCoverlift');
  const optCoverliftTotal = $('optCoverliftTotal');

  const optMaint = $('optMaint');
  const optMaintTotal = $('optMaintTotal');

  const optFilter = $('optFilter');
  const optFilterTotal = $('optFilterTotal');

  const optSwimFiltersetRow = $('optSwimFiltersetRow');
  const optSwimFiltersetQty = $('optSwimFiltersetQty');
  const optSwimFiltersetTotal = $('optSwimFiltersetTotal');

  const tProduct = $('optProductTotal');
  const tOptions = $('optOptionsTotal');
  const tGrand = $('optGrandTotal');

  const inst = installCost(type);

  if (optInstallPrice) {
    optInstallPrice.textContent = euro(inst);
  }

  const allowCoverlift = coverliftAllowed(type);
  if (optCoverliftRow) optCoverliftRow.style.display = allowCoverlift ? '' : 'none';
  if (!allowCoverlift && optCoverlift) optCoverlift.checked = false;

  const swim = isSwimspa(type);
  if (optSwimFiltersetRow) optSwimFiltersetRow.style.display = swim ? '' : 'none';
  if (!swim && optSwimFiltersetQty) optSwimFiltersetQty.value = '0';

  const installSelected = !!optInstall?.checked;
  const coverliftSelected = allowCoverlift ? !!optCoverlift?.checked : false;
  const maintSelected = !!optMaint?.checked;
  const filterSelected = !!optFilter?.checked;
  const swimFiltersetQty = swim ? readInt(optSwimFiltersetQty) : 0;

  const installLine = installSelected ? inst : 0;
  const coverliftLine = coverliftSelected ? PRICES.coverlift_unit : 0;
  const maintLine = maintSelected ? PRICES.maintenance_unit : 0;
  const filterLine = filterSelected ? PRICES.filter_unit : 0;
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

function wireOptionHandlers() {
  const ids = [
    'optInstall',
    'optCoverlift',
    'optMaint',
    'optFilter',
    'optSwimFiltersetQty'
  ];

  ids.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', updateOptionUI);
    el.addEventListener('change', updateOptionUI);
  });

  const btnAdd = $('btnAddToOffer');
  if (btnAdd) {
    btnAdd.onclick = () => {
      if (!currentProduct) return;

      const type = currentProduct.type || '';
      const inst = installCost(type);
      const allowCoverlift = coverliftAllowed(type);
      const swim = isSwimspa(type);

      const payload = {
        productId: currentProduct.id,
        title: currentProduct.title,
        type: currentProduct.type || '',
        url: currentProduct.url || '',
        image: currentProduct.image || '',
        unit_price: Number(currentProduct.price || 0),
        options: {
          install: !!$('optInstall')?.checked,
          install_price: inst,

          cover_trap_included: true,
          cover_trap_price: 0,

          coverlift: allowCoverlift ? !!$('optCoverlift')?.checked : false,
          coverlift_unit: PRICES.coverlift_unit,

          maintenance: !!$('optMaint')?.checked,
          maintenance_unit: PRICES.maintenance_unit,

          extra_filter: !!$('optFilter')?.checked,
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

function afterOpenModal(p) {
  currentProduct = p;

  const install = $('optInstall');
  if (install) install.checked = true;

  const coverlift = $('optCoverlift');
  if (coverlift) coverlift.checked = false;

  const maint = $('optMaint');
  if (maint) maint.checked = false;

  const filter = $('optFilter');
  if (filter) filter.checked = false;

  const swimFiltersetQty = $('optSwimFiltersetQty');
  if (swimFiltersetQty) swimFiltersetQty.value = '0';

  wireOptionHandlers();
  updateOptionUI();
}

// ===== modal =====
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

// ===== render =====
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

    const link = node.querySelector('[data-link]');
    if (link) {
      link.href = '#';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(p);
      });
    }

    const openBtn = node.querySelector('[data-open]');
    if (openBtn) {
      openBtn.addEventListener('click', () => openModal(p));
    } else {
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

async function init() {
  if (elStatus) elStatus.textContent = 'Laden…';

  products = await loadProducts({ force: false });
  buildTypeFilter(products);
  applyFilters();

  if (elStatus) elStatus.textContent = `OK • ${products.length} producten`;
}

// ===== events =====
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

if (elSync) {
  elSync.addEventListener('click', async () => {
    elSync.disabled = true;
    elSync.textContent = '⏳ Bezig…';
    if (elStatus) elStatus.textContent = 'Synchroniseren…';

    try {
      products = await loadProducts({ force: true });
      buildTypeFilter(products);
      applyFilters();
      if (elStatus) elStatus.textContent = `OK • ${products.length} producten`;
    } catch (e) {
      console.error(e);
      if (elStatus) elStatus.textContent = 'Fout';
      showError(String(e.message || e));
    } finally {
      elSync.disabled = false;
      elSync.textContent = '🔄 Synchroniseren';
    }
  });
}

init().catch(e => {
  console.error(e);
  if (elStatus) elStatus.textContent = 'Fout';
  showError(String(e.message || e));
});
