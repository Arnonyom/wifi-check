// หน้าพนักงาน: ลากการ์ดสลับตำแหน่ง (เมาส์/นิ้ว/คีย์บอร์ด) · ย้ายได้ในกลุ่มเดียวกัน · บันทึกผ่าน set_profile_order · เปิดหน้าใหม่ลำดับยังอยู่
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
for(const vp of [{width:1280,height:900},{width:360,height:760,hasTouch:true}]){
 const tag=vp.width>500?'d':'m';
 const p=await b.newPage({viewport:{width:vp.width,height:vp.height},hasTouch:!!vp.hasTouch});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
 const goPeople=async()=>{await p.click('#nav [data-act=tab][data-v=today]');await p.waitForTimeout(100);await p.click('#nav [data-act=tab][data-v=people]');await p.waitForTimeout(200);};
 await goPeople();
 const ids=g=>p.$$eval('.pgrid[data-grp="'+g+'"] .pcard',cs=>cs.map(c=>c.getAttribute('data-eid')));
 const a0=await ids('A'),b0=await ids('B');
 ok(a0.length>=3,tag+' team A has cards ('+a0.length+')');
 ok(await p.$$eval('.pgrid[data-grp=A] .dragh',hs=>hs.every(h=>h.offsetWidth>=36)),tag+' drag handle visible and big enough');
 // ลากการ์ดแรกไปไว้หลังการ์ดที่ 3
 const box=async sel=>(await p.$(sel)).boundingBox();
 const top=async id=>{await p.evaluate(id=>{const c=document.querySelector('.pcard[data-eid="'+id+'"]');scrollTo(0,scrollY+c.getBoundingClientRect().top-90);},id);await p.waitForTimeout(100);};
 await top(a0[0]);const h=await box('.pcard[data-eid="'+a0[0]+'"] .dragh');
 const t=await box('.pcard[data-eid="'+a0[2]+'"]');
 await p.mouse.move(h.x+h.width/2,h.y+h.height/2);await p.mouse.down();
 const steps=12;for(let i=1;i<=steps;i++){await p.mouse.move(h.x+(t.x+t.width*0.6-h.x)*i/steps,h.y+(t.y+t.height*0.5-h.y)*i/steps);await p.waitForTimeout(16);}
 ok(await p.$('.pcard.dragging')!==null&&await p.$('.pcard-ph')!==null,tag+' dragging card + placeholder shown');
 await p.mouse.up();await p.waitForTimeout(200);
 const a1=await ids('A');
 ok(a1.indexOf(a0[0])===2&&a1.length===a0.length,tag+' card moved to 3rd place ('+a1.join(',')+')');
 ok(await p.$('.pcard.dragging')===null&&await p.$('.pcard-ph')===null,tag+' drag cleaned up');
 const call=await p.evaluate(()=>window.__calls.filter(c=>c[1]==='set_profile_order').pop());
 ok(call&&JSON.stringify(call[2].p_ids)===JSON.stringify(a1),tag+' set_profile_order called with new order');
 // เปิดหน้าใหม่ (render ใหม่) ลำดับยังอยู่
 await goPeople();
 ok(JSON.stringify(await ids('A'))===JSON.stringify(a1),tag+' order kept after re-render');
 // ลากข้ามกลุ่มไม่ได้
 if(b0.length&&tag==="d"){
  const n0=await p.evaluate(()=>window.__calls.filter(c=>c[1]==='set_profile_order').length);
  await top(a1[0]);const h2=await box('.pcard[data-eid="'+a1[0]+'"] .dragh');const tb=await box('.pcard[data-eid="'+b0[0]+'"]');
  await p.mouse.move(h2.x+h2.width/2,h2.y+h2.height/2);await p.mouse.down();
  for(let i=1;i<=12;i++){await p.mouse.move(h2.x+(tb.x+tb.width/2-h2.x)*i/12,h2.y+(tb.y+tb.height/2-h2.y)*i/12);await p.waitForTimeout(16);}
  await p.mouse.up();await p.waitForTimeout(200);
  ok(JSON.stringify(await ids('A'))===JSON.stringify(a1)&&JSON.stringify(await ids('B'))===JSON.stringify(b0),tag+' cannot move card to another group');
  ok(await p.evaluate(()=>window.__calls.filter(c=>c[1]==='set_profile_order').length)===n0,tag+' no save when order unchanged');
 }
 // คีย์บอร์ด: ลูกศรขวา = ย้ายไปหลัง 1 ช่อง
 await p.focus('.pcard[data-eid="'+a1[0]+'"] .dragh');await p.keyboard.press('ArrowRight');await p.waitForTimeout(150);
 const a2=await ids('A');
 ok(a2[1]===a1[0]&&a2[0]===a1[1],tag+' keyboard arrow moves card');
 ok(await p.evaluate(()=>document.activeElement&&document.activeElement.matches('.dragh')),tag+' focus stays on handle');
 // ปุ่มอื่นบนการ์ดยังใช้ได้
 await p.click('.pcard[data-eid="'+a2[0]+'"] [data-act=edit-emp]');await p.waitForTimeout(200);
 ok(await p.$('#empEd')!==null,tag+' edit button still works');
 await goPeople();
 if(tag==='m'){ // ทดสอบลากด้วยนิ้ว (touch → pointer events)
  const cdp=await p.context().newCDPSession(p);
  await top(a2[0]);const hh=await box('.pcard[data-eid="'+a2[0]+'"] .dragh'),tt=await box('.pcard[data-eid="'+a2[2]+'"]');
  const pt=(x,y)=>[{x,y,id:1}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(hh.x+hh.width/2,hh.y+hh.height/2)});
  for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(hh.x+hh.width/2+(tt.x+tt.width/2-hh.x-hh.width/2)*i/12,hh.y+hh.height/2+(tt.y+tt.height*0.6-hh.y-hh.height/2)*i/12)});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);
  const a3=await ids('A');
  ok(a3.indexOf(a2[0])===2,tag+' touch drag moves card ('+a3.join(',')+')');
  const lastSave=await p.evaluate(()=>window.__calls.filter(c=>c[1]==='set_profile_order').pop()[2].p_ids);
  ok(JSON.stringify(lastSave)===JSON.stringify(a3),tag+' touch drag saved');
  ok(await p.$('.pcard.dragging')===null&&!(await p.evaluate(()=>document.body.classList.contains('pdragging'))),tag+' touch drag cleaned up');
  // ปัดนิ้วบนการ์ด (ไม่ใช่ที่ปุ่ม ⠿) ต้องเลื่อนหน้าจอได้ตามปกติ และไม่ย้ายการ์ด
  await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(100);
  const cb=await box('.pgrid[data-grp=A] .pcard b');
  {const X=Math.round(cb.x+20),Y=Math.round(cb.y+10)+300;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:X,y:Y}]});for(let i=1;i<=15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:X,y:Y-i*20}]});await p.waitForTimeout(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(400);}
  ok(await p.evaluate(()=>scrollY)>100,tag+' finger swipe on card scrolls page (scrollY '+await p.evaluate(()=>Math.round(scrollY))+')');
  ok(JSON.stringify(await ids('A'))===JSON.stringify(a3),tag+' swipe does not reorder');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),tag+' no horizontal scroll');
 }
 await p.close();
}
{const p=await b.newPage();await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 await p.fill('#lu','malee');await p.fill('#lp','Temp1234!');await p.click('#lbtn');await p.waitForTimeout(700);
 ok(await p.$('.dragh')===null,'staff sees no drag handles');await p.close();}
await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
