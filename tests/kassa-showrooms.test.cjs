const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'kleineproducten.json')));
const cache = new Map();
const context = vm.createContext({
  console, document: { getElementById: () => ({}), addEventListener() {} },
  localStorage: { getItem: k => cache.get(k), setItem: (k,v) => cache.set(k,v), removeItem: k => cache.delete(k) },
  fetch: async () => ({ ok: true, json: async () => ({ gent: { filter: 7 }, brugge: { filter: 13 } }) })
});
vm.runInContext(fs.readFileSync(path.join(root, 'kassa-stock.js'), 'utf8'), context);
async function main() {
  context.catalog = catalog;
  vm.runInContext('products = catalog.map(p => ({...p, showrooms:p.showrooms || []}));', context);
  assert.equal(vm.runInContext('SHOWROOMS.kortrijk', context), 'Kortrijk');
  vm.runInContext("adminDraftsByShowroom.kortrijk.filter = 36", context);
  assert.equal(vm.runInContext('Object.keys(adminDraftsByShowroom.brugge).length', context), 0);
  assert.equal(vm.runInContext('Object.keys(adminDraftsByShowroom.gent).length', context), 0);
  const api = vm.runInContext('createLocalStockApi()', context);
  const items = [{id:'filter'}];
  assert.equal((await api.getStock('kortrijk',items)).filter, 0, 'Never copy another showroom on first use');
  const key = vm.runInContext('STORAGE_KEYS.localStock', context);
  cache.set(key, JSON.stringify({gent:{filter:7},brugge:{filter:13}}));
  assert.equal((await api.getStock('kortrijk',items)).filter, 0, 'Old saved stock remains compatible');
  await api.setStock('kortrijk',items[0],36);
  await api.sell('kortrijk',[{id:'filter',qty:2}],items);
  assert.equal((await api.getStock('kortrijk',items)).filter,34);
  assert.equal((await api.getStock('gent',items)).filter,7);
  assert.equal((await api.getStock('brugge',items)).filter,13);
  vm.runInContext("currentShowroom='kortrijk'",context);
  const visible = vm.runInContext('getShowroomProducts().map(p=>p.id)', context);
  for (const id of ['broodkussen-wit','spagoedkoop-brood-kussentje','easy-water-chloortablet','chloordrijver','myspa-vogue-filter','aquacheck-teststrips-ph-chloor','easy-water-tube-clean','spa-balancer-1l','easy-water-ph-plus','easy-water-ph-min','easy-water-chloorkorrels']) assert.ok(visible.includes(id), id);
  assert.ok(visible.includes('easy-water-foam-down'), 'Foam Down is available with its confirmed price, without seeding stock');
  assert.ok(!visible.includes('insparation-eucalyptus-mint'), 'Brugge-only product stays restricted');
  const calls = [];
  const client = { rpc:async(name,args)=>{calls.push({name,args});return {error:null};}, from:()=>({select(){return this;},in(){return this;},eq(key,value){calls.push({key,value});return this;},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve);}}) };
  context.client=client;
  const remote=vm.runInContext('createSupabaseStockApi(client)',context);
  await remote.setStock('kortrijk',{id:'filter',title:'Filter'},36);
  await remote.sell('kortrijk',[{id:'filter',title:'Filter',qty:1,price:45}],items,'Bancontact');
  assert.equal(calls[0].args.p_showroom,'kortrijk');
  assert.equal(calls[1].args.p_showroom,'kortrijk');
  assert.ok(calls.some(c=>c.key==='showroom'&&c.value==='kortrijk'));
  const html=fs.readFileSync(path.join(root,'kassa.html'),'utf8');
  for(const id of ['gent','brugge','kortrijk']) {
    assert.ok(html.includes(`data-showroom="${id}"`));
    assert.ok(html.includes(`<option value="${id}">`));
  }
  console.log('PASS: three showrooms, isolated stock/drafts/sales, old local cache, catalog visibility and Supabase routing');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
