// Sunspa catalogus - overzichtspagina
// Klik op een product gaat naar product.html?id=PRODUCT_ID

const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

// --- Catalog refs
const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const elSearch = document.getElementById('search');
const elType = document.getElementById('typeFilter');
const elMerk = document.getElementById('merkFilter');
const personenFilter = document.getElementById('personenFilter');
const personenField = document.getElementById('personenField');
const elSort = document.getElementById('sort');
const elClear = document.getElementById('btnClear');

const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');
const resultMeta = document.getElementById('resultMeta');
const activeChips = document.getElementById('activeChips');

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

function getShowrooms(p) {
  const value = p?.showroom || p?.showrooms || getSpecValue(p, 'Showroom') || '';

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  return [];
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

function getSpecValue(p, label) {
  const specs = p?.specs;

  if (!specs) return '';

  // Geval 1: specs is een array
  if (Array.isArray(specs)) {
    const found = specs.find(s => normalize(s?.label) === normalize(label));
    return found?.value || '';
  }

  // Geval 2: specs is een object
  if (typeof specs === 'object') {
    const key = Object.keys(specs).find(k => normalize(k) === normalize(label));
    return key ? specs[key] : '';
  }

  return '';
}

function getMerk(p) {
  return (
    p?.brand ||
    p?.merk ||
    getSpecValue(p, 'Merk') ||
    ''
  );
}

function getAantalPersonen(p) {
  return (
    getSpecValue(p, 'Aantal personen') ||
    getSpecValue(p, 'Aantal zitplaatsen') ||
    getSpecValue(p, 'Zitplaatsen') ||
    ''
  );
}

function buildTypeFilter(items) {
  if (!elType) return;

  const currentValue = elType.value || '';

  const types = Array.from(
    new Set(
      items
        .map(p => (p?.type ?? '').toString().trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'nl'));

  elType.innerHTML =
    '<option value="">Alle types</option>' +
    types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');

  if (types.includes(currentValue)) {
    elType.value = currentValue;
  }
}

function buildMerkFilter(items) {
  if (!elMerk) return;

  const currentValue = elMerk.value || '';

  const merken = Array.from(
    new Set(
      items
        .map(p => getMerk(p))
        .map(m => (m ?? '').toString().trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'nl'));

  elMerk.innerHTML =
    '<option value="">Alle merken</option>' +
    merken.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');

  if (merken.includes(currentValue)) {
    elMerk.value = currentValue;
  }
}

if (product.merk?.toLowerCase() === "bullfrog") {
  document.querySelectorAll('.options, .Totals').forEach(el => {
    el.style.display = 'none';
  });
}

function buildPersonenFilter(items) {
  if (!personenFilter || !personenField) return;

  const selectedType = elType ? normalize(elType.value) : '';
  const isSpaSelected = selectedType === 'spa' || selectedType === "spa's";

  if (!isSpaSelected) {
    personenFilter.innerHTML = '<option value="">Alle aantallen personen</option>';
    personenFilter.value = '';
    personenField.style.display = 'none';
    return;
  }

  const currentValue = personenFilter.value || '';

  const personen = Array.from(
    new Set(
      items
        .filter(p => {
          const type = normalize(p?.type);
          return type === 'spa' || type === "spa's";
        })
        .map(p => getAantalPersonen(p))
        .map(v => (v ?? '').toString().trim())
        .filter(Boolean)
    )
  ).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);

    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      return na - nb;
    }

    return a.localeCompare(b, 'nl');
  });

  personenFilter.innerHTML =
    '<option value="">Alle aantallen personen</option>' +
    personen.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');

  personenField.style.display = '';

  if (personen.includes(currentValue)) {
    personenFilter.value = currentValue;
  }
}

function productSearchBlob(p) {
  const bullets = Array.isArray(p?.bullets) ? p.bullets.join(' | ') : '';

  let specText = '';

  if (Array.isArray(p?.specs)) {
    specText = p.specs.map(s => `${s.label}: ${s.value}`).join(' | ');
  } else if (p?.specs && typeof p.specs === 'object') {
    specText = Object.entries(p.specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
  }

  return normalize([
    p?.title,
    p?.type,
    getMerk(p),
    bullets,
    specText
  ].join(' '));
}

function topSpecs(p) {
  const want = ['Merk', 'Afmetingen', 'Aantal personen', 'Aantal zitplaatsen', 'Aantal ligplaatsen', 'Aantal jets'];
  const picked = [];

  for (const key of want) {
    const value = key === 'Merk' ? getMerk(p) : getSpecValue(p, key);
    if (value) {
      picked.push(`${escapeHtml(key)}: ${escapeHtml(value)}`);
    }
  }

  if (!picked.length) {
    if (Array.isArray(p?.specs)) {
      for (const s of p.specs.slice(0, 3)) {
        picked.push(`${escapeHtml(s.label)}: ${escapeHtml(s.value)}`);
      }
    } else if (p?.specs && typeof p.specs === 'object') {
      for (const [key, value] of Object.entries(p.specs).slice(0, 3)) {
        picked.push(`${escapeHtml(key)}: ${escapeHtml(value)}`);
      }
    }
  }

  return picked.slice(0, 4).join('<br>');
}

function getProductUrl(p) {
  const id = encodeURIComponent(p?.id || '');
  return `product.html?id=${id}`;
}

function updateMeta() {
  if (!resultMeta) return;
  resultMeta.textContent = `${filtered.length} producten`;
}

function renderActiveChips() {
  if (!activeChips) return;

  const chips = [];

  if (elType?.value) chips.push(`Type: ${elType.value}`);
  if (elMerk?.value) chips.push(`Merk: ${elMerk.value}`);
  if (personenFilter?.value) chips.push(`Personen: ${personenFilter.value}`);
  if (elSearch?.value) chips.push(`Zoek: ${elSearch.value}`);

  activeChips.innerHTML = chips
    .map(c => `<span class="chip">${escapeHtml(c)}</span>`)
    .join('');
}

function applyFilters() {
  const q = elSearch ? normalize(elSearch.value) : '';
  const type = elType ? elType.value : '';
  const merk = elMerk ? elMerk.value : '';
  const personen = personenFilter ? personenFilter.value : '';
  const sort = elSort ? elSort.value : 'relevance';

  buildPersonenFilter(products);

  filtered = products.filter(p => {
    if (type && p.type !== type) return false;

    if (merk) {
      const productMerk = getMerk(p);
      if (productMerk !== merk) return false;
    }

    if (personen) {
      const productPersonen = getAantalPersonen(p);
      if (productPersonen !== personen) return false;
    }

    if (q && !productSearchBlob(p).includes(q)) return false;

    return true;
  });

  if (sort === 'priceAsc') {
    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === 'priceDesc') {
    filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sort === 'titleAsc') {
    filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'nl'));
  }

  renderGrid();
  updateMeta();
  renderActiveChips();
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
    const showroomBadge = node.querySelector('[data-showroom]');
    const title = node.querySelector('[data-title]');
    const price = node.querySelector('[data-price]');
    const specs = node.querySelector('[data-specs]');

    const showrooms = getShowrooms(p);

if (showroomBadge) {
  if (showrooms.length) {
    showroomBadge.textContent = `📍 ${showrooms.join(' • ')}`;
    showroomBadge.style.display = '';
  } else {
    showroomBadge.style.display = 'none';
  }
}

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
  buildMerkFilter(products);
  buildPersonenFilter(products);
  applyFilters();
}

if (elSearch) elSearch.addEventListener('input', applyFilters);

if (elType) {
  elType.addEventListener('change', () => {
    if (personenFilter) personenFilter.value = '';
    applyFilters();
  });
}

if (elMerk) {
  elMerk.addEventListener('change', applyFilters);
}

if (personenFilter) {
  personenFilter.addEventListener('change', applyFilters);
}

if (elSort) {
  elSort.addEventListener('change', applyFilters);
}

if (elClear) {
  elClear.addEventListener('click', () => {
    if (elSearch) elSearch.value = '';
    if (elType) elType.value = '';
    if (elMerk) elMerk.value = '';
    if (personenFilter) personenFilter.value = '';
    if (elSort) elSort.value = 'relevance';
    applyFilters();
  });
}

init().catch(e => {
  console.error(e);
  showError(String(e.message || e));
});
