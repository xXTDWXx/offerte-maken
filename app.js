// Sunspa catalogus + productfiche modal (robust / null-safe)
// Verwacht: assets/products.json
// Werkt met templates die (optioneel) data-open en/of data-link bevatten.

const PRODUCTS_URL = new URL('assets/products.json', document.baseURI).toString();

// --- Catalog refs
const elGrid = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const elSearch = document.getElementById('search');
const elType = document.getElementById('typeFilter');
const elSort = document.getElementById('sort');
const elClear = document.getElementById('btnClear');

const elSync = document.getElementById('btn-sync');
const elStatus = document.getElementById('status');
const elChips = document.getElementById('activeChips');
const elMeta = document.getElementById('resultMeta');

const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');

// --- Modal refs (best-effort; als modal niet bestaat, blijft catalogus werken)
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

function euro(n) {
  const x = Number(n || 0);
  try {
    return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(x);
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
  if (!res.ok) throw new Error(`Kan products.json niet laden (${res.status})`);
  const json = await res.json();

  // ondersteunt: [..] of {products:[..]}
  const items = Array.isArray(json) ? json : (json.products || []);
  if (!Array.isArray(items)) return [];
  return items;
}

function buildTypeFilter(items) {
  if (!elType) return;
  const types = Array.from(new Set(items.map(p => p.type).filter(Boolean))).sort();
  elType.innerHTML = '<option value="">Alle types</option>' +
    types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

function productSearchBlob(p) {
  const specText = (p.specs || []).map(s => `${s.label}: ${s.value}`).join(' | ');
  const bullets = (p.bullets || []).join(' | ');
  return normalize([p.title, p.type, bullets, specText].join(' '));
}

function topSpecs(p) {
  const want = ['Aantal zitplaatsen', 'Aantal ligplaatsen', 'Aantal jets', 'Afmetingen', 'Inhoud', 'Stroom'];
  const specs = Array.isArray(p.specs) ? p.specs : [];
  const picked = [];

  for (const key of want) {
    const found = specs.find(s => normalize(s.label) === normalize(key));
    if (found) picked.push(`${escapeHtml(found.label)}: ${escapeHtml(found.value)}`);
  }

  if (!picked.length) {
    for (const s of specs.slice(0, 3)) {
      picked.push(`${escapeHtml(s.label)}: ${escapeHtml(s.value)}`);
    }
  }

  return picked.slice(0, 4).join('<br>');
}

function renderChips(q, type, sort) {
  if (!elChips || !elMeta) return;

  const chips = [];
  if (q) chips.push(`Zoek: ${escapeHtml(q)}`);
  if (type) chips.push(`Type: ${escapeHtml(type)}`);
  if (sort && sort !== 'relevance') {
    const map = { priceAsc: 'Prijs ↑', priceDesc: 'Prijs ↓', titleAsc: 'Titel A–Z' };
    chips.push(`Sort: ${map[sort] || sort}`);
  }

  elChips.innerHTML = chips.map(c => `<span class="chip">${c}</span>`).join('');
  elMeta.textContent = `${filtered.length} producten`;
}

function applyFilters() {
  const q = elSearch ? normalize(elSearch.value) : '';
  const type = elType ? elType.value : '';
  const sort = elSort ? elSort.value : 'relevance';

  filtered = products.filter(p => {
    if (type && p.type !== type) return false;
    if (q) return productSearchBlob(p).includes(q);
    return true;
  });

  if (sort === 'priceAsc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sort === 'priceDesc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sort === 'titleAsc') filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'nl'));

  renderChips(q, type, sort);
  renderGrid();
}

function specTableHtml(p) {
  const specs = Array.isArray(p.specs) ? p.specs : [];
  if (!specs.length) return '<div class="small">Geen specificaties beschikbaar.</div>';

  return specs.map(s => `
    <div class="spec-row">
      <strong>${escapeHtml(s.label || '')}</strong>
      <span>${escapeHtml(s.value || '')}</span>
    </div>
  `).join('');
}

// --- Modal open/close (best-effort)
function openModal(p) {
  if (!modal) return; // als je geen modal HTML hebt, doet hij niks

  if (modalTitle) modalTitle.textContent = p.title || '—';
  if (modalPrice) modalPrice.textContent = `Prijs: ${euro(p.price || 0)}`;
  if (modalType) modalType.textContent = (p.type || '').toUpperCase();

  if (modalImg) {
    modalImg.src = p.image || '';
    modalImg.alt = p.title || 'Product';
    modalImg.style.display = p.image ? '' : 'none';
    modalImg.onerror = () => { modalImg.style.display = 'none'; };
  }

  if (modalSpecs) modalSpecs.innerHTML = specTableHtml(p);

  if (modalUrl) {
    modalUrl.href = p.url || '#';
    modalUrl.style.display = p.url ? '' : 'none';
  }

  if (modalPrint) modalPrint.onclick = () => printProductFiche(p);

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (modal) {
  modal.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.matches('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });
}

function printProductFiche(p) {
  const win = window.open('', '_blank');
  const specs = (p.specs || []).map(s =>
    `<tr><td><strong>${escapeHtml(s.label)}</strong></td><td>${escapeHtml(s.value)}</td></tr>`
  ).join('');

  const img = p.image
    ? `<img src="${p.image}" style="width:100%;max-width:760px;border:1px solid #ddd;border-radius:12px;margin:10px 0">`
    : '';

  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(p.title || 'Product')}</title>
        <style>
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:24px;color:#111}
          h1{margin:0 0 6px 0}
          .meta{color:#333;margin:0 0 10px 0}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          td{border-bottom:1px solid #eee;padding:8px 0;vertical-align:top}
          td:first-child{width:220px}
        </style>
      </head>
      <body>
        <h1>${escapeHtml(p.title || '')}</h1>
        <div class="meta">
          Type: ${escapeHtml(p.type || '—')}<br>
          Prijs: ${euro(p.price || 0)}
        </div>
        ${img}
        <table>${specs}</table>
        <script>window.onload=()=>{window.print();}</script>
      </body>
    </html>
  `);
  win.document.close();
}

// --- Render
function renderGrid() {
  if (!elGrid || !tpl) return;
  elGrid.innerHTML = '';

  const frag = document.createDocumentFragment();

  for (const p of filtered) {
    const node = tpl.content.cloneNode(true);

    // image
    const img = node.querySelector('.card-img');
    if (img) {
      img.src = p.image || '';
      img.alt = p.title || 'Product';
      img.onerror = () => { img.style.display = 'none'; };
    }

    // badge/title/price/specs
    const badge = node.querySelector('[data-badge]');
    if (badge) badge.textContent = (p.type || '').toUpperCase();

    const title = node.querySelector('[data-title]');
    if (title) title.textContent = p.title || '';

    const price = node.querySelector('[data-price]');
    if (price) price.textContent = euro(p.price || 0);

    const specs = node.querySelector('[data-specs]');
    if (specs) specs.innerHTML = topSpecs(p);

    // OPTIONAL: if your template has a link
    const link = node.querySelector('[data-link]');
    if (link) {
      // als je een aparte productpagina gebruikt:
      // link.href = `product.html?id=${encodeURIComponent(p.id)}`;
      // Maar als je “zoals jouw site” wil: klik opent modal:
      link.href = '#';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(p);
      });
    }

    // OPTIONAL: if your template has a button with data-open
    const openBtn = node.querySelector('[data-open]');
    if (openBtn) {
      openBtn.addEventListener('click', () => openModal(p));
    } else {
      // fallback: maak de hele card klikbaar als er geen data-open is
      const card = node.querySelector('.card-link') || node.querySelector('.card') || node.firstElementChild;
      if (card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openModal(p));
      }
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
  if (elStatus) elStatus.textContent = 'Laden…';

  products = await loadProducts({ force: false });
  buildTypeFilter(products);
  applyFilters();

  if (elStatus) elStatus.textContent = `OK • ${products.length} producten`;
}

// --- Events (null-safe)
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

if (elSync) {
  elSync.addEventListener('click', async () => {
    elSync.disabled = true;
    elSync.textContent = '⏳ Bezig…';
    if (elStatus) elStatus.textContent = 'Synchroniseren…';

    try {
      products = await loadProducts({ force: true });
      buildTypeFilter(products);
      applyFilters();
      if (elStatus) elStatus.textContent = `OK • ${products.length} producten`;
    } catch (e) {
      console.error(e);
      if (elStatus) elStatus.textContent = 'Fout';
      showError(String(e.message || e));
    } finally {
      elSync.disabled = false;
      elSync.textContent = '🔄 Synchroniseren';
    }
  });
}

init().catch(e => {
  console.error(e);
  if (elStatus) elStatus.textContent = 'Fout';
  showError(String(e.message || e));
});
