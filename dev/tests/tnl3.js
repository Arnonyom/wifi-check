const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
await p.fill('#lu','malee');await p.fill('#lp','Temp1234!');await p.click('#lbtn');await p.waitForTimeout(800);
console.log('forced?',!!await p.$('#forceForm'));
await p.click('[data-act=bell]');await p.waitForTimeout(200);
const items=await p.$$eval('[data-act=read]',es=>es.map(e=>e.dataset.id+' '+e.querySelector('b').textContent+' => '+((e.querySelector('.notego')||{}).textContent||'-')));
console.log(items.join('\n'));
await p.screenshot({path:S+'nl_staff.png'});
if(items.length){await p.click('[data-act=read]');await p.waitForTimeout(300);console.log('tab:',await p.evaluate(()=>(document.querySelector('[data-act=tab][aria-current]')||{}).dataset.v));}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
