const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {
    hidden: true, disabled: false, innerHTML: '', textContent: '',
    classList: {toggle(){}}, addEventListener(){}, querySelectorAll(){return [];}, appendChild(){}
  });
  return elements.get(id);
};
const options = ['Bancontact','Overschrijving','Eigen gebruik','Cadeau klant'].map(value=>({value,checked:false,disabled:false}));
let receipt = '';
let call;
let release;
const context = {
  document: {getElementById:element,addEventListener(){},querySelectorAll(){return options;},createElement(){return {}}},
  window: {open:()=>({document:{open(){},write(text){receipt=text;},close(){}},close(){}})},
  console, Intl, Date, URLSearchParams,
  alert(message){throw Error(message);}
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../kassa-stock.js'),'utf8'),context);
context.fakeSell=async (showroom,items,products,method)=>{
  call={showroom,items,method};
  await new Promise(resolve=>{release=resolve;});
  return {fixture:8};
};
const run=source=>vm.runInContext(source,context);
run("products=[{id:'fixture',title:'Onderhoud',price:25,showrooms:[]}];currentShowroom='brugge';stockByProduct={fixture:10};stockApi={sell:fakeSell};");
(async()=>{
  for(const method of options.map(option=>option.value)){
    run("cart={fixture:2};openCheckout();");
    assert.equal(element('checkoutPrintBtn').disabled,true);
    context.method=method;
    run('checkoutPaymentMethod=method;renderCheckoutSummary(getCheckoutItems());updateCheckoutPrintButton();');
    assert.equal(element('checkoutPrintBtn').disabled,false);
    const expected=method==='Eigen gebruik'||method==='Cadeau klant'?0:25;
    assert.equal(run('getCheckoutItems()[0].price'),expected);
    assert.equal(run('getCartItems()[0].price'),25,'Catalog/cart price must not change');
    const pending=run('completeSaleAndPrint()');
    assert(options.every(input=>input.disabled),'Choices locked during registration');
    run("checkoutPaymentMethod='Changed while pending';");
    release();
    await pending;
    assert.equal(call.method,method);
    assert.equal(call.items[0].price,expected);
    assert.equal(call.items[0].qty,2);
    assert(receipt.includes(method),'Receipt uses the captured choice');
    assert(!receipt.includes('Changed while pending'));
    assert.equal(run('Object.keys(cart).length'),0);
    assert(options.every(input=>!input.disabled));
  }
  run("cart={fixture:2};openCheckout();checkoutPaymentMethod='Cadeau klant';");
  assert.equal(run('getCheckoutItems()[0].lineTotal'),0);
  run("checkoutPaymentMethod='Bancontact';");
  assert.equal(run('getCheckoutItems()[0].lineTotal'),50,'Switching back restores paid total');
  console.log('PASS: all four checkout choices, free amounts, original prices restored, receipt labels, choice locking and captured registration.');
})().catch(error=>{console.error(error);process.exitCode=1;});
