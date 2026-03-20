// Sunspa catalogus - overzichtspagina
// Klik op een product gaat naar product.html?id=PRODUCT_ID

const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

// --- Catalog refs
const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const elSearch = document.getElementById('search');
const elType = document.getElementById('typeFilter');
const afmetingFilter = document.getElementById('afmetingFilter');
const elSort = document.getElementById('sort');
const elClear = document.getElementById('btnClear');

const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');
const resultMeta = document.getElementById('resultMeta');

let products = [];
let filtered = [];

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

async function loadProducts({ force = false } = {}) {
  const url = force ? `${PRODUCTS_URL}?t=${Date.now()}` : PRODUCTS_URL;
  const res = await fetch(url, { cache: force ? 'no-store' : 'default' });

  if (!res.ok) {
    throw new Error(`Kan products.json niet laden (${res.status})`);
  }

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

function getSpecValue(p, label) {
  const specs = Array.isArray(p.specs) ? p.specs : [];
  const found = specs.find(s => normalize(s.label) === normalize(label));
  return found?.value || '';
}

function buildAfmetingFilter(items) {
  if (!afmetingFilter) return;

  const selectedType = elType ? elType.value : '';
  const isSpaSelected = normalize(selectedType) === 'spa';

  if (!isSpaSelected) {
    afmetingFilter.innerHTML = '<option value="">Alle afmetingen</option>';
    afmetingFilter.value = '';
    afmetingFilter.style.display = 'none';
    return;
  }

  const afmetingen = Array.from(
    new Set(
      items
        .filter(p => normalize(p.type) === 'spa')
        .map(p => getSpecValue(p, 'Afmetingen'))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'nl'));

  afmetingFilter.innerHTML =
    '<option value="">Alle afmetingen</option>' +
    afmetingen.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');

  afmetingFilter.style.display = '';
}

function productSearchBlob(p) {
  const specText = (Array.isArray(p.specs) ? p.specs : [])
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
  const want = ['Afmetingen', 'Aantal zitplaatsen', 'Aantal ligplaatsen', 'Aantal jets'];
  const specs = Array.isArray(p.specs) ? p.specs : [];
  const picked = [];

  for (const key of want) {
    const found = specs.find(s => normalize(s.label) === normalize(key));
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

function getProductUrl(p) {
  const id = encodeURIComponent(p.id || '');
  return `product.html?id=${id}`;
}

function updateMeta() {
  if (!resultMeta) return;
  resultMeta.textContent = `${filtered.length} producten`;
}

function applyFilters() {
  const q = elSearch ? normalize(elSearch.value) : '';
  const type = elType ? elType.value : '';
  const afmeting = afmetingFilter ? afmetingFilter.value : '';
  const sort = elSort ? elSort.value : 'relevance';

  buildAfmetingFilter(products);

  filtered = products.filter(p => {
    if (type && p.type !== type) return false;

    if (afmeting) {
      const productAfmeting = getSpecValue(p, 'Afmetingen');
      if (productAfmeting !== afmeting) return false;
    }

    if (q) return productSearchBlob(p).includes(q);
    return true;
  });

  if (sort === 'priceAsc') {
    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  }

  if (sort === 'priceDesc') {
    filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  if (sort === 'titleAsc') {
    filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'nl'));
  }

  renderGrid();
  updateMeta();
}

function renderGrid() {
  if (!elGrid || !tpl) return;

  elGrid.innerHTML = '';
  const frag = document.createDocumentFragment();

  for (const p of filtered) {
    const node = tpl.content.cloneNode(true);

    const cardLink = node.querySelector('[data-open]');
    const img = node.querySelector('.card-img');
    const badge = node.querySelector('[data-badge]');
    const title = node.querySelector('[data-title]');
    const price = node.querySelector('[data-price]');
    const specs = node.querySelector('[data-specs]');

    if (img) {
      img.src = p.image || '';
      img.alt = p.title || 'Product';
      img.onerror = () => {
        img.style.display = 'none';
      };
    }

    if (badge) badge.textContent = (p.type || '').toUpperCase();
    if (title) title.textContent = p.title || '';
    if (price) price.textContent = euro(p.price || 0);
    if (specs) specs.innerHTML = topSpecs(p);

    if (cardLink) {
      cardLink.setAttribute('type', 'button');
      cardLink.addEventListener('click', () => {
        window.location.href = getProductUrl(p);
      });
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
  buildTypeFilter(products);
  buildAfmetingFilter(products);
  applyFilters();
}

if (elSearch) elSearch.addEventListener('input', applyFilters);

if (elType) {
  elType.addEventListener('change', () => {
    if (afmetingFilter) afmetingFilter.value = '';
    applyFilters();
  });
}

if (afmetingFilter) {
  afmetingFilter.addEventListener('change', applyFilters);
}

if (elSort) elSort.addEventListener('change', applyFilters);

if (elClear) {
  elClear.addEventListener('click', () => {
    if (elSearch) elSearch.value = '';
    if (elType) elType.value = '';
    if (afmetingFilter) afmetingFilter.value = '';
    if (elSort) elSort.value = 'relevance';
    applyFilters();
  });
}

init().catch(e => {
  console.error(e);
  showError(String(e.message || e));
});
