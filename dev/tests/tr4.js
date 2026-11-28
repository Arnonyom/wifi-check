// 29 พ.ย. 2569 (บ่าย): สำรองข้อมูลเป็น Excel · Admin tool ใต้การ์ดโปรไฟล์ · ไม่มีการ์ดแจ้งเตือนบนมือถือ · ไม่โฟกัสช่องพิมพ์เอง (iOS)
// ช่องเลือกคนไม่ถูกโฟกัสซ้ำ (iOS) · สถิติเลือกช่วงได้ถึง 1 ปี / กำหนดเอง · แถบสีด้านบนตามธีม
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const ctx=await b.newContext({viewport:{width:1100,height:900},acceptDownloads:true});const p=await ctx.newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-12-01T10:00:00+07:00')});
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
const meta=()=>p.$eval('meta[name=theme-color]',e=>e.content);
ok(await meta()==='rgb(243, 248, 238)','top bar color = day theme background');
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(800);
// โปรไฟล์: Admin tool อยู่ใต้การ์ดโปรไฟล์
await p.click('#nav [data-v=profile]');await p.waitForTimeout(200);
ok(await p.$eval('#main .profwrap',w=>{const k=[...w.children];return k.indexOf(w.querySelector('.admtool'))===2&&k[1].querySelector('.phd')!==null;}),'Admin tool card is right under the profile card');
// Admin tool
await p.click('#main .admtool');await p.waitForTimeout(250);
const tiles=await p.$$eval('#main .stile:not([hidden])',e=>e.map(x=>x.dataset.tile));
ok(!tiles.includes('push')&&await p.$('#main section.spop[data-acc=push]')===null,'no mobile-notification card in Admin tool');
await p.click('[data-set-tab=io]');await p.waitForTimeout(80);
ok(JSON.stringify(await p.$$eval('#main .stile:not([hidden])',e=>e.map(x=>x.dataset.tile)))==='["export","import","bk"]','import/export tab has backup card');
await p.click('[data-set-tab=all]');
// iOS: เปิดกฎการลงเวลา ไม่โฟกัสช่องตัวเลข
await p.click('[data-set-open=rules]');await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.activeElement&&document.activeElement.classList.contains('spx')),'opening a popup focuses the close button, not the number field (no keyboard pop-up)');
await p.click('#main section.spop.open .spx');
// สำรองข้อมูล
await p.click('[data-set-open=bk]');await p.waitForTimeout(150);
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act=bk-run]')]);
const fp=await dl.path();const buf=require('fs').readFileSync(fp);const txt=buf.toString('latin1');
ok(/^wifi-check-backup-2026-12-01-\d{4}\.xlsx$/.test(dl.suggestedFilename()),'backup file name ('+dl.suggestedFilename()+')');
const wb=buf.toString('utf8');
ok(['บัญชีผู้ใช้','ลงเวลา','การลา','สิทธิ์วันลา','วันหยุด','แจ้งเตือน'].every(n=>wb.includes('name="'+n+'"')),'backup has a sheet per category');
ok(txt.includes('xl/worksheets/sheet12.xml'),'12 sheets');
ok(!wb.includes('>avatar<')&&!wb.includes('>prefs<')&&wb.includes('>emp_name<'),'no photos/prefs columns · employee names added next to ids');
await p.waitForTimeout(200);ok((await p.textContent('#bkCard')).includes('ดาวน์โหลดแล้ว'),'backup done message');
await p.click('#main section.spop.open .spx');
// สถิติ
await p.click('#nav [data-v=report]');await p.click('[data-act=rsec][data-s=stats]');await p.waitForTimeout(300);
ok(JSON.stringify(await p.$$eval('.dseg button',e=>e.map(x=>x.textContent)))===JSON.stringify(['7 วัน','30 วัน','90 วัน','180 วัน','1 ปี','กำหนดเอง']),'period choices: 7 / 30 / 90 / 180 days / 1 year / custom');
await p.selectOption('#dashEmp','e3');await p.waitForTimeout(250);
ok(await p.evaluate(()=>!document.activeElement||document.activeElement.id!=='dashEmp'),'person dropdown is not re-focused after choosing (iOS reopened it)');
await p.selectOption('#dashEmp','');await p.waitForTimeout(200);
await p.click('.dseg [data-n="365"]');await p.waitForTimeout(600);
ok((await p.textContent('.dsinfo')).includes('365 วัน')&&(await p.textContent('.dsinfo')).includes('รายสัปดาห์'),'1 year: 365 days, daily charts by week');
const bars=await p.$$eval('#main .chartcard svg.chart',s=>s[0].querySelectorAll('.bar').length);
ok(bars>0&&bars<=53*3,'daily chart grouped by week ('+bars+' bars)');
ok(await p.evaluate(()=>window.__calls.filter(c=>c[0]==='rpc'&&c[1]==='server_now').length)>=2,'older data loaded for the long period');
await p.click('.dseg [data-n="30"]');await p.waitForTimeout(150);await p.click('.dseg [data-act=dash-custom]');await p.waitForTimeout(200);
ok(await p.$('.dsrange [data-id=dsFrom]')!==null&&await p.$('.dsrange [data-id=dsTo]')!==null,'custom: from / to dates');
await p.click('.dsrange [data-id=dsFrom]');await p.waitForTimeout(100);if(!(await p.$('[data-act=dp-pick][data-d="2026-11-10"]')))await p.click('[data-act=dp-m][data-n="-1"]');await p.click('[data-act=dp-pick][data-d="2026-11-10"]');await p.waitForTimeout(150);
await p.click('.dsrange [data-id=dsTo]');await p.waitForTimeout(100);if(!(await p.$('[data-act=dp-pick][data-d="2026-11-20"]')))await p.click('[data-act=dp-m][data-n="-1"]');await p.click('[data-act=dp-pick][data-d="2026-11-20"]');await p.waitForTimeout(250);
ok((await p.textContent('.dsinfo')).includes('11 วัน')&&(await p.textContent('.dsinfo')).includes('10 พ.ย.'),'custom range 10–20 Nov = 11 days');
ok((await p.textContent('#main .kpis')).includes('11 วัน'),'KPIs use the custom range');
await p.click('.dseg [data-n="30"]');await p.waitForTimeout(200);
ok(await p.$('.dsrange')===null&&(await p.textContent('.dsinfo')).includes('30 วัน'),'back to 30 days');
// แถบสีด้านบนตามธีม
await p.click('[data-act=theme]');await p.click('.thpop .thopt[data-t=black]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(200);
ok(await meta()==='rgb(0, 0, 0)','top bar color follows Black theme');
await p.click('.thpop .daysw');await p.click('[data-act=gear-yes]');await p.waitForTimeout(200);
ok(await meta()==='rgb(243, 248, 238)','toggle (from Black) → day: top bar follows');
await p.click('.thpop .daysw');await p.click('[data-act=gear-yes]');await p.waitForTimeout(200);
ok(await meta()==='rgb(12, 23, 16)','night mode: top bar follows');
await p.click('.thpop .thopt[data-t=custom]');await p.click('[data-act=gear-yes]');await p.click('[data-act=cust-pick][data-c="#9B51E0"]');await p.waitForTimeout(100);await p.click('[data-act=gear-yes]');await p.waitForTimeout(200);
ok(await meta()!=='rgb(12, 23, 16)'&&await meta()!=='rgb(0, 0, 0)','top bar color follows custom color ('+await meta()+')');
await ctx.close();await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
