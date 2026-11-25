// โปรไฟล์: ปุ่มรูปคนมุมขวาบน (ไม่มีปุ่มกุญแจแล้ว) → ข้อมูลของฉัน (ทีม ไม่บอกกะประจำ) · สมาชิกในทีม · เปลี่ยนรหัสผ่าน · ภาษา
//          ผู้ดูแล: แท็บ "ตั้งค่า" ย้ายมาอยู่ในโปรไฟล์ · ปุ่มเปลี่ยนภาษาอยู่บนแถบด้านบนหลังล็อกอิน
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const PB='.top-right .iconbtn[data-act=profile]';
for(const vp of [{width:1280,height:900},{width:390,height:844},{width:320,height:640}]){
 const tag=vp.width>500?'d':vp.width>350?'m':'s';
 const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+' '+e.message));
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 const login=async(u,pw)=>{await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(800);};
 const db=await p.evaluate(()=>window.__mockdb.profiles.map(x=>({id:x.id,name:x.name,username:x.username,role:x.role,team:x.team,active:x.active})));
 // ---- พนักงานทีม A
 await login('malee','Temp1234!');
 ok(await p.$('[data-act=pw-self]')===null||!(await p.$('.top-right [data-act=pw-self]')),tag+' no key button on top bar');
 ok(await p.$(PB)!==null,tag+' profile button on top bar');
 ok(await p.$('.top-right [data-act=lang-set]')!==null,tag+' language button on top bar after login');
 ok(await p.evaluate(()=>{const t=document.getElementById('top');return t.scrollWidth<=t.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth;}),tag+' top bar fits ('+vp.width+'px)');
 await p.click(PB);await p.waitForTimeout(250);
 ok((await p.textContent('#main h1')).trim()==='โปรไฟล์',tag+' profile page opens');
 ok(await p.$eval(PB,e=>e.getAttribute('aria-current'))==='page',tag+' profile button lit');
 const kv=await p.$eval('#main .kv',e=>e.innerText);
 ok(kv.includes('ทีม A')&&kv.includes('จันทร์–ศุกร์'),tag+' shows team');
 ok(!/กะประจำ|\d\d\.\d\d–\d\d\.\d\d/.test(await p.textContent('#main')),tag+' no regular shift shown');
 ok((await p.textContent('#main .phd')).includes('malee'),tag+' shows username');
 const want=db.filter(x=>x.active&&x.role==='staff'&&x.team==='A').map(x=>x.name).sort();
 const got=(await p.$$eval('#main .pmem b',e=>e.map(x=>x.textContent))).sort();
 ok(JSON.stringify(got)===JSON.stringify(want),tag+' team members = team A ('+got.length+')');
 ok(await p.$eval('#main .pmem:has(.chip)',e=>e.textContent.includes('มาลี')),tag+' "คุณ" marks myself');
 ok(await p.$('#main [data-v=settings]')===null,tag+' staff has no system settings');
 await p.click('#main [data-act=pw-self]');await p.waitForTimeout(200);
 ok(await p.$('#pwbox .modal')!==null,tag+' change password opens from profile');
 await p.click('[data-act=pw-close]');await p.waitForTimeout(200);
 ok(await p.$('#main .plang [data-act=lang-set][data-l=th].on')!==null,tag+' language choice in profile');
 await p.click('[data-act=logout]');await p.waitForTimeout(400);
 // ---- พนักงานสำรอง (Ops)
 await login('anan','Temp1234!');await p.click(PB);await p.waitForTimeout(250);
 const wantO=db.filter(x=>x.active&&x.role==='staff'&&x.team==='OPS').map(x=>x.name).sort();
 ok(JSON.stringify((await p.$$eval('#main .pmem b',e=>e.map(x=>x.textContent))).sort())===JSON.stringify(wantO),tag+' Ops sees Ops members');
 await p.click('[data-act=logout]');await p.waitForTimeout(400);
 // ---- ผู้ดูแล
 await login('admin','Admin@2026');
 const tabs=await p.$$eval('#nav [data-act=tab]',a=>a.map(x=>x.dataset.v));
 ok(!tabs.includes('settings')&&tabs.length===5,tag+' admin nav has no settings tab ('+tabs.join(',')+')');
 ok(await p.evaluate(()=>{const t=document.getElementById('top');return t.scrollWidth<=t.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth;}),tag+' admin top bar fits');
 await p.click(PB);await p.waitForTimeout(250);
 ok((await p.textContent('#main .kv')).includes('ผู้ดูแลระบบ'),tag+' admin role shown');
 const wantA=db.filter(x=>x.active&&x.role==='admin').map(x=>x.name).sort();
 ok(JSON.stringify((await p.$$eval('#main .pmem b',e=>e.map(x=>x.textContent))).sort())===JSON.stringify(wantA),tag+' admin sees admins');
 await p.click('#main [data-act=tab][data-v=settings]');await p.waitForTimeout(250);
 ok((await p.textContent('#main h1')).includes('ตั้งค่า')&&await p.$('[data-act=save-rules]')!==null,tag+' system settings opens from profile');
 ok(await p.$eval(PB,e=>e.getAttribute('aria-current'))==='page',tag+' profile lit on settings');
 await p.click('#main [data-act=profile]');await p.waitForTimeout(200);
 ok((await p.textContent('#main h1')).trim()==='โปรไฟล์',tag+' back to profile');
 if(tag==='m')await p.screenshot({path:S+'profile_m.png'});
 if(vp.width>500){await p.click('.top-right .ubtn');await p.waitForTimeout(150);ok((await p.textContent('#main h1')).trim()==='โปรไฟล์',tag+' name on top bar opens profile');}
 // ---- บังคับตั้งรหัสใหม่: ไม่มีปุ่มโปรไฟล์
 await p.click('[data-act=logout]');await p.waitForTimeout(400);
 await login('somchai','Temp1234!');ok(await p.$(PB)===null,tag+' no profile button while forced to change password');
 await ctx.close();
}
// แถบด้านบนต้องไม่ล้นทุกความกว้าง (ทั้งไทยและอังกฤษ)
for(const lang of ['th','en']){
 const ctx=await b.newContext();if(lang==='en')await ctx.addInitScript(()=>{try{localStorage.setItem('wc-lang','en')}catch(e){}});
 const p=await ctx.newPage();await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(800);
 const bad=[];
 for(let w=320;w<=1000;w+=20){await p.setViewportSize({width:w,height:800});await p.waitForTimeout(60);
  if(!(await p.evaluate(()=>{const t=document.getElementById('top');return t.scrollWidth<=t.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth;})))bad.push(w);}
 ok(!bad.length,lang+' top bar fits at every width 320–1000 '+(bad.length?'(overflow at '+bad.join(',')+')':''));
 await ctx.close();
}
await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
