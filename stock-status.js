(function () {
  const SPA_STOCK_URL = new URL('api/spa-stock', document.baseURI).toString();
  const SPA_STOCK_STATIC_URL = new URL('spa-stock.json', document.baseURI).toString();
  let stockDataPromise = null;

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' en ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function isSpaProduct(product) {
    const type = normalize(product?.type);
    return type === 'spa' || type === 'spa s' || type.includes('zwemspa');
  }

  function getModelCandidates(product) {
    const title = String(product?.title || '');
    const normalizedTitle = normalize(title);
    const withoutBrand = normalize(title.replace(/\b(sunspa|myspa|fox|elite|vogue|gold\s*line|goldline)\b/gi, ' '));
    const words = withoutBrand.split(' ').filter(Boolean);
    const aliases = [];

    if (normalizedTitle.includes('aquavera')) aliases.push('aquatique');
    if (normalizedTitle.includes('python')) aliases.push('python');

    return [...new Set([
      ...aliases,
      normalizedTitle,
      withoutBrand,
      words.length ? words[words.length - 1] : ''
    ].filter(Boolean))];
  }

  function findModel(product, stockData) {
    const models = Array.isArray(stockData?.models) ? stockData.models : [];
    const candidates = getModelCandidates(product);
    const exact = models.find(model => candidates.includes(normalize(model?.key || model?.name)));
    if (exact) return exact;

    return models.find(model => {
      const modelKey = normalize(model?.key || model?.name);
      return candidates.some(candidate => candidate.includes(modelKey) || modelKey.includes(candidate));
    }) || null;
  }

  async function load() {
    if (!stockDataPromise) {
      stockDataPromise = fetch(SPA_STOCK_URL, { cache: 'no-store' })
        .then(response => {
          if (!response.ok) throw new Error(`Stock API ${response.status}`);
          return response.json();
        })
        .catch(() => fetch(`${SPA_STOCK_STATIC_URL}?v=${Date.now()}`, { cache: 'no-store' })
          .then(response => {
            if (!response.ok) throw new Error(`Stock JSON ${response.status}`);
            return response.json();
          }))
        .catch(error => {
          console.warn('Spa-voorraad is niet beschikbaar', error);
          return null;
        });
    }

    return stockDataPromise;
  }

  function getAvailability(product, stockData) {
    if (!isSpaProduct(product) || !stockData) return null;

    const model = findModel(product, stockData);
    if (!model) return false;

    const cabinets = Array.isArray(model.cabinets) ? model.cabinets : [];
    if (cabinets.some(cabinet => Number(cabinet?.currentTotal ?? cabinet?.total ?? 0) > 0)) {
      return true;
    }

    return Number(model.currentTotal ?? model.total ?? 0) > 0;
  }

  window.SunspaStockStatus = Object.freeze({ load, getAvailability });
})();
