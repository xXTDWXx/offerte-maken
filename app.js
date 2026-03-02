// Catalogus
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

const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');
const elSearch = document.getElementById('search');
const elType = document.getElementById('typeFilter');
const elSort = document.getElementById('sort');
const elClear = document.getElementById('btnClear');
const elSync = document.getElementById('btn-sync');
setCountTo(document.getElementById('cartCount'));

let products = [];
let filtered = [];

function buildTypeFilter(items){
  const types = Array.from(new Set(items.map(p=>p.type).filter(Boolean))).sort();
  elType.innerHTML = '<option value="">Alle types</option>' + types.map(t=>`<option value="${t}">${t}</option>`).join('');
}

function productSearchBlob(p){
  const specText = (p.specs||[]).map(s => `${s.label}: ${s.value}`).join(' | ');
  const bullets = (p.bullets||[]).join(' | ');
  return normalize([p.title,p.type,bullets,specText].join(' '));
}

function renderChips(q,type,sort){
  const chips = [];
  if (q) chips.push(`Zoek: ${q}`);
  if (type) chips.push(`Type: ${type}`);
  if (sort && sort !== 'relevance'){
    const map = {priceAsc:'Prijs ↑',priceDesc:'Prijs ↓',titleAsc:'Titel A–Z'};
    chips.push(`Sort: ${map[sort] || sort}`);
  }
  document.getElementById('activeChips').innerHTML = chips.map(c=>`<span class="chip">${c}</span>`).join('');
  document.getElementById('resultMeta').textContent = `${filtered.length} producten`;
}

function topSpecs(p){
  const want = ['Aantal zitplaatsen','Aantal ligplaatsen','Aantal jets','Afmetingen','Inhoud','Stroom'];
  const specs = p.specs || [];
  const picked = [];
  for (const key of want){
    const found = specs.find(s => normalize(s.label) === normalize(key));
    if (found) picked.push(`${found.label}: ${found.value}`);
  }
  if (!picked.length){
    for (const s of specs.slice(0,3)) picked.push(`${s.label}: ${s.value}`);
  }
  return picked.slice(0,4).join('<br>');
}

function applyFilters(){
  const q = normalize(elSearch.value);
  const type = elType.value;
  const sort = elSort.value;

  filtered = products.filter(p => {
    if (type && p.type !== type) return false;
    if (q) return productSearchBlob(p).includes(q);
    return true;
  });

  if (sort === 'priceAsc') filtered.sort((a,b)=> (a.price||0)-(b.price||0));
  if (sort === 'priceDesc') filtered.sort((a,b)=> (b.price||0)-(a.price||0));
  if (sort === 'titleAsc') filtered.sort((a,b)=> (a.title||'').localeCompare(b.title||'','nl'));

  renderChips(q,type,sort);
  renderGrid();
}

function renderGrid(){
  elGrid.innerHTML = '';
  const frag = document.createDocumentFragment();

  for (const p of filtered){
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector('.card-img');
    img.src = p.image || '';
    img.alt = p.title || 'Product';
    img.onerror = () => { img.src=''; img.style.display='none'; };

    node.querySelector('[data-badge]').textContent = (p.type || '').toUpperCase();
    node.querySelector('[data-title]').textContent = p.title || '';
    node.querySelector('[data-price]').textContent = euro(p.price || 0);
    node.querySelector('[data-specs]').innerHTML = topSpecs(p);

    const link = node.querySelector('[data-link]');
    link.href = `product.html?id=${encodeURIComponent(p.id)}`;

    frag.appendChild(node);
  }
  elGrid.appendChild(frag);
}

async function init(){
  products = await loadProducts(false);
  buildTypeFilter(products);
  applyFilters();
}

elSearch.addEventListener('input', applyFilters);
elType.addEventListener('change', applyFilters);
elSort.addEventListener('change', applyFilters);
elClear.addEventListener('click', () => { elSearch.value=''; elType.value=''; elSort.value='relevance'; applyFilters(); });
elSync.addEventListener('click', async () => {
  elSync.disabled = true; elSync.textContent='⏳ Bezig…';
  try{
    products = await loadProducts(true);
    buildTypeFilter(products);
    applyFilters();
  }finally{
    elSync.disabled = false; elSync.textContent='🔄 Synchroniseren';
  }
});

init().catch(err => {
  console.error(err);
  document.getElementById('resultMeta').textContent = 'Fout bij laden';
});
