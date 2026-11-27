// โปรไฟล์: ปุ่มรูปคนมุมขวาบน (ไม่มีปุ่มกุญแจแล้ว) → ข้อมูลของฉัน (ทีม ไม่บอกกะประจำ) · สมาชิกในทีม · เปลี่ยนรหัสผ่าน · ภาษา
//          ผู้ดูแล: แท็บ "ตั้งค่า" ย้ายมาอยู่ในโปรไฟล์ · ปุ่มเปลี่ยนภาษาอยู่บนแถบด้านบนหลังล็อกอิน
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const PB='#nav [data-act=tab][data-v=profile]';
for(const vp of [{width:1280,height:900},{width:390,height:844},{width:320,height:640}]){
 const tag=vp.width>500?'d':vp.width>350?'m':'s';
 const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+' '+e.message));
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 const login=async(u,pw)=>{await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(800);};
 const db=await p.evaluate(()=>window.__mockdb.profiles.map(x=>({id:x.id,name:x.name,username:x.username,role:x.role,team:x.team,active:x.active})));
 // ---- พนักงานทีม A
 await login('malee','Temp1234!');
 ok(JSON.stringify(await p.$$eval('.top-right button',e=>e.map(x=>x.dataset.act)))===JSON.stringify(['profile','bell','theme']),tag+' top bar: name, bell, gear (in this order)');
 ok(await p.$(PB)!==null&&(await p.$$eval('#nav [data-act=tab]',a=>a.map(x=>x.dataset.v))).pop()==='profile',tag+' profile is the last menu tab');
 await p.click('[data-act=theme]');ok(await p.$('.thpop [data-act=lang-set]')!==null&&await p.$('.thpop [data-act=theme-set]')!==null&&await p.$('.thpop [data-act=logout-ask]')!==null,tag+' gear menu: language, theme, sign out');await p.click('[data-act=theme]');
 // ออกจากระบบต้องถามก่อน · กดยกเลิกแล้วยังอยู่ในระบบ
 await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.waitForTimeout(100);
 ok(await p.$('#nav .tab')!==null&&(await p.textContent('.thout')).includes('ออกจากระบบใช่ไหม'),tag+' sign out asks for confirmation first');
 await p.click('[data-act=logout-no]');await p.waitForTimeout(100);
 ok(await p.$('#nav .tab')!==null&&await p.$('.thout [data-act=logout]')===null,tag+' cancel keeps you signed in');
 await p.click('[data-act=theme]');
 ok(await p.evaluate(()=>{const t=document.getElementById('top');return t.scrollWidth<=t.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth;}),tag+' top bar fits ('+vp.width+'px)');
 await p.click(PB);await p.waitForTimeout(250);
 ok((await p.textContent('#main h1')).trim()==='โปรไฟล์',tag+' profile page opens');
 { const w=await p.$eval('#main .profwrap',e=>e.getBoundingClientRect().width);ok(w<=520,tag+' profile is a compact card, not full width ('+Math.round(w)+'px)'); }
 ok(await p.$eval(PB,e=>e.getAttribute('aria-current'))==='page',tag+' profile button lit');
 const kv=await p.$eval('#main .kv',e=>e.innerText);
 ok(kv.includes('ทีม A')&&kv.includes('จันทร์–ศุกร์'),tag+' shows team');
 ok(!/กะประจำ|\d\d\.\d\d–\d\d\.\d\d/.test(await p.textContent('#main')),tag+' no regular shift shown');
 ok((await p.textContent('#main .phd')).includes('malee'),tag+' shows username');
 // พนักงานทั่วไปเห็นเฉพาะข้อมูลของตัวเอง
 const others=db.filter(x=>x.username!=='malee').map(x=>x.name);
 const mainTxt=await p.textContent('#main');
 ok(await p.$('#main .pmem')===null&&!others.some(n=>mainTxt.includes(n)),tag+' staff sees only themselves (no other members)');
 ok(await p.$('#main [data-v=settings]')===null,tag+' staff has no system settings');
 if(tag==='m'){const w=await p.$eval('#main .profwrap',e=>e.getBoundingClientRect().width);ok(w<=310,tag+' phone: card narrower than screen ('+Math.round(w)+'px)');}
 await p.click('#main [data-act=pw-self]');await p.waitForTimeout(200);
 ok(await p.$('#pwbox .modal')!==null,tag+' change password opens from profile');
 await p.click('[data-act=pw-close]');await p.waitForTimeout(200);
 ok(await p.$('#main [data-act=lang-set]')===null,tag+' no language choice in profile');
 await p.click('[data-act=theme]');ok(await p.$('.thpop .langsw[role=switch][aria-checked=false]')!==null,tag+' gear menu has a language switch (Thai now)');await p.$eval('[data-act=theme]',e=>e.click()); // (หน้าตัวอย่างมีแถบเหลืองดันแถบบนลง ป๊อปอัปจึงทับปุ่ม)
 await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);
 // ---- พนักงานสำรอง (Ops)
 await login('anan','Temp1234!');await p.click(PB);await p.waitForTimeout(250);
 ok(await p.$('#main .pmem')===null&&(await p.textContent('#main .phd')).includes('anan'),tag+' Ops staff sees only themselves');
 await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);
 // ---- ผู้ดูแล (เพิ่มผู้ดูแลจำลองอีก 2 คน เพื่อทดสอบการกดขยาย)
 await p.evaluate(()=>{const d=window.__mockdb;[['ea1','wanida','วนิดา ทดสอบ'],['ea2','preecha','ปรีชา ทดสอบ']].forEach((x,i)=>{if(!d.profiles.some(p=>p.id===x[0]))d.profiles.push({id:x[0],username:x[1],name:x[2],role:'admin',team:null,shift_id:null,active:true,can_work:i===0,notify:true,created_at:new Date(2e12+i).toISOString()});});});
 await login('admin','Admin@2026');
 const tabs=await p.$$eval('#nav [data-act=tab]',a=>a.map(x=>x.dataset.v));
 ok(!tabs.includes('settings')&&tabs.length===6&&tabs[5]==='profile',tag+' admin nav has no settings tab ('+tabs.join(',')+')');
 ok(await p.evaluate(()=>{const t=document.getElementById('top');return t.scrollWidth<=t.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth;}),tag+' admin top bar fits');
 await p.click(PB);await p.waitForTimeout(250);
 ok((await p.textContent('#main .kv')).includes('ผู้ดูแลระบบ'),tag+' admin role shown');
 const wantA=(await p.evaluate(()=>window.__mockdb.profiles.filter(x=>x.active&&x.role==='admin').map(x=>x.name))).sort();
 ok(JSON.stringify((await p.$$eval('#main .pmem b',e=>e.map(x=>x.textContent))).sort())===JSON.stringify(wantA),tag+' admin sees admins ('+wantA.length+')');
 ok(await p.$eval('#main .pmem:has(.chip)',e=>e.textContent.includes('admin')),tag+' "คุณ" marks myself');
 // กดชื่อ → ขยาย · กดคนอื่น → สลับ · กดซ้ำ/กดที่อื่น → หุบ
 const openIds=()=>p.$$eval('#main .pmem.open',e=>e.map(x=>x.dataset.pm));
 const ids=await p.$$eval('#main .pmem',e=>e.map(x=>x.dataset.pm));
 await p.click('[data-pm="'+ids[0]+'"]');await p.waitForTimeout(150);
 ok(JSON.stringify(await openIds())===JSON.stringify([ids[0]])&&(await p.textContent('.pmem.open .pmx')).includes('บทบาท'),tag+' tap member expands details');
 await p.click('[data-pm="'+ids[1]+'"]');await p.waitForTimeout(150);
 ok(JSON.stringify(await openIds())===JSON.stringify([ids[1]]),tag+' tap another member switches');
 await p.click('[data-pm="'+ids[1]+'"]');await p.waitForTimeout(150);
 ok((await openIds()).length===0,tag+' tap same member again collapses');
 await p.click('[data-pm="'+ids[0]+'"]');await p.click('#main h1');await p.waitForTimeout(150);
 ok((await openIds()).length===0,tag+' tap elsewhere collapses');
 await p.focus('[data-pm="'+ids[2]+'"]');await p.keyboard.press('Enter');await p.waitForTimeout(150);
 ok(JSON.stringify(await openIds())===JSON.stringify([ids[2]]),tag+' keyboard Enter expands');
 await p.click('#main [data-act=tab][data-v=settings]');await p.waitForTimeout(250);
 ok((await p.textContent('#main h1')).includes('ตั้งค่า')&&await p.$('[data-act=save-rules]')!==null,tag+' system settings opens from profile');
 ok(await p.$eval(PB,e=>e.getAttribute('aria-current'))==='page',tag+' profile lit on settings');
 await p.click('#main [data-act=profile]');await p.waitForTimeout(200);
 ok((await p.textContent('#main h1')).trim()==='โปรไฟล์',tag+' back to profile');
 if(tag==='m')await p.screenshot({path:S+'profile_m.png'});
 if(vp.width>500){await p.click('.top-right .ubtn');await p.waitForTimeout(150);ok((await p.textContent('#main h1')).trim()==='โปรไฟล์',tag+' name on top bar opens profile');}
 // ---- บังคับตั้งรหัสใหม่: ไม่มีปุ่มโปรไฟล์
 await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);
 await login('somchai','Temp1234!');ok(await p.$eval('#nav',e=>e.hidden)&&await p.$('.top-right .ubtn')===null,tag+' no menu / profile while forced to change password');
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
