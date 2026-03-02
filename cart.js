// Cart/offerte overview
// Shared helpers + cart storage
const PRODUCTS_URL = './products.json';
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

const elLines = document.getElementById('lines');
const tpl = document.getElementById('lineTpl');
const elEmpty = document.getElementById('emptyHint');
const elSub = document.getElementById('subTotal');
const elGrand = document.getElementById('grandTotal');
const elPrintBtn = document.getElementById('btnPrint');
const elReset = document.getElementById('btnReset');
const elCopy = document.getElementById('btnCopy');
const elDownload = document.getElementById('btnDownload');

const formIds = ['custName','custEmail','custPhone','custCity','notes'];

function loadForm(){
  try{
    const s = JSON.parse(localStorage.getItem(FORM_KEY) || '{}');
    for (const id of formIds){
      if (s[id] != null){
        const el = document.getElementById(id);
        if (el) el.value = s[id];
      }
    }
  }catch{}
}
function saveForm(){
  const s = {};
  for (const id of formIds){
    const el = document.getElementById(id);
    s[id] = el ? el.value : '';
  }
  localStorage.setItem(FORM_KEY, JSON.stringify(s));
}

function lineTotals(item){
  const unit = Number(item.unit_price||0);
  const qty = Math.max(1, Number(item.qty||1));
  const o = item.options || {};

  const install = o.install ? Number(o.install_price||0) : 0;
  const coverlift = o.coverlift ? Number(o.coverlift_price||189) : 0;
  const maint = o.maintenance ? Number(o.maintenance_price||179) : 0;
  const filters = Math.max(0, Number(o.filters_qty||0)) * Number(o.filter_unit_price||45);

  const optUnit = install + coverlift + maint + filters;
  const line = (unit + optUnit) * qty;
  return { qty, unit, optUnit, line, install, coverlift, maint, filters };
}

function render(){
  const cart = getCart();
  elLines.innerHTML = '';

  if (!cart.length){
    elEmpty.textContent = 'Nog geen producten toegevoegd. Ga terug naar de catalogus.';
    elSub.textContent = euro(0);
    elGrand.textContent = euro(0);
    renderPrint();
    return;
  }
  elEmpty.textContent = '';

  const frag = document.createDocumentFragment();
  let grand = 0;

  cart.forEach((item, idx) => {
    const node = tpl.content.cloneNode(true);
    const t = lineTotals(item);
    grand += t.line;

    node.querySelector('[data-title]').textContent = item.title || item.productId;
    node.querySelector('[data-sub]').textContent = `${(item.type||'').toUpperCase()} • Product: ${euro(t.unit)} • Opties per stuk: ${euro(t.optUnit)}`;

    const opts = [];
    if (item.options?.install) opts.push(`Levering & installatie (${euro(item.options.install_price||0)})`);
    opts.push('Cover & trap (incl.)');
    if (item.options?.coverlift) opts.push(`Coverlift (${euro(item.options.coverlift_price||189)})`);
    if (item.options?.maintenance) opts.push(`Onderhoudspakket (${euro(item.options.maintenance_price||179)})`);
    if ((item.options?.filters_qty||0) > 0) opts.push(`Filters: ${item.options.filters_qty} × ${euro(item.options.filter_unit_price||45)}`);

    node.querySelector('[data-opts]').textContent = opts.join(' • ');

    const qtyEl = node.querySelector('[data-qty]');
    qtyEl.value = String(item.qty || 1);
    qtyEl.addEventListener('input', () => {
      const cart2 = getCart();
      cart2[idx].qty = Math.max(1, Number(qtyEl.value||1));
      setCart(cart2);
      render();
    });

    node.querySelector('[data-total]').textContent = euro(t.line);

    node.querySelector('[data-remove]').addEventListener('click', () => {
      const cart2 = getCart();
      cart2.splice(idx,1);
      setCart(cart2);
      render();
    });

    frag.appendChild(node);
  });

  elLines.appendChild(frag);
  elSub.textContent = euro(grand);
  elGrand.textContent = euro(grand);
  renderPrint();
}

function quoteObject(){
  const cart = getCart();
  const f = {};
  for (const id of formIds){
    const el = document.getElementById(id);
    f[id] = el ? el.value : '';
  }

  const lines = cart.map(item => {
    const t = lineTotals(item);
    return {
      productId: item.productId,
      title: item.title,
      type: item.type,
      qty: t.qty,
      unit_price: t.unit,
      options_unit_total: t.optUnit,
      options: item.options,
      line_total: t.line,
      url: item.url || ''
    };
  });

  const total = lines.reduce((a,l)=>a+l.line_total,0);

  return {
    meta: { createdAt: new Date().toISOString() },
    customer: { name: f.custName||'', email: f.custEmail||'', phone: f.custPhone||'', city: f.custCity||'' },
    notes: f.notes || '',
    lines,
    totals: { total_excl_vat: total }
  };
}

function renderPrint(){
  const q = quoteObject();
  const block = document.getElementById('printBlock');

  const rows = q.lines.map(l => `
    <tr>
      <td><strong>${escapeHtml(l.title)}</strong><br><span style="color:#333">${escapeHtml(l.type||'')}</span></td>
      <td style="text-align:right">${l.qty}</td>
      <td style="text-align:right">${euro(l.unit_price + l.options_unit_total)}</td>
      <td style="text-align:right">${euro(l.line_total)}</td>
    </tr>
  `).join('');

  block.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
      <div>
        <div style="font-size:20px;font-weight:800;">Offerte</div>
        <div>Datum: ${new Date().toLocaleDateString('nl-BE')}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:800;">Klant</div>
        <div>${escapeHtml(q.customer.name || '—')}</div>
        <div>${escapeHtml(q.customer.email || '')}</div>
        <div>${escapeHtml(q.customer.phone || '')}</div>
        <div>${escapeHtml(q.customer.city || '')}</div>
      </div>
    </div>

    <hr style="margin:14px 0;border:none;border-top:1px solid #ddd"/>

    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px 0;">Omschrijving</th>
          <th style="text-align:right;border-bottom:1px solid #ddd;padding:8px 0;">Aantal</th>
          <th style="text-align:right;border-bottom:1px solid #ddd;padding:8px 0;">Eenheid (incl. opties)</th>
          <th style="text-align:right;border-bottom:1px solid #ddd;padding:8px 0;">Totaal</th>
        </tr>
      </thead>
      <tbody>${rows || ''}</tbody>
      <tfoot>
        <tr><td colspan="4"><hr style="margin:10px 0;border:none;border-top:1px solid #ddd"/></td></tr>
        <tr>
          <td colspan="3" style="text-align:right;font-weight:900;padding:6px 0;font-size:16px;">Totaal (excl. btw)</td>
          <td style="text-align:right;padding:6px 0;font-weight:900;font-size:16px;">${euro(q.totals.total_excl_vat)}</td>
        </tr>
      </tfoot>
    </table>

    ${q.notes ? `<div style="margin-top:12px"><strong>Opmerkingen / voorwaarden</strong><br>${escapeHtml(q.notes).replace(/\n/g,'<br>')}</div>` : ''}
  `;
}

function download(filename, text){
  const blob = new Blob([text], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

elPrintBtn.addEventListener('click', ()=>window.print());
elReset.addEventListener('click', ()=>{
  if (!confirm('Winkelwagen leegmaken?')) return;
  setCart([]);
  render();
});

elDownload.addEventListener('click', ()=>{
  const q = quoteObject();
  download('offerte.json', JSON.stringify(q, null, 2));
});

elCopy.addEventListener('click', async ()=>{
  const q = quoteObject();
  const txt = [
    'Offerte',
    `Datum: ${new Date().toLocaleDateString('nl-BE')}`,
    '',
    `Klant: ${q.customer.name||'—'}`,
    `E-mail: ${q.customer.email||'—'}`,
    `Tel: ${q.customer.phone||'—'}`,
    `Gemeente: ${q.customer.city||'—'}`,
    '',
    'Regels:',
    ...q.lines.map(l => `- ${l.qty}× ${l.title} (${l.type}) = ${euro(l.line_total)}`),
    '',
    `Totaal (excl. btw): ${euro(q.totals.total_excl_vat)}`,
    '',
    q.notes ? `Opmerkingen:\n${q.notes}` : ''
  ].filter(Boolean).join('\n');

  try{
    await navigator.clipboard.writeText(txt);
    alert('Tekst gekopieerd.');
  }catch{
    const ta = document.createElement('textarea');
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    alert('Tekst gekopieerd.');
  }
});

for (const id of formIds){
  const el = document.getElementById(id);
  if (el){
    el.addEventListener('input', saveForm);
    el.addEventListener('change', saveForm);
  }
}

loadForm();
render();
