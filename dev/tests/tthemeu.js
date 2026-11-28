// 29 พ.ย. 2569: ธีมจำแยกตามบัญชี · หน้าล็อกอินใช้ธีมของเครื่อง · ออกจากระบบแล้วกลับเป็นธีมของเครื่อง
const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)errs.push('FAIL: '+m);};
const ctx=await b.newContext({viewport:{width:1100,height:900}});const p=await ctx.newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(300);
const th=()=>p.evaluate(()=>(document.documentElement.getAttribute('data-theme')||'')+(document.documentElement.hasAttribute('data-cust')?'+cust':''));
const bg=()=>p.evaluate(()=>getComputedStyle(document.body).backgroundColor);
const login=async(u,pw)=>{await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(800);};
const logout=async()=>{await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(400);};
const pick=async t=>{await p.click('[data-act=theme]');await p.click('.thpop .thopt[data-t='+t+']');await p.click('[data-act=gear-yes]');await p.waitForTimeout(400);await p.click('[data-act=theme]');};
// หน้าล็อกอิน: เลือกธีมของเครื่องเป็น White
await pick('white');
ok(await th()==='white'&&await p.evaluate(()=>localStorage.getItem('shift-checkin-theme'))==='white','login page: device theme saved on this device (White)');
// ผู้ดูแลเลือก Black
await login('admin','Admin@2026');
ok(await th()==='white','admin without saved theme: uses the device theme');
await pick('black');
ok(await th()==='black','admin picks Black');
ok(await p.evaluate(()=>window.__mockdb.profiles.find(x=>x.id==='e0').prefs.theme)==='black','Black saved to admin profile');
ok(await p.evaluate(()=>localStorage.getItem('shift-checkin-theme'))==='white','device theme unchanged (still White)');
await logout();
ok(await th()==='white','after sign-out: back to device theme (White)');
// พนักงานอีกคน: ไม่ได้ธีมของผู้ดูแล
await login('malee','Temp1234!');
ok(await th()==='white'&&await bg()==='rgb(255, 255, 255)','malee does NOT get admin\'s Black (uses device theme)');
// มาลีเลือกสีเอง แบบแก้ว
await p.click('[data-act=theme]');await p.click('.thpop .thopt[data-t=custom]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(150);
await p.click('[data-act=cust-pick][data-c="#E2557B"]');await p.click('[data-act=cust-base][data-b=glass]');await p.click('[data-act=gear-yes]');await p.waitForTimeout(450);await p.click('[data-act=theme]');
ok(await th()==='glass+cust','malee picks custom pink glass');
ok(await p.evaluate(()=>{const x=window.__mockdb.profiles.find(x=>x.id==='e2').prefs;return x.theme==='custom'&&x.custom.c==='#E2557B'&&x.custom.base==='glass';}),'malee\'s custom color saved to her profile');
await logout();
ok(await th()==='white','sign-out: device theme again');
// ผู้ดูแลกลับมา: ได้ Black ของตัวเอง
await login('admin','Admin@2026');
ok(await th()==='black'&&await bg()==='rgb(0, 0, 0)','admin signs in again: gets own Black');
await logout();
await login('malee','Temp1234!');
ok(await th()==='glass+cust','malee signs in again: gets own pink glass');
ok((await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--brand').trim())).toUpperCase()==='#E2557B','malee\'s color applied');
// ความใสของแก้วก็จำแยกคน
await p.click('[data-act=theme]');await p.$eval('#glassRange',e=>{e.value=25;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});await p.waitForTimeout(100);await p.click('[data-act=gear-yes]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>window.__mockdb.profiles.find(x=>x.id==='e2').prefs.glass)===25,'glass transparency saved per person');
await ctx.close();await b.close();
console.log(errs.length?errs.join('\n'):'NO ERRORS');process.exit(errs.length?1:0);})();
