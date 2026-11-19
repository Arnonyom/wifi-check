const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vp,tag] of [[{width:1280,height:900},'d'],[{width:390,height:844},'m']]){
const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
await p.click('[data-act=tab][data-v=report]');await p.click('[data-act=rsec][data-s=table]');await p.waitForTimeout(300);
console.log(tag,'sum:',await p.$eval('.sum',e=>e.innerText.replace(/\s+/g,' ')));
console.log(tag,'forgot:',await p.$$eval('section:has(h3:text("ใครลืมลงเวลามากที่สุด")) .lib',e=>e.slice(0,4).map(x=>x.innerText.replace(/\s+/g,' ')).join(' || ')));
console.log(tag,'remark rows',await p.$$eval('table.rt td',e=>e.filter(x=>x.innerText.includes('ผู้ดูแลลงให้')).length));
const sec=await p.$('section:has(h3:text("ใครลืมลงเวลามากที่สุด"))');await sec.scrollIntoViewIfNeeded();await sec.screenshot({path:S+'rep_forgot_'+tag+'.png'});
const td=await p.$('table.rt td:has-text("ผู้ดูแลลงให้")');if(td){await td.scrollIntoViewIfNeeded();if(tag==='d')await (await td.$('xpath=..')).screenshot({path:S+'rep_row.png'});}
await p.click('section:has(h3:text("ใครลืมลงเวลามากที่สุด")) .lib >> nth=0');await p.waitForTimeout(200);console.log(tag,'click ->',await p.textContent('#dTitle'));await p.click('[data-act=det-close]');
console.log(tag,'excel buttons',await p.$$eval('.xlbtn',e=>e.map(x=>x.dataset.act).join(',')));
await p.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
