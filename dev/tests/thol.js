// วันหยุดราชการ: ทีม A ไม่มีกะวันหยุด (แสดงชื่อวันหยุด) · ทีม B ทำตามรอบปกติ · ทีม A เข้างานวันหยุดไม่ได้
// ผู้ดูแลเพิ่ม/ลบวันหยุดได้ · ล้างข้อมูลทดสอบ: เลือกหมวด+ช่วงวันที่ → นับ → ถามยืนยัน → ลบ · บัญชีผู้ใช้ไม่ถูกลบ
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
async function open(iso,u,pw){
  const ctx=await b.newContext({viewport:{width:1100,height:900},permissions:['geolocation'],geolocation:{latitude:13.7,longitude:100.5}});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));
  await p.clock.install({time:new Date(iso)});
  await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
  await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(800);
  return {ctx,p};
}
// 1) ตารางกะสัปดาห์ 7–13 ธ.ค. 2569: จ. 7 (ชดเชยวันพ่อ) และ พฤ. 10 (รัฐธรรมนูญ) ทีม A ไม่มีกะ
{const {ctx,p}=await open('2026-12-02T10:00:00+07:00','admin','Admin@2026');
 await p.click('#nav [data-v=schedule]');await p.waitForTimeout(200);
 await p.click('#main .seg button:has-text("สัปดาห์")');await p.waitForTimeout(200);
 await p.click('[data-act=sched-nav][data-n="1"]');await p.waitForTimeout(300);
 const hol=await p.$$eval('#main .cell.hol',e=>e.map(x=>x.textContent.trim()));
 ok(hol.length>=8&&hol.some(t=>t.includes('ชดเชยวันพ่อแห่งชาติ'))&&hol.some(t=>t.includes('วันรัฐธรรมนูญ')),'team A: holiday cells show holiday name ('+hol.length+')');
 ok(!(await p.$$eval('[data-act=edit-slot]',e=>e.map(x=>x.dataset.d))).some(d=>d==='2026-12-07'||d==='2026-12-10'),'team A: no editable shift on holidays');
 ok((await p.$$eval('[data-act=edit-slot]',e=>e.map(x=>x.dataset.d))).includes('2026-12-08'),'team A: normal weekday still has shifts');
 // ทีม B ทำตามรอบปกติ (ไม่สนวันหยุด)
 await p.click('#main .seg button:has-text("ทีม B")');await p.waitForTimeout(300);
 ok((await p.$$eval('#main .cell.hol',e=>e.length))===0,'team B: no holiday cells (works normal cycle)');
 ok((await p.$$eval('[data-act=edit-slot]',e=>e.map(x=>x.dataset.d))).includes('2026-12-07'),'team B: still works Mon 7 Dec (holiday) as usual');
 // วันรายวัน: ข้อความวันหยุด
 await p.click('#main .seg button:has-text("ทีม A")');await p.click('#main .seg button:has-text("รายวัน")');await p.waitForTimeout(200);
 await p.evaluate(()=>{});
 await ctx.close();}
// 2) ทีม A เข้างานวันหยุดไม่ได้ (malee ทีม A · จ. 7 ธ.ค. ทั้งวัน)
{let can=false;for(const hm of ['08:05','09:35','10:05','17:35','23:05']){const {ctx,p}=await open('2026-12-07T'+hm+':00+07:00','malee','Temp1234!');if(await p.$('#main [data-act=checkin]'))can=true;await ctx.close();}
 ok(!can,'team A member cannot check in on a public holiday');
 let can2=false;for(const hm of ['08:05','09:35','10:05','17:35','23:05']){const {ctx,p}=await open('2026-12-08T'+hm+':00+07:00','malee','Temp1234!');if(await p.$('#main [data-act=checkin]'))can2=true;await ctx.close();}
 ok(can2,'team A member can check in on the next normal weekday');}
// 3) ผู้ดูแลเพิ่ม/ลบวันหยุด + ล้างข้อมูล
{const {ctx,p}=await open('2026-12-02T10:00:00+07:00','admin','Admin@2026');
 await p.click('#nav [data-v=profile]');await p.click('#main [data-act=tab][data-v=settings]');await p.waitForTimeout(300);
 ok(await p.$('#holCard')!==null&&await p.$('#clrCard')!==null,'settings has holiday + clear-data cards');
 // แท็บหมวด + ตารางการ์ด · กด "เปิด" → popup · ปิดด้วย ✕ / พื้นหลัง / Esc
 const vis=sel=>p.$eval(sel,e=>!!e.getClientRects().length).catch(()=>false);
 const tiles=()=>p.$$eval('#main .stile:not([hidden])',e=>e.map(x=>x.dataset.tile));
 ok(!(await vis('[data-act=save-rules]'))&&!(await vis('[data-act=hol-add]'))&&!(await vis('[data-act=clr-check]')),'settings show as a card grid (no feature open)');
 ok(JSON.stringify(await tiles())===JSON.stringify(['rota','rotab','hol','lvq','rules','push','export','import','sim','clr']),'grid has every feature ('+(await tiles()).join(',')+')');
 ok((await p.$$eval('#main .settabs [data-set-tab]',e=>e.map(x=>x.textContent)).catch(()=>[])).join('|')==='ทั้งหมด|กะ & ทีม|วันหยุด|วันลา|กฎ|นำเข้า/ส่งออก|ทดสอบ','tab bar: all / shifts / holidays / rules / import-export / testing');
 for(const [tab,want] of [['shift',['rota','rotab']],['hol',['hol']],['leave',['lvq']],['rule',['rules','push']],['io',['export','import']],['test',['sim','clr']],['all',['rota','rotab','hol','lvq','rules','push','export','import','sim','clr']]]){
   await p.click('[data-set-tab='+tab+']');await p.waitForTimeout(80);
   ok(JSON.stringify(await tiles())===JSON.stringify(want)&&(await p.$eval('[data-set-tab='+tab+']',e=>e.getAttribute('aria-selected')))==='true','tab "'+tab+'" shows '+want.join(','));
 }
 await p.click('[data-set-open=rules]');await p.waitForTimeout(150);
 ok(await vis('[data-act=save-rules]')&&await vis('#main .spbg.on'),'"Open" shows the feature in a popup over a backdrop');
 await p.click('#main section.spop.open .spx');await p.waitForTimeout(150);
 ok(!(await vis('[data-act=save-rules]')),'✕ closes the popup');
 await p.click('[data-set-open=hol]');await p.waitForTimeout(150);
 ok(await vis('[data-act=hol-add]'),'another feature opens');
 await p.mouse.click(5,5);await p.waitForTimeout(150);
 ok(!(await vis('[data-act=hol-add]')),'tap on the backdrop closes');
 await p.click('[data-set-open=rules]');await p.waitForTimeout(150);await p.keyboard.press('Escape');await p.waitForTimeout(150);
 ok(!(await vis('[data-act=save-rules]')),'Esc closes');
 await p.click('[data-set-open=rules]');await p.fill('#setOpen','30');await p.click('[data-act=save-rules]');await p.waitForTimeout(400);
 ok(await vis('[data-act=save-rules]'),'popup stays open after saving (page re-render)');
 await p.click('#main section.spop.open .spx');await p.waitForTimeout(100);
 await p.click('[data-set-open=sim]');await p.waitForTimeout(250);
 ok((await p.textContent('#main h1')).includes('ทดสอบ'),'check-in test opens its own page');
 await p.click('#nav [data-v=profile]');await p.click('#main [data-act=tab][data-v=settings]');await p.waitForTimeout(250);
 // เพิ่มวันหยุดพิเศษ 9 ธ.ค. (วันที่ตั้งผ่านตัวเลือกวันที่)
 await p.evaluate(()=>{});
await p.evaluate(()=>{const o=document.querySelector('#main section.spop.open .spx');if(o)o.click();});await p.click('[data-set-open=hol]');await p.waitForTimeout(150);
 const n0=await p.$$eval('#holCard .hrow',e=>e.length);
 await p.click('[data-act=hol-add]');await p.waitForTimeout(150);
 ok((await p.textContent('#holCard')).includes('ใส่ชื่อวันหยุด'),'holiday name required');
 await p.fill('#holN','วันหยุดพิเศษทดสอบ');await p.click('[data-act=hol-add]');await p.waitForTimeout(300);
 ok((await p.$$eval('#holCard .hrow',e=>e.length))===n0+1&&(await p.textContent('#holCard')).includes('วันหยุดพิเศษทดสอบ'),'admin adds a holiday (today 2 Dec)');
 const dbh=await p.evaluate(()=>window.__mockdb.holidays.find(h=>h.d==='2026-12-02'));
 ok(dbh&&dbh.name==='วันหยุดพิเศษทดสอบ','holiday saved via admin_set_holiday');
 await p.click('[data-act=hol-del][data-d="2026-12-02"]');await p.waitForTimeout(150);
 ok(await p.$('[data-act=hol-del-yes][data-d="2026-12-02"]')!==null,'delete holiday asks to confirm');
 await p.click('[data-act=hol-del-yes][data-d="2026-12-02"]');await p.waitForTimeout(300);
 ok(!(await p.evaluate(()=>window.__mockdb.holidays.some(h=>h.d==='2026-12-02'))),'holiday deleted');
 // ล้างข้อมูล
 const before=await p.evaluate(()=>{const d=window.__mockdb;return {att:d.attendance.length,ov:d.overrides.length,lv:d.leaves.length,nt:d.notifications.length,pr:d.profiles.length,hol:d.holidays.length};});
 ok(before.att>0&&before.nt>0,'mock has data to clear');
await p.evaluate(()=>{const o=document.querySelector('#main section.spop.open .spx');if(o)o.click();});await p.click('[data-set-open=clr]');await p.waitForTimeout(150);
 await p.evaluate(()=>{document.querySelectorAll('[data-clr]').forEach(x=>{x.checked=false;x.dispatchEvent(new Event('change',{bubbles:true}));});});
 await p.click('[data-act=clr-check]');await p.waitForTimeout(200);
 ok((await p.textContent('#clrCard')).includes('เลือกอย่างน้อย 1 อย่าง'),'must choose at least one category');
 for(const k of ['att','sched','notif'])await p.check('[data-clr='+k+']');
 await p.click('[data-act=clr-check]');await p.waitForTimeout(300);
 const askTxt=await p.textContent('#clrCard');
 ok(askTxt.includes('ต้องการล้างข้อมูลจริงหรือไม่')&&askTxt.includes('ลงเวลา '),'asks for confirmation with counts');
 ok((await p.evaluate(()=>window.__mockdb.attendance.length))===before.att,'nothing deleted before confirming');
 await p.click('[data-act=clr-no]');await p.waitForTimeout(150);
 ok(await p.$('[data-act=clr-yes]')===null&&(await p.evaluate(()=>window.__mockdb.attendance.length))===before.att,'cancel keeps data');
 await p.click('[data-act=clr-check]');await p.waitForTimeout(300);await p.click('[data-act=clr-yes]');await p.waitForTimeout(600);
 const after=await p.evaluate(()=>{const d=window.__mockdb,inR=x=>x>='2026-01-01'&&x<='2026-12-02';return {att:d.attendance.filter(x=>inR(x.work_date)).length,ov:d.overrides.filter(x=>inR(x.work_date)).length,nt:d.notifications.length,pr:d.profiles.length,hol:d.holidays.length};});
 ok(after.att===0&&after.ov===0,'check-ins and days off in range cleared');
 ok(after.nt===0,'notifications cleared');
 ok(after.pr===before.pr,'user accounts NOT deleted ('+after.pr+')');
 ok(after.hol===before.hol,'holidays NOT deleted');
 ok((await p.textContent('#clrCard')).includes('ล้างข้อมูลแล้ว'),'shows "cleared"');
 await ctx.close();}
// 4) พนักงานไม่เห็นการ์ดตั้งค่าระบบ
{const {ctx,p}=await open('2026-12-02T10:00:00+07:00','malee','Temp1234!');
 await p.click('#nav [data-v=profile]');await p.waitForTimeout(200);
 ok(await p.$('#main [data-v=settings]')===null&&await p.$('#clrCard')===null,'staff cannot reach clear-data');await ctx.close();}
await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
