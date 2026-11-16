const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const products = JSON.parse(read('products.json')).products;
let now = Date.parse('2026-11-16T12:00:00+01:00');
class Clock extends Date { static now() { return now; } }
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, { value: '', checked: false, style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} }, closest() { return null; } });
  return elements.get(id);
}
const context = vm.createContext({ Date: Clock, URL, URLSearchParams, Intl, console,
  window: { SunspaI18n: { isFrench: () => false } },
  document: { baseURI: 'https://xxtdwxx.github.io/offerte-maken/',
    getElementById: element, querySelector: () => null, querySelectorAll: () => [] } });
vm.runInContext(read('promotions.js'), context);
vm.runInContext(read('showroom-models.js'), context);
// Load real pricing/quotation functions; don't start network/UI initialization.
vm.runInContext(read('product.js').split('init().catch')[0], context);
const api = context.window.SunspaPromotions;
const active = products.filter(p => api.getAction(p));
assert.equal(active.length, 36);
for (const p of active) {
  const a = api.getAction(p);
  assert.ok(a.actionPrice > 0 && a.actionPrice < a.originalPrice, p.id);
  if (a.stockOnly) assert.equal(Math.round(a.originalPrice / 1.21 * 100) / 100, a.actionPrice, p.id);
  context.testProduct = p;
  vm.runInContext('currentProduct = testProduct; selectedVariant = null;', context);
  const lines = vm.runInContext('getSelectedOfferLines()', context);
  assert.equal(Math.round((lines[0].price + lines[1].price) * 100) / 100, a.actionPrice,
    p.id + ': quotation must subtract discount from Sunspa reference price');
  assert.equal(vm.runInContext('getCurrentProductPriceValue()', context), a.actionPrice);
  assert.match(lines[1].label, /Black Friday.*30\/11\/2026/);
  assert.equal(lines[1].label.includes('voorraadmodellen'), a.stockOnly);
  assert.match(vm.runInContext('getCurrentProductPriceHtml()', context), /Black Friday/);
}
assert.equal(api.getAction(products.find(p => p.id === 'spa::myspa-houston')), null);
assert.equal(api.getAction(products.find(p => p.id === 'sauna::barrelsauna-tr170')), null);
assert.equal(api.getAction(products.find(p => p.id === 'sauna::traditionele-combi-sauna-chaleur')), null);
assert.equal(api.getAction({ id: 'spa::bullfrog-m7', showroomOffer: { total: 21495 } }), null);
const showroom = context.window.SunspaShowroomModels.createProducts(products);
for (const p of showroom) {
  context.testProduct = p;
  vm.runInContext('currentProduct = testProduct; selectedVariant = null;', context);
  const lines = vm.runInContext('getSelectedOfferLines()', context);
  assert.equal(Math.round(lines.reduce((sum, line) => sum + line.price, 0) * 100) / 100, p.showroomOffer.total);
  assert.ok(!lines.some(line => line.label.includes('Black Friday')));
}
for (const name of ['index.html','category.html','actie.html','product.html']) {
  const html = read(name);
  assert.ok(html.indexOf('promotions.js?v=black-friday-20261116') < html.search(/src="(?:app|category|product)\.js/));
}
const sample = active[0];
now = Date.parse('2026-11-30T23:59:59+01:00');
assert.ok(api.getAction(sample));
now = Date.parse('2026-12-01T00:00:00+01:00');
assert.equal(api.getAction(sample), null);
assert.equal(api.price(sample), sample.price);
now = Date.parse('2026-11-15T23:59:59+01:00');
assert.equal(api.getAction(sample), null);
console.log('PASS: 36 exact prices, quotation lines, stock conditions, showroom packages, exclusions and Brussels expiry.');
