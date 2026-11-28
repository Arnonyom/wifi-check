// 28 พ.ย. 2569: วันลา (กติกาใหม่ + จำนวนวัน · สิทธิ์รายคน · ผู้ดูแลลาแทน · การ์ดรายงาน) · ฟันเฟือง (ยืนยันทุกการเปลี่ยน · Black · สีเอง · เปลี่ยนรหัสผ่าน)
// โปรไฟล์ (Admin tool · ไม่มีเปลี่ยนรหัสผ่าน · รูป · แก้ชื่อ · สวิตช์สิทธิ์) · สถิติเลือกดูรายคน · ตารางกะเปิดเป็นเดือน
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const ctx=await b.newContext({viewport:{width:1100,height:900}});const p=await ctx.newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-12-01T10:00:00+07:00')}); // อังคาร
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
const login=async(u,pw)=>{await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(800);};
const logout=async()=>{await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);};
const vis=sel=>p.$eval(sel,e=>!!e.getClientRects().length).catch(()=>false);
const calls=n=>p.evaluate(n=>window.__calls.filter(c=>c[0]==='rpc'&&c[1]===n).map(c=>c[2]),n);

// ---------- ฟันเฟืองบนหน้าล็อกอิน: เปลี่ยนภาษาต้องยืนยัน ----------
await p.click('[data-act=theme]');await p.click('.thpop [data-act=lang-set]');await p.waitForTimeout(150);
ok(await vis('.thpop .gask')&&await p.evaluate(()=>document.documentElement.lang)==='th','language: asks to confirm, not changed yet');
await p.click('[data-act=gear-no]');await p.waitForTimeout(100);
ok(!(await vis('.thpop .gask'))&&await p.evaluate(()=>document.documentElement.lang)==='th','language: cancel keeps Thai');
await p.click('.thpop [data-act=lang-set]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(300);
ok(await p.evaluate(()=>document.documentElement.lang)==='en'&&(await p.textContent('#main h1')).trim()==='Sign in','language: confirm switches to English');
await p.click('[data-act=theme]');await p.click('.thpop [data-act=lang-set]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(300);
ok(await p.evaluate(()=>document.documentElement.lang)==='th','language: back to Thai (with confirm)');
if(await vis('.thpop'))await p.click('[data-act=theme]');

// ---------- พนักงาน: หน้า "ลา" ----------
await login('malee','Temp1234!');
ok((await p.textContent('#nav [data-v=leave]')).trim()==='ลา','staff menu is "ลา"');
await p.click('#nav [data-v=leave]');await p.waitForTimeout(200);
ok((await p.textContent('#main h1')).trim()==='ลา','leave page title "ลา"');
ok((await p.textContent('#main .bal')).includes('10'),'balance shows allowance');
// ลาป่วย: วันเริ่ม = วันนี้ (เลือกไม่ได้) · สูงสุด 3 วัน
await p.click('[data-act=lvtype][data-t=sick]');await p.waitForTimeout(100);
ok(await p.$('#main [data-act=dp][data-id=lvFrom]')===null&&await vis('#main .dfix'),'sick: start date fixed to today');
ok((await p.textContent('#main .lvrule')).includes('ไม่เกิน 3 วัน'),'sick: rule shown');
for(let i=0;i<5;i++){const pl=await p.$('[data-act=lv-len][data-n="1"]:not([disabled])');if(pl){await pl.click();await p.waitForTimeout(50);}}
ok((await p.textContent('#main .lenst b')).includes('3')&&await p.$('[data-act=lv-len][data-n="1"][disabled]')!==null,'sick: length stops at 3 days');
await p.click('[data-act=lv-submit]');await p.waitForTimeout(80);{const _y=await p.$('#cfbox [data-cf=yes]');if(_y)await _y.click();}await p.waitForTimeout(300);
let c=await calls('request_leave');
ok(c.length===1&&c[0].p_type==='sick'&&c[0].p_from==='2026-12-01'&&c[0].p_to==='2026-12-03','sick: sends today + 3 days ('+JSON.stringify(c[0])+')');
// พักร้อน: ย้อนหลังไม่ได้
await p.click('[data-act=lvtype][data-t=vac]');await p.waitForTimeout(100);
ok(await p.$('#main [data-act=dp][data-id=lvFrom]')!==null,'vacation: start date can be chosen');
ok((await p.textContent('#main .lenst b')).includes('1'),'length resets to 1 after submit');
await p.click('#main [data-act=dp][data-id=lvFrom]');await p.waitForTimeout(100);await p.click('[data-act=dp-m][data-n="-1"]');await p.waitForTimeout(80);await p.click('[data-act=dp-pick][data-d="2026-11-30"]');await p.waitForTimeout(150);
await p.click('[data-act=lv-submit]');await p.waitForTimeout(80);{const _y=await p.$('#cfbox [data-cf=yes]');if(_y)await _y.click();}await p.waitForTimeout(200);
ok((await p.textContent('#main .err')).includes('ตั้งแต่วันนี้'),'vacation: past date rejected');
ok((await calls('request_leave')).length===1,'vacation: nothing sent for past date');
await p.click('#main [data-act=dp][data-id=lvFrom]');await p.waitForTimeout(100);if(!await p.$('[data-act=dp-pick][data-d="2026-12-07"]'))await p.click('[data-act=dp-m][data-n="1"]');await p.waitForTimeout(80);await p.click('[data-act=dp-pick][data-d="2026-12-07"]');await p.waitForTimeout(150);
await p.click('[data-act=lv-len][data-n="1"]');await p.waitForTimeout(80);
ok((await p.textContent('#main')).includes('8 ธ.ค.'),'vacation: shows end date from length');
await p.click('[data-act=lv-submit]');await p.waitForTimeout(80);{const _y=await p.$('#cfbox [data-cf=yes]');if(_y)await _y.click();}await p.waitForTimeout(300);
c=await calls('request_leave');ok(c.length===2&&c[1].p_from==='2026-12-07'&&c[1].p_to==='2026-12-08','vacation: advance request with length 2 sent');
// โปรไฟล์พนักงาน: ไม่มีเปลี่ยนรหัสผ่าน · ไม่มี Admin tool · ยังแก้รูป/ชื่อไม่ได้
await p.click('#nav [data-v=profile]');await p.waitForTimeout(200);
ok(await p.$('#main [data-act=pw-self]')===null&&await p.$('#main .admtool')===null,'staff profile: no password / Admin tool');
ok(await p.$('#main [data-act=av-pick]')===null&&await p.$('#main [data-act=name-edit]')===null,'staff profile: cannot edit photo/name (not allowed yet)');
// ฟันเฟือง: เปลี่ยนรหัสผ่าน + ธีม Black / สีเอง ต้องยืนยัน
await p.click('[data-act=theme]');ok(await vis('.thpop [data-act=pw-self]'),'gear: has change password');
await p.click('.thpop [data-act=pw-self]');await p.waitForTimeout(200);ok(await vis('#pwbox .modal, #pwbox [role=dialog]')||await vis('#pwbox input'),'gear: change password opens dialog');
await p.keyboard.press('Escape');await p.waitForTimeout(150);if(await vis('#pwbox input')){const x=await p.$('#pwbox [data-act=pw-close],#pwbox .btn.sec');if(x)await x.click();}
await p.click('[data-act=theme]');await p.click('[data-act=theme-set][data-t=black]');await p.waitForTimeout(100);
ok(await vis('.thpop .gask')&&await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))!=='black','theme: asks before changing');
await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='black'&&await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)==='rgb(0, 0, 0)','theme: Black = pure black background');
await p.click('[data-act=theme-set][data-t=custom]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='custom'&&await vis('#custColor'),'theme: custom shows color picker');
const bg0=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);
await p.click('[data-act=cust-pick][data-c="#E2557B"]');await p.waitForTimeout(100);
ok(await vis('.thpop .gask')&&await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)!==bg0,'custom color: previews and asks to confirm');
await p.click('[data-act=gear-no]');await p.waitForTimeout(100);
ok(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)===bg0,'custom color: cancel restores');
await p.click('[data-act=cust-pick][data-c="#2F80ED"]');await p.click('[data-act=cust-base][data-b=dark]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
await p.waitForTimeout(400);ok(await p.evaluate(()=>{const c=window.__mockdb.profiles.find(x=>x.id==='e2').prefs.custom;return c.c==='#2F80ED'&&c.base==='dark';}),'custom color: saved to this account (blue, dark)');
const ink=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ink').trim());ok(ink.toUpperCase()==='#EDF1EE','custom dark: light text');
await p.click('[data-act=theme-set][data-t=light]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>document.documentElement.style.getPropertyValue('--bg')==='')&&await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='light','back to light: custom colors removed');
if(await vis('.thpop'))await p.click('[data-act=theme]');
await logout();

// ---------- ผู้ดูแล ----------
await login('admin','Admin@2026');
// ตารางกะเปิดเป็นเดือน
await p.click('#nav [data-v=schedule]');await p.waitForTimeout(200);
ok(await p.$('[data-act=mode][data-m=month][aria-pressed=true]')!==null,'schedule opens in month view');
ok((await p.textContent('#nav [data-v=leaves]')).trim().startsWith('ลา'),'admin menu is "ลา"');
// โปรไฟล์: Admin tool (สีเข้ม) + สวิตช์สิทธิ์
await p.click('#nav [data-v=profile]');await p.waitForTimeout(200);
ok(await p.$('#main [data-act=pw-self]')===null,'admin profile: no change password');
const at=await p.$eval('#main .admtool',e=>[e.textContent,getComputedStyle(e).backgroundColor,getComputedStyle(document.querySelector('#main .card')).backgroundColor]);
ok(at[0].includes('Admin tool')&&at[1]!==at[2],'Admin tool card is darker than other cards');
ok(await vis('#main [data-act=av-pick]')&&await vis('#main [data-act=name-edit]'),'admin can edit own photo and name');
await p.click('[data-act=perm-set][data-k=avatar]');await p.waitForTimeout(200);
await p.click('[data-act=perm-set][data-k=name]');await p.waitForTimeout(200);
ok(await p.evaluate(()=>window.__mockdb.settings[0].allow_avatar&&window.__mockdb.settings[0].allow_name)&&await p.$('[data-act=perm-set][data-k=avatar][aria-checked=true]')!==null,'permission switches turn on');
// รูป: เลือกไฟล์ → ย่อ → บันทึก
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDK+mmyAAAAABJRU5ErkJggg==','base64');
const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#main .avbtns [data-act=av-pick]')]);
await fc.setFiles({name:'me.png',mimeType:'image/png',buffer:png});await p.waitForTimeout(600);
c=await calls('set_avatar');ok(c.length===1&&/^data:image\/jpeg/.test(c[0].p_avatar)&&c[0].p_avatar.length<80000,'photo: resized to JPEG and saved');
ok(await vis('#main .phd .pav.img img'),'photo: shown on profile');
// การตั้งค่าวันลา (Admin tool › แท็บวันลา)
await p.click('#main .admtool');await p.waitForTimeout(250);
ok((await p.textContent('#main h1')).trim()==='Admin tool','settings page titled Admin tool');
await p.click('[data-set-tab=leave]');await p.waitForTimeout(100);
ok(JSON.stringify(await p.$$eval('#main .stile:not([hidden])',e=>e.map(x=>x.dataset.tile)))==='["lvq"]','tab "วันลา" holds leave settings');
await p.click('[data-set-open=lvq]');await p.waitForTimeout(150);
ok(await vis('#lvqCard .lvqt')&&(await p.$eval('#lvqCard .lvqt',e=>e.getBoundingClientRect().height))>100,'leave table visible in popup');
ok((await p.textContent('#lvqCard .lvqt')).includes('12*'),'per-person allowance marked *');
await p.click('[data-act=lvq-mode][data-m=add]');await p.fill('#lvqDays','2');await p.fill('#lvqNote','ทดสอบ');
await p.click('[data-lvq-all]');await p.waitForTimeout(100);
for(const id of ['e1','e3','e4','e5','e6']){const x=await p.$('[data-lvq-emp='+id+']');if(x&&await x.isChecked())await x.click();await p.waitForTimeout(50);}
await p.click('[data-act=lvq-check]');await p.waitForTimeout(100);
ok((await p.textContent('#lvqCard .alert-y')).includes('10 → 12')&&(await p.$$('#lvqCard .alert-y li')).length===1,'add 2 days: preview for one person (10 → 12)');
await p.click('[data-act=lvq-yes]');await p.waitForTimeout(300);
ok(await p.evaluate(()=>window.__mockdb.lq.some(r=>r.emp==='e2'&&r.type==='vac'&&r.days===12)),'allowance saved');
ok((await p.textContent('#lvqCard .lvqlog')).includes('ทดสอบ'),'change shows in history');
await p.click('[data-act=lvq-mode][data-m=sub]');await p.fill('#lvqDays','20');await p.click('[data-act=lvq-check]');await p.waitForTimeout(100);
ok((await p.textContent('#lvqCard .alert-y')).includes('→ 0'),'reduce never goes below 0');await p.click('[data-act=lvq-no]');
await p.fill('#lvqD_vac','11');await p.click('[data-act=lvq-def]');await p.waitForTimeout(80);{const _y=await p.$('#cfbox [data-cf=yes]');if(_y)await _y.click();}await p.waitForTimeout(250);
ok(await p.evaluate(()=>window.__mockdb.settings[0].q_vac===11),'default allowance saved');
// (แก้บั๊กเดิม) เลือกวันที่ในการ์ดวันหยุดแล้วต้องเปลี่ยนตาม
await p.click('#main section.spop.open .spx');await p.click('[data-set-tab=all]');await p.click('[data-set-open=hol]');await p.waitForTimeout(150);
await p.click('#holCard [data-act=dp][data-id=holD]');await p.waitForTimeout(100);await p.click('[data-act=dp-pick][data-d="2026-12-15"]');await p.waitForTimeout(150);
ok((await p.textContent('#holCard [data-act=dp][data-id=holD]')).includes('15 ธ.ค.'),'holiday card: picked date sticks (old bug fixed)');
await p.click('#main section.spop.open .spx');await p.click('[data-set-open=lvq]');await p.waitForTimeout(150);
// ลาแทนพนักงาน
await p.click('[data-act=la-go]');await p.waitForTimeout(300);
ok((await p.textContent('#main h1')).trim()==='ลา'&&await vis('#laCard'),'"enter leave for employee" opens on leave page');
await p.selectOption('#laEmp','e3');await p.click('[data-act=la-type][data-t=sick]');await p.click('[data-act=la-submit]');await p.waitForTimeout(80);{const _y=await p.$('#cfbox [data-cf=yes]');if(_y)await _y.click();}await p.waitForTimeout(150);
ok((await p.textContent('#laCard .err')).includes('เหตุผล'),'reason required');
await p.click('#laCard [data-act=dp][data-id=laFrom]');await p.waitForTimeout(100);await p.click('[data-act=dp-m][data-n="-1"]');await p.waitForTimeout(80);await p.click('[data-act=dp-pick][data-d="2026-11-27"]');await p.waitForTimeout(150);
await p.fill('#laReason','โทรแจ้งว่าป่วย');await p.click('[data-act=la-submit]');await p.waitForTimeout(80);{const _y=await p.$('#cfbox [data-cf=yes]');if(_y)await _y.click();}await p.waitForTimeout(400);
c=await calls('admin_request_leave');console.log(JSON.stringify(c));ok(c.length===1&&c[0].p_emp==='e3'&&c[0].p_from==='2026-11-27'&&c[0].p_reason==='โทรแจ้งว่าป่วย','admin leave sent (past date allowed)');
ok(await vis('[data-act=lv-approve]')&&(await p.textContent('#main')).includes('ผู้ดูแลบันทึกให้'),'approval panel opens · marked "entered by admin"');
// รายงาน › สถิติ
await p.click('#nav [data-v=report]');await p.click('[data-act=rsec][data-s=stats]');await p.waitForTimeout(300);
ok(await vis('#lvBal')&&(await p.$$('#lvBal .lvbrow')).length===6,'stats: leave balance card for 6 people');
ok((await p.$$('.bar.dim')).length===0,'stats: everyone by default');
await p.selectOption('#dashEmp','e3');await p.waitForTimeout(300);
ok((await p.$$('.bar.dim')).length>0&&(await p.$$('#lvBal .lvbrow')).length===1&&(await p.textContent('#main')).includes('กราฟของ'),'stats: one person → own charts, others dimmed');
await p.selectOption('#dashEmp','');await p.waitForTimeout(200);ok((await p.$$('.bar.dim')).length===0,'stats: back to everyone');
// หน้าพนักงาน: ปุ่มเปลี่ยนรูป
await p.click('#nav [data-v=people]');await p.waitForTimeout(200);await p.click('[data-pr=e2]');await p.waitForTimeout(150);
ok(await vis('.prow.open [data-act=av-pick]'),'employees page: change photo button');
await logout();
// พนักงานหลังเปิดสิทธิ์: แก้ชื่อ/รูปเองได้
await login('malee','Temp1234!');await p.click('#nav [data-v=profile]');await p.waitForTimeout(200);
ok(await vis('#main [data-act=av-pick]')&&await vis('#main [data-act=name-edit]'),'staff: can edit photo/name after admin allows');
await p.click('[data-act=name-edit]');await p.fill('#myName','ม');await p.click('[data-act=name-save]');await p.waitForTimeout(80);{const _y=await p.$('#cfbox [data-cf=yes]');if(_y)await _y.click();}await p.waitForTimeout(200);
ok((await p.textContent('#main .nameed .err')).includes('2–60'),'name: too short rejected');
await p.fill('#myName','มาลี ใจงาม');await p.click('[data-act=name-save]');await p.waitForTimeout(80);{const _y=await p.$('#cfbox [data-cf=yes]');if(_y)await _y.click();}await p.waitForTimeout(300);
ok(await p.evaluate(()=>window.__mockdb.profiles.find(x=>x.id==='e2').name==='มาลี ใจงาม')&&(await p.textContent('#main .phd h2')).includes('มาลี ใจงาม'),'name: saved');
await ctx.close();await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
