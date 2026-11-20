// หน้าลงเวลาพนักงาน: ไม่มีประวัติล่าสุด · ปุ่มใหญ่ขึ้น · การ์ดพอดีจอไม่ต้องเลื่อน (รวมกรณีมีข้อความเตือน)
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
for(const [w,h,n] of [[390,844,'iPhone14'],[375,667,'iPhoneSE'],[360,740,'Android'],[430,932,'ProMax'],[1280,900,'desktop']]){
 for(const stale of [false,true]){
  const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(400);
  // แถบตัวอย่างด้านบนไม่มีในเว็บจริง
  await p.evaluate(()=>{const d=document.querySelector('body > div:first-child');if(d&&/ตัวอย่างสำหรับอนุมัติ/.test(d.innerText))d.remove();});
  if(stale)await p.evaluate(()=>{const db=window.__mockdb,t=Date.now();const r=db.attendance.filter(a=>a.emp==='e2'&&Date.parse(a.check_in)<t-2*864e5).pop();if(r)r.check_out=null;});
  await p.fill('#lu','malee');await p.fill('#lp','Temp1234!');await p.click('#lbtn');await p.waitForTimeout(700);
  const m=await p.evaluate(()=>{const c=document.querySelector('#main .card.hero').getBoundingClientRect(),r=document.querySelector('.ring').getBoundingClientRect(),nr=document.querySelector('#nav').getBoundingClientRect();
    const bottom=nr.top>innerHeight/2?nr.top:innerHeight;
    return {fits:c.bottom<=bottom,ring:Math.round(r.width),gap:Math.round(bottom-c.bottom),hist:document.querySelector('#main').innerText.includes('ประวัติล่าสุด'),warn:document.querySelector('#main .card.hero').innerText.includes('ยังไม่ได้ลงเวลาออก')};});
  const tag=n+(stale?'+warn':'');
  ok(m.fits,tag+' card fits screen (ring '+m.ring+'px, gap '+m.gap+'px)');
  ok(!m.hist,tag+' no recent-history card');
  if(stale)ok(m.warn,tag+' forgot-checkout warning shown');
  if(!stale&&w>=360)ok(m.ring>=260,tag+' button bigger than before (250px)');
  await p.close();
 }
}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
