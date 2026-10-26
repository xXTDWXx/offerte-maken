const fs = require('node:fs');
async function runStockTests(stockSource, productSource) {
  let now = Date.parse('2026-10-08T12:00:00Z');
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const events = {};
  const timers = [];
  let requests = 0;
  let fail = false;
  let snapshot = { generatedAt: new Clock().toISOString(), models: [
    { key: 'elite', currentTotal: 1 },
    { key: 'angora', currentTotal: 2 },
    { key: 'aquatique', currentTotal: 4 },
    { key: 'python', currentTotal: 18 },
    { key: 'san marino 1', currentTotal: 4 },
    { key: 'grand pacific prem', currentTotal: 1 }
  ] };
  const window = { addEventListener(name, cb) { events[name] = cb; } };
  const document = { baseURI: 'https://xxtdwxx.github.io/offerte-maken/', hidden: false,
    addEventListener(name, cb) { events[name] = cb; } };
  const fetch = async url => {
    requests++;
    assert(!url.includes('/api/'), 'GitHub Pages should fetch static JSON directly');
    if (fail) throw new Error('offline');
    return { ok: true, json: async () => snapshot };
  };
  const localConsole = { warn() {} };
  new Function('window', 'document', 'fetch', 'Date', 'URL', 'AbortController',
    'setTimeout', 'clearTimeout', 'setInterval', 'console', stockSource)(
    window, document, fetch, Clock, URL, AbortController,
    () => 1, () => {}, cb => timers.push(cb), localConsole);
  const api = window.SunspaStockStatus;
  let notices = 0;
  api.subscribe(() => { notices++; });
  const stock = await api.load();
  for (const title of ['Fox Elite Javea', 'Fox Elite Valencia', 'Fox Elite Altea']) {
    assert(api.findModel({title}, stock) === null, title + ' borrowed Elite stock');
    assert(api.getAvailability({ title, type:'spa' }, stock) === false, title + ' green dot');
  }
  assert(api.findModel({title:'Sunspa San Marino 2'}, stock) === null, 'San Marino variants mixed');
  assert(api.findModel({title:'Zwemspa Pacific'}, stock) === null, 'Pacific variants mixed');
  assert(api.findModel({title:'Vogue Angora'}, stock).currentTotal === 2, 'Angora missing');
  assert(api.findModel({title:'Sunspa Aquavera'}, stock).key === 'aquatique', 'Aquavera alias missing');
  assert(api.findModel({title:'Python hottub spa'}, stock).key === 'python', 'Python alias missing');
  assert(api.findModel({title:'Fox Elite Javea'}, {models:[{key:''}]}) === null, 'Empty name matched');
  assert(api.findModel({title:'Vogue Angora'}, {models:[{key:'angora'},{key:'angora'}]}) === null, 'Ambiguous name matched');
  assert(api.getAvailability({title:'Vogue Angora',type:'spa'}, stock) === true, 'Fresh stock hidden');

  const saunaStock = {generatedAt: new Clock().toISOString(), models: [], saunas: {items: [
    {name:'Barrel TR300-X Nutty Cedar',currentTotal:0,incomingTotal:5},
    {name:'Barrel TR300-X Nutty Cedar (Half Glass)',currentTotal:2},
    {name:'Royal 9101C',currentTotal:0},
    {name:'Royal 9101C - Black Front',currentTotal:3},
    {name:'HY406 COMBI SAUNA',currentTotal:4},
    {name:'HY560 Traditional Sauna',currentTotal:0},
    {name:'Sauna Pod Rustic / Joint Cedar',currentTotal:2},
    {name:'Koy H04-K6 150 exclusive 4',currentTotal:0},
    {name:'Koy H04-K61 180 exclusive 6',currentTotal:5},
    {name:'Koy Scharnier cabine set',currentTotal:99},
    {name:'Infra4Health SHC - i160 Ongelakt',currentTotal:9},
    {name:'Koy H03-K62 150 exclusive 5',currentTotal:0}
  ]}};
  const availability = (title,type,data=saunaStock) => api.getAvailability({title,type},data);
  assert(availability('Barrelsauna TR300','barrelsauna') === false, 'Incoming or half-glass stock borrowed by standard barrel');
  assert(availability('Barrelsauna TR300 – Halfglas','Barrelsauna') === true, 'Half-glass barrel missing');
  assert(availability('Full Spectrum Exclusive 9101C','Infrarood') === false, 'Black-front stock borrowed by standard infrared');
  assert(availability('Sauna Full Spectrum Black Front 9101C','Infrarood') === true, 'Black-front infrared missing');
  assert(availability('Traditionele Combi sauna','combi sauna') === true, 'Combi sauna missing');
  assert(availability('Traditionele sauna','sauna') === false, 'Traditional sauna must be red at zero');
  assert(availability('Sauna pod Knotty Red Cedar','sauna pod') === true, 'Sauna pod missing');
  assert(availability('Health Company 4','Infrarood') === false, 'H04-K6 borrowed H04-K61 stock');
  assert(availability('Health Company 5 hoeksauna','Infrarood') === false, 'Health Company borrowed i160C stock');
  assert(availability('Sauna Cabine Cedar Outdoor','barrelsauna') === false, 'Cabinet hinges matched a full sauna');
  assert(availability('Traditionele Combi sauna','combi sauna',{...saunaStock,generatedAt:'2000-01-01'}) === null, 'Stale sauna data shown');
  assert(availability('Traditionele Combi sauna','combi sauna',{generatedAt:saunaStock.generatedAt,models:[]}) === null, 'Missing sauna feed shown as unavailable');
  assert(availability('Roof','overkapping') === null, 'Unrelated category got a stock dot');
  const halfOnly = {...saunaStock,saunas:{items:[saunaStock.saunas.items[1]]}};
  assert(availability('Barrelsauna TR300','barrelsauna',halfOnly) === false, 'Partial fallback borrowed half-glass stock');
  assert(productSource.includes('window.SunspaStockStatus.findSaunaStockMatches(product, stockData)'), 'Detail page and overview use different sauna matching');

  await api.load();
  assert(requests === 1, 'Cache should deduplicate requests within one minute');
  now += 61000;
  snapshot = {generatedAt:new Clock().toISOString(), models:[{key:'angora',currentTotal:0}]};
  await timers[0]();
  assert((await api.load()).models[0].currentTotal === 0, 'Open screen did not refresh');
  assert(requests === 2, 'Timer did not fetch');
  now += 61000;
  snapshot = {generatedAt:'2026-10-08T11:00:00Z', models:[{key:'angora',currentTotal:99}]};
  await api.load({force:true});
  assert((await api.load()).models[0].currentTotal === 0, 'Old snapshot replaced new one');
  now += 46 * 60000;
  fail = true;
  await api.load({force:true});
  assert(api.getAvailability({title:'Vogue Angora',type:'spa'}, stock) === null, 'Stale stock shown as current');
  assert(api.describe(stock).includes('verouderd'), 'Stale warning missing');
  fail = false;
  snapshot = {generatedAt:new Clock().toISOString(), models:[{key:'angora',currentTotal:3}]};
  await events.online();
  assert(api.getAvailability({title:'Vogue Angora',type:'spa'}, await api.load()) === true, 'Recovery failed');
  const before = requests;
  document.hidden = true;
  await timers[0]();
  assert(requests === before, 'Hidden tab should not poll');
  document.hidden = false;
  await events.visibilitychange();
  assert(requests === before + 1, 'Returning to screen should refresh');
  assert(notices >= 5, 'Subscribers not updated');
  new Function(productSource); // Entire product script must remain valid JavaScript.
  assert(productSource.includes('window.SunspaStockStatus.findModel(product, stockData)'), 'Product uses different matching');
  assert(!productSource.includes('spaStockDataPromise'), 'Product still caches forever');
  return 'Stock regressions passed: exact matching, aliases, ambiguity, periodic refresh, cache, stale data, recovery, visibility, product syntax.';
}

runStockTests(fs.readFileSync('stock-status.js','utf8'), fs.readFileSync('product.js','utf8')).then(console.log).catch(error => { console.error(error); process.exitCode = 1; });
