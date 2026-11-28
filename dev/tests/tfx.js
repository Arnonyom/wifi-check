// 29 พ.ย. 2569: ถามยืนยันทุกปุ่ม ส่ง/อนุมัติ/บันทึก · toast สำเร็จ (มีเครื่องหมายถูก แล้วหายไป) · ขั้นตอนคำขอลา · ปุ่มส่งมีไอคอน
// รหัสผิด: การ์ดสั่น + ช่องสีแดง · กระดิ่งขยับ · KPI นับขึ้น/กราฟวิ่ง · ธีม กลางวัน/กลางคืน/White · กำหนดสีเอง สว่าง/มืด/แก้ว
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const ctx=await b.newContext({viewport:{width:1100,height:900}});const p=await ctx.newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-12-01T10:00:00+07:00')});
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
const vis=sel=>p.$eval(sel,e=>!!e.getClientRects().length).catch(()=>false);
const calls=n=>p.evaluate(n=>window.__calls.filter(c=>c[0]==='rpc'&&c[1]===n).map(c=>c[2]),n);
const login=async(u,pw)=>{await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(800);};
const logout=async()=>{await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);};

// ---------- ล็อกอินรหัสผิด ----------
await p.fill('#lu','malee');await p.fill('#lp','wrongpass1');await p.click('#lbtn');await p.waitForTimeout(150);
ok(await p.$('.login-wrap .hero.shake')!==null,'wrong password: card shakes');
ok(await p.$('#lu.bad')!==null&&await p.$('#lp.bad[aria-invalid=true]')!==null,'wrong password: fields turn red');
ok((await p.textContent('#lerr')).includes('ไม่ถูกต้อง')&&await p.$eval('#lerr',e=>getComputedStyle(e).color)!==await p.$eval('#lu',e=>getComputedStyle(e).color),'wrong password: red message');
await p.fill('#lp','x');ok(await p.$('#lp.bad')===null,'typing again clears the red');
await p.fill('#lp','Temp1234!');await p.click('#lbtn');await p.waitForTimeout(800);

// ---------- พนักงาน: ส่งคำขอลา ----------
await p.click('#nav [data-v=leave]');await p.waitForTimeout(200);
ok(await p.$('[data-act=lv-submit] svg.sendic')!==null,'send button has a send icon');
await p.click('[data-act=lv-submit]');await p.waitForTimeout(150);
ok(await vis('#cfbox .cfm')&&(await p.textContent('#cfbox')).includes('ส่งคำขอลาพักร้อน'),'send asks to confirm (shows what will be sent)');
await p.click('#cfbox [data-cf=no]');await p.waitForTimeout(150);
ok(!(await vis('#cfbox .cfm'))&&(await calls('request_leave')).length===0,'cancel: nothing sent');
await p.click('[data-act=lv-submit]');await p.waitForTimeout(100);await p.click('#cfbox [data-cf=yes]');await p.waitForTimeout(400);
ok((await calls('request_leave')).length===1,'confirm: request sent');
ok(await vis('#toast .toast.ok .tok svg'),'success toast with check mark');
ok(await vis('.lvitem.new .lvflow .fs.cur')&&(await p.textContent('.lvitem.new .lvflow')).includes('รอผู้ดูแลอนุมัติ'),'new request shows flow: sent → waiting for admin');
ok((await p.$$eval('.lvitem.new .lvflow .fs',e=>e.map(x=>x.className))).join(',')==='fs done,fs cur,fs todo','flow steps: done / current / to do');
await p.clock.runFor(4000);await p.waitForTimeout(100);
ok((await p.$$('#toast .toast.ok')).length===0,'success toast disappears by itself');
// ยกเลิกคำขอก็ถามก่อน
await p.click('.lvitem.new [data-act=lv-cancel]');await p.waitForTimeout(100);
ok((await p.textContent('#cfbox')).includes('ยกเลิกคำขอลานี้'),'cancel request asks to confirm');
await p.keyboard.press('Escape');await p.waitForTimeout(100);
ok(!(await vis('#cfbox .cfm'))&&(await calls('cancel_leave')).length===0,'Esc closes, request not cancelled');
// คำขอที่อนุมัติแล้ว: ขั้นตอนครบ
await logout();

// ---------- ผู้ดูแล ----------
await login('admin','Admin@2026');
await p.waitForTimeout(400);
ok(await p.$('.bellwrap [data-act=bell].bswing')!==null,'bell swings when there are unread notifications');
// KPI + กราฟวิ่ง
await p.click('#nav [data-v=report]');await p.click('[data-act=rsec][data-s=stats]');await p.waitForTimeout(60);
ok(await p.$('#main.anim')!==null,'stats: charts animate when opened');
const k0=await p.$eval('#main .kpi b.tnum',e=>e.textContent);await p.waitForTimeout(1200);const k1=await p.$eval('#main .kpi b.tnum',e=>e.textContent);
ok(k0!==k1||k1==='0','KPI counts up ('+k0+' → '+k1+')');
await p.click('#nav [data-v=today]');await p.waitForTimeout(1200);
// อนุมัติต้องยืนยัน
await p.click('#nav [data-v=leaves]');await p.waitForTimeout(200);
ok((await p.$$('#main .lvcard .lvflow')).length>0,'admin leave cards show the flow');
await p.click('[data-act=lv-open] >> nth=0');await p.waitForTimeout(150);await p.click('[data-act=lv-approve]');await p.waitForTimeout(100);
ok((await p.textContent('#cfbox')).includes('อนุมัติ'),'approve asks to confirm');
await p.click('#cfbox [data-cf=no]');ok((await calls('approve_leave')).length===0,'approve cancelled: nothing saved');
await p.click('[data-act=lv-approve]');await p.click('#cfbox [data-cf=yes]');await p.waitForTimeout(300);
ok((await calls('approve_leave')).length===1,'approve confirmed: saved');
// บันทึกกฎต้องยืนยัน
await p.click('#nav [data-v=profile]');await p.click('#main .admtool');await p.waitForTimeout(200);await p.click('[data-set-open=rules]');await p.fill('#setOpen','45');await p.click('[data-act=save-rules]');await p.waitForTimeout(100);
ok(await vis('#cfbox .cfm')&&(await p.textContent('#cfbox')).includes('บันทึกกฎ'),'save rules asks to confirm');
await p.click('#cfbox [data-cf=yes]');await p.waitForTimeout(300);
ok(await p.evaluate(()=>window.__mockdb.settings[0].open_before===45),'rules saved after confirm');
await p.click('#main section.spop.open .spx');
// ธีม
await p.click('[data-act=theme]');
ok(JSON.stringify(await p.$$eval('.thpop .thopt[data-act=theme-set]',e=>e.map(x=>x.textContent.trim())))===JSON.stringify(['White','Black','Liquid Glass','กำหนดสีเอง']),'theme buttons: White / Black / Glass / Custom');
// โหมดกลางวัน/กลางคืน เป็นสวิตช์
ok(await p.$('.thpop .daysw[role=switch][aria-checked=false].on')!==null&&(await p.textContent('.thpop .daysw')).includes('โหมดกลางวัน'),'day/night toggle: day now');
await p.click('.thpop .daysw');await p.waitForTimeout(100);
ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))!=='dark'&&(await p.textContent('.thpop .gask')).includes('กลางคืน'),'toggle asks to confirm night mode');
await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='dark'&&await p.$('.thpop .daysw[aria-checked=true]')!==null&&(await p.textContent('.thpop .daysw')).includes('โหมดกลางคืน'),'night mode on, toggle shows night');
await p.click('.thpop .daysw');await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='light','toggle back to day');
await p.click('[data-act=theme-set][data-t=white]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)==='rgb(255, 255, 255)','White theme: pure white');
await p.click('[data-act=theme-set][data-t=custom]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
ok(JSON.stringify(await p.$$eval('.thpop [data-act=cust-base]',e=>e.map(x=>x.textContent.trim())))===JSON.stringify(['สว่าง','มืด','แก้ว']),'custom: Light / Dark / Glass');
await p.click('[data-act=cust-pick][data-c="#9B51E0"]');await p.click('[data-act=cust-base][data-b=glass]');await p.waitForTimeout(100);
ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme')==='glass'&&document.documentElement.hasAttribute('data-cust')),'custom glass previews as glass');
await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
await p.waitForTimeout(400);ok(await p.evaluate(()=>{const c=window.__mockdb.profiles.find(x=>x.id==='e0').prefs.custom;return c.base==='glass'&&c.c==='#9B51E0';}),'custom glass saved (to this account)');
ok(await p.$('.thpop .thopt.on[data-t=custom]')!==null&&await vis('#glassRange'),'custom glass: still shown as "custom" + transparency slider');
ok((await p.evaluate(()=>getComputedStyle(document.body).backgroundImage)).includes('radial-gradient'),'custom glass: colored glass background');
if(!(await p.$('.thpop')))await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);
ok(!(await p.evaluate(()=>document.documentElement.hasAttribute('data-cust'))),'signed out: device theme (not the account color)');
await login('admin','Admin@2026');
ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme')==='glass'&&document.documentElement.hasAttribute('data-cust')),'custom glass back after signing in again');
await ctx.close();await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
