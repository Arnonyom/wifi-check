// การล็อกอินหลายเครื่อง: ออกจากระบบ = เฉพาะเครื่องนี้ (scope local) · ปุ่มผู้ดูแล (รีเซ็ตรหัสผ่าน ฯลฯ) ถ้าการล็อกอินหมดอายุ
// → ต่ออายุแล้วทำซ้ำเอง 1 ครั้ง · ถ้าถูกออกจากระบบจากเครื่องอื่น → บอกเหตุผลชัด ๆ แล้วกลับหน้าล็อกอิน (ไม่ค้าง "ยังไม่ได้ล็อกอิน")
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const p=await b.newPage({viewport:{width:1100,height:900}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
const login=async()=>{await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(800);};
const openReset=async()=>{await p.click('#nav [data-v=people]');await p.waitForTimeout(200);await p.click('[data-pr] >> nth=1');await p.waitForTimeout(150);await p.click('.prow.open [data-act=pw-reset]');await p.waitForTimeout(200);
  await p.fill('#pwNew','Reset#2026');await p.fill('#pwNew2','Reset#2026');};
await login();
// 1) หมดอายุครั้งเดียว → ต่ออายุแล้วสำเร็จเอง
await p.evaluate(()=>{window.__expiredOnce=true;window.__calls.length=0;});
await openReset();await p.click('#pwOk');await p.waitForTimeout(700);
const c1=await p.evaluate(()=>window.__calls.map(c=>c[0]));
ok(c1.slice(0,3).join(',')==='fn,refresh,fn','expired sign-in: refreshed and retried automatically ('+c1.join(',')+')');
ok(await p.$('#pwForm')===null,'reset password succeeded after refresh');
// 2) ถูกออกจากระบบจากเครื่องอื่น → ข้อความชัด + กลับหน้าล็อกอิน
await p.evaluate(()=>{window.__revoked=true;});
await openReset();await p.click('#pwOk');await p.waitForTimeout(400);
ok((await p.textContent('#pwForm')).includes('หมดอายุ'),'revoked: dialog explains sign-in expired (not "ยังไม่ได้ล็อกอิน")');
await p.waitForTimeout(1800);
ok(await p.$('#loginForm')!==null&&(await p.textContent('#lerr')).includes('อาจออกจากระบบจากเครื่องอื่น'),'revoked: back to sign-in page with the reason');
const so=await p.evaluate(()=>window.__calls.filter(c=>c[0]==='signOut').map(c=>c[1].scope));
ok(so.length&&so.every(s=>s==='local'),'local sign-out only ('+so.join(',')+')');
// 3) เข้าใหม่ได้ · ปุ่มออกจากระบบ = เฉพาะเครื่องนี้
await p.evaluate(()=>{window.__revoked=false;window.__calls.length=0;});
await login();ok(await p.$('#nav .tab')!==null,'can sign in again');
await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);
const so2=await p.evaluate(()=>window.__calls.filter(c=>c[0]==='signOut').map(c=>c[1].scope));
ok(JSON.stringify(so2)==='["local"]','sign-out button signs out this device only');
// 4) โค้ดในเว็บจริงไม่มีการออกจากระบบแบบทุกเครื่อง
const src=require('fs').readFileSync(S+'index.html','utf8');
ok(!/auth\.signOut\(\)/.test(src),'web app never calls a global signOut()');
ok(/signOut\(\{ scope: "local" \}\)/.test(require('fs').readFileSync(S+'supabase/functions/admin-users/index.ts','utf8')),'edge function: password check signs out its own session only');
await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
