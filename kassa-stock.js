const COMPANY_NAME = 'Sunspa Brugge/Lievegem';
const COMPANY_EMAIL = 'sunspabrugge@gmail.com';
const COMPANY_PHONE = '0483399967';
const COMPANY_WEBSITE = 'www.sunspabenelux.be';
const COMPANY_LOGO = 'logo.svg';

const SHOWROOMS = {
  gent: 'Gent',
  brugge: 'Brugge'
};

const STORAGE_KEYS = {
  showroom: 'sunspa-kassa-showroom',
  localStock: 'sunspa-kassa-local-stock-v9'
};

const STOCK_BACKEND = {
  mode: 'supabase',
  supabaseUrl: 'https://dbqsnkabnwcndidsovbb.supabase.co',
  supabaseAnonKey: 'sb_publishable_PmIaSJW8d8GgQZV_L10PgA_mf04r5da'
};

const ADMIN_LOGIN = {
  username: 'Admin',
  email: 'sunspabrugge+kassaadmin@gmail.com'
};

let products = [];
let cart = {};
let stockByProduct = {};
let currentShowroom = null;
let stockApi = null;
let stockSubscription = null;
let supabaseClient = null;
let adminStockByProduct = {};

const els = {
  gate: document.getElementById('showroomGate'),
  app: document.getElementById('kassaApp'),
  grid: document.getElementById('grid'),
  total: document.getElementById('total'),
  status: document.getElementById('statusLine'),
  showroomBadge: document.getElementById('showroomBadge'),
  backendBadge: document.getElementById('backendBadge'),
  changeShowroomBtn: document.getElementById('changeShowroomBtn'),
  refreshStockBtn: document.getElementById('refreshStockBtn'),
  resetBtn: document.getElementById('resetBtn'),
  printBtn: document.getElementById('printBtn'),
  stockAdmin: document.getElementById('stockAdmin'),
  adminLoginPanel: document.getElementById('adminLoginPanel'),
  adminManagerPanel: document.getElementById('adminManagerPanel'),
  adminUsername: document.getElementById('adminUsername'),
  adminPassword: document.getElementById('adminPassword'),
  adminLoginBtn: document.getElementById('adminLoginBtn'),
  adminLoginStatus: document.getElementById('adminLoginStatus'),
  adminShowroom: document.getElementById('adminShowroom'),
  adminSearch: document.getElementById('adminSearch'),
  adminRefreshBtn: document.getElementById('adminRefreshBtn'),
  adminLogoutBtn: document.getElementById('adminLogoutBtn'),
  adminStatus: document.getElementById('adminStatus'),
  adminStockList: document.getElementById('adminStockList')
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  stockApi = createStockApi();
  if (els.backendBadge) els.backendBadge.textContent = stockApi.label;

  if (isAdminMode()) {
    await initAdminMode();
    return;
  }

  const savedShowroom = localStorage.getItem(STORAGE_KEYS.showroom);
  if (savedShowroom && SHOWROOMS[savedShowroom]) {
    await selectShowroom(savedShowroom);
  }
}

function bindEvents() {
  document.querySelectorAll('[data-showroom]').forEach(button => {
    button.addEventListener('click', () => selectShowroom(button.dataset.showroom));
  });

  els.changeShowroomBtn.addEventListener('click', () => {
    stopStockSubscription();
    currentShowroom = null;
    localStorage.removeItem(STORAGE_KEYS.showroom);
    cart = {};
    els.app.hidden = true;
    els.gate.hidden = false;
  });

  els.refreshStockBtn.addEventListener('click', refreshStock);
  els.resetBtn.addEventListener('click', resetAll);
  els.printBtn.addEventListener('click', printBon);

  els.adminLoginBtn?.addEventListener('click', adminLogin);
  els.adminPassword?.addEventListener('keydown', event => {
    if (event.key === 'Enter') adminLogin();
  });
  els.adminShowroom?.addEventListener('change', refreshAdminStock);
  els.adminSearch?.addEventListener('input', renderAdminStockList);
  els.adminRefreshBtn?.addEventListener('click', refreshAdminStock);
  els.adminLogoutBtn?.addEventListener('click', adminLogout);
}

async function selectShowroom(showroom) {
  if (!SHOWROOMS[showroom]) return;

  currentShowroom = showroom;
  localStorage.setItem(STORAGE_KEYS.showroom, showroom);
  els.showroomBadge.textContent = `Showroom ${SHOWROOMS[showroom]}`;
  els.gate.hidden = true;
  els.app.hidden = false;
  stopStockSubscription();
  setStatus('Producten en voorraad laden...');

  try {
    await loadProducts();
    await refreshStock();
    startStockSubscription();
  } catch (err) {
    console.error(err);
    setStatus(err.message || 'Er ging iets mis bij het laden.', true);
  }
}

async function loadProducts() {
  if (products.length) return;

  const response = await fetch('kleineproducten.json');
  if (!response.ok) throw new Error('kleineproducten.json kon niet geladen worden');

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('JSON heeft een ongeldig formaat');

  products = data.map((p, index) => ({
    id: p.id ?? `product-${index}`,
    title: p.title ?? 'Onbekend product',
    price: Number(p.price) || 0,
    image: p.image ?? '',
    showrooms: Array.isArray(p.showrooms)
      ? p.showrooms.filter(showroom => SHOWROOMS[showroom])
      : []
  }));
}

async function refreshStock() {
  if (!currentShowroom) return;

  setControlsDisabled(true);
  setStatus(`Voorraad ${SHOWROOMS[currentShowroom]} vernieuwen...`);

  try {
    stockByProduct = await stockApi.getStock(currentShowroom, products);
    trimCartToStock();
    render();
    setStatus(`Live voorraad voor ${SHOWROOMS[currentShowroom]} geladen.`);
  } catch (err) {
    console.error(err);
    setStatus(err.message || 'Voorraad kon niet geladen worden.', true);
  } finally {
    setControlsDisabled(false);
  }
}

function createStockApi() {
  const configuredForSupabase = STOCK_BACKEND.mode === 'supabase'
    && STOCK_BACKEND.supabaseUrl
    && STOCK_BACKEND.supabaseAnonKey
    && window.supabase?.createClient;

  if (configuredForSupabase) {
    supabaseClient = window.supabase.createClient(
      STOCK_BACKEND.supabaseUrl,
      STOCK_BACKEND.supabaseAnonKey
    );
    return createSupabaseStockApi(supabaseClient);
  }

  return createLocalStockApi();
}

function createLocalStockApi() {
  return {
    label: 'Lokale demo',
    async getStock(showroom, productList) {
      const store = await getLocalStockStore(productList);
      return normalizeStockMap(store[showroom] || {}, productList);
    },
    async sell(showroom, items, productList) {
      const store = await getLocalStockStore(productList);
      const showroomStock = store[showroom] || {};

      items.forEach(item => {
        showroomStock[item.id] = Math.max(0, Number(showroomStock[item.id] || 0) - item.qty);
      });

      store[showroom] = showroomStock;
      localStorage.setItem(STORAGE_KEYS.localStock, JSON.stringify(store));
      return normalizeStockMap(showroomStock, productList);
    },
    async setStock(showroom, product, quantity) {
      const store = await getLocalStockStore(products);
      const showroomStock = store[showroom] || {};
      showroomStock[product.id] = Math.max(0, Number(quantity) || 0);
      store[showroom] = showroomStock;
      localStorage.setItem(STORAGE_KEYS.localStock, JSON.stringify(store));
      return normalizeStockMap(showroomStock, products);
    },
    subscribe() {
      return null;
    }
  };
}

function createSupabaseStockApi(client) {
  return {
    label: 'Supabase live',
    async getStock(showroom, productList) {
      const ids = productList.map(p => p.id);
      const { data, error } = await client
        .from('showroom_stock')
        .select('product_id, quantity')
        .eq('showroom', showroom)
        .in('product_id', ids);

      if (error) throw new Error(error.message);

      const stock = {};
      (data || []).forEach(row => {
        stock[row.product_id] = Number(row.quantity || 0);
      });
      return normalizeStockMap(stock, productList);
    },
    async sell(showroom, items, productList) {
      const payload = items.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        title: item.title,
        unit_price: item.price
      }));

      const { error } = await client.rpc('register_showroom_sale', {
        p_showroom: showroom,
        p_items: payload
      });

      if (error) throw new Error(error.message);
      return this.getStock(showroom, productList);
    },
    async setStock(showroom, product, quantity) {
      const { error } = await client.rpc('set_showroom_stock', {
        p_showroom: showroom,
        p_product_id: product.id,
        p_product_title: product.title,
        p_quantity: Math.max(0, Number(quantity) || 0)
      });

      if (error) throw new Error(error.message);
      return this.getStock(showroom, products);
    },
    subscribe(showroom, onChange) {
      const channel = client
        .channel(`showroom-stock-${showroom}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'showroom_stock',
            filter: `showroom=eq.${showroom}`
          },
          onChange
        )
        .subscribe();

      return {
        unsubscribe() {
          client.removeChannel(channel);
        }
      };
    }
  };
}

function startStockSubscription() {
  if (!stockApi?.subscribe || !currentShowroom) return;

  stockSubscription = stockApi.subscribe(currentShowroom, () => {
    refreshStock();
  });
}

function stopStockSubscription() {
  if (!stockSubscription) return;
  stockSubscription.unsubscribe?.();
  stockSubscription = null;
}

async function getLocalStockStore(productList) {
  const saved = localStorage.getItem(STORAGE_KEYS.localStock);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.localStock);
    }
  }

  const response = await fetch('voorbeeld-stock.json');
  if (!response.ok) throw new Error('voorbeeld-stock.json kon niet geladen worden');

  const data = await response.json();
  const store = {
    gent: normalizeStockMap(data.gent || {}, productList),
    brugge: normalizeStockMap(data.brugge || {}, productList)
  };
  localStorage.setItem(STORAGE_KEYS.localStock, JSON.stringify(store));
  return store;
}

function normalizeStockMap(stock, productList) {
  return productList.reduce((result, product) => {
    result[product.id] = Math.max(0, Number(stock[product.id] || 0));
    return result;
  }, {});
}

function trimCartToStock() {
  const visibleProductIds = new Set(getVisibleProducts().map(product => product.id));
  Object.keys(cart).forEach(productId => {
    if (!visibleProductIds.has(productId)) {
      delete cart[productId];
      return;
    }
    if (cart[productId] <= 0) delete cart[productId];
  });
}

function getVisibleProducts() {
  return products.filter(product => isProductVisibleForShowroom(product, currentShowroom));
}

function isProductVisibleForShowroom(product, showroom) {
  return !product.showrooms.length || product.showrooms.includes(showroom);
}

function render() {
  els.grid.innerHTML = '';

  getVisibleProducts().forEach(product => {
    const qty = cart[product.id] || 0;
    const stock = Number(stockByProduct[product.id] || 0);
    const stockClass = stock <= 0 ? 'empty' : stock <= 2 ? 'low' : '';
    const card = document.createElement('div');

    card.className = `product-card${stock <= 0 ? ' is-empty' : ''}`;
    card.innerHTML = `
      <div class="img-wrap">
        ${product.image ? `<img src="${product.image}" class="product-img" alt="${escapeHtml(product.title)}">` : ''}
      </div>
      <div class="product-title">${escapeHtml(product.title)}</div>
      <div class="product-price">${euro(product.price)}</div>
      <div class="stock-row">
        <span>Voorraad ${escapeHtml(SHOWROOMS[currentShowroom])}</span>
        <span class="stock-value ${stockClass}">${stock}</span>
      </div>
      <div class="counter">
        <button type="button" data-change="${product.id}" data-delta="-1" ${qty <= 0 ? 'disabled' : ''}>-</button>
        <span>${qty}</span>
        <button type="button" data-change="${product.id}" data-delta="1">+</button>
      </div>`;

    els.grid.appendChild(card);
  });

  els.grid.querySelectorAll('[data-change]').forEach(button => {
    button.addEventListener('click', () => {
      change(button.dataset.change, Number(button.dataset.delta));
    });
  });

  updateTotal();
}

function change(id, delta) {
  const currentQty = cart[id] || 0;
  const nextQty = Math.max(0, currentQty + delta);

  if (nextQty === 0) {
    delete cart[id];
  } else {
    cart[id] = nextQty;
  }

  render();
}

function getCartItems() {
  return getVisibleProducts()
    .map(product => ({
      ...product,
      qty: cart[product.id] || 0,
      lineTotal: (cart[product.id] || 0) * product.price
    }))
    .filter(product => product.qty > 0);
}

function updateTotal() {
  const total = getCartItems().reduce((sum, product) => sum + product.lineTotal, 0);
  els.total.innerText = euro(total);
}

function resetAll() {
  cart = {};
  render();
}

async function printBon() {
  const items = getCartItems();
  if (!items.length) {
    alert('Er staan nog geen producten in de bon.');
    return;
  }

  const receiptWindow = window.open('', '_blank', 'width=1100,height=900');
  if (!receiptWindow) {
    alert('Popup geblokkeerd door de browser.');
    return;
  }

  setControlsDisabled(true);
  setStatus('Bon maken en voorraad aftrekken...');

  try {
    stockByProduct = await stockApi.sell(currentShowroom, items, products);
    writeReceipt(receiptWindow, items);
    cart = {};
    render();
    setStatus(`Bon gemaakt. Voorraad ${SHOWROOMS[currentShowroom]} is bijgewerkt.`);
  } catch (err) {
    console.error(err);
    receiptWindow.close();
    await refreshStock();
    alert(err.message || 'Voorraad kon niet bijgewerkt worden.');
  } finally {
    setControlsDisabled(false);
  }
}

function writeReceipt(w, items) {
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const btw = total * 0.21;
  const excl = total - btw;
  const today = new Date();
  const rows = items.map((item, index) => `
    <tr>
      <td class="col-num">${index + 1}</td>
      <td class="col-desc">${escapeHtml(item.title)} x ${item.qty}</td>
      <td class="col-price">${euro(item.lineTotal)}</td>
    </tr>
  `).join('');
  const logoHtml = COMPANY_LOGO ? `<img class="offer-logo" src="${encodeURI(COMPANY_LOGO)}" alt="${escapeHtml(COMPANY_NAME)}">` : '';

  w.document.open();
  w.document.write(`
    <!doctype html>
    <html lang="nl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bon ${formatDateBelgium(today)}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { margin: 0; padding: 0; background: #f2f4f7; color: #1f2937; font-family: "Segoe UI", Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.4; }
          body { padding: 14px; }
          .sheet { width: 100%; max-width: 920px; margin: 0 auto; min-height: calc(100vh - 28px); background: #ffffff; border: 1px solid #d9e1ea; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 34px rgba(15, 23, 42, 0.08); display: flex; flex-direction: column; }
          .header { background: #5f7fa4; color: #ffffff; padding: 28px 32px 26px; }
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
          .brand { display: flex; align-items: flex-start; gap: 18px; min-width: 0; }
          .offer-logo { width: 280px; height: auto; display: block; background: #ffffff; border-radius: 14px; padding: 8px 10px; }
          .offer-meta { min-width: 280px; padding: 18px 22px; border-radius: 18px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.18); }
          .offer-meta-row { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 4px 0; }
          .offer-meta-label { font-size: 15px; font-weight: 700; color: #ffffff; }
          .offer-meta-value { font-size: 15px; font-weight: 800; color: #ffffff; text-align: right; white-space: nowrap; }
          .content { padding: 28px 32px 28px; display: flex; flex-direction: column; flex: 1 1 auto; }
          .intro { margin-bottom: 22px; }
          .intro h2 { margin: 0 0 10px 0; font-size: 32px; line-height: 1.1; font-weight: 800; color: #0f172a; }
          .intro p { margin: 0; font-size: 15px; color: #475569; }
          .product-highlight { display: flex; justify-content: space-between; align-items: center; gap: 18px; background: #ffffff; border: 1px solid #d7e0e9; border-radius: 18px; padding: 18px 22px; margin-bottom: 18px; }
          .product-highlight-label { margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .product-highlight-title { margin: 0; font-size: 28px; line-height: 1.1; font-weight: 800; color: #0f172a; }
          .product-highlight-price { text-align: right; white-space: nowrap; }
          .product-highlight-price small { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .product-highlight-price strong { display: block; font-size: 30px; line-height: 1.05; font-weight: 800; color: #4f6f96; }
          .table-wrap { border: 1px solid #d7e0e9; border-radius: 18px; overflow: hidden; background: #ffffff; }
          table { width: 100%; border-collapse: collapse; }
          thead th { background: #eef3f8; color: #314f72; padding: 16px 18px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; text-align: left; border-bottom: 1px solid #d7e0e9; }
          tbody td { padding: 15px 18px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e9eef4; vertical-align: top; }
          tbody tr:last-child td { border-bottom: none; }
          .col-num { width: 70px; font-weight: 800; color: #475569; }
          .col-desc { font-weight: 600; }
          .col-price { width: 190px; text-align: right; white-space: nowrap; font-weight: 800; }
          .summary { margin-top: 18px; display: flex; justify-content: space-between; align-items: flex-start; gap: 40px; }
          .summary-left { flex: 1; padding-top: 10px; }
          .payment-line { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #0f172a; }
          .payment-line span:first-child { min-width: 112px; font-weight: 700; }
          .payment-fill { flex: 1; border-bottom: 1.5px solid #64748b; height: 16px; }
          .summary-box { width: 320px; border: 1px solid #d7e0e9; border-radius: 18px; overflow: hidden; background: #ffffff; }
          .summary-row { display: flex; justify-content: space-between; gap: 18px; padding: 14px 18px; border-bottom: 1px solid #e9eef4; font-size: 14px; color: #0f172a; }
          .summary-row:last-child { border-bottom: none; }
          .summary-row strong { font-weight: 800; }
          .summary-row.total { background: #f3f7fb; color: #314f72; font-size: 17px; font-weight: 800; }
          .footer { margin-top: 18px; padding-top: 16px; border-top: 1px solid #d7e0e9; display: flex; justify-content: space-between; gap: 20px; font-size: 12px; color: #64748b; }
          .footer strong { color: #0f172a; }
          @media print {
            html, body { width: 210mm; height: 297mm; margin: 0 !important; padding: 0 !important; background: #ffffff !important; color: #1f2937 !important; }
            body { font-size: 11px !important; line-height: 1.28 !important; }
            .sheet { width: 194mm !important; max-width: 194mm !important; min-height: 281mm !important; margin: 0 auto !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; }
            .header { background: #ffffff !important; color: #274863 !important; padding: 10mm 10mm 7mm 10mm !important; }
            .header-top { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; gap: 10mm !important; }
            .offer-meta { min-width: 58mm !important; background: #f6f9fc !important; border: 1px solid #dbe3ec !important; border-radius: 10px !important; padding: 5mm 6mm !important; color: #274863 !important; }
            .offer-meta-label, .offer-meta-value { color: #274863 !important; font-size: 10.5px !important; }
            .content { padding: 7mm 8mm 6mm 8mm !important; flex: 1 1 auto !important; }
            .intro { margin-bottom: 5mm !important; }
            .intro h2 { font-size: 18px !important; margin: 0 0 2mm 0 !important; }
            .intro p { font-size: 11px !important; }
            .product-highlight { border-radius: 10px !important; padding: 5mm 6mm !important; margin-bottom: 5mm !important; }
            .product-highlight-title { font-size: 18px !important; }
            .product-highlight-price strong { font-size: 18px !important; color: #407298 !important; }
            .table-wrap { border-radius: 10px !important; }
            thead th { font-size: 10px !important; padding: 3.2mm 4mm !important; }
            tbody td { padding: 3mm 4mm !important; font-size: 11px !important; line-height: 1.25 !important; }
            .col-num { width: 10mm !important; }
            .col-price { width: 34mm !important; }
            .summary { margin-top: 4mm !important; gap: 8mm !important; }
            .payment-line { font-size: 11px !important; }
            .summary-box { width: 52mm !important; border-radius: 10px !important; }
            .summary-row { padding: 3mm 4mm !important; font-size: 11px !important; }
            .summary-row.total { font-size: 13px !important; }
            .footer { margin-top: auto !important; padding-top: 3mm !important; font-size: 9.5px !important; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="header-top">
              <div class="brand">${logoHtml}</div>
              <div class="offer-meta">
                <div class="offer-meta-row">
                  <div class="offer-meta-label">Datum</div>
                  <div class="offer-meta-value">${formatDateBelgium(today)}</div>
                </div>
                <div class="offer-meta-row">
                  <div class="offer-meta-label">Showroom</div>
                  <div class="offer-meta-value">${escapeHtml(SHOWROOMS[currentShowroom])}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="intro">
              <h2>Kassabon</h2>
              <p>Overzicht van de producten.</p>
            </div>

            <div class="product-highlight">
              <div>
                <div class="product-highlight-label">Particuliere verkoop</div>
                <h3 class="product-highlight-title">Showroom ${escapeHtml(SHOWROOMS[currentShowroom])}</h3>
              </div>
              <div class="product-highlight-price">
                <small>Totaal kassabedrag</small>
                <strong>${euro(total)}</strong>
              </div>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Omschrijving</th>
                    <th style="text-align:right">Prijs</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>

            <div class="summary">
              <div class="summary-left">
                <div class="payment-line">
                  <span>BETAALD MET</span>
                  <span class="payment-fill"></span>
                </div>
              </div>

              <div class="summary-box">
                <div class="summary-row">
                  <span>Subtotaal</span>
                  <strong>${euro(excl)}</strong>
                </div>
                <div class="summary-row">
                  <span>21% BTW</span>
                  <strong>${euro(btw)}</strong>
                </div>
                <div class="summary-row total">
                  <span>Totaal</span>
                  <strong>${euro(total)}</strong>
                </div>
              </div>
            </div>

            <div class="footer">
              <div>Met vriendelijke groeten,<br><strong>Team Sunspa Brugge/Lievegem</strong></div>
              <div>Wellnessmarkt BV | BE 0843 104 796 | BE75 3800 1777 8151<br>
              Sunspa Benelux | ${escapeHtml(COMPANY_PHONE)} | ${escapeHtml(COMPANY_EMAIL)}/gentsunspa@gmail.com | ${escapeHtml(COMPANY_WEBSITE)}</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 250);
          };
        <\/script>
      </body>
    </html>
  `);
  w.document.close();
}

function euro(value) {
  return '\u20ac ' + Number(value).toLocaleString('nl-BE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateBelgium(date) {
  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle('error', isError);
}

function setControlsDisabled(disabled) {
  els.refreshStockBtn.disabled = disabled;
  els.resetBtn.disabled = disabled;
  els.printBtn.disabled = disabled;
}

function isAdminMode() {
  return new URLSearchParams(window.location.search).has('beheer');
}

async function initAdminMode() {
  stopStockSubscription();
  els.gate.hidden = true;
  els.app.hidden = true;
  els.stockAdmin.hidden = false;

  if (!supabaseClient) {
    showAdminLoginStatus('Supabase is niet beschikbaar voor voorraadbeheer.', true);
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  if (data?.session) {
    await showAdminManager();
  } else {
    showAdminLogin();
  }
}

function showAdminLogin() {
  els.adminLoginPanel.hidden = false;
  els.adminManagerPanel.hidden = true;
  els.adminUsername.value = '';
  els.adminPassword.value = '';
  showAdminLoginStatus('Aanmelden vereist.');
}

async function showAdminManager() {
  els.adminLoginPanel.hidden = true;
  els.adminManagerPanel.hidden = false;
  await loadProducts();
  await refreshAdminStock();
}

async function adminLogin() {
  const username = els.adminUsername.value.trim();
  const password = els.adminPassword.value;

  if (username !== ADMIN_LOGIN.username || !password) {
    showAdminLoginStatus('Ongeldige aanmelding.', true);
    return;
  }

  els.adminLoginBtn.disabled = true;
  showAdminLoginStatus('Aanmelden...');

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: ADMIN_LOGIN.email,
      password
    });

    if (error) throw error;
    await showAdminManager();
  } catch (err) {
    showAdminLoginStatus(err.message || 'Aanmelden mislukt.', true);
  } finally {
    els.adminLoginBtn.disabled = false;
  }
}

async function adminLogout() {
  await supabaseClient?.auth.signOut();
  adminStockByProduct = {};
  showAdminLogin();
}

async function refreshAdminStock() {
  const showroom = els.adminShowroom.value;
  showAdminStatus(`Voorraad ${SHOWROOMS[showroom]} laden...`);
  setAdminControlsDisabled(true);

  try {
    adminStockByProduct = await stockApi.getStock(showroom, products);
    renderAdminStockList();
    showAdminStatus(`Voorraad ${SHOWROOMS[showroom]} geladen.`);
  } catch (err) {
    showAdminStatus(err.message || 'Voorraad kon niet geladen worden.', true);
  } finally {
    setAdminControlsDisabled(false);
  }
}

function renderAdminStockList() {
  const showroom = els.adminShowroom.value;
  const query = els.adminSearch.value.trim().toLowerCase();
  const visibleProducts = products
    .filter(product => isProductVisibleForShowroom(product, showroom))
    .filter(product => !query || product.title.toLowerCase().includes(query));

  els.adminStockList.innerHTML = '';

  visibleProducts.forEach(product => {
    const stock = Number(adminStockByProduct[product.id] || 0);
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.innerHTML = `
      <div>
        <div class="admin-product-title">${escapeHtml(product.title)}</div>
        <div class="admin-stock-now">Huidige voorraad: <strong>${stock}</strong></div>
      </div>
      <div class="admin-stock-now">Prijs<br><strong>${euro(product.price)}</strong></div>
      <div class="admin-stepper">
        <button type="button" data-admin-step="${product.id}" data-delta="-1">-</button>
        <input type="number" min="0" step="1" value="${stock}" data-admin-input="${product.id}" />
        <button type="button" data-admin-step="${product.id}" data-delta="1">+</button>
        <button class="btn btn-primary" type="button" data-admin-save="${product.id}">Opslaan</button>
      </div>
    `;
    els.adminStockList.appendChild(row);
  });

  els.adminStockList.querySelectorAll('[data-admin-step]').forEach(button => {
    button.addEventListener('click', () => {
      const input = els.adminStockList.querySelector(`[data-admin-input="${cssEscape(button.dataset.adminStep)}"]`);
      const nextValue = Math.max(0, Number(input.value || 0) + Number(button.dataset.delta));
      input.value = String(nextValue);
    });
  });

  els.adminStockList.querySelectorAll('[data-admin-save]').forEach(button => {
    button.addEventListener('click', () => saveAdminStock(button.dataset.adminSave));
  });
}

async function saveAdminStock(productId) {
  const showroom = els.adminShowroom.value;
  const product = products.find(item => item.id === productId);
  const input = els.adminStockList.querySelector(`[data-admin-input="${cssEscape(productId)}"]`);
  const quantity = Math.max(0, Math.floor(Number(input.value || 0)));

  if (!product || !isProductVisibleForShowroom(product, showroom)) return;

  setAdminControlsDisabled(true);
  showAdminStatus(`${product.title} opslaan...`);

  try {
    adminStockByProduct = await stockApi.setStock(showroom, product, quantity);
    renderAdminStockList();
    showAdminStatus(`${product.title} opgeslagen voor ${SHOWROOMS[showroom]}.`);
  } catch (err) {
    showAdminStatus(err.message || 'Voorraad kon niet opgeslagen worden.', true);
  } finally {
    setAdminControlsDisabled(false);
  }
}

function showAdminLoginStatus(message, isError = false) {
  els.adminLoginStatus.textContent = message;
  els.adminLoginStatus.classList.toggle('error', isError);
}

function showAdminStatus(message, isError = false) {
  els.adminStatus.textContent = message;
  els.adminStatus.classList.toggle('error', isError);
}

function setAdminControlsDisabled(disabled) {
  els.adminRefreshBtn.disabled = disabled;
  els.adminLogoutBtn.disabled = disabled;
  els.adminStockList.querySelectorAll('button, input').forEach(control => {
    control.disabled = disabled;
  });
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
}
