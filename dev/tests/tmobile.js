// มือถือ: การ์ดลงเวลาพอดีจอแม้ฟอนต์โหลดทีหลัง/ตัวอักษรใหญ่ · ไม่มีเลื่อนแนวนอน · ปัดลงปิดหน้าต่าง · แสดงเวลาเข้า–ออกงาน
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const noBanner=p=>p.evaluate(()=>{const d=document.querySelector('body > div:first-child');if(d&&/ตัวอย่างสำหรับอนุมัติ/.test(d.innerText))d.remove();});
const fit=p=>p.evaluate(()=>{const c=document.querySelector('#main .card.hero').getBoundingClientRect(),r=document.querySelector('.ring').getBoundingClientRect(),nr=document.querySelector('#nav').getBoundingClientRect();
  const bottom=nr.top>innerHeight/2?nr.top:innerHeight;return {fits:c.bottom<=bottom+1,ring:Math.round(r.width),gap:Math.round(bottom-c.bottom),hscroll:document.documentElement.scrollWidth>document.documentElement.clientWidth};});
async function login(p,u,pw){await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(700);}

// 1) พอดีจอ: หลายขนาด (vivo Y 360x760, vivo V 393x873, เล็ก 320x640) + ฟอนต์โหลดทีหลัง + ตัวอักษรใหญ่ 130%
for(const [w,h,n] of [[360,760,'vivoY'],[393,873,'vivoV'],[320,640,'small'],[412,915,'big']]){
 for(const mode of ['normal','fontswap','bigtext']){
  const p=await b.newPage({viewport:{width:w,height:h},hasTouch:true,isMobile:true});p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);await noBanner(p);
  await login(p,'malee','Temp1234!');
  // ฟอนต์จริงโหลดเสร็จ = ตัวหนังสือในการ์ดสูงขึ้นหลังวาดครั้งแรก
  if(mode==='fontswap')await p.addStyleTag({content:'.card.hero p{font-size:17px!important;line-height:1.6!important}.clock{font-size:66px!important}'});
  if(mode==='bigtext')await p.addStyleTag({content:'.card.hero p,.card.hero b,.card.hero small{font-size:130%!important}.clock{font-size:clamp(52px,15vw,78px)!important}'});
  await p.waitForTimeout(250);
  const m=await fit(p);
  ok(m.fits&&!m.hscroll,n+' '+w+'x'+h+' '+mode+': fits (ring '+m.ring+', gap '+m.gap+', hscroll '+m.hscroll+')');
  if(n==='vivoY'&&mode==='fontswap')await p.screenshot({path:S+'mob_vivo.png'});
  await p.close();
 }
}

// 2) เวลาเข้า–ออกงาน
let p=await b.newPage({viewport:{width:360,height:760},hasTouch:true,isMobile:true});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);await noBanner(p);
// กะที่เพิ่งเลิก (ไม่ได้ทำงานอยู่ตอนนี้): เข้า 3 ชม.ก่อน ออก 1 ชม.ก่อน
const live=await p.evaluate(()=>window.__mockdb.attendance.some(a=>a.emp==='e2'&&!a.check_out));
if(!live)await p.evaluate(()=>{const db=window.__mockdb,r=db.attendance.filter(a=>a.emp==='e2').pop();r.check_in=new Date(Date.now()-3*36e5).toISOString();r.check_out=new Date(Date.now()-36e5).toISOString();});
await login(p,'malee','Temp1234!');
let io=await p.$eval('#main .card.hero',e=>{const x=e.querySelector('.iotimes');return x?x.innerText.replace(/\s+/g,' '):'';});
console.log('      times on card:',io||'(none)');
const working=await p.$('#main [data-act=checkout]');
if(working){ok(/เข้างาน \d\d:\d\d ออกงาน —/.test(io),'working: shows check-in time, check-out —');
  await p.click('[data-act=checkout]');await p.waitForTimeout(200);await p.click('[data-act=modal-ok]');await p.waitForTimeout(500);
  io=await p.$eval('#main .card.hero',e=>{const x=e.querySelector('.iotimes');return x?x.innerText.replace(/\s+/g,' '):'';});console.log('      after check-out:',io);
  ok(/เข้างาน \d\d:\d\d ออกงาน \d\d:\d\d/.test(io),'after check-out: shows both times');
  const m=await fit(p);ok(m.fits,'still fits after check-out (gap '+m.gap+')');
}else ok(/เข้างาน \d\d:\d\d ออกงาน \d\d:\d\d/.test(io),'just finished: shows check-in and check-out times');

// 3) ปัดลงเพื่อปิด
async function swipe(p,sel,dy){
  await p.evaluate(([sel,dy])=>{const m=document.querySelector(sel);const r=m.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+20;
    const T=(yy)=>new Touch({identifier:1,target:m,clientX:x,clientY:yy});
    m.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[T(y)],changedTouches:[T(y)]}));
    for(let i=1;i<=6;i++){const t=T(y+dy*i/6);m.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[t],changedTouches:[t]}));}
    m.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],changedTouches:[T(y+dy)]}));},[sel,dy]);
  await p.waitForTimeout(400);
}
// เปลี่ยนรหัสผ่าน (พนักงาน)
await p.click('#nav [data-act=tab][data-v=profile]');await p.waitForTimeout(150);await p.click('#main [data-act=pw-self]');await p.waitForTimeout(200);
ok(!!(await p.$('#pwbox .modal')),'pw sheet open');
await swipe(p,'#pwbox .modal',40);ok(!!(await p.$('#pwbox .modal')),'short swipe keeps pw sheet open');
await swipe(p,'#pwbox .modal',200);ok(!(await p.$('#pwbox .modal')),'swipe down closes pw sheet');
await p.close();
// ผู้ดูแล: รายละเอียด + เลือกวันที่
p=await b.newPage({viewport:{width:360,height:760},hasTouch:true,isMobile:true});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);await login(p,'admin','Admin@2026');
await p.click('[data-k="now:working"]');await p.waitForTimeout(200);ok(!!(await p.$('#detbox .modal')),'detail sheet open');
await swipe(p,'#detbox .modal',200);ok(!(await p.$('#detbox .modal')),'swipe down closes detail sheet');
await p.click('#nav [data-act=tab][data-v=report]');await p.click('[data-act=rsec][data-s=table]');await p.waitForTimeout(150);
await p.click('[data-act=dp][data-id=rpFrom]');await p.waitForTimeout(150);ok(!!(await p.$('#dpbox .modal')),'date picker open');
await swipe(p,'#dpbox .modal',200);ok(!(await p.$('#dpbox .modal')),'swipe down closes date picker');
// หน้าจอคอม: ไม่ปิดด้วยการปัด
const d=await b.newPage({viewport:{width:1280,height:900},hasTouch:true});await d.goto('file://'+S+'preview_detail.html');await d.waitForTimeout(300);await login(d,'admin','Admin@2026');
await d.click('[data-k="now:working"]');await d.waitForTimeout(200);await swipe(d,'#detbox .modal',200);ok(!!(await d.$('#detbox .modal')),'desktop: swipe does not close');
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
