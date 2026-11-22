// พนักงาน 6 คนเปิดเว็บพร้อมกัน (คนละเครื่อง/มือถือ) แต่ละคนเข้างานตามกะตัวเอง แล้วออกงาน
// ตั้งนาฬิกาจำลองเป็นวันจันทร์ 23 พ.ย. 2569 จึงไม่ขึ้นกับวันที่รันเทสต์ · ข้อมูลจำลอง ไม่แตะฐานข้อมูลจริง
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
const USERS=['somchai','malee','wichai','nattaya','prasert','kanya'];
const DAY='2026-11-23';
const TIMES=['06:35','07:05','08:05','08:35','09:35','10:05','17:35','18:05','18:35','19:05','23:05','23:35'];
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
async function session(u,hm){
  const ctx=await b.newContext({viewport:{width:360,height:760},isMobile:true,hasTouch:true});const p=await ctx.newPage();
  const pe=[];p.on('pageerror',e=>pe.push(e.message));
  await p.clock.install({time:new Date(DAY+'T'+hm+':00+07:00')});
  await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
  await p.fill('#lu',u);await p.fill('#lp','Temp1234!');await p.click('#lbtn');await p.waitForTimeout(700);
  if(await p.$('#forceForm')){ // บัญชีรหัสชั่วคราว: ต้องตั้งรหัสใหม่ก่อน
    await p.fill('#pwNew','NewPass#2026');await p.fill('#pwNew2','NewPass#2026');await p.click('#pwOk');await p.waitForTimeout(900);
    if(await p.$('#forceForm'))pe.push('stuck on forced password screen');
  }
  return {ctx,p,pe};
}
// 1) หาเวลาเข้ากะของแต่ละคนในวันนั้น (ลองหลายช่วงเวลา ดูว่าปุ่ม "เข้างาน" กดได้เมื่อไร)
const plan={};
for(const u of USERS){
  for(const hm of TIMES){const s=await session(u,hm);const can=!!(await s.p.$('#main [data-act=checkin]'));
    const info=can?await s.p.$eval('#main .card.hero',e=>(e.innerText.match(/กะ \d\d\.\d\d–\d\d\.\d\d/)||[''])[0]):'';await s.ctx.close();
    if(can){plan[u]={hm,info};break;}}
  console.log('      '+u.padEnd(8)+(plan[u]?'เข้างานได้ตอน '+plan[u].hm+' · '+plan[u].info:'ไม่มีกะวันนี้'));
}
const who=USERS.filter(u=>plan[u]);ok(who.length>=5,'found shifts for '+who.length+' users on '+DAY);
// 2) ทุกคนล็อกอิน + กดเข้างานพร้อมกัน
const ss=await Promise.all(who.map(u=>session(u,plan[u].hm)));
const res=await Promise.all(ss.map(async (s,i)=>{const p=s.p;
  await p.click('#main [data-act=checkin]');await p.waitForTimeout(250);await p.click('[data-act=modal-ok]');await p.waitForTimeout(700);
  const card=await p.$eval('#main .card.hero',e=>e.innerText.replace(/\s+/g,' '));
  return {u:who[i],card,out:!!(await p.$('#main [data-act=checkout]')),pe:s.pe};}));
for(const r of res){
  ok(r.out&&/เข้างานสำเร็จ/.test(r.card)&&/เข้างาน \d\d:\d\d ออกงาน —/.test(r.card),r.u+' checked in ('+(r.card.match(/เข้างานสำเร็จ[^·]*·\s*\S+(\s\d+\sนาที)?/)||['?'])[0]+')');
  ok(!r.pe.length,r.u+' no page errors'+(r.pe.length?': '+r.pe.join(' | '):''));
}
// 3) กดเข้างานซ้ำไม่ได้ / การ์ดยังพอดีจอ
for(const [i,s] of ss.entries()){const m=await s.p.evaluate(()=>{const c=document.querySelector('#main .card.hero').getBoundingClientRect(),n=document.querySelector('#nav').getBoundingClientRect();return c.bottom<=n.top+1;});ok(m,who[i]+' card fits screen after check-in');}
// 4) ออกงานพร้อมกัน (เดินเวลาไปหลังเลิกกะ 9–12 ชม.)
await Promise.all(ss.map(s=>s.p.clock.fastForward('09:30:00')));
const outs=await Promise.all(ss.map(async (s,i)=>{const p=s.p;await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await p.waitForTimeout(300);
  const btn=await p.$('#main [data-act=checkout]');if(!btn)return {u:who[i],ok:false,card:'no checkout button'};
  await btn.click();await p.waitForTimeout(250);await p.click('[data-act=modal-ok]');await p.waitForTimeout(700);
  const card=await p.$eval('#main .card.hero',e=>e.innerText.replace(/\s+/g,' '));return {u:who[i],ok:/ออกงานสำเร็จ/.test(card)&&/เข้างาน \d\d:\d\d ออกงาน \d\d:\d\d/.test(card),card};}));
for(const r of outs)ok(r.ok,r.u+' checked out'+(r.ok?'':': '+r.card.slice(0,120)));
await Promise.all(ss.map(s=>s.ctx.close()));
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
