const {chromium}=require('playwright');
const S=require('path').join(__dirname,'..')+'/';
(async()=>{
const b=await chromium.launch();const errs=[];
// เข้า/ออกงานต้องอนุญาตตำแหน่ง → ให้สิทธิ์ตำแหน่ง + จำลองคำตอบ OpenStreetMap (ไม่ต่อเน็ตจริง)
async function mk(vp){const ctx=await b.newContext({viewport:vp,permissions:['geolocation'],geolocation:{latitude:13.73,longitude:100.56,accuracy:25}});const p=await ctx.newPage();
  await p.route('https://nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({address:{road:'ถนนทดสอบ',city:'กรุงเทพมหานคร'}})}));
  p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});
  await p.route('**/supabase-js@*/**',r=>r.fulfill({body:'',contentType:'text/javascript'}));
  await p.addInitScript({path:S+'mock.js'});
  await p.goto('file://'+S+'index.html');await p.waitForTimeout(400);return p;}
const login=async(p,u)=>{await p.fill('#lu',u);await p.fill('#lp',u==='admin'?'000000':'123456');await p.click('#lbtn');await p.waitForTimeout(700);};
// wrong pw
let p=await mk({width:1280,height:900});
await p.fill('#lu','admin');await p.fill('#lp','999999');await p.click('#lbtn');await p.waitForTimeout(400);
console.log('wrong pw msg:',await p.textContent('#lerr'));
await login(p,'admin');
console.log('admin tabs:',await p.$$eval('.tab',e=>e.map(x=>x.textContent.trim())));
console.log('has demo bar:',await p.$('.demo')!==null);
await p.screenshot({path:S+'p_dash.png'});
// slot edit: schedule week, click a cell in future, set off w/ cover
await p.click('[data-act=tab][data-v=schedule]');await p.waitForTimeout(200);await p.click('[data-act=mode][data-m=week]');
await p.click('[data-act=sched-nav][data-n="1"]');await p.waitForTimeout(150);
await p.click('button.cell:not(.na) >> nth=1');await p.waitForTimeout(150);
await p.check('input[name=edMode][value=cover]');await p.waitForTimeout(100);
const opts=await p.$$eval('#edOther option',e=>e.map(o=>o.value).filter(Boolean));await p.selectOption('#edOther',opts[opts.length-1]);await p.waitForTimeout(100);
await p.click('[data-act=save-days]');await p.waitForTimeout(500);
console.log('rpc calls:',JSON.stringify(await p.evaluate(()=>window.__calls.filter(c=>c[1]==='set_override_days').map(c=>c[1]))));
console.log('off cell present:',await p.$('.cell.off')!==null);
// people: add employee
await p.click('[data-act=tab][data-v=people]');await p.click('[data-act=new-emp]');
await p.fill('#fName','ทดสอบ ระบบ');await p.fill('#fUser','tester1');await p.fill('#fPin','Abcd1234!');await p.fill('#fPin2','Abcd1234!');await p.selectOption('#fTeam','OPS');
await p.click('[data-act=save-emp]');await p.waitForTimeout(500);
console.log('people has tester:',(await p.textContent('#main')).includes('ทดสอบ ระบบ'),'fn calls:',JSON.stringify(await p.evaluate(()=>window.__calls.filter(c=>c[0]==='fn').map(c=>c[2].action))));
// settings rules
await p.click('#nav [data-act=tab][data-v=profile]');await p.click('#main [data-act=tab][data-v=settings]');await p.evaluate(()=>{const o=document.querySelector('#main section.spop.open .spx');if(o)o.click();});await p.click('[data-set-open=rules]');await p.waitForTimeout(150);await p.fill('#setLate','20');await p.click('[data-act=save-rules]');await p.waitForTimeout(500);
console.log('rules msg:',(await p.textContent('#main')).includes('บันทึกกฎแล้ว'));
await p.screenshot({path:S+'p_set.png'});await p.evaluate(()=>{const o=document.querySelector('#main section.spop.open .spx');if(o)o.click();});
// logout
await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(300);console.log('back at login:',await p.$('#loginForm')!==null);
// staff: Somchai check-in flow (time-dependent) -> use wichai A3 (18:00-03:00) now ~21:xx Bangkok
await login(p,'wichai');
console.log('wichai home has check button:',await p.$('[data-act=checkin]')!==null||await p.$('[data-act=checkout]')!==null);
if(await p.$('[data-act=checkin]')){await p.click('[data-act=checkin]');await p.waitForTimeout(300);await p.screenshot({path:S+'p_modal.png'});await p.click('[data-act=modal-ok]');await p.waitForTimeout(600);console.log('after checkin flash:',(await p.textContent('#main')).match(/เข้างานสำเร็จ[^ ]*[^.]*/)?.[0]);}
// leave
await p.click('[data-act=tab][data-v=leave]');await p.click('[data-act=dp][data-id=lvFrom]');await p.waitForTimeout(150);
const dd=await p.$$('.dday');await dd[dd.length-4].click();await p.waitForTimeout(150);await p.click('[data-act=lv-submit]');await p.waitForTimeout(500);
console.log('leave msg:',(await p.textContent('#main')).match(/ส่งคำขอแล้ว[^ ]*|เกินสิทธิ์[^ ]*|ไม่มีกะ[^ ]*/)?.[0]);
// bell toggle
await p.click('[data-act=bell]');await p.click('[data-act=bell-notify]');await p.waitForTimeout(300);
console.log('notify rpc:',JSON.stringify(await p.evaluate(()=>window.__calls.filter(c=>c[1]==='set_my_notify').map(c=>c[2]))));
await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');
await login(p,'admin');await p.click('[data-act=tab][data-v=leaves]');await p.waitForTimeout(200);
if(await p.$('[data-act=lv-open]')){await p.click('[data-act=lv-open] >> nth=0');await p.waitForTimeout(150);await p.click('[data-act=lv-approve]');await p.waitForTimeout(500);console.log('approve rpc:',JSON.stringify(await p.evaluate(()=>window.__calls.filter(c=>c[1]==='approve_leave').length)));}
console.log(errs.length?errs.join('\n'):'NO ERRORS');
await b.close();})();
