// ภาษาอังกฤษ: เปลี่ยนภาษาจากเมนู → ทุกหน้าไม่มีข้อความไทยหลงเหลือ (ยกเว้นชื่อพนักงาน/ข้อมูลที่คนพิมพ์) · เปลี่ยนกลับเป็นไทยได้
// ใช้: node tests/ten.js [--show]   (--show = พิมพ์ข้อความไทยที่เหลือทั้งหมด)
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
const SHOW=process.argv.includes('--show');
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const TH=/[฀-๿]/;
// ข้อความไทยที่ยอมให้เหลือ: ชื่อภาษาในเมนู + ข้อมูลจำลองที่คนพิมพ์ (ชื่อ, หมายเหตุ)
const ALLOW=['เปลี่ยนเป็นภาษาไทย','ภาษาไทย','ภาษา','ไทย'];
for(const vp of [{width:1280,height:900},{width:390,height:844}]){
 const tag=vp.width>500?'d':'m';
 const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+' '+e.message));
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 // เปลี่ยนภาษาจากปุ่มบนหน้าล็อกอิน
 ok(await p.$('.top-right [data-act=theme]')!==null,tag+' login shows settings (gear) button');
 await p.click('[data-act=theme]');await p.click('.thpop [data-act=lang-set][data-l=en]');await p.waitForLoadState();await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.documentElement.lang)==='en',tag+' html lang=en after switch');
 ok((await p.textContent('#main h1')).trim()==='Sign in',tag+' login page in English');
 // ชื่อพนักงาน + เหตุผลการลา/หมายเหตุที่คนพิมพ์ (ข้อมูล ไม่ต้องแปล)
 const names=await p.evaluate(()=>{const d=window.__mockdb;return [].concat(d.profiles.map(x=>x.name),d.leaves.map(x=>x.reason),d.leaves.map(x=>x.note),d.overrides.map(x=>x.note),d.attendance.map(x=>x.admin_note)).filter(Boolean).sort((a,b)=>b.length-a.length);});
 const leftovers=new Map();
 const scan=async where=>{
  const r=await p.evaluate(()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    const banner=document.body.firstElementChild;
    while(n=w.nextNode()){const el=n.parentElement;if(!el||el.closest('script,style,[hidden],.pav')||(banner&&banner.contains(el)&&!document.getElementById('main').contains(el)))continue;if(!el.getClientRects().length)continue;const t=n.textContent.trim();if(t)out.push(t);}
    document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(el=>['aria-label','title','placeholder'].forEach(a=>{const v=el.getAttribute(a);if(v)out.push(v);}));
    return out;});
    r.forEach(t=>{
    let x=t;names.forEach(nm=>{x=x.split(nm).join('');nm.split(' ').forEach(part=>{if(part.length>2)x=x.split(part).join('');});});
    ALLOW.forEach(a=>{x=x.split(a).join('');});
    x=x.replace(/[฀-๿]+…/g,m=>names.some(nm=>nm.includes(m.slice(0,-1)))?'':m); // ชื่อที่ถูกตัดสั้น
    if(TH.test(x)){if(!leftovers.has(t))leftovers.set(t,where);}
  });
 };
 await scan('login');
 const login=async(u,pw)=>{await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(800);};
 await login('admin','Admin@2026');
 const tabs=['today','schedule','people','leaves','report'];
 for(const t of tabs){const el=await p.$('#nav [data-act=tab][data-v='+t+']');if(!el){ok(false,tag+' tab '+t);continue;}await el.click();await p.waitForTimeout(350);await scan('tab '+t);}
 ok((await p.textContent('#nav')).includes('Schedule'),tag+' menu in English');
 await p.click('[data-act=theme]');ok(await p.$('.thpop [data-act=lang-set][data-l=en].on')!==null&&await p.$('.thpop [data-act=logout-ask]')!==null,tag+' gear menu: language (English on) + sign out');await p.click('[data-act=theme]');
 await p.click('#nav [data-act=tab][data-v=profile]');await p.waitForTimeout(150);await scan('profile');await p.click('#main [data-pm] >> nth=0');await p.waitForTimeout(150);await scan('profile member expanded');
 ok(await p.$('#main .plang [data-act=lang-set][data-l=en].on')!==null,tag+' language choice in profile (English selected)');
 // ตารางกะ ทีม B + มุมมองต่าง ๆ
 await p.click('#nav [data-act=tab][data-v=schedule]');await p.waitForTimeout(200);
 {const n=(await p.$$('#main .seg button')).length;for(let i=0;i<n;i++){const bs=await p.$$('#main .seg button');if(bs[i]){await bs[i].click();await p.waitForTimeout(200);await scan('schedule views '+i);}}}
 // เปิดแก้ไขกะ
 const slot=await p.$('[data-act=edit-slot]');if(slot){await slot.click();await p.waitForTimeout(300);await scan('edit slot');}
 await p.keyboard.press('Escape');
 // รายงาน: ทุกส่วน
 await p.click('#nav [data-act=tab][data-v=report]');await p.waitForTimeout(300);
 {const n=(await p.$$('#main .rsec button')).length;for(let i=0;i<n;i++){await (await p.$$('#main .rsec button'))[i].click();await p.waitForTimeout(400);await scan('report section '+i);}}
 // รายละเอียด (แผ่นเลื่อน)
 await p.click('#nav [data-act=tab][data-v=today]');await p.waitForTimeout(300);
 const det=await p.$('#main [data-act=det]');if(det){await det.click();await p.waitForTimeout(400);await scan('detail sheet');await p.keyboard.press('Escape');await p.waitForTimeout(200);}
 // พนักงาน: ฟอร์มเพิ่ม
 await p.click('#nav [data-act=tab][data-v=people]');await p.waitForTimeout(200);
 await p.click('[data-act=new-emp]');await p.waitForTimeout(200);await scan('new employee form');
 // ตั้งค่า → ทดสอบเข้า-ออกงาน
 await p.click('#nav [data-act=tab][data-v=profile]');await p.click('#main [data-act=tab][data-v=settings]');await p.waitForTimeout(200);
 const sim=await p.$('[data-v=sim]');if(sim){await sim.click();await p.waitForTimeout(300);await scan('sim');}
 // กระดิ่ง + เมนูธีม/ภาษา
 await p.click('[data-act=bell]');await p.waitForTimeout(200);await scan('bell');await p.keyboard.press('Escape');
 await p.click('[data-act=theme]');await p.waitForTimeout(200);await scan('gear menu');await p.click('[data-act=logout-ask]');await p.waitForTimeout(150);await scan('sign-out confirm');await p.click('[data-act=logout-no]');
 // วันที่เป็น ค.ศ.
 const txt=await p.evaluate(()=>document.body.innerText);
 ok(!/25[6-9]\d/.test(txt.replace(/\d{5,}/g,'')),tag+' no Buddhist-era years shown');
 await p.click('[data-act=theme]');
 // ออก แล้วเข้าเป็นพนักงาน
 await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);
 await login('malee','Temp1234!');
 for(const t of ['home','history','leave','schedule']){const el=await p.$('#nav [data-act=tab][data-v='+t+']');if(el){await el.click();await p.waitForTimeout(300);await scan('staff '+t);}}
 await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);
 await login('somchai','Temp1234!');await scan('force password');
 const list=[...leftovers].map(([t,w])=>w+' :: '+t.slice(0,120));
 if(SHOW||list.length)console.log(list.join('\n'));
 ok(list.length===0,tag+' no untranslated Thai text ('+list.length+')');
 // เปลี่ยนกลับเป็นไทย
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 await p.click('[data-act=theme]');await p.click('.thpop [data-act=lang-set][data-l=th]');await p.waitForLoadState();await p.waitForTimeout(400);
 ok((await p.textContent('#main h1')).trim()==='เข้าสู่ระบบ'&&await p.evaluate(()=>document.documentElement.lang)==='th',tag+' switch back to Thai');
 await ctx.close();
}
await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
