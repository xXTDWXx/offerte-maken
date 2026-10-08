(function () {
  const STATIC_URL = new URL('spa-stock.json', document.baseURI).toString();
  const API_URL = new URL('api/spa-stock', document.baseURI).toString();
  const REFRESH_MS = 60 * 1000;
  const MAX_AGE_MS = 45 * 60 * 1000;
  let inFlight = null;
  let cached = null;
  let checkedAt = 0;
  const listeners = new Set();

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' en ')
      .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }

  function isSpaProduct(product) {
    const type = normalize(product?.type);
    return type === 'spa' || type === 'spa s' || type.includes('zwemspa');
  }

  function getModelCandidates(product) {
    const title = normalize(product?.title);
    // Strip a complete brand prefix only. Never match "Elite" inside Fox Elite Javea.
    const model = title
      .replace(/^(?:plug and play spa|fox elite|fox spa|legend spa|bullfrog spa|maxicuzzi|sunspa|myspa|vogue|zwemspa)\s+/, '')
      .replace(/\s+hottub spa$/, '');
    const aliases = { aquavera: 'aquatique', 'goldline spa': 'goldline' };
    return [...new Set([aliases[model], model, title].filter(Boolean))];
  }

  function findModel(product, stockData) {
    const models = Array.isArray(stockData?.models) ? stockData.models : [];
    // Candidate priority matters; ambiguous or partial names must never borrow stock.
    for (const candidate of getModelCandidates(product)) {
      const matches = models.filter(model => normalize(model?.key || model?.name) === candidate);
      if (matches.length === 1) return matches[0];
      if (matches.length > 1) return null;
    }
    return null;
  }

  function isFresh(data) {
    const age = Date.now() - Date.parse(data?.generatedAt);
    return Array.isArray(data?.models) && Number.isFinite(age) && age >= -300000 && age <= MAX_AGE_MS;
  }

  function describe(data = cached) {
    const date = new Date(data?.generatedAt);
    const when = Number.isFinite(date.getTime())
      ? date.toLocaleString('nl-BE', { timeZone: 'Europe/Brussels', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '';
    if (isFresh(data)) return 'Voorraad bijgewerkt: ' + when;
    return when ? 'Voorraad verouderd (laatste update ' + when + '). Beschikbaarheid navragen.'
      : 'Voorraad tijdelijk niet beschikbaar. Beschikbaarheid navragen.';
  }

  async function fetchStock(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now(),
        { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Stock HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data?.models) || !Number.isFinite(Date.parse(data?.generatedAt))) {
        throw new Error('Invalid stock response');
      }
      return data;
    } finally { clearTimeout(timeout); }
  }

  function notify() {
    for (const listener of listeners) {
      try { listener(cached); } catch (error) { console.warn('Voorraadweergave', error); }
    }
  }

  function load({ force = false } = {}) {
    if (inFlight) return inFlight;
    if (!force && checkedAt && Date.now() - checkedAt < REFRESH_MS) return Promise.resolve(cached);
    inFlight = (async () => {
      try {
        // GitHub Pages has no /api route; avoid a guaranteed 404 on every refresh.
        const onPages = new URL(document.baseURI).hostname.endsWith('.github.io');
        let data;
        if (onPages) data = await fetchStock(STATIC_URL);
        else {
          try { data = await fetchStock(API_URL); }
          catch (_) { data = await fetchStock(STATIC_URL); }
          if (!isFresh(data)) {
            try {
              const fallback = await fetchStock(STATIC_URL);
              if (Date.parse(fallback.generatedAt) > Date.parse(data.generatedAt)) data = fallback;
            } catch (_) {}
          }
        }
        // A lagging cache/deployment must not replace a newer snapshot.
        if (!cached || Date.parse(data.generatedAt) >= Date.parse(cached.generatedAt)) cached = data;
      } catch (error) {
        console.warn('Spa-voorraad is niet beschikbaar', error);
      }
      checkedAt = Date.now();
      return cached;
    })().finally(() => { inFlight = null; notify(); });
    return inFlight;
  }

  function getAvailability(product, stockData) {
    if (!isSpaProduct(product) || !isFresh(stockData)) return null;
    const model = findModel(product, stockData);
    if (!model) return false;
    return (Array.isArray(model.cabinets) && model.cabinets.some(c => Number(c?.currentTotal ?? c?.total ?? 0) > 0))
      || Number(model.currentTotal ?? model.total ?? 0) > 0;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  window.SunspaStockStatus = Object.freeze({ load, getAvailability, findModel, isFresh, describe, subscribe });
  setInterval(() => { if (!document.hidden) load({ force: true }); }, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load({ force: true }); });
  window.addEventListener('online', () => load({ force: true }));
  window.addEventListener('pageshow', () => load());

  // One unobtrusive timestamp on the overview; product pages have their own status.
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('spaStockDelivery')) return;
    const grid = document.getElementById('grid');
    if (!grid) return;
    const status = document.createElement('p');
    status.id = 'stockFreshness';
    status.setAttribute('role', 'status');
    status.style.cssText = 'font-size:13px;margin:8px 0;color:inherit;opacity:.8';
    grid.before(status);
    subscribe(data => { status.textContent = describe(data); });
    status.textContent = describe();
  });
})();
