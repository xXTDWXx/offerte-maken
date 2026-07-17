const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();
const OVERKAPPING_URL = new URL('overkapping.json', document.baseURI).toString();

const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const resultMetaTop = document.getElementById('resultMetaTop');
const resultMetaBottom = document.getElementById('resultMetaBottom');
const pageTitle = document.getElementById('pageTitle');
const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');

const brandFilter = document.getElementById('brandFilter');
const searchInput = document.getElementById('search');
const sortFilter = document.getElementById('sort');
const filtersPanel = document.getElementById('filtersPanel');
const btnClear = document.getElementById('btnClear');
const activeChips = document.getElementById('activeChips');

let products = [];
let filtered = [];
let searchFrame = 0;

function getShowroomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('showroom') || '';
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

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalize(s) {
  return (s ?? '').toString().toLowerCase().trim();
}

function isProductVisible(product) {
  return product?.hidden !== true && product?.visible !== false;
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

function isMySpaBtwActionProduct(p) {
  const type = normalize(p?.type);
  const merk = normalize(getMerk(p));
  const title = normalize(p?.title);

  return (type === 'spa' || type === "spa's") && (merk.includes('myspa') || title.includes('myspa'));
}

function isVogueActionProduct(p) {
  const type = normalize(p?.type);
  const merk = normalize(getMerk(p));
  const title = normalize(p?.title);

  return (type === 'spa' || type === "spa's") && (merk.includes('vogue') || title.includes('vogue'));
}

function isBullfrogActionProduct(p) {
  return normalize(getMerk(p)).includes('bullfrog') || normalize(p?.title).includes('bullfrog');
}

function getProductSalePrice(p) {
  const salePrice = Number(p?.sale_price || 0);
  return Number.isFinite(salePrice) && salePrice > 0 ? roundCurrency(salePrice) : 0;
}

function getMySpaBtwAction(p, price = Number(p?.price || 0)) {
  const originalPrice = Number(price || 0);
  const salePrice = getProductSalePrice(p);

  if (originalPrice <= 0 || salePrice <= 0 || salePrice >= originalPrice) {
    return null;
  }

  return {
    originalPrice,
    actionPrice: salePrice,
    discount: roundCurrency(originalPrice - salePrice)
  };
}

function mySpaBtwActionLabel(p) {
  if (getProductSalePrice(p) > 0) {
    if (isBullfrogActionProduct(p)) {
      return window.SunspaI18n?.isFrench?.() ? 'Promotion Bullfrog' : 'Bullfrog actie';
    }

    if (isVogueActionProduct(p)) {
      return window.SunspaI18n?.isFrench?.() ? 'Promotion Vogue' : 'Vogue actie';
    }

    return window.SunspaI18n?.isFrench?.() ? 'Promotion stock' : 'Voorraadactie';
  }

  return window.SunspaI18n?.isFrench?.() ? 'Promotion' : 'Actie';
}

function discountLabel() {
  return window.SunspaI18n?.isFrench?.() ? 'Réduction' : 'Korting';
}

function productPriceHtml(p) {
  const action = getMySpaBtwAction(p);

  if (!action) {
    return escapeHtml(p.price_display || euro(p.price || 0));
  }

  return `
    <span class="price-action-label">${escapeHtml(mySpaBtwActionLabel(p))}</span>
    <span class="price-old">${escapeHtml(euro(action.originalPrice))}</span>
    <span class="price-current">${escapeHtml(euro(action.actionPrice))}</span>
    <span class="price-action-note">${escapeHtml(discountLabel())} ${escapeHtml(euro(action.discount))}</span>
  `;
}

function topSpecs(p) {
  const want = [
    'Merk',
    'Afmeting',
    'Producttype',
    'Kleur',
    'Breedte',
    'Diepte',
    'Aantal personen',
    'Zitplaatsen',
    'Ligplaatsen',
    'Aantal jets'
  ];

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
  const url = `product.html?id=${id}`;
  return window.SunspaI18n?.localizeUrl(url) || url;
}

async function fetchProductItems(url, label = 'producten') {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Kan ${label} niet laden (${res.status})`);
  }

  const json = await res.json();
  const items = Array.isArray(json) ? json : (json.products || []);
  return Array.isArray(items) ? items : [];
}

async function loadProducts() {
  const [catalogProducts, overkappingProducts] = await Promise.all([
    fetchProductItems(PRODUCTS_URL, 'products.json'),
    fetchProductItems(OVERKAPPING_URL, 'overkapping.json')
  ]);

  return [...catalogProducts, ...overkappingProducts].filter(isProductVisible);
}

function enrichProduct(product) {
  product._merk = getMerk(product);
  product._merkNorm = normalize(product._merk);
  product._titleNorm = normalize(product.title);
  product._searchBlob = productSearchBlob(product);
  product._topSpecs = topSpecs(product);
  product._showrooms = getShowrooms(product);
  product._showroomNorms = product._showrooms.map(s => normalize(s));
  return product;
}

function scheduleFilterProducts() {
  if (searchFrame) cancelAnimationFrame(searchFrame);
  searchFrame = requestAnimationFrame(() => {
    searchFrame = 0;
    filterProducts();
  });
}

function getParams() {
  return new URLSearchParams(window.location.search);
}

function getTypeFromUrl() {
  return getParams().get('type') || '';
}

function getBrandFromUrl() {
  return getParams().get('merk') || '';
}

function getSearchFromUrl() {
  return getParams().get('zoek') || '';
}

function getSortFromUrl() {
  return getParams().get('sort') || 'relevance';
}

function isSpaCategory(type) {
  return normalize(type) === 'spa';
}

function isOverkappingCategory(type) {
  const t = normalize(type);
  return t === 'overkapping' || t === 'overkappingen';
}

function productMatchesType(product, type) {
  if (!type) return true;

  if (isOverkappingCategory(type)) {
    return isOverkappingCategory(product?.type);
  }

  return normalize(product?.type) === normalize(type);
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

function getCategoryTitle(type) {
  const map = {
    Spa: 'SPA',
    Zwemspa: 'ZWEMSPA',
    Barrelsauna: 'BARRELSAUNA',
    Infrarood: 'INFRAROOD',
    'combi sauna': 'COMBI SAUNA',
    sauna: 'FINSE SAUNA',
    'sauna pod': 'SAUNA POD',
    overkapping: 'OVERKAPPINGEN',
    overkappingen: 'OVERKAPPINGEN'
  };

  return map[type] || type || 'Categorie';
}

function markActiveMenu(type) {
  const links = document.querySelectorAll('[data-category-link]');

  links.forEach(link => {
    const linkType = link.getAttribute('data-category-link') || '';
    link.classList.toggle('is-active', normalize(linkType) === normalize(type));
  });
}

function setElementVisible(el, visible) {
  if (!el) return;
  el.style.display = visible ? '' : 'none';
}

function setupFilterVisibility() {
  const currentType = getTypeFromUrl();
  const showBrandFilter = isSpaCategory(currentType);

  setElementVisible(filtersPanel, true);

  const brandField = brandFilter?.closest('.field');
  setElementVisible(brandField, showBrandFilter);
}

function loadFiltersFromUrl() {
  const currentType = getTypeFromUrl();
  const showBrandFilter = isSpaCategory(currentType);

  const brand = getBrandFromUrl();
  const search = getSearchFromUrl();
  const sort = getSortFromUrl();

  if (brandFilter) {
    brandFilter.value = showBrandFilter ? brand : '';
  }

  if (searchInput) {
    searchInput.value = search;
  }

  if (sortFilter) {
    sortFilter.value = sort;
  }
}

function updateUrlFromFilters() {
  const params = new URLSearchParams();
  const currentType = getTypeFromUrl();
  const showBrandFilter = isSpaCategory(currentType);

  const brand = showBrandFilter ? (brandFilter?.value || '') : '';
  const search = searchInput?.value || '';
  const sort = sortFilter?.value || 'relevance';

  if (window.SunspaI18n?.lang) {
    params.set('lang', window.SunspaI18n.lang);
  }

  if (currentType) params.set('type', currentType);
  if (brand && !search) params.set('merk', brand);
  if (search) params.set('zoek', search);

  if (sort && sort !== 'relevance') params.set('sort', sort);

  const query = params.toString();
  const newUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;

  window.history.replaceState({}, '', newUrl);
}

function sortProducts(items) {
  const sort = sortFilter?.value || 'relevance';

  if (sort === 'priceAsc') {
    items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (sort === 'priceDesc') {
    items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else if (sort === 'titleAsc') {
    items.sort((a, b) => normalize(a.title).localeCompare(normalize(b.title)));
  }

  return items;
}

function renderGrid() {
  if (!elGrid || !tpl) return;

  elGrid.innerHTML = '';

  if (!filtered.length) {
    elGrid.innerHTML = `
      <div class="panel">
        <div class="panel-title">Geen producten gevonden</div>
        <div class="small">Pas je filters of zoekterm aan.</div>
      </div>
    `;
    return;
  }

 

  const frag = document.createDocumentFragment();

  for (const p of filtered) {
    const node = tpl.content.cloneNode(true);

    const card = node.querySelector('.card');
    const cardLink = node.querySelector('[data-open]');
    const img = node.querySelector('.card-img');
    const badge = node.querySelector('[data-badge]');
    const showroomBadge = node.querySelector('[data-showroom]');
    const title = node.querySelector('[data-title]');
    const price = node.querySelector('[data-price]');
    const specs = node.querySelector('[data-specs]');

    const showrooms = p._showrooms || getShowrooms(p);

    if (card) {
      card.classList.toggle('card--overkapping', isOverkappingCategory(p?.type));
    }

if (showroomBadge) {
  if (showrooms.length) {
    showroomBadge.textContent = `📍 ${showrooms.join(' • ')}`;
    showroomBadge.style.display = '';
  } else {
    showroomBadge.style.display = 'none';
  }
}

    if (img) {
      img.decoding = 'async';
      img.src = p.image || '';
      img.alt = p.title || 'Product';
      img.onerror = () => {
        img.style.display = 'none';
      };
    }

    if (badge) badge.textContent = (p.type || '').toUpperCase();
    if (title) title.textContent = p.title || '';
    if (price) price.innerHTML = productPriceHtml(p);
    if (specs) specs.innerHTML = p._topSpecs || topSpecs(p);

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

function updateMeta() {
  const text = `${filtered.length} producten`;

  if (resultMetaTop) resultMetaTop.textContent = text;
  if (resultMetaBottom) resultMetaBottom.textContent = text;
}

function updateChips() {
  if (!activeChips) return;

  const currentType = getTypeFromUrl();
  const showBrandFilter = isSpaCategory(currentType);

  const chips = [];

  const brand = showBrandFilter ? (brandFilter?.value || '') : '';
  const search = searchInput?.value || '';
  const sort = sortFilter?.value || 'relevance';

  if (brand && !search) {
    chips.push(`<span class="chip">Merk: ${escapeHtml(brand)}</span>`);
  }

  if (search) {
    chips.push(`<span class="chip">Zoek: ${escapeHtml(search)}</span>`);
  }

  if (sort && sort !== 'relevance') {
    const sortLabels = {
      priceAsc: 'Prijs laag → hoog',
      priceDesc: 'Prijs hoog → laag',
      titleAsc: 'Titel A → Z'
    };

    chips.push(`<span class="chip">Sortering: ${escapeHtml(sortLabels[sort] || sort)}</span>`);
  }

  activeChips.innerHTML = chips.join('');
}

function filterProducts() {
  const currentType = getTypeFromUrl();
  const selectedBrand = brandFilter?.value || '';
  const search = searchInput?.value || '';
  const searchNorm = normalize(search);
  const selectedShowroom = getShowroomFromUrl();
  const isGlobalSearch = Boolean(searchNorm);

  filtered = products.filter(p => {
    const matchType = isGlobalSearch || productMatchesType(p, currentType);

    const matchBrand =
      isGlobalSearch || !selectedBrand || (p._merkNorm || normalize(getMerk(p))) === normalize(selectedBrand);

    const matchSearch =
      !searchNorm || (p._searchBlob || productSearchBlob(p)).includes(searchNorm);

    const showrooms = p._showrooms || getShowrooms(p);

    let matchShowroom = true;

    if (isGlobalSearch) {
      matchShowroom = true;
    } else if (selectedShowroom === 'all') {
      matchShowroom = showrooms.length > 0;
    } else if (selectedShowroom) {
      matchShowroom = (p._showroomNorms || showrooms.map(s => normalize(s)))
        .includes(normalize(selectedShowroom));
    }

    return matchType && matchBrand && matchSearch && matchShowroom;
  });

  filtered = sortProducts([...filtered]);

  if (pageTitle) {
    pageTitle.textContent = isGlobalSearch ? 'Zoeken' : getCategoryTitle(currentType);
  }

  updateUrlFromFilters();
  updateChips();
  updateMeta();
  renderGrid();
}

function clearFilters() {
  const currentType = getTypeFromUrl();

  if (brandFilter && isSpaCategory(currentType)) {
    brandFilter.value = '';
  }

  if (searchInput) searchInput.value = '';
  if (sortFilter) sortFilter.value = 'relevance';

  filterProducts();
}

function bindFilters() {
  brandFilter?.addEventListener('change', filterProducts);
  searchInput?.addEventListener('input', scheduleFilterProducts);
  sortFilter?.addEventListener('change', filterProducts);
  btnClear?.addEventListener('click', clearFilters);
}

function showError(msg) {
  if (!errorBox || !errorText) return;
  errorBox.style.display = '';
  errorText.textContent = msg;
}

async function init() {
  const currentType = getTypeFromUrl();

  if (pageTitle) {
    pageTitle.textContent = getSearchFromUrl() ? 'Zoeken' : getCategoryTitle(currentType);
  }

  markActiveMenu(currentType);
  setupFilterVisibility();

  products = (await loadProducts()).map(enrichProduct);

  loadFiltersFromUrl();
  bindFilters();
  filterProducts();
}

init().catch(e => {
  console.error(e);
  showError(String(e.message || e));
});
