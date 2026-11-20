// หน้าพนักงาน: ไม่มีเบอร์โทรในการ์ดและฟอร์ม · แก้ไข/เพิ่มพนักงานยังบันทึกได้ · ค่าเดิมในฐานข้อมูลไม่ถูกลบ
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
for(const vp of [{width:390,height:844},{width:1280,height:900}]){
 const tag=vp.width>500?'d':'m';const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(400);
 await p.evaluate(()=>{window.__mockdb.profiles.find(x=>x.username==='malee').phone='0812345602';});
 await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
 await p.click('#nav [data-act=tab][data-v=people]');await p.waitForTimeout(200);
 ok(!(await p.$eval('#main',e=>e.innerText)).includes('0812345602'),tag+' phone not shown on cards');
 // แก้ไข malee
 const id=await p.evaluate(()=>window.__mockdb.profiles.find(x=>x.username==='malee').id);
 await p.click('[data-act=edit-emp][data-id="'+id+'"]');await p.waitForTimeout(150);
 ok(!(await p.$('#fPhone')),tag+' no phone field in edit form');
 await p.fill('#fName','มาลี รักงานมาก');await p.click('[data-act=save-emp]');await p.waitForTimeout(400);
 const pr=await p.evaluate(()=>window.__mockdb.profiles.find(x=>x.username==='malee'));
 ok(pr.name==='มาลี รักงานมาก',tag+' edit saved');ok(pr.phone==='0812345602',tag+' old phone kept in database');
 // เพิ่มพนักงานใหม่
 await p.click('[data-act=new-emp]');await p.waitForTimeout(150);
 ok(!(await p.$('#fPhone')),tag+' no phone field in new form');
 await p.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
