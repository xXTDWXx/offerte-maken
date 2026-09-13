const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const elements = new Map();
let markup = '';
class Element {
  constructor(id) { this.id=id; this.value=''; this.hidden=true; this.innerHTML=''; this.textContent=''; this.disabled=false; this.listeners={}; this.classList={add(){},remove(){},toggle(){}}; }
  addEventListener(name, fn) { this.listeners[name]=fn; }
  focus() {}
  reset() {}
  showModal() { this.open=true; }
  close() { this.open=false; }
  replaceChildren() { this.innerHTML=''; }
  scrollIntoView() {}
  fire(event) { return this.listeners[event]?.({preventDefault(){}}); }
}
const el = id => { if(!elements.has(id)) elements.set(id,new Element(id)); return elements.get(id); };
let signedIn=false, signIns=0, queries=0, failLogin=false, rejectReads=false;
const fixtures=Array.from({length:205},(_,i)=>({id:'sale-'+String(i).padStart(3,'0'),showroom:i%2?'gent':'brugge',sold_at:'2026-09-13T10:00:00Z',payment_method:i%2?'Overschrijving':'Bancontact'}));
const itemFixtures=fixtures.flatMap(s=>[
  {id:s.id+'-a',sale_id:s.id,product_title:'Aquafinesse pakket',quantity:2,unit_price:12.50},
  {id:s.id+'-b',sale_id:s.id,product_title:'Filter <script>alert(1)</script>',quantity:3,unit_price:0.10}
]);
class Query {
  constructor(table) { this.table=table; this.filters=[]; this.start=0; this.end=Infinity; }
  select(){return this;} order(){return this;} abortSignal(signal){this.signal=signal;return this;}
  range(start,end){this.start=start;this.end=end;return this;}
  eq(key,value){this.filters.push(row=>row[key]===value);return this;}
  in(key,values){this.filters.push(row=>values.includes(row[key]));return this;}
  gte(key,value){this.filters.push(row=>row[key]>=value);return this;}
  lt(key,value){this.filters.push(row=>row[key]<value);return this;}
  maybeSingle(){assert.equal(this.table,'kassa_pv_readers','PV must check its own read-only role');return Promise.resolve({data:signedIn?{user_id:'admin'}:null,error:null});}
  then(resolve,reject) {
    queries++;
    if (rejectReads || !signedIn) return Promise.resolve({error:{message:'Denied'}}).then(resolve,reject);
    const source=this.table==='showroom_stock_sales'?fixtures:itemFixtures;
    const data=source.filter(row=>this.filters.every(fn=>fn(row))).slice(this.start,this.end+1);
    return Promise.resolve({data,error:null}).then(resolve,reject);
  }
}
const mockClient={
  auth:{
    async signInWithPassword({email}){assert.equal(email,'sunspabrugge+kassapv@gmail.com','PV must not authenticate as the stock administrator');signIns++;signedIn=!failLogin;return failLogin?{error:{message:'Invalid'},data:null}:{data:{user:{id:'admin'}},error:null};},
    async signOut(){signedIn=false;}
  },
  from: table=>new Query(table)
};
const document={body:{insertAdjacentHTML(position,html){markup=html;}},getElementById:el};
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : ['2026-09-13T12:00:00Z'])); }
  static now() { return Date.parse('2026-09-13T12:00:00Z'); }
}
const context={
  document, window:{supabase:{createClient(url,key,options){assert.equal(options.auth.persistSession,false);assert.equal(options.auth.autoRefreshToken,false);return mockClient;}},addEventListener(){}},
  els:{app:el('kassaApp')},STOCK_BACKEND:{mode:'supabase',supabaseUrl:'fixture',supabaseAnonKey:'fixture'},
  ADMIN_LOGIN:{email:'fixture'},SHOWROOMS:{gent:'Gent',brugge:'Brugge'},
  euro:value=>'€ '+Number(value).toLocaleString('nl-BE',{minimumFractionDigits:2,maximumFractionDigits:2}),
  escapeHtml:value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'),
  AbortController, Intl, Date:TestDate, console, setTimeout:()=>1,clearTimeout(){}
};
vm.createContext(context);
let source=fs.readFileSync(root+'/kassa-pv.js','utf8');
source=source.replace(/\}\)\(\);\s*$/, 'this.pvTest = {midnight, addDays, validDay, selectedRange, loadSales, renderPage}; })();');
vm.runInContext(source,context);
const api=context.pvTest;
async function test(){
  assert.equal(queries,0,'No sales query before password');
  assert.equal(api.midnight('2026-03-29'),'2026-03-28T23:00:00.000Z');
  assert.equal(api.midnight('2026-03-30'),'2026-03-29T22:00:00.000Z');
  assert.equal(api.midnight('2026-10-25'),'2026-10-24T22:00:00.000Z');
  assert.equal(api.midnight('2026-10-26'),'2026-10-25T23:00:00.000Z');
  assert.equal(api.addDays('2024-02-28',1),'2024-02-29');
  assert.equal(api.validDay('2026-02-30'),false);
  el('pvPeriod').value='week';el('pvWeek').value='2026-01-01';
  assert.equal(api.selectedRange().from,'2025-12-29');
  assert.equal(api.selectedRange().to,'2026-01-04');
  el('pvPeriod').value='month';el('pvMonth').value='2024-02';
  assert.equal(api.selectedRange().to,'2024-02-29');
  el('pvOpenBtn').fire('click');
  failLogin=true;el('pvPassword').value='fixture';
  await el('pvLoginForm').fire('submit');
  assert.equal(queries,0);
  assert.match(el('pvLoginStatus').textContent,/Aanmelden mislukt/);
  failLogin=false;el('pvPassword').value='fixture';
  await el('pvLoginForm').fire('submit');
  el('pvMonth').value='2026-09';
  await api.loadSales();
  assert.equal(el('pvOverview').hidden,false);
  assert.match(el('pvStatus').textContent,/205 verkopen/);
  assert.match(el('pvSummary').innerHTML,/5.186,50/);
  assert.equal((el('pvSales').innerHTML.match(/class="pv-sale"/g)||[]).length,30);
  assert.match(el('pvSales').innerHTML,/&lt;script&gt;/);
  assert.equal(el('pvPageInfo').textContent,'Pagina 1 van 7');
  el('pvNext').fire('click');
  assert.equal(el('pvPageInfo').textContent,'Pagina 2 van 7');
  el('pvShowroom').value='gent';
  await api.loadSales();
  assert.match(el('pvStatus').textContent,/102 verkopen/);
  assert.match(el('pvSummary').innerHTML,/2.580,60/);
  el('pvPeriod').value='custom';el('pvFrom').value='2026-09-14';el('pvTo').value='2026-09-13';
  await api.loadSales();
  assert.equal(el('pvResults').hidden,true);
  assert.match(el('pvStatus').textContent,/einddatum/);
  el('pvFrom').value='2026-09-14';el('pvTo').value='2026-09-14';
  await api.loadSales();
  assert.match(el('pvSales').innerHTML,/Geen verkopen gevonden/);
  rejectReads=true;
  await api.loadSales();
  assert.equal(el('pvResults').hidden,true);
  rejectReads=false;
  el('pvClose').fire('click');
  assert.equal(el('pvOverview').hidden,true);
  assert.equal(el('pvSales').innerHTML,'');
  assert.equal(signedIn,false);
  el('pvOpenBtn').fire('click');
  assert.equal(el('pvLogin').open,true);
  assert.equal(signIns,2,'Reopening does not reuse a session');
  console.log('PASS: auth gate, failed login, lock/reopen, 205-sale pagination, all-page totals, showroom filter, errors, empty state, escaped titles, leap year, year-crossing week and Brussels DST boundaries.');
}
test().catch(error=>{console.error(error);process.exitCode=1;});
