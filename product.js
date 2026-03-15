// Product detail + opties -> voeg toe aan offerte
const PRODUCTS_URL = 'products.json';
const CART_KEY = 'sunspa_quote_cart_v1';

function euro(n) {
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR'
    }).format(n);
  } catch {
    return '€' + (Math.round(n * 100) / 100).toFixed(2);
  }
}

function normalize(s) {
  return (s || '').toString().toLowerCase().trim();
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function cartCount() {
  return getCart().reduce((a, i) => a + Math.max(1, Number(i.qty || 1)), 0);
}

function setCountTo(el) {
  if (el) el.textContent = String(cartCount());
}

async function loadProducts(force = false) {
  const url = force ? `${PRODUCTS_URL}?t=${Date.now()}` : PRODUCTS_URL;
  const res = await fetch(url, { cache: force ? 'no-store' : 'default' });
  if (!res.ok) throw new Error(`Kan products.json niet laden (${res.status})`);
  const json = await res.json();
  return Array.isArray(json) ? json : (json.products || []);
}

function installCostForType(type) {
  const t = normalize(type);

  if (t.includes('zwemspa') || t.includes('swim')) return 895;
  if (t.includes('infrarood')) return 450;
  if (t.includes('sauna barrel') || (t.includes('barrel') && t.includes('sauna'))) return 995;
  if (t.includes('sauna')) return 695;

  return 695;
}

function escapeHtml(s) {
  return (s || '').toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isSwimSpaType(type) {
  const t = normalize(type);
  return t.includes('zwemspa') || t.includes('swim');
}

function isInfraredType(type) {
  return normalize(type).includes('infrarood');
}

function isSaunaType(type) {
  return normalize(type).includes('sauna');
}

function isJacuzziType(type) {
  const t = normalize(type);
  return !t.includes('zwemspa') && !t.includes('swim') && !t.includes('infrarood') && !t.includes('sauna');
}

function coverOptionsAllowed(type) {
  return isJacuzziType(type) || isSwimSpaType(type);
}

setCountTo(document.getElementById('cartCount'));

const params = new URLSearchParams(location.search);
const pid = params.get('id');

const elWrap = document.getElementById('pwrap');
const elErr = document.getElementById('err');

const elImg = document.getElementById('pimg');
const elBadge = document.getElementById('pbadge');
const elLink = document.getElementById('plink');
const elTitle = document.getElementById('ptitle');
const elPrice = document.getElementById('pprice');
const elSpecs = document.getElementById('pspecs');

const optInstall = document.getElementById('optInstall');
const optCoverTrapRow = document.getElementById('optCoverTrapRow');
const optCoverliftRow = document.getElementById('optCoverliftRow');
const optCoverlift = document.getElementById('optCoverlift');
const optMaint = document.getElementById('optMaint');
const filterQty = document.getElementById('optSwimFiltersetQty');

const installHint = document.getElementById('optInstallHint');
const installPrice = document.getElementById('optInstallPrice');
const filterRow = document.getElementById('optSwimFiltersetRow');
const optCoverliftTotal = document.getElementById('optCoverliftTotal');

const pqty = document.getElementById('pqty');

const tProduct = document.getElementById('tProduct');
const tOptions = document.getElementById('tOptions');
const tTotal = document.getElementById('tTotal');

const btnAdd = document.getElementById('btnAdd');

const PRICES = {
  coverTrap: 0,
  coverlift: 189,
  maintenance: 179,
  filter: 250
};

let product = null;

function specTable(p) {
  const rows = (p.specs || [])
    .map(s => `
      <div class="spec-row">
        <strong>${escapeHtml(s.label)}</strong>
        <span>${escapeHtml(s.value)}</span>
      </div>
    `)
    .join('');

  return `<div class="spec-table">${rows}</div>`;
}

function optionsTotals() {
  const install = installCostForType(product.type);
  const coverlift = optCoverlift?.checked ? PRICES.coverlift : 0;
  const maint = optMaint?.checked ? PRICES.maintenance : 0;
  const fq = Math.max(0, Number(filterQty?.value || 0));
  const filters = fq * PRICES.filter;

  const optTotal = install + coverlift + maint + filters;
  return { install, coverlift, maint, fq, filters, optTotal };
}

function renderVisibility() {
  if (!product) return;

  const allowCoverOptions = coverOptionsAllowed(product.type);
  const swim = isSwimSpaType(product.type);

  if (optCoverTrapRow) {
    optCoverTrapRow.style.display = allowCoverOptions ? '' : 'none';
  }

  if (optCoverliftRow) {
    optCoverliftRow.style.display = allowCoverOptions ? '' : 'none';
  }

  if (!allowCoverOptions && optCoverlift) {
    optCoverlift.checked = false;
  }

  if (filterRow) {
    filterRow.style.display = swim ? '' : 'none';
  }

  if (!swim && filterQty) {
    filterQty.value = '0';
  }
}

function renderTotals() {
  if (!product) return;

  renderVisibility();

  const qty = Math.max(1, Number(pqty?.value || 1));
  const base = Number(product.price || 0) * qty;

  const o = optionsTotals();
  const opt = o.optTotal * qty;

  tProduct.textContent = euro(base);
  tOptions.textContent = euro(opt);
  tTotal.textContent = euro(base + opt);

  if (installPrice) {
    installPrice.textContent = euro(installCostForType(product.type));
  }

  if (optCoverliftTotal) {
    optCoverliftTotal.textContent = euro(PRICES.coverlift);
  }
}

function addToCart() {
  if (!product) return;

  const qty = Math.max(1, Number(pqty?.value || 1));
  const o = optionsTotals();

  const item = {
    productId: product.id,
    title: product.title,
    type: product.type || '',
    unit_price: Number(product.price || 0),
    qty,
    url: product.url || '',
    image: product.image || '',
    options: {
      install: true,
      install_price: installCostForType(product.type),
      cover_trap_included: coverOptionsAllowed(product.type),
      coverlift: coverOptionsAllowed(product.type) ? !!optCoverlift?.checked : false,
      coverlift_price: PRICES.coverlift,
      maintenance: !!optMaint?.checked,
      maintenance_price: PRICES.maintenance,
      filters_qty: isSwimSpaType(product.type) ? o.fq : 0,
      filter_unit_price: PRICES.filter
    }
  };

  const cart = getCart();
  cart.push(item);
  setCart(cart);
  setCountTo(document.getElementById('cartCount'));
  alert('Toegevoegd aan offerte.');
}

async function init() {
  const items = await loadProducts(false);
  product = items.find(p => String(p.id) === String(pid));

  if (!product) {
    elErr.style.display = '';
    return;
  }

  elWrap.style.display = '';

  elImg.src = product.image || '';
  elImg.alt = product.title || 'Product';
  elImg.onerror = () => {
    elImg.src = '';
    elImg.style.display = 'none';
  };

  elBadge.textContent = (product.type || '').toUpperCase();
  elLink.href = product.url || '#';
  elLink.textContent = 'Bekijk product';
  elTitle.textContent = product.title || '';
  elPrice.textContent = euro(product.price || 0);
  elSpecs.innerHTML = specTable(product);

  const inst = installCostForType(product.type);
  if (installHint) {
    installHint.textContent = `Installatiekost voor type "${product.type || 'jacuzzi'}": ${euro(inst)}`;
  }

  if (optInstall) optInstall.checked = true;
  if (filterQty) filterQty.value = '0';
  if (optCoverlift) optCoverlift.checked = false;
  if (optMaint) optMaint.checked = false;

  [optCoverlift, optMaint, filterQty, pqty]
    .filter(Boolean)
    .forEach(el => {
      el.addEventListener('input', renderTotals);
      el.addEventListener('change', renderTotals);
    });

  if (btnAdd) {
    btnAdd.addEventListener('click', addToCart);
  }

  renderTotals();
}

init().catch(err => {
  console.error(err);
  elErr.style.display = '';
});
