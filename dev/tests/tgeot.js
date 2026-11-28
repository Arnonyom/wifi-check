// 29 พ.ย. 2569: Admin tool › ทดสอบ › ทดสอบตำแหน่ง — สแกนแล้วแสดงผล (ไม่บันทึก)
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const ctx=await b.newContext({viewport:{width:1100,height:900},permissions:['geolocation'],geolocation:{latitude:13.7,longitude:100.5}});const p=await ctx.newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(800);
await p.click('#nav [data-v=profile]');await p.click('#main .admtool');await p.waitForTimeout(250);
await p.click('[data-set-tab=test]');await p.waitForTimeout(80);
ok(JSON.stringify(await p.$$eval('#main .stile:not([hidden])',e=>e.map(x=>x.dataset.tile)))==='["sim","geot","clr"]','test tab: check-in test / location test / clear data');
await p.click('[data-set-open=geot]');await p.waitForTimeout(150);
ok((await p.textContent('#geoTestCard')).includes('ไม่บันทึก'),'says test only, not saved');
await p.click('[data-act=geot-run]');await p.waitForTimeout(100);
ok((await p.textContent('#geoTestCard')).includes('กำลัง'),'scanning…');
await p.waitForTimeout(900);
const t=await p.textContent('#geoTestCard');
ok(t.includes('อ่านตำแหน่งได้')&&t.includes('อาคารสำนักงานตัวอย่าง')&&t.includes('± 15 ม.')&&t.includes('แม่นยำมาก'),'shows place name, accuracy ±15 m (very accurate)');
ok(t.includes('13.74661, 100.53928')&&await p.$('#geoTestCard a[href*="google.com/maps?q=13.746610,100.539280"]')!==null,'shows coordinates + map link');
ok(await p.evaluate(()=>window.__calls.filter(c=>c[0]==='rpc'&&c[1]==='set_my_location').length)===0,'nothing saved (no set_my_location)');
// ไม่อนุญาตตำแหน่ง
await p.evaluate(()=>{window.__geoMock.geo={getCurrentPosition:function(ok,bad){setTimeout(function(){bad({code:1});},100);}};});
await p.click('[data-act=geot-run]');await p.waitForTimeout(400);
ok((await p.$$('#geoTestCard .gtrow')).length===2&&(await p.textContent('#geoTestCard .gtrow.gtnew')).includes('ไม่ได้อนุญาตตำแหน่ง')&&(await p.textContent('#geoTestCard .gtrow.gtnew')).includes('จะลงเวลาไม่ได้'),'denied: explains staff cannot check in · keeps previous result');
// อ่านค่าไม่ได้
await p.evaluate(()=>{window.__geoMock.geo={getCurrentPosition:function(ok,bad){setTimeout(function(){bad({code:2});},100);}};});
await p.click('[data-act=geot-run]');await p.waitForTimeout(400);
ok((await p.textContent('#geoTestCard .gtrow.gtnew')).includes('อ่านค่าตำแหน่งไม่ได้'),'unavailable: shown');
await ctx.close();await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
