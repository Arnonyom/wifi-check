// ตำแหน่งตอนเข้า/ออกงาน: ขอพิกัดจากเครื่อง → ชื่อสถานที่จาก OpenStreetMap → บันทึก (set_my_location) → แสดงหน้าลงเวลา + รายละเอียดกะของผู้ดูแล (ลิงก์แผนที่)
// กฎ: ต้องอนุญาตตำแหน่งจึงลงเวลาได้ · อนุญาตแล้วแต่อ่านค่าไม่ได้ → ลงเวลาได้ แสดง "อ่านค่าตำแหน่งไม่ได้" · ระหว่างรอคำตอบ ปุ่มยืนยันกดไม่ได้
// กรณี: อนุญาต · ไม่อนุญาต (กดไม่ได้ → เปิดสิทธิ์ → ลองใหม่) · อ่านค่าไม่ได้ · OpenStreetMap ใช้ไม่ได้ (แสดงพิกัดแทน)
// นาฬิกาจำลอง จ. 23 พ.ย. 2569 · ไม่ต่ออินเทอร์เน็ตจริง (จำลองคำตอบ OpenStreetMap)
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
const DAY='2026-11-23',TIMES=['06:35','08:05','08:35','09:35','10:05','17:35','18:05','23:05','23:35'];
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const OSM={address:{road:'ถนนทดสอบ',suburb:'แขวงทดสอบ',city_district:'เขตทดสอบ',city:'กรุงเทพมหานคร'},display_name:'x'};
const GEO={latitude:13.731,longitude:100.567,accuracy:20};
async function open(hm,mode){
  const opt={viewport:{width:390,height:844}};
  if(mode!=='denied'){opt.permissions=['geolocation'];opt.geolocation=GEO;}
  const ctx=await b.newContext(opt);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(mode+' '+e.message));
  const osm=[];
  await p.route('https://nominatim.openstreetmap.org/**',r=>{osm.push(r.request().url());return mode==='osmfail'?r.abort():r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(OSM)});});
  await p.clock.install({time:new Date(DAY+'T'+hm+':00+07:00')});
  await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
  // ใช้ตำแหน่งเครื่อง (ไม่ใช่ค่าจำลองของหน้าตัวอย่าง) · "อ่านค่าไม่ได้" = เครื่องตอบว่าหาตำแหน่งไม่ได้ (ช้า 800 ms)
  await p.evaluate(m=>{if(m==='unreadable')window.__geoMock={geo:{getCurrentPosition:function(ok,err){setTimeout(function(){err({code:2});},800);}}};else delete window.__geoMock;},mode);
  await p.fill('#lu','malee');await p.fill('#lp','Temp1234!');await p.click('#lbtn');await p.waitForTimeout(700);
  return {ctx,p,osm};
}
const lastIn=p=>p.evaluate(()=>{const d=window.__mockdb,me=d.profiles.find(x=>x.username==='malee');const a=d.attendance.filter(x=>x.emp===me.id&&!x.check_out).pop();return a?((d.locs||[]).find(l=>l.att_id===a.id&&l.kind==='in')||{none:true}):null;});
const settle=p=>p.waitForFunction(()=>{const e=document.getElementById('mLoc');return e&&!/กำลังหา/.test(e.textContent);},null,{timeout:15000}).catch(()=>{});
// หาเวลาที่ malee เข้างานได้
let HM=null;
for(const hm of TIMES){const s=await open(hm,'ok');const can=!!(await s.p.$('#main [data-act=checkin]'));await s.ctx.close();if(can){HM=hm;break;}}
ok(!!HM,'found a check-in time for malee ('+HM+')');
for(const mode of ['ok','denied','unreadable','osmfail']){
  const {ctx,p,osm}=await open(HM,mode);
  await p.click('#main [data-act=checkin]');
  if(mode==='unreadable'){
    ok(await p.$eval('[data-act=modal-ok]',e=>e.disabled)&&(await p.textContent('#mLoc')).includes('กำลังหาตำแหน่ง'),mode+': confirm is disabled while finding location');
  }
  await settle(p);
  const mtxt=await p.textContent('#mLoc');
  if(mode==='ok'){
    ok(mtxt.includes('ถนนทดสอบ')&&mtxt.includes('±20'),mode+': confirm window shows place name + accuracy ('+mtxt.trim()+')');
    ok(osm.length===1&&/lat=13\.731/.test(osm[0])&&/accept-language=th/.test(osm[0]),mode+': asked OpenStreetMap once, in Thai');
  }else if(mode==='denied'){
    ok(mtxt.includes('ไม่ได้อนุญาตตำแหน่ง')&&mtxt.includes('ต้องอนุญาต'),mode+': says location must be allowed');
    ok(await p.$eval('[data-act=modal-ok]',e=>e.disabled),mode+': confirm button disabled');
    await p.click('[data-act=modal-ok]',{force:true}).catch(()=>{});await p.waitForTimeout(500);
    ok((await lastIn(p))===null&&await p.$('#main [data-act=checkin]')!==null,mode+': cannot check in without location permission');
    ok(osm.length===0,mode+': nothing sent to OpenStreetMap');
    // เปิดสิทธิ์แล้วกด "ลองใหม่"
    await ctx.grantPermissions(['geolocation']);await ctx.setGeolocation(GEO);
    await p.click('[data-act=geo-retry]');await settle(p);
    ok((await p.textContent('#mLoc')).includes('ถนนทดสอบ')&&!(await p.$eval('[data-act=modal-ok]',e=>e.disabled)),mode+': after allowing + "try again" → location found, confirm enabled');
  }else if(mode==='unreadable'){
    ok(mtxt.includes('อ่านค่าตำแหน่งไม่ได้')&&mtxt.includes('ยังลงเวลาได้'),mode+': says location could not be read, can still check in');
    ok(!(await p.$eval('[data-act=modal-ok]',e=>e.disabled)),mode+': confirm enabled');
  }else{
    ok(/13\.73100, 100\.56700/.test(mtxt),mode+': OpenStreetMap down → shows coordinates ('+mtxt.trim()+')');
  }
  ok((await p.textContent('#modal')).includes('ตำแหน่งเห็นได้เฉพาะคุณและผู้ดูแล'),mode+': privacy note shown');
  await p.click('[data-act=modal-ok]');await p.waitForTimeout(1500);
  ok(await p.$('#main [data-act=checkout]')!==null,mode+': check-in succeeded');
  const L=await lastIn(p);
  ok(L&&!L.none,mode+': location saved with the check-in');
  if(L&&!L.none){
    if(mode==='ok'||mode==='denied')ok(L.status==='ok'&&Math.abs(L.lat-13.731)<1e-6&&L.acc===20&&/ถนนทดสอบ/.test(L.place),mode+': saved coords + place');
    if(mode==='unreadable')ok(L.status==='unavailable'&&L.lat===null&&L.place===null,mode+': saved as "unavailable" with no coords');
    if(mode==='osmfail')ok(L.status==='ok'&&L.place===null&&L.lat!==null,mode+': saved coords without place');
  }
  const home=await p.textContent('#main');
  ok(home.includes('ตำแหน่งเข้างาน')&&(mode==='unreadable'?home.includes('อ่านค่าตำแหน่งไม่ได้'):mode==='osmfail'?home.includes('13.73100'):home.includes('ถนนทดสอบ')),mode+': home shows check-in location');
  ok(/เข้างานสำเร็จ/.test(home),mode+': success message still shown after location is saved');
  // ออกงาน → บันทึกตำแหน่งออกงานด้วย
  await p.click('#main [data-act=checkout]');await settle(p);await p.click('[data-act=modal-ok]');await p.waitForTimeout(1500);
  const L2=await p.evaluate(()=>{const d=window.__mockdb,me=d.profiles.find(x=>x.username==='malee');const a=d.attendance.filter(x=>x.emp===me.id&&x.check_out).sort((x,y)=>x.check_out<y.check_out?-1:1).pop();return (d.locs||[]).find(l=>l.att_id===a.id&&l.kind==='out')||null;});
  ok(!!L2&&L2.status===(mode==='unreadable'?'unavailable':'ok'),mode+': check-out location saved');
  // ผู้ดูแลเปิดรายละเอียดกะ → เห็นตำแหน่ง + ลิงก์แผนที่
  if(mode==='ok'||mode==='unreadable'){
    await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(300);
    await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(800);
    const k=await p.evaluate(()=>{const d=window.__mockdb,me=d.profiles.find(x=>x.username==='malee');const a=d.attendance.filter(x=>x.emp===me.id&&x.check_out).sort((x,y)=>x.check_out<y.check_out?-1:1).pop();return a.work_date+'|'+a.shift_id;});
    await p.evaluate(k=>{const el=document.createElement('button');el.setAttribute('data-act','det');el.setAttribute('data-k','slot:'+k);el.id='__x';document.getElementById('main').appendChild(el);},k);
    await p.click('#__x');await p.waitForTimeout(500);
    const dt=await p.evaluate(()=>document.body.innerText);
    if(mode==='ok'){
      ok(dt.includes('ตำแหน่งเข้างาน')&&dt.includes('ตำแหน่งออกงาน')&&dt.includes('ถนนทดสอบ'),mode+': admin sees check-in/out location in shift details');
      const href=await p.$eval('a.maplink',e=>e.href).catch(()=>'');
      ok(/google\.com\/maps\?q=13\.731000,100\.567000/.test(href),mode+': map link opens the coordinates ('+href+')');
    }else ok(dt.includes('อ่านค่าตำแหน่งไม่ได้'),mode+': admin sees "could not read location"');
  }
  await ctx.close();
}
await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
