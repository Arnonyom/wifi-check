const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
const ids=['nl0','nl1','nl2','nl3','nl4'];
for(const id of ids){
  await p.click('.bellwrap button[aria-haspopup], .bellwrap > button');await p.waitForTimeout(200);
  if(id==='nl0')await p.screenshot({path:S+'nl_bell.png'});
  const hint=await p.$eval('[data-act=read][data-id='+id+']',e=>{const g=e.querySelector('.notego');return e.querySelector('b').textContent+' => '+(g?g.textContent:'-');});
  await p.click('[data-act=read][data-id='+id+']');await p.waitForTimeout(300);
  const st=await p.evaluate(()=>({tab:(document.querySelector('[data-act=tab][aria-current]')||{}).dataset.v,lvf:(document.querySelector('[data-act=lvf][aria-pressed=true],[data-act=lvf].on,[data-act=lvf][aria-current]')||{}).textContent,det:(document.querySelector('#detbox .modal h2,#detbox .modal h3')||{}).textContent,head:(document.querySelector('#main h2,#main h1')||{}).textContent,bell:!!document.querySelector('.pop[aria-label=การแจ้งเตือน]'),badge:(document.querySelector('[data-act=bell]')||{}).getAttribute('aria-label')}));
  await p.keyboard.press('Escape');await p.waitForTimeout(100);
  console.log(hint,'|',JSON.stringify(st));
}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
