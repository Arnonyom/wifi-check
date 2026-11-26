// หน้าพนักงาน (ผู้ดูแล): แต่ละทีมเป็นการ์ดเดียว ข้างในเป็นรายชื่อ · ปุ่ม แก้ไข/รีเซ็ตรหัสผ่าน/ลบ ซ่อนไว้ กดชื่อแล้วขยาย
// กดคนอื่นสลับ · กดซ้ำ/กดที่อื่นหุบ · ป้ายกะว่างไม่แสดง · ลากสลับยังใช้ได้ (ดู torder)
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
for(const vp of [{width:1280,height:900},{width:390,height:844}]){
 const tag=vp.width>500?'d':'m';
 const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(tag+' '+e.message));
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(800);
 await p.click('#nav [data-act=tab][data-v=people]');await p.waitForTimeout(250);
 const teams=await p.$$eval('#main section.card.pteam',e=>e.length);
 ok(teams>=3,tag+' each team is one card ('+teams+')');
 ok(await p.$$eval('#main .pteam .plist .prow',e=>e.length)>=8,tag+' employees listed as rows inside team cards');
 ok(await p.$('#main [data-act=edit-emp]')===null&&await p.$('#main [data-act=pw-reset]')===null&&await p.$('#main [data-act=del-emp]')===null,tag+' action buttons hidden until a name is tapped');
 ok(await p.$$eval('#main .chip',e=>e.every(x=>x.textContent.trim()!=='')),tag+' no empty chips');
 const openIds=()=>p.$$eval('#main .prow.open',e=>e.map(x=>x.dataset.eid));
 const ids=await p.$$eval('#main .prow',e=>e.map(x=>x.dataset.eid));
 // กดชื่อ → ขยาย
 await p.click('[data-pr="'+ids[1]+'"]');await p.waitForTimeout(150);
 ok(JSON.stringify(await openIds())===JSON.stringify([ids[1]]),tag+' tap name expands');
 const btn=await p.$$eval('.prow.open [data-act]',e=>e.map(x=>x.dataset.act));
 ok(btn.includes('edit-emp')&&btn.includes('pw-reset')&&btn.includes('del-emp'),tag+' expanded row shows edit / reset password / delete');
 ok(await p.$eval('[data-pr="'+ids[1]+'"]',e=>e.getAttribute('aria-expanded'))==='true',tag+' aria-expanded set');
 // กดคนอื่น → สลับ
 await p.click('[data-pr="'+ids[2]+'"]');await p.waitForTimeout(150);
 ok(JSON.stringify(await openIds())===JSON.stringify([ids[2]]),tag+' tap another name switches');
 // กดซ้ำ → หุบ
 await p.click('[data-pr="'+ids[2]+'"]');await p.waitForTimeout(150);
 ok((await openIds()).length===0,tag+' tap same name again collapses');
 // กดที่อื่น → หุบ
 await p.click('[data-pr="'+ids[0]+'"]');await p.click('#main h1');await p.waitForTimeout(150);
 ok((await openIds()).length===0,tag+' tap elsewhere collapses');
 // ลบ: ยืนยันอยู่ในแถวที่ขยาย · ยกเลิกแล้วยังเปิดอยู่
 await p.click('[data-pr="'+ids[1]+'"]');await p.click('.prow.open [data-act=del-emp]');await p.waitForTimeout(150);
 ok((await p.textContent('.prow.open')).includes('จะหายถาวร'),tag+' delete asks for confirmation inside the row');
 await p.click('.prow.open [data-act=del-no]');await p.waitForTimeout(150);
 ok(JSON.stringify(await openIds())===JSON.stringify([ids[1]])&&await p.$('.prow.open [data-act=del-emp]')!==null,tag+' cancel delete keeps the row open');
 // แก้ไข: เปิดฟอร์ม
 await p.click('.prow.open [data-act=edit-emp]');await p.waitForTimeout(200);
 ok(await p.$('#empEd')!==null,tag+' edit opens the form');
 await p.click('[data-act=cancel-emp]');await p.waitForTimeout(150);
 // รีเซ็ตรหัสผ่าน: เปิดหน้าต่าง
 await p.click('[data-pr="'+ids[1]+'"]');await p.waitForTimeout(100);if(!(await openIds()).length){await p.click('[data-pr="'+ids[1]+'"]');await p.waitForTimeout(100);}
 await p.click('.prow.open [data-act=pw-reset]');await p.waitForTimeout(200);
 ok(await p.$('#pwbox .modal')!==null,tag+' reset password opens');
 await p.click('[data-act=pw-close]');await p.waitForTimeout(200);
 // คีย์บอร์ด
 await p.focus('[data-pr="'+ids[3]+'"]');await p.keyboard.press('Enter');await p.waitForTimeout(150);
 ok(JSON.stringify(await openIds())===JSON.stringify([ids[3]]),tag+' keyboard Enter expands');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),tag+' no horizontal scroll');
 if(tag==='m')await p.screenshot({path:S+'plist_m.png'});
 await p.close();
}
await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
