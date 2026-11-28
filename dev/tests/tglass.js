const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vp,tag] of [[{width:1280,height:860},'d'],[{width:390,height:844},'m']]){
const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
await p.click('[data-act=theme]');await p.click('[data-act=theme-set][data-t=glass]');await p.click('.thpop [data-act=gear-yes]');await p.waitForTimeout(200);await p.click('[data-act=theme]');await p.waitForTimeout(100);
for(const v of [15,70]){
  await p.evaluate(v=>{localStorage.setItem('wc-glass',String(v));},v);
  await p.click('[data-act=theme]');await p.$eval('#glassRange',(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},v);await p.waitForTimeout(600);
  await p.screenshot({path:S+`g_${tag}_${v}_theme.png`});await p.click('[data-act=theme]');await p.waitForTimeout(200);
  await p.click('[data-k="now:pend"]');await p.waitForTimeout(600);await p.screenshot({path:S+`g_${tag}_${v}_detail.png`});await p.click('[data-act=det-close]');await p.waitForTimeout(200);
  await p.click('#nav [data-act=tab][data-v=profile]');await p.waitForTimeout(150);await p.click('[data-act=theme]');await p.click('.thpop [data-act=pw-self]');await p.waitForTimeout(600);await p.screenshot({path:S+`g_${tag}_${v}_pw.png`});await p.click('[data-act=pw-close]');await p.waitForTimeout(200);
  await p.click('[data-act=bell]');await p.waitForTimeout(600);await p.screenshot({path:S+`g_${tag}_${v}_bell.png`});await p.$eval('[data-act=bell]',e=>e.click()); /* หน้าตัวอย่างมีแถบเหลือง ป๊อปอัปจึงทับปุ่ม */await p.waitForTimeout(200);
  await p.click('#nav [data-act=tab][data-v=today]');await p.waitForTimeout(200);
}
await p.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
