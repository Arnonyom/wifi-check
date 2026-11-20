// กระดิ่ง: เปิดแล้วตัวเลขหาย · จุดเขียว (ยังไม่อ่าน) ยังอยู่ · ข้อความใหม่ทำให้ตัวเลขกลับมา · ล็อกอินใหม่ตัวเลขไม่กลับมา
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
for(const [u,pw] of [['admin','Admin@2026'],['malee','Temp1234!']]){
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(400);
 // ให้มีข้อความยังไม่อ่านแน่ ๆ
 await p.evaluate(u=>{const db=window.__mockdb,me=db.profiles.find(x=>x.username===u);db.notifications.push({id:'nt1',ts:new Date(Date.now()-6e4).toISOString(),to_ids:[me.id],title:'ทดสอบ',body:'ข้อความทดสอบ',kind:''});},u);
 await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(700);
 const badge=async()=>p.$eval('[data-act=bell]',e=>{const x=e.querySelector('.badge');return x?x.textContent:'';});
 const b0=await badge();ok(b0!=='',u+' badge before open = '+b0);
 await p.click('[data-act=bell]');await p.waitForTimeout(150);
 ok(await badge()==='',u+' badge gone after opening bell');
 const dots=await p.$$eval('.pop .note .dot:not(.read)',e=>e.length);ok(dots>0,u+' green unread dots kept ('+dots+')');
 await p.click('[data-act=bell]');await p.waitForTimeout(100);
 ok(await badge()==='',u+' badge still gone after closing bell');
 // ข้อความใหม่เข้ามา -> ตัวเลขกลับมา 1
 await p.evaluate(u=>{const db=window.__mockdb,me=db.profiles.find(x=>x.username===u);db.notifications.push({id:'nt2',ts:new Date().toISOString(),to_ids:[me.id],title:'ใหม่',body:'ข้อความใหม่',kind:''});},u);
 await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await p.waitForTimeout(500);
 ok(await badge()==='1',u+' new message shows badge 1 (got "'+(await badge())+'")');
 // อ่านข้อความหนึ่ง -> จุดของข้อความนั้นหาย
 await p.click('[data-act=bell]');await p.waitForTimeout(150);
 const before=await p.$$eval('.pop .note .dot:not(.read)',e=>e.length);
 await p.click('.pop .note >> nth=0');await p.waitForTimeout(400);
 if(!(await p.$('.pop')))await p.click('[data-act=bell]');await p.waitForTimeout(150);
 const after=await p.$$eval('.pop .note .dot:not(.read)',e=>e.length);ok(after===before-1,u+' reading one removes its dot ('+before+' -> '+after+')');
 await ctx.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
