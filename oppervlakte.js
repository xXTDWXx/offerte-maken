const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');
const resultMeta = document.getElementById('resultMeta');
const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');

const spaceSelect = document.getElementById('spaceSelect');
const brandFilter = document.getElementById('brandFilter');
const sortFilter = document.getElementById('sort');
const btnClear = document.getElementById('btnClear');
const activeChips = document.getElementById('activeChips');

let products = [];
let filtered = [];

const SPACE_OPTIONS = {
  '160x215': { lengthCm: 215, widthCm: 160, label: '160 x 215 cm' },
  '205x205': { lengthCm: 205, widthCm: 205, label: '205 x 205 cm' },
  '215x215': { lengthCm: 215, widthCm: 215, label: '215 x 215 cm' },
  '230x230': { lengthCm: 230, widthCm: 230, label: '230 x 230 cm' },
  '250x250': { lengthCm: 250, widthCm: 250, label: '250 x 250 cm' },
  '300x300': { lengthCm: 300, widthCm: 300, label: '300 x 300 cm' }
};

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

function getSpecValue(p, label) {
  const specs = p?.specs;

  if (!specs) return '';

  if (Array.isArray(specs)) {
    const found = specs.find(s => normalize(s?.label) === normalize(label));
    return found?.value || '';
  }

  if (typeof specs === 'object') {
    const key = Object.keys(specs).find(k => normalize(k) === normalize(label));
    return key ? specs[key] : '';
  }

  return '';
}

function getMerk(p) {
  return p?.brand || p?.merk || getSpecValue(p, 'Merk') || '';
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

function getProductUrl(p) {
  const id = encodeURIComponent(p?.id || '');
  return `product.html?id=${id}`;
}

function parseDimensionsToCm(raw) {
  const text = normalize(raw)
    .replaceAll(',', '.')
    .replace(/\s+/g, ' ');

  if (!text) return null;

  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => Number(m[1]));
  if (matches.length < 2) return null;

  let [a, b] = matches;

  const usesMeters = text.includes(' m') || text.endsWith('m') || text.includes('meter');
  const looksLikeMeters = a <= 10 && b <= 10;

  if (usesMeters || looksLikeMeters) {
    a = a * 1;
    b = b * 1;
  }

  a = Math.round(a);
  b = Math.round(b);

  if (!a || !b) return null;

  return {
    lengthCm: Math.max(a, b),
    widthCm: Math.min(a, b),
    raw
  };
}

function getProductDimensions(p) {
  const fromSpec = getSpecValue(p, 'Afmetingen');
  return parseDimensionsToCm(fromSpec);
}

function getLigplaatsen(product) {
  const spec = (product.specs || []).find(
    s => s.label.toLowerCase().includes('ligplaatsen')
  );

  if (!spec) return 0;

  const match = spec.value.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getSelectedSpace() {
  const key = spaceSelect?.value || '';
  return SPACE_OPTIONS[key] || null;
}

function fitsInSpace(productDims, selectedSpace) {
  if (!productDims || !selectedSpace) return false;

  return (
    productDims.lengthCm <= selectedSpace.lengthCm &&
    productDims.widthCm <= selectedSpace.widthCm
  );
}

function getUnusedSpaceScore(productDims, selectedSpace) {
  if (!productDims || !selectedSpace) return Number.MAX_SAFE_INTEGER;

  return (
    (selectedSpace.lengthCm - productDims.lengthCm) +
    (selectedSpace.widthCm - productDims.widthCm)
  );
}

function sortProducts(items, selectedSpace) {
  const sort = sortFilter?.value || 'fitBest';

  if (sort === 'priceAsc') {
    items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (sort === 'priceDesc') {
    items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else if (sort === 'titleAsc') {
    items.sort((a, b) => normalize(a.title).localeCompare(normalize(b.title)));
  } else if (sort === 'sizeAsc') {
    items.sort((a, b) => {
      const da = getProductDimensions(a);
      const db = getProductDimensions(b);
      const areaA = da ? da.lengthCm * da.widthCm : Number.MAX_SAFE_INTEGER;
      const areaB = db ? db.lengthCm * db.widthCm : Number.MAX_SAFE_INTEGER;
      return areaA - areaB;
    });
  } else if (sort === 'sizeDesc') {
    items.sort((a, b) => {
      const da = getProductDimensions(a);
      const db = getProductDimensions(b);
      const areaA = da ? da.lengthCm * da.widthCm : -1;
      const areaB = db ? db.lengthCm * db.widthCm : -1;
      return areaB - areaA;
    });
  } else {
    items.sort((a, b) => {
      const da = getProductDimensions(a);
      const db = getProductDimensions(b);
      return getUnusedSpaceScore(da, selectedSpace) - getUnusedSpaceScore(db, selectedSpace);
    });
  }

  return items;
}

function topSpecs(p, dims) {
  const lines = [];

  if (getMerk(p)) lines.push(`Merk: ${escapeHtml(getMerk(p))}`);
  if (getSpecValue(p, 'Afmetingen')) lines.push(`Afmetingen: ${escapeHtml(getSpecValue(p, 'Afmetingen'))}`);
  if (getSpecValue(p, 'Aantal personen')) lines.push(`Aantal personen: ${escapeHtml(getSpecValue(p, 'Aantal personen'))}`);
  if (getSpecValue(p, 'Aantal jets')) lines.push(`Aantal jets: ${escapeHtml(getSpecValue(p, 'Aantal jets'))}`);

  if (dims?.lengthCm && dims?.widthCm) {
    lines.push(`Formaat: ${dims.widthCm} x ${dims.lengthCm} cm`);
  }

  return lines.slice(0, 5).join('<br>');
}

async function loadProducts() {
  const res = await fetch(PRODUCTS_URL);

  if (!res.ok) {
    throw new Error(`Kan products.json niet laden (${res.status})`);
  }

  const json = await res.json();
  const items = Array.isArray(json) ? json : (json.products || []);
  return Array.isArray(items) ? items : [];
}

function updateChips(selectedSpace) {
  if (!activeChips) return;

  const chips = [];
  const brand = brandFilter?.value || '';
  const sort = sortFilter?.value || 'fitBest';

  if (selectedSpace) {
    chips.push(`<span class="chip">Ruimte: ${escapeHtml(selectedSpace.label)}</span>`);
  }

  if (brand) {
    chips.push(`<span class="chip">Merk: ${escapeHtml(brand)}</span>`);
  }

  const sortLabels = {
    fitBest: 'Beste match',
    priceAsc: 'Prijs laag → hoog',
    priceDesc: 'Prijs hoog → laag',
    titleAsc: 'Titel A → Z',
    sizeAsc: 'Kleinste eerst',
    sizeDesc: 'Grootste eerst'
  };

  chips.push(`<span class="chip">Sortering: ${escapeHtml(sortLabels[sort] || sort)}</span>`);

  activeChips.innerHTML = chips.join('');
}

function updateMeta() {
  if (!resultMeta) return;
  resultMeta.textContent = `${filtered.length} spa’s gevonden`;
}

function renderGrid() {
  if (!elGrid || !tpl) return;

  elGrid.innerHTML = '';

  if (!spaceSelect?.value) {
    elGrid.innerHTML = `
      <div class="panel">
        <div class="panel-title">Kies eerst een afmeting</div>
        <div class="small">Selecteer hierboven de beschikbare ruimte om passende spa’s te bekijken.</div>
      </div>
    `;
    return;
  }

  if (!filtered.length) {
    elGrid.innerHTML = `
      <div class="panel">
        <div class="panel-title">Geen passende spa’s gevonden</div>
        <div class="small">Kies een grotere afmeting of pas het merk aan.</div>
      </div>
    `;
    return;
  }

  const frag = document.createDocumentFragment();

  for (const p of filtered) {
    const dims = getProductDimensions(p);
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

    if (badge) {
      badge.textContent = dims
        ? `${dims.widthCm} x ${dims.lengthCm} cm`
        : (p.type || '').toUpperCase();
    }

    if (title) title.textContent = p.title || '';
    if (price) price.textContent = euro(p.price || 0);
    if (specs) specs.innerHTML = topSpecs(p, dims);

    if (cardLink) {
      cardLink.addEventListener('click', () => {
        window.location.href = getProductUrl(p);
      });
    }

    frag.appendChild(node);
  }

  elGrid.appendChild(frag);
}

function filterProducts() {
  const selectedSpace = getSelectedSpace();
  const selectedBrand = brandFilter?.value || '';

  if (!selectedSpace) {
    filtered = [];
    updateChips(null);
    updateMeta();
    renderGrid();
    return;
  }

  filtered = products.filter(p => {
    if (normalize(p.type) !== 'spa') return false;

    const dims = getProductDimensions(p);
    if (!dims) return false;

    const matchBrand = !selectedBrand || normalize(getMerk(p)) === normalize(selectedBrand);
    const matchSize = fitsInSpace(dims, selectedSpace);

    return matchBrand && matchSize;
  });

  filtered = sortProducts([...filtered], selectedSpace);

  updateChips(selectedSpace);
  updateMeta();
  renderGrid();
}

function clearFilters() {
  if (spaceSelect) spaceSelect.value = '';
  if (brandFilter) brandFilter.value = '';
  if (sortFilter) sortFilter.value = 'fitBest';
  filterProducts();
}

function bindEvents() {
  spaceSelect?.addEventListener('change', filterProducts);
  brandFilter?.addEventListener('change', filterProducts);
  sortFilter?.addEventListener('change', filterProducts);
  document.getElementById('filterLigplaatsen')?.addEventListener('change', applyFilters);
  btnClear?.addEventListener('click', clearFilters);
}

function showError(msg) {
  if (!errorBox || !errorText) return;
  errorBox.style.display = '';
  errorText.textContent = msg;
}

const selectedLigplaatsen = document.getElementById('filterLigplaatsen')?.value;

filteredProducts = products.filter(product => {
  const ligplaatsen = getLigplaatsen(product);

  if (selectedLigplaatsen && ligplaatsen !== Number(selectedLigplaatsen)) {
    return false;
  }

  return true;
});

async function init() {
  products = await loadProducts();
  bindEvents();
  filterProducts();
}

init().catch(e => {
  console.error(e);
  showError(String(e.message || e));
});
