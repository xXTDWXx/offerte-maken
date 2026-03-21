const PRODUCTS_URL = new URL('products.json', document.baseURI).toString();

const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');
const resultMeta = document.getElementById('resultMeta');
const pageTitle = document.getElementById('pageTitle');
const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');

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

async function loadProducts() {
  const res = await fetch(PRODUCTS_URL);

  if (!res.ok) {
    throw new Error(`Kan products.json niet laden (${res.status})`);
  }

  const json = await res.json();
  const items = Array.isArray(json) ? json : (json.products || []);
  return Array.isArray(items) ? items : [];
}

function getTypeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('type') || '';
}

function getCategoryTitle(type) {
  const map = {
    Spa: "SPA",
    Zwemspa: "ZWEMSPA",
    Barrel: "BARRELSAUNA",
    Infrarood: "INFRAROOD",
    Finse: "SAUNA",
    Pod: "SAUNA POD",
    Combi: "COMBI SAUNA"
  };

  return map[type] || type || 'Categorie';
}

function markActiveMenu(type) {
  const links = document.querySelectorAll('[data-category-link]');
  links.forEach(link => {
    const linkType = link.getAttribute('data-category-link') || '';
    if (normalize(linkType) === normalize(type)) {
      link.classList.add('is-active');
    } else {
      link.classList.remove('is-active');
    }
  });
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

function updateMeta() {
  if (resultMeta) {
    resultMeta.textContent = `${filtered.length} producten`;
  }
}

function filterProducts() {
  const selectedBrand = brandFilter.value;
  const selectedCategory = document.getElementById("categoryFilter")?.value || "";
  const searchValue = document.getElementById("searchInput")?.value.toLowerCase() || "";

  const filtered = products.filter(product => {
    const matchCategory = !selectedCategory || product.category === selectedCategory;

    const matchBrand =
      selectedCategory !== "spa"
        ? true
        : !selectedBrand || product.brand === selectedBrand;

    const matchSearch =
      !searchValue || product.name.toLowerCase().includes(searchValue);

    return matchCategory && matchBrand && matchSearch;
  });

  renderProducts(filtered);
}

function showError(msg) {
  if (!errorBox || !errorText) return;
  errorBox.style.display = '';
  errorText.textContent = msg;
}

async function init() {
  const currentType = getTypeFromUrl();

  if (pageTitle) {
    pageTitle.textContent = getCategoryTitle(currentType);
  }

  markActiveMenu(currentType);

  products = await loadProducts();

  filtered = products.filter(p => normalize(p.type) === normalize(currentType));

  renderGrid();
  updateMeta();
}

init().catch(e => {
  console.error(e);
  showError(String(e.message || e));
});
