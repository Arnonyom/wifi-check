// ลงเวลาแทน: เลือกเข้างาน/ออกงาน/ทั้งคู่ · ใส่แค่เวลา · กะข้ามคืนเลือกวันถัดไปให้เอง · ปุ่มลัด เริ่มกะ/เลิกกะ/ตอนนี้
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const bkkHM=iso=>new Date(Date.parse(iso)+7*36e5).toISOString().slice(11,16);
const bkkD=iso=>new Date(Date.parse(iso)+7*36e5).toISOString().slice(0,10);
for(const vp of [{width:1280,height:900},{width:360,height:760}]){
 const tag=vp.width>500?'d':'m';
 const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 // เตรียม: (1) กะทีม B กลางวันที่ผ่านมาแล้ว ไม่มีบันทึก (ลืมเข้างาน)  (2) กะทีม B กลางคืนที่ผ่านมา: มีแค่เวลาเข้า (ลืมออกงาน)
 const prep=await p.evaluate(()=>{const db=window.__mockdb,today=new Date(Date.now()+7*36e5).toISOString().slice(0,10);
   const past=db.attendance.filter(a=>a.shift_id==='B1'&&a.work_date<today).sort((x,y)=>x.work_date<y.work_date?1:-1)[0];
   const night=db.attendance.filter(a=>a.shift_id==='B2'&&a.check_out&&a.work_date<today).sort((x,y)=>x.work_date<y.work_date?1:-1)[0];
   db.attendance.splice(db.attendance.indexOf(past),1);night.check_out=null;
   return {dIn:past.work_date,dOut:night.work_date,outEmp:night.emp,outIn:night.check_in};});
 await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
 const openSlot=async(d,sid)=>{await p.click('#nav [data-act=tab][data-v=schedule]');await p.waitForTimeout(150);
   if(await p.$('button:has-text("ทีม B")'))await p.click('button:has-text("ทีม B")');await p.waitForTimeout(150);
   for(let i=0;i<4&&!(await p.$('[data-act=edit-slot][data-d="'+d+'"][data-s="'+sid+'"]'));i++){
     const day=await p.$('[data-act=sched-day][data-d="'+d+'"],[data-d="'+d+'"]:not([data-act=edit-slot])');if(day){await day.click();await p.waitForTimeout(150);continue;}
     await p.click('[data-act=sched-nav][data-n="-1"]');await p.waitForTimeout(150);}
   await p.click('[data-act=edit-slot][data-d="'+d+'"][data-s="'+sid+'"]');await p.waitForTimeout(300);};
 const modeOn=()=>p.$eval('#attEd [data-act=att-mode][aria-pressed=true]',e=>e.dataset.m);
 // 1) ลืมเข้างาน
 await openSlot(prep.dIn,'B1');
 const firstTop=await p.evaluate(()=>{const a=document.querySelector('#attEd'),s2=document.querySelector('#slotEd');return a&&s2&&a.getBoundingClientRect().top<s2.getBoundingClientRect().top;});
 ok(firstTop,tag+' attendance editor shown above schedule editor for past day');
 ok(await p.$eval('#attEd [data-act=att-mode][data-m=out]',e=>e.disabled),tag+' "check-out only" disabled when no check-in');
 ok(await modeOn()==='both',tag+' default mode for missed shift = both');
 await p.click('#attEd [data-act=att-mode][data-m=in]');await p.waitForTimeout(150);
 ok(!!(await p.$('#atInT'))&&!(await p.$('#atOutT')),tag+' mode "in" shows only check-in field');
 await p.fill('#atInT','07:20');await p.waitForTimeout(100);
 ok((await p.textContent('#attPrev')).includes('เข้า 07:20'),tag+' preview updates while typing');
 await p.click('#attEd [data-act=save-att]');await p.waitForTimeout(400);
 let r=await p.evaluate(d=>window.__mockdb.attendance.find(a=>a.work_date===d&&a.shift_id==='B1'),prep.dIn);
 ok(r&&bkkHM(r.check_in)==='07:20'&&!r.check_out,tag+' saved check-in only ('+(r?bkkHM(r.check_in)+' / '+r.check_out:'none')+')');
 // 2) ลืมออกงาน (กะกลางคืน 19.00–07.00)
 await openSlot(prep.dOut,'B2');
 ok(await modeOn()==='out',tag+' default mode for forgot check-out = out');
 ok(!(await p.$('#atInT'))&&!!(await p.$('#atOutT')),tag+' mode "out" shows only check-out field');
 await p.click('#attEd [data-act=att-set][data-k=Out] >> nth=0');await p.waitForTimeout(150);
 ok(await p.inputValue('#atOutT')==='07:00',tag+' "end of shift" quick button sets 07:00');
 const prev=await p.textContent('#attPrev');ok(/ออก 07:00 \(/.test(prev),tag+' overnight check-out shows next-day date: '+prev.replace(/\s+/g,' '));
 await p.click('#attEd [data-act=save-att]');await p.waitForTimeout(400);
 r=await p.evaluate(d=>window.__mockdb.attendance.find(a=>a.work_date===d&&a.shift_id==='B2'),prep.dOut);
 const next=new Date(Date.parse(prep.dOut+'T00:00:00Z')+864e5).toISOString().slice(0,10);
 ok(r&&r.check_in===prep.outIn&&bkkHM(r.check_out)==='07:00'&&bkkD(r.check_out)===next,tag+' check-out saved on next day, check-in unchanged');
 // 3) เวลาออกก่อนเข้า -> ไม่บันทึก
 await openSlot(prep.dIn,'B1');await p.click('#attEd [data-act=att-mode][data-m=both]');await p.waitForTimeout(150);
 await p.fill('#atInT','10:00');await p.fill('#atOutT','09:00');await p.waitForTimeout(100);
 ok((await p.textContent('#attPrev')).includes('⚠'),tag+' warns out before in');
 // 4) กะที่กำลังทำงาน: ใส่เวลาออกงานล่วงหน้าไม่ได้ (เดิมทำให้ไม่ถูกนับว่า "กำลังทำงาน")
 const live=await p.evaluate(()=>{const today=new Date(Date.now()+7*36e5).toISOString().slice(0,10);const r=window.__mockdb.attendance.find(a=>a.work_date===today&&!a.check_out);return r?{d:r.work_date,s:r.shift_id,team:r.shift_id[0]}:null;});
 if(live){
   await p.click('#nav [data-act=tab][data-v=today]');await p.waitForTimeout(200);
   await p.click('[data-k="now:working"]');await p.waitForTimeout(200);await p.click('#detbox .lib >> nth=0');await p.waitForTimeout(200);
   await p.click('[data-act=go-edit]');await p.waitForTimeout(400);
   ok(await modeOn()==='out',tag+' working shift: default mode out');
   await p.fill('#atOutT','23:59');await p.waitForTimeout(100);
   ok((await p.textContent('#attPrev')).includes('ยังมาไม่ถึง'),tag+' future check-out warned');
   await p.click('#attEd [data-act=save-att]');await p.waitForTimeout(300);
   const still=await p.evaluate(l=>window.__mockdb.attendance.find(a=>a.work_date===l.d&&a.shift_id===l.s).check_out,live);
   ok(!still&&(await p.textContent('#attErr')).includes('ยังมาไม่ถึง'),tag+' future check-out not saved');
 }else console.log('      (no live shift in mock now; future-time check skipped)');
 if(tag==='m'){const ed=await p.$('#attEd');await ed.scrollIntoViewIfNeeded();await p.screenshot({path:S+'att_m.png'});}
 await p.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
