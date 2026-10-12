// Run with Playwright available via NODE_PATH; optionally set BROWSER_CHANNEL.
// All requests and writes stay in this fixture; no production session is used.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'kleineproducten.json')));
let currentCatalog = catalog;
const mock = `window.fixture = {
  stock: {gent:{'broodkussen-wit':20},brugge:{'broodkussen-wit':20},kortrijk:{'broodkussen-wit':20}}, writes:[], fail:false
};
window.supabase = {createClient(){return {
  auth:{getSession:async()=>({data:{session:{user:{id:'fixture'}}}})},
  from(){return {select(){return this},eq(k,v){this.location=v;return this},in(){return this},
    then(resolve){return Promise.resolve({data:Object.entries(window.fixture.stock[this.location]).map(([product_id,quantity])=>({product_id,quantity})),error:null}).then(resolve)}}},
  async rpc(name,args){
    if(window.fixture.fail)return {error:{message:'Fixture save failure'}};
    window.fixture.writes.push({name,...args});
    window.fixture.stock[args.p_showroom][args.p_product_id]=args.p_quantity;
    return {error:null};
  }
}}};`;
async function main() {
  const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
  try {
    const page = await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>localStorage.setItem('sunspa-kassa-showroom','gent'));
    await page.route('**/*', async route=>{
      const url=new URL(route.request().url());
      if(url.hostname==='cdn.jsdelivr.net') return route.fulfill({contentType:'application/javascript',body:mock});
      if(url.hostname!=='kassa.test') return route.abort();
      const file=decodeURIComponent(url.pathname).slice(1);
      if(file==='kleineproducten.json') return route.fulfill({json:currentCatalog});
      if(!['kassa.html','kassa-stock.js','kassa-pv.js','kassa-pv.css','i18n.js'].includes(file)) return route.abort();
      return route.fulfill({path:path.join(root,file)});
    });
    await page.goto('https://kassa.test/kassa.html?beheer=1');
    const status=page.locator('#adminStatus');
    const input=id=>page.locator(`[data-admin-input="${id}"]`);
    async function settled(){await page.waitForFunction(()=>!adminBusy && adminLoadedShowroom === els.adminShowroom.value);}
    await settled();
    assert.equal(await page.locator('#adminShowroom').inputValue(),'gent');
    assert.equal(await input('broodkussen-wit').inputValue(),'20');
    for(const product of catalog.filter(p=>p.id.startsWith('easy-water-'))) {
      assert.equal(await input(product.id).inputValue(),'0');
      assert.ok(await input(product.id).isEnabled());
    }
    // Every catalog item gets exactly one editable row in every showroom.
    for(const showroom of ['gent','brugge','kortrijk']) {
      await page.selectOption('#adminShowroom',showroom);await settled();
      await page.selectOption('#adminAssortment','all');
      const ids=await page.locator('[data-admin-input]').evaluateAll(nodes=>nodes.map(n=>n.dataset.adminInput));
      assert.deepEqual(ids,catalog.map(p=>p.id));
      assert.equal(new Set(ids).size,ids.length);
      assert.equal(await page.locator('[data-admin-input]:disabled').count(),0);
    }
    assert.ok(await page.locator('.admin-row').filter({has:input('fox-spa-filter')}).getByText('Niet in het kassa-assortiment van deze vestiging').isVisible());
    // Drafts survive search, scope and showroom switches; hidden rows can save.
    await input('fox-spa-filter').fill('3');
    await page.selectOption('#adminAssortment','active');
    assert.equal(await input('fox-spa-filter').count(),0);
    await page.locator('#adminSearch').fill('Broodkussen wit');
    await input('broodkussen-wit').fill('21');
    await page.selectOption('#adminShowroom','gent');await settled();
    assert.equal(await input('broodkussen-wit').inputValue(),'20');
    await page.selectOption('#adminShowroom','kortrijk');await settled();
    assert.equal(await input('broodkussen-wit').inputValue(),'21');
    await page.locator('#adminSaveAllBtn').click();await settled();
    assert.match(await status.textContent(),/2 wijziging\(en\) opgeslagen en gecontroleerd/);
    const saved=await page.evaluate(()=>window.fixture);
    assert.equal(saved.stock.kortrijk['fox-spa-filter'],3);
    assert.equal(saved.stock.kortrijk['broodkussen-wit'],21);
    assert.equal(saved.stock.gent['broodkussen-wit'],20);
    assert.equal(saved.stock.brugge['broodkussen-wit'],20);
    // Refresh reloads the catalog without losing entered quantities.
    await input('broodkussen-wit').fill('22');
    currentCatalog=[...catalog,{id:'new-fixture',title:'Nieuw fixtureproduct',price:null,image:''}];
    await page.locator('#adminRefreshBtn').click();await settled();
    assert.equal(await input('broodkussen-wit').inputValue(),'22');
    await page.locator('#adminSearch').fill('');
    assert.equal(await input('new-fixture').inputValue(),'0');
    // Invalid values and failed writes remain recoverable.
    await input('broodkussen-wit').fill('-1');
    await page.locator('#adminSaveAllBtn').click();await settled();
    assert.match(await status.textContent(),/geldig geheel aantal/);
    assert.equal(await page.evaluate(()=>window.fixture.writes.length),2);
    await input('broodkussen-wit').fill('22');
    await page.evaluate(()=>window.fixture.fail=true);
    await page.locator('#adminSaveAllBtn').click();await settled();
    assert.equal(await input('broodkussen-wit').inputValue(),'22');
    assert.match(await status.textContent(),/Niet-opgeslagen wijzigingen blijven bewaard/);
    await page.evaluate(()=>window.fixture.fail=false);
    await page.locator('#adminSaveAllBtn').click();await settled();
    assert.equal(await page.evaluate(()=>window.fixture.stock.kortrijk['broodkussen-wit']),22);
    await page.selectOption('#adminShowroom','gent');await settled();
    await input('easy-water-chloorkorrels').fill('7');
    await page.locator('#adminSaveAllBtn').click();await settled();
    assert.match(await status.textContent(),/1 wijziging\(en\) opgeslagen en gecontroleerd/);
    const waterStock=await page.evaluate(()=>window.fixture.stock);
    assert.equal(waterStock.gent['easy-water-chloorkorrels'],7);
    assert.equal(waterStock.brugge['easy-water-chloorkorrels'],undefined);
    assert.equal(waterStock.kortrijk['easy-water-chloorkorrels'],undefined);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
    console.log('PASS: beheer=1, all catalog rows in all showrooms, Gent cushions/Easy Water, drafts, isolated saves, refresh, invalid/failing saves, mobile. No live writes.');
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
