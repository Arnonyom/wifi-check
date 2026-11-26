// บั๊กที่แก้ใน patch_fix: ลืมออกงาน · รายงานก่อนเริ่มข้อมูล · เตือนลบพนักงาน · ข้อความ Push · ผู้ดูแลยกเลิกการลา
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const login=async(p,u,pw)=>{await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(700);};
const open=async(vp)=>{const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);return p;};

// 1) ลืมออกงาน: กะเมื่อ 2–5 วันก่อนของ malee ค้างไม่ได้ออก
let p=await open({width:390,height:844});
const stale=await p.evaluate(()=>{const db=window.__mockdb,t=Date.now();
  const r=db.attendance.filter(a=>a.emp==='e2'&&Date.parse(a.check_in)<t-2*864e5&&Date.parse(a.check_in)>t-6*864e5).pop();if(!r)return null;r.check_out=null;return r.work_date;});
ok(!!stale,'injected stale open shift '+stale);
await login(p,'malee','Temp1234!');
const card=await p.$eval('#main .card.hero',e=>e.innerText);
ok(card.includes('ยังไม่ได้ลงเวลาออก'),'home warns about forgotten check-out');
const liveOpen=await p.evaluate(()=>{const t=Date.now();return window.__mockdb.attendance.filter(a=>a.emp==='e2'&&!a.check_out&&Date.parse(a.check_in)>t-864e5).length;});
if(!liveOpen)ok(!(await p.$('#main [data-act=checkout]')),'old shift does not show check-out button');else console.log('      (malee is on a live shift now; check-out button is for that shift)');
await p.screenshot({path:S+'fix_forgot_m.png'});
await p.close();

// 2–5) ผู้ดูแล
for(const vp of [{width:1280,height:900},{width:390,height:844}]){
 const tag=vp.width>500?'d':'m';p=await open(vp);
 // ให้ข้อมูลเริ่มเมื่อ 10 วันก่อน (เหมือนระบบจริงที่เพิ่งเริ่มใช้กลางเดือน)
 await p.evaluate(()=>{const db=window.__mockdb,lim=new Date(Date.now()+7*36e5-10*864e5).toISOString().slice(0,10);db.attendance.splice(0,db.attendance.length,...db.attendance.filter(a=>a.work_date>=lim));});
 await login(p,'admin','Admin@2026');
 // 2) รายงาน: ช่วงก่อนเริ่มมีข้อมูล
 await p.click('#nav [data-act=tab][data-v=report]');await p.click('[data-act=rsec][data-s=table]');await p.waitForTimeout(200);
 await p.click('[data-act=dp][data-id=rpFrom]');await p.waitForTimeout(100);
 await p.click('[data-act=dp-m][data-n="-1"]');await p.waitForTimeout(40);
 await p.click('[data-act=dp-pick] >> nth=0');await p.waitForTimeout(300);
 const firstDay=await p.$$eval('table.rt tbody tr td:first-child',e=>e.length?e[e.length-1].innerText:'');console.log('      ',tag,'earliest row',firstDay);
 const note=await p.$eval('#main',e=>e.innerText);
 ok(/ข้อมูลลงเวลาเริ่มวันที่/.test(note),tag+' report shows data-start note');
 const st=await p.$eval('.sum',e=>e.innerText.replace(/\s+/g,' '));console.log('     ',tag,'sum',st);
 const missing=Number((st.match(/(\d+) ไม่ครบ/)||[])[1]);ok(missing<15,tag+' missing count not inflated ('+missing+')');
 // 3) ลบพนักงาน: เตือนก่อน
 await p.click('#nav [data-act=tab][data-v=people]');await p.waitForTimeout(150);
 await p.click('[data-pr] >> nth=1');await p.waitForTimeout(150);
 const delBtn=await p.$('[data-act=del-emp]');
 if(delBtn){await delBtn.click();await p.waitForTimeout(100);ok((await p.$eval('#main',e=>e.innerText)).includes('จะหายถาวร'),tag+' delete warns history is lost');await p.click('[data-act=del-no]');}
 else{await p.click('[data-act=edit-emp] >> nth=1');await p.waitForTimeout(150);const d2=await p.$('[data-act=del-emp]');ok(!!d2,tag+' delete button found in editor');if(d2){await d2.click();await p.waitForTimeout(100);ok((await p.$eval('#main',e=>e.innerText)).includes('จะหายถาวร'),tag+' delete warns history is lost');}}
 // 4) ข้อความ Push
 await p.click('#nav [data-act=tab][data-v=profile]');await p.click('#main [data-act=tab][data-v=settings]');await p.waitForTimeout(150);
 ok((await p.$eval('#main',e=>e.innerText)).includes('ยังไม่มีระบบส่ง Push'),tag+' push text is honest');
 // 5) อนุมัติแล้วยกเลิกการลา lv2 (5 วันข้างหน้า)
 await p.click('#nav [data-act=tab][data-v=leaves]');await p.waitForTimeout(150);
 await p.click('[data-act=lv-open][data-id=lv2]');await p.waitForTimeout(150);await p.click('[data-act=lv-approve]');await p.waitForTimeout(400);
 const ovBefore=await p.evaluate(()=>window.__mockdb.overrides.filter(o=>o.leave_id==='lv2').length);ok(ovBefore>0,tag+' approve created cover ('+ovBefore+')');
 await p.click('[data-act=lvf][data-f=approved]');await p.waitForTimeout(150);
 await p.click('[data-act=lv-adm-cancel][data-id=lv2]');await p.waitForTimeout(100);
 ok((await p.$eval('#main',e=>e.innerText)).includes('ผู้ทำแทนจะถูกเอาออกจากตาราง'),tag+' cancel asks to confirm');
 if(tag==='m')await p.screenshot({path:S+'fix_cancel_m.png'});
 await p.click('[data-act=lv-adm-cancel-yes]');await p.waitForTimeout(400);
 const after=await p.evaluate(()=>({st:window.__mockdb.leaves.find(l=>l.id==='lv2').status,ov:window.__mockdb.overrides.filter(o=>o.leave_id==='lv2').length}));
 ok(after.st==='cancelled'&&after.ov===0,tag+' leave cancelled and covers removed');
 ok(!(await p.$('[data-act=lv-adm-cancel][data-id=lv2]')),tag+' cancel button gone');
 // ลาที่เริ่มไปแล้วไม่มีปุ่มยกเลิก
 const pastBtn=await p.evaluate(()=>{const td=new Date(Date.now()+7*36e5).toISOString().slice(0,10);return window.__mockdb.leaves.filter(l=>l.status==='approved'&&l.from_date<td).map(l=>l.id).filter(id=>document.querySelector('[data-act=lv-adm-cancel][data-id="'+id+'"]')).length;});
 ok(pastBtn===0,tag+' no cancel button for leave already started');
 await p.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
