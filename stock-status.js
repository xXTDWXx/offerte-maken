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


  function isSaunaProduct(product) {
    return ['barrelsauna', 'infrarood', 'sauna', 'sauna pod', 'combi sauna'].includes(normalize(product?.type));
  }

  function getSaunaStockCandidates(product) {
    const rawTitle = String(product?.title || '');
    const normalizedTitle = normalize(rawTitle);
    const title = normalizedTitle;
    const aliases = [];
  
    const add = (...values) => values.forEach(value => {
      const normalized = normalize(value);
      if (normalized) aliases.push(normalized);
    });
  
    
    if (title.includes('black front') && title.includes('9101')) add('royal 9101c black front');
    else if (title.includes('9101') && title.includes('funda')) add('9101 c funda');
    else if (title.includes('9101')) add('royal 9101c');
    if (title.includes('i100')) add('infra4health sh1 i100 ongelakt');
    if (title.includes('i120')) add('infra4health sh2 i120 ongelakt');
    if (title.includes('i150')) add('infra4health sh3 i150 ongelakt');
    if (title.includes('i170') && !title.includes('barrelsauna')) add('infra4health sh4 i170 ongelakt');
    if (title.includes('i160c')) add('infra4health shc i160 ongelakt');
    if (title.includes('icombi')) add('combi sauna 95b h i220');
    if (title.includes('health company 1')) add('h08 r5');
    if (title.includes('health company 2')) add('h01 k6');
    if (title.includes('health company 3')) add('h02 k6');
    if (title.includes('health company 4')) add('h04 k6');
    if (title.includes('health company 5')) add('h03 k62');
    if (title.includes('health company 6')) add('h03 k61');
    if (title.includes('dreammaker')) add('koy dreammaker h32s l8');
    if (title.includes('130 infrarood')) add('royal 130');
    if (title.includes('160 infrarood')) add('royal 160');
    if (title === 'traditionele sauna') add('hy560 traditional sauna');
    if (title === 'traditionele combi sauna') add('hy406 combi sauna');
    if (title.includes('sauna pod')) add('sauna pod rustic joint cedar');
    if (title.includes('infrarood barrelsauna canopy')) add('barrel infrarood in170 x c with canopy nutty cedar');
  
    if (title.includes('barrelsauna tr170') && title.includes('halfglas')) add('barrel tr170 x nutty half glass');
    else if (title.includes('barrelsauna tr170')) add('barrel tr170 x nutty cedar');
    if (title.includes('barrelsauna tr210') && title.includes('halfglas')) add('barrel tr210 x nutty half glass');
    else if (title.includes('barrelsauna tr210')) add('barrel tr210 x nutty');
    if (title.includes('barrelsauna tr230') && title.includes('glazen achterwand')) add('barrel tr230 x nutty full glass');
    else if (title.includes('barrelsauna tr230') && title.includes('panorama')) add('barrel tr230 x acryl bol nutty');
    else if (title.includes('barrelsauna tr230') && title.includes('halfglas')) add('barrel tr230 x nutty half glass');
    else if (title.includes('barrelsauna tr230')) add('barrel tr230 x nutty');
    if (title.includes('barrelsauna tr270') && title.includes('halfglas')) add('barrel tr270 x nutty half glass');
    else if (title.includes('barrelsauna tr270')) add('barrel tr270 x nutty');
    if (title.includes('barrelsauna tr300') && title.includes('halfglas')) add('barrel tr300 x nutty cedar half glass');
    else if (title.includes('barrelsauna tr300')) add('barrel tr300 x nutty cedar');
    if (title.includes('barrelsauna tr400') && title.includes('half')) add('barrel tr400 x nutty cedar half glass');
    else if (title.includes('barrelsauna tr400')) add('barrel tr400 x nutty cedar');
  
    if (title === 'funda mahogany 1 persoons infrarood sauna') add('9101 c 0052 funda');
    if (title === 'hemlock magnus 1 persoons uitschuifbare sauna') add('1101t ch 3 magnus 1');
    if (title === 'hemlock magnus 2 persoons uitschuifbare infrarood sauna') add('1102t ch 1 magnus 2');
    if (title === 'sumum wit 2 persoons infrarood sauna') add('9022s ch 1 alba 2 sumum wit 2');
    if (title === 'sumum wit 3 persoons infrarood sauna') add('9033s ch 2 alba3 sumum wit 3');
    if (title === 'sumum hemlock 3 persoons infrarood sauna') add('9033s ch 2 mb3 sumum hemlock 3');
    if (title === 'sumum quatro 4 persoons infrarood sauna') add('9044s ch 1 mb4 sumum quatro 4');
    if (title === 'infrarood lounge chair') add('hyz107 infrarood stoel lounge');
    if (title === 'health company 7') add('koy h04 k61 180 exclusive 6');
    if (title === 'health company 8 links') add('koy h03 k63 210 exclusive 7 l');
    if (title === 'health company 8 rechts') add('koy h03 k63 210 exclusive 7 r');
    if (title === 'traditionele combi sauna chaleur') add('ap 001 c alpha chaleur combi');
    if (title === 'horizon outdoor sauna') add('horizon cube black');
    if (title === 'discovery sauna') add('dc220 discovery');
    if (title === 'kerava outdoor sauna') add('kerava outdoor cabin');
    if (title === 'sunset outdoor sauna') add('sunset black edition');
  
    const simplified = normalize(
      rawTitle
        .replace(/\b(sunspa|infra4health|infrarood|sauna|persoons|uitschuifbare|full\s*spectrum)\b/gi, ' ')
        .replace(/\b(cedar|outdoor|knotty|red|benelux)\b/gi, ' ')
    );
  
    return Array.from(new Set([
      ...aliases,
      normalizedTitle,
      simplified
    ].filter(value => value && !['cabine', 'cabine outdoor', 'sauna', 'infrarood'].includes(value))));
  }

  function findSaunaStockMatches(product, stockData) {
    const items = Array.isArray(stockData?.saunas?.items) ? stockData.saunas.items : [];
    const candidates = getSaunaStockCandidates(product);
    // Prefer exact names so a standard barrel never borrows half-glass stock.
    for (const candidate of candidates) {
      const exact = items.filter(item =>
        normalize(item?.name || item?.key) === candidate ||
        normalize(item?.code) === candidate ||
        normalize(item?.key) === candidate);
      if (exact.length) return exact;
    }
    // Supplier names can include extra model codes. Match complete words only
    // and keep glass variants separate (H04-K6 must not match H04-K61).
    const title = normalize(product?.title);
    const variant = text => /half\s*glas/.test(text) ? 'half'
      : /full\s*glas|glazen achterwand/.test(text) ? 'full'
      : /panorama|acryl bol/.test(text) ? 'panorama' : 'standard';
    for (const candidate of candidates) {
      if (candidate.length < 3) continue;
      const matches = items.filter(item => {
        const name = normalize(item?.name || item?.key);
        if ((title.includes('barrelsauna tr') || title.includes('9101')) &&
            (variant(title) !== variant(name) || title.includes('black front') !== name.includes('black front'))) return false;
        return (' ' + name + ' ').includes(' ' + candidate + ' ');
      });
      if (matches.length) return matches;
    }
    return [];
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
    if (isSaunaProduct(product)) {
      if (!isFresh(stockData) || !Array.isArray(stockData?.saunas?.items)) return null;
      return findSaunaStockMatches(product, stockData).some(item => Number(item?.currentTotal || 0) > 0);
    }
    if (!isSpaProduct(product)) return null;
    // Alicante and Pacific are permanently available in Graphite.
    // Keep their overview dot green independently of the live stock snapshot.
    if (normalize(product?.type).includes('zwemspa') &&
        getModelCandidates(product).some(model => model === 'alicante' || model === 'pacific')) return true;
    if (!isFresh(stockData)) return null;
    const model = findModel(product, stockData);
    if (!model) return false;
    return (Array.isArray(model.cabinets) && model.cabinets.some(c => Number(c?.currentTotal ?? c?.total ?? 0) > 0))
      || Number(model.currentTotal ?? model.total ?? 0) > 0;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  window.SunspaStockStatus = Object.freeze({ load, getAvailability, findModel, findSaunaStockMatches, isFresh, describe, subscribe });
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
