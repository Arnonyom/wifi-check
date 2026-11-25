// เปลี่ยนภาษาทันที (ไม่โหลดหน้าใหม่ ไม่หลุดล็อกอิน): ไทย → อังกฤษ → ไทย แล้วทุกหน้าต้องเหมือนเดิมทุกตัวอักษร
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const TH=/[฀-๿]/;
for(const vp of [{width:1280,height:900},{width:390,height:844}]){
 const tag=vp.width>500?'d':'m';
 const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+' '+e.message));
 let loads=0;p.on('load',()=>loads++);
 await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
 // หน้าล็อกอิน: เปลี่ยนแล้วไม่โหลดใหม่ ช่องที่พิมพ์ไว้ยังอยู่
 await p.fill('#lu','admin');
 await p.click('[data-act=lang-set]');await p.waitForTimeout(300);
 ok(loads===1,tag+' login: switching language does not reload');
 ok((await p.textContent('#main h1')).trim()==='Sign in'&&await p.inputValue('#lu')==='admin',tag+' login: English now, typed username kept');
 await p.click('[data-act=lang-set]');await p.waitForTimeout(200);
 ok((await p.textContent('#main h1')).trim()==='เข้าสู่ระบบ',tag+' login: back to Thai');
 await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(800);
 // ไล่ทุกหน้า: ข้อความหน้าจอตอนไทย → เปลี่ยนเป็นอังกฤษ (ต้องยังล็อกอิน + ไม่มีคำไทยของแอป) → กลับไทย (ต้องเหมือนเดิม)
 const names=await p.evaluate(()=>{const d=window.__mockdb;return [].concat(d.profiles.map(x=>x.name),d.leaves.map(x=>x.reason),d.overrides.map(x=>x.note),d.attendance.map(x=>x.admin_note)).filter(Boolean).sort((a,b)=>b.length-a.length);});
 const pageText=()=>p.evaluate(()=>{const m=document.getElementById('main').cloneNode(true);m.querySelectorAll('#clk,.clock,.tnum').forEach(e=>e.remove());return document.getElementById('nav').innerText+'\n'+m.innerText.replace(/\d{1,2}:\d{2}(:\d{2})?/g,'#');});
 const strip=t=>{let x=t;names.forEach(n=>{x=x.split(n).join('');n.split(' ').forEach(w=>{if(w.length>2)x=x.split(w).join('');});});return x.replace(/[฀-๿]+…/g,'').replace(/^.*ไทย.*$/mg,'');};
 const pages=[['#nav [data-act=tab][data-v=today]','overview'],['#nav [data-act=tab][data-v=schedule]','schedule'],['#nav [data-act=tab][data-v=people]','staff'],['#nav [data-act=tab][data-v=leaves]','leaves'],['#nav [data-act=tab][data-v=report]','report'],['.top-right .iconbtn[data-act=profile]','profile'],['#main [data-act=tab][data-v=settings]','settings']];
 for(const [sel,name] of pages){
  await p.click(sel);await p.waitForTimeout(350);
  const th1=await pageText();
  await p.click('.top-right [data-act=lang-set]');await p.waitForTimeout(350);
  const en=await pageText();
  const left=strip(en).split('\n').filter(l=>TH.test(l));
  ok(await p.$('#lu')===null&&await p.$('#nav .tab')!==null,tag+' '+name+': still signed in after switching');
  ok(left.length===0,tag+' '+name+': English, no Thai left'+(left.length?' → '+left.slice(0,3).join(' | '):''));
  await p.click('.top-right [data-act=lang-set]');await p.waitForTimeout(350);
  const th2=await pageText();
  ok(th1===th2,tag+' '+name+': back to Thai exactly the same');
  if(th1!==th2){const a=th1.split('\n'),c=th2.split('\n');for(let i=0;i<Math.max(a.length,c.length);i++)if(a[i]!==c[i]){console.log('   was:',a[i],'\n   now:',c[i]);break;}}
 }
 ok(loads===1,tag+' no page reloads at all ('+loads+')');
 ok(await p.evaluate(()=>{try{return localStorage.getItem('wc-lang')}catch(e){return null}})==='th',tag+' language choice remembered');
 await ctx.close();
}
await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
