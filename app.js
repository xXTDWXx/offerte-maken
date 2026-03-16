// Sunspa catalogus + productfiche modal + offerte-opties

const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();
const OFFER_KEY = 'sunspa_offer_v1';

// --- Catalog refs
const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const elSearch = document.getElementById('search');
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

function euro(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR'
  }).format(x);
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

async function loadProducts() {
  const res = await fetch(PRODUCTS_URL);
  if (!res.ok) throw new Error(`Kan products.json niet laden (${res.status})`);
  const json = await res.json();

  const items = Array.isArray(json) ? json : (json.products || []);
  if (!Array.isArray(items)) return [];
  return items;
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

  const specText = (p.specs || [])
    .map(s => `${s.label}: ${s.value}`)
    .join(' | ');

  const bullets = (p.bullets || []).join(' | ');

  return normalize([
    p.title,
    p.type,
    bullets,
    specText
  ].join(' '));
}

function topSpecs(p) {

  const want = [
    'Afmetingen',
    'Aantal zitplaatsen',
    'Aantal ligplaatsen',
    'Aantal jets'
  ];

  const specs = Array.isArray(p.specs) ? p.specs : [];

  const picked = [];

  for (const key of want) {

    const found = specs.find(
      s => normalize(s.label) === normalize(key)
    );

    if (found) {
      picked.push(`${escapeHtml(found.label)}: ${escapeHtml(found.value)}`);
    }

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

  if (!specs.length) {
    return '<div class="small">Geen specificaties beschikbaar.</div>';
  }

  return specs.map(s => `
    <div class="spec-row">
      <strong>${escapeHtml(s.label || '')}</strong>
      <span>${escapeHtml(s.value || '')}</span>
    </div>
  `).join('');
}

function applyFilters() {

  const q = elSearch ? normalize(elSearch.value) : '';
  const type = elType ? elType.value : '';
  const sort = elSort ? elSort.value : 'relevance';

  filtered = products.filter(p => {

    if (type && p.type !== type) return false;

    if (q) {
      return productSearchBlob(p).includes(q);
    }

    return true;
  });

  if (sort === 'priceAsc') {
    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  }

  if (sort === 'priceDesc') {
    filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  if (sort === 'titleAsc') {
    filtered.sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', 'nl')
    );
  }

  renderGrid();
}

function openModal(p) {

  if (!modal) return;

  currentProduct = p;

  if (modalTitle) modalTitle.textContent = p.title || '—';
  if (modalPrice) modalPrice.textContent = `Prijs: ${euro(p.price || 0)}`;
  if (modalType) modalType.textContent = (p.type || '').toUpperCase();

  if (modalImg) {
    modalImg.src = p.image || '';
    modalImg.alt = p.title || 'Product';
  }

  if (modalSpecs) modalSpecs.innerHTML = specTableHtml(p);

  if (modalUrl) {
    modalUrl.href = p.url || '#';
  }

  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {

  if (!modal) return;

  modal.setAttribute('aria-hidden', 'true');
}

function renderGrid() {

  if (!elGrid || !tpl) return;

  elGrid.innerHTML = '';

  const frag = document.createDocumentFragment();

  for (const p of filtered) {

    const node = tpl.content.cloneNode(true);

    const img = node.querySelector('.card-img');
    if (img) img.src = p.image || '';

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

  products = await loadProducts();

  buildTypeFilter(products);

  applyFilters();
}

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

init().catch(e => {

  console.error(e);
  showError(String(e.message || e));

});
