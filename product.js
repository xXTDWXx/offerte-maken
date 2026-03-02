// Product detail + opties -> voeg toe aan offerte
// Shared helpers + cart storage
const PRODUCTS_URL = 'products.json';
const CART_KEY = 'sunspa_quote_cart_v1';
const FORM_KEY = 'sunspa_quote_form_v1';

function euro(n){
  try{ return new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'}).format(n); }
  catch{ return '€' + (Math.round(n*100)/100).toFixed(2); }
}
function normalize(s){ return (s||'').toString().toLowerCase().trim(); }

function getCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }catch{ return []; }
}
function setCart(items){
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}
function cartCount(){
  return getCart().reduce((a,i)=> a + Math.max(1, Number(i.qty||1)), 0);
}
function setCountTo(el){
  if (el) el.textContent = String(cartCount());
}
async function loadProducts(force=false){
  const url = force ? `${PRODUCTS_URL}?t=${Date.now()}` : PRODUCTS_URL;
  const res = await fetch(url, { cache: force ? 'no-store' : 'default' });
  if (!res.ok) throw new Error(`Kan products.json niet laden (${res.status})`);
  const json = await res.json();
  return Array.isArray(json) ? json : (json.products || []);
}

function installCostForType(type){
  const t = normalize(type);
  // Map per jouw prijzen
  if (t.includes('zwemspa') || t.includes('swim')) return 895;
  if (t.includes('infrarood')) return 450;
  if (t.includes('sauna barrel') || (t.includes('barrel') && t.includes('sauna'))) return 995;
  if (t.includes('sauna')) return 695; // gewone sauna
  // default: jacuzzi
  return 695;
}

function escapeHtml(s){
  return (s||'').toString()
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
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
const optCoverlift = document.getElementById('optCoverlift');
const optMaintenance = document.getElementById('optMaintenance');
const filterQty = document.getElementById('filterQty');

const installHint = document.getElementById('installHint');
const installPrice = document.getElementById('installPrice');
const filterPrice = document.getElementById('filterPrice');

const pqty = document.getElementById('pqty');

const tProduct = document.getElementById('tProduct');
const tOptions = document.getElementById('tOptions');
const tTotal = document.getElementById('tTotal');

const btnAdd = document.getElementById('btnAdd');

const PRICES = {
  coverTrap: 0,
  coverlift: 189,
  maintenance: 179,
  filter: 45
};

let product = null;

function specTable(p){
  const rows = (p.specs||[]).map(s => `<div class="spec-row"><strong>${escapeHtml(s.label)}</strong><span>${escapeHtml(s.value)}</span></div>`).join('');
  return `<div class="spec-table">${rows || ''}</div>`;
}

function optionsTotals(){
  const install = optInstall.checked ? installCostForType(product.type) : 0;
  const coverlift = optCoverlift.checked ? PRICES.coverlift : 0;
  const maint = optMaintenance.checked ? PRICES.maintenance : 0;
  const fq = Math.max(0, Number(filterQty.value||0));
  const filters = fq * PRICES.filter;

  const optTotal = install + coverlift + maint + filters;
  return { install, coverlift, maint, fq, filters, optTotal };
}

function renderTotals(){
  const qty = Math.max(1, Number(pqty.value||1));
  const base = Number(product.price||0) * qty;

  const o = optionsTotals();
  const opt = o.optTotal * qty; // opties per product (per unit)
  tProduct.textContent = euro(base);
  tOptions.textContent = euro(opt);
  tTotal.textContent = euro(base + opt);

  installPrice.textContent = euro(installCostForType(product.type));
  filterPrice.textContent = euro(o.filters);
}

function addToCart(){
  const qty = Math.max(1, Number(pqty.value||1));
  const o = optionsTotals();

  const item = {
    productId: product.id,
    title: product.title,
    type: product.type || '',
    unit_price: Number(product.price||0),
    qty,
    url: product.url || '',
    image: product.image || '',
    options: {
      install: !!optInstall.checked,
      install_price: installCostForType(product.type),
      cover_trap_included: true,
      coverlift: !!optCoverlift.checked,
      coverlift_price: PRICES.coverlift,
      maintenance: !!optMaintenance.checked,
      maintenance_price: PRICES.maintenance,
      filters_qty: o.fq,
      filter_unit_price: PRICES.filter
    }
  };

  const cart = getCart();
  cart.push(item);
  setCart(cart);
  setCountTo(document.getElementById('cartCount'));
  alert('Toegevoegd aan offerte.');
}

async function init(){
  const items = await loadProducts(false);
  product = items.find(p => String(p.id) === String(pid));

  if (!product){
    elErr.style.display = '';
    return;
  }

  elWrap.style.display = '';
  elImg.src = product.image || '';
  elImg.alt = product.title || 'Product';
  elImg.onerror = () => { elImg.src=''; elImg.style.display='none'; };

  elBadge.textContent = (product.type || '').toUpperCase();
  elLink.href = product.url || '#';
  elLink.textContent = 'Bekijk product';
  elTitle.textContent = product.title || '';
  elPrice.textContent = euro(product.price || 0);
  elSpecs.innerHTML = specTable(product);

  const inst = installCostForType(product.type);
  installHint.textContent = `Installatiekost voor type “${product.type || 'jacuzzi'}”: ${euro(inst)}`;

  // default selections
  optInstall.checked = true; // usually yes
  filterQty.value = '0';

  // wire
  [optInstall,optCoverlift,optMaintenance,filterQty,pqty].forEach(el => {
    el.addEventListener('input', renderTotals);
    el.addEventListener('change', renderTotals);
  });
  btnAdd.addEventListener('click', addToCart);

  renderTotals();
}

init().catch(err => {
  console.error(err);
  elErr.style.display = '';
});
