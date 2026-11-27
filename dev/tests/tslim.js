// ลดความซ้ำซ้อน (patch_slim): เมนู 6 ปุ่ม · ภาพรวมสั้นลง · รายงานแบ่ง 3 ส่วน · ทดสอบอยู่ในตั้งค่า
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{if(!c)errs.push('FAIL: '+m);};
for(const [vp,tag] of [[{width:1280,height:900},'d'],[{width:390,height:844},'m']]){
const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
const tabs=await p.$$eval('#nav [data-act=tab]',a=>a.map(x=>x.dataset.v));
console.log(tag,'tabs',tabs.join(','));ok(tabs.length===6&&!tabs.includes('sim')&&!tabs.includes('settings')&&tabs[5]==='profile','nav has 6 tabs: settings moved into profile (last tab)');
const h3=async()=>p.$$eval('#main h2,#main h3',e=>e.map(x=>x.textContent.trim()));
let H=await h3();
ok(!H.includes('ปฏิทินสถานะรายวัน'),'overview has no calendar');ok(!H.includes('คำขอลาที่รออนุมัติ'),'overview has no pending list');
ok(!H.includes('สถิติย้อนหลัง'),'overview has no stats');ok(H.some(x=>x.startsWith('ใครหยุด ใครทำแทน')),'overview keeps upcoming cover');
ok(await p.$('[data-k="now:pend"]'),'pending KPI still there');
const hT=await p.evaluate(()=>document.documentElement.scrollHeight);console.log(tag,'overview height',hT);if(tag==='m')ok(hT<2500,'overview short on phone');
// KPI pending -> detail -> leaves page
await p.click('[data-k="now:pend"]');await p.waitForTimeout(150);console.log(tag,'pend detail',await p.textContent('#dTitle'));await p.click('[data-act=det-close]');
await p.click('#nav [data-act=tab][data-v=report]');await p.waitForTimeout(200);
H=await h3();const cals=H.filter(x=>x.startsWith('ปฏิทิน'));console.log(tag,'report/cal',cals.join(','));ok(cals.length===1,'one calendar in report');
await p.click('[data-act=rsec][data-s=stats]');await p.waitForTimeout(200);H=await h3();ok(H.includes('สถิติย้อนหลัง')&&H.includes('ควรติดตาม'),'stats section');
await p.click('[data-act=dash][data-n="7"]');await p.waitForTimeout(150);ok(await p.$eval('[data-act=dash][data-n="7"]',e=>e.getAttribute('aria-pressed'))==='true','7-day toggle');
ok(await p.$eval('[data-act=rsec][data-s=stats]',e=>e.getAttribute('aria-pressed'))==='true','still on stats after toggle');
await p.click('[data-act=rsec][data-s=table]');await p.waitForTimeout(200);H=await h3();ok(H.includes('รายละเอียดรายกะ')&&H.includes('ใครลืมลงเวลามากที่สุด'),'table section');
ok(await p.$('.sum'),'summary in table section');
await p.click('#nav [data-act=tab][data-v=today]');await p.click('#nav [data-act=tab][data-v=report]');
ok(await p.$eval('[data-act=rsec][data-s=table]',e=>e.getAttribute('aria-pressed'))==='true','report remembers section');
// sim via settings
await p.click('#nav [data-act=tab][data-v=profile]');await p.click('#main [data-act=tab][data-v=settings]');await p.click('#main [data-set-open=sim]');await p.waitForTimeout(200);
ok((await p.textContent('#main h1')).includes('ทดสอบ'),'sim opens from settings');
ok(await p.$eval('#nav [data-act=tab][data-v=profile]',e=>e.getAttribute('aria-current'))==='page','profile tab lit on sim');
await p.click('#main [data-act=tab][data-v=settings]');await p.waitForTimeout(150);ok((await p.textContent('#main h1')).includes('ตั้งค่า'),'back to settings');
if(tag==='m'){await p.click('#nav [data-act=tab][data-v=report]');await p.click('[data-act=rsec][data-s=cal]');await p.waitForTimeout(200);await p.screenshot({path:S+'slim_rep_m.png'});}
await p.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
