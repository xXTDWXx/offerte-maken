const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');
const resultMeta = document.getElementById('resultMeta');
const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');

const maxLengthInput = document.getElementById('maxLength');
const maxWidthInput = document.getElementById('maxWidth');
const unitSelect = document.getElementById('unit');
const brandFilter = document.getElementById('brandFilter');
const sortFilter = document.getElementById('sort');
const btnClear = document.getElementById('btnClear');
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

function getProductUrl(p) {
  const id = encodeURIComponent(p?.id || '');
  return `product.html?id=${id}`;
}

function topSpecs(p, dims) {
  const lines = [];

  if (getMerk(p)) lines.push(`Merk: ${escapeHtml(getMerk(p))}`);
  if (getSpecValue(p, 'Afmetingen')) lines.push(`Afmetingen: ${escapeHtml(getSpecValue(p, 'Afmetingen'))}`);
  if (getSpecValue(p, 'Aantal personen')) lines.push(`Aantal personen: ${escapeHtml(getSpecValue(p, 'Aantal personen'))}`);
  if (getSpecValue(p, 'Aantal jets')) lines.push(`Aantal jets: ${escapeHtml(getSpecValue(p, 'Aantal jets'))}`);

  if (dims?.lengthCm && dims?.widthCm) {
    lines.push(`Past binnen: ${dims.lengthCm} × ${dims.widthCm} cm`);
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

function toCm(value, unit) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === 'm' ? n * 100 : n;
}

/**
 * Probeert afmetingen uit tekst te halen.
 * Voorbeelden die werken:
 * - 200 x 200 x 90 cm
 * - 200x200 cm
 * - 2,00 x 2,00 m
 * - 230 x 210
 */
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

function fitsInSpace(productDims, maxLengthCm, maxWidthCm) {
  if (!productDims) return false;
  if (!maxLengthCm || !maxWidthCm) return true;

  const spaceLong = Math.max(maxLengthCm, maxWidthCm);
  const spaceShort = Math.min(maxLengthCm, maxWidthCm);

  return (
    productDims.lengthCm <= spaceLong &&
    productDims.widthCm <= spaceShort
  );
}

function getUnusedSpaceScore(productDims, maxLengthCm, maxWidthCm) {
  if (!productDims || !maxLengthCm || !maxWidthCm) return Number.MAX_SAFE_INTEGER;

  const spaceLong = Math.max(maxLengthCm, maxWidthCm);
  const spaceShort = Math.min(maxLengthCm, maxWidthCm);

  return (spaceLong - productDims.lengthCm) + (spaceShort - productDims.widthCm);
}

function sortProducts(items, maxLengthCm, maxWidthCm) {
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

      const scoreA = getUnusedSpaceScore(da, maxLengthCm, maxWidthCm);
      const scoreB = getUnusedSpaceScore(db, maxLengthCm, maxWidthCm);

      return scoreA - scoreB;
    });
  }

  return items;
}

function updateChips(maxLengthCm, maxWidthCm) {
  if (!activeChips) return;

  const chips = [];
  const brand = brandFilter?.value || '';
  const unit = unitSelect?.value || 'cm';

  if (maxLengthCm && maxWidthCm) {
    if (unit === 'm') {
      chips.push(`<span class="chip">Ruimte: ${escapeHtml(String(maxLengthCm / 100))} × ${escapeHtml(String(maxWidthCm / 100))} m</span>`);
    } else {
      chips.push(`<span class="chip">Ruimte: ${escapeHtml(String(maxLengthCm))} × ${escapeHtml(String(maxWidthCm))} cm</span>`);
    }
  }

  if (brand) {
    chips.push(`<span class="chip">Merk: ${escapeHtml(brand)}</span>`);
  }

  const sort = sortFilter?.value || 'fitBest';
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

function renderGrid(maxLengthCm, maxWidthCm) {
  if (!elGrid || !tpl) return;

  elGrid.innerHTML = '';

  if (!filtered.length) {
    elGrid.innerHTML = `
      <div class="panel">
        <div class="panel-title">Geen passende spa’s gevonden</div>
        <div class="small">Vergroot de beschikbare afmetingen of pas je merkfilter aan.</div>
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

    if (badge) badge.textContent = dims ? `${dims.lengthCm}×${dims.widthCm} CM` : (p.type || '').toUpperCase();
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
  const maxLengthCm = toCm(maxLengthInput?.value, unitSelect?.value || 'cm');
  const maxWidthCm = toCm(maxWidthInput?.value, unitSelect?.value || 'cm');
  const selectedBrand = brandFilter?.value || '';

  filtered = products.filter(p => {
    if (normalize(p.type) !== 'spa') return false;

    const dims = getProductDimensions(p);
    if (!dims) return false;

    const matchBrand = !selectedBrand || normalize(getMerk(p)) === normalize(selectedBrand);
    const matchSize = fitsInSpace(dims, maxLengthCm, maxWidthCm);

    return matchBrand && matchSize;
  });

  filtered = sortProducts([...filtered], maxLengthCm, maxWidthCm);

  updateChips(maxLengthCm, maxWidthCm);
  updateMeta();
  renderGrid(maxLengthCm, maxWidthCm);
}

function clearFilters() {
  if (maxLengthInput) maxLengthInput.value = '';
  if (maxWidthInput) maxWidthInput.value = '';
  if (unitSelect) unitSelect.value = 'cm';
  if (brandFilter) brandFilter.value = '';
  if (sortFilter) sortFilter.value = 'fitBest';
  filterProducts();
}

function bindEvents() {
  maxLengthInput?.addEventListener('input', filterProducts);
  maxWidthInput?.addEventListener('input', filterProducts);
  unitSelect?.addEventListener('change', filterProducts);
  brandFilter?.addEventListener('change', filterProducts);
  sortFilter?.addEventListener('change', filterProducts);
  btnClear?.addEventListener('click', clearFilters);
}

function showError(msg) {
  if (!errorBox || !errorText) return;
  errorBox.style.display = '';
  errorText.textContent = msg;
}

async function init() {
  products = await loadProducts();
  bindEvents();
  filterProducts();
}

init().catch(e => {
  console.error(e);
  showError(String(e.message || e));
});
