const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
for(const vp of [{width:1280,height:900},{width:390,height:844}]){
const tag=vp.width>500?'d':'m';
const p=await b.newPage({viewport:vp});
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|Failed to load/.test(m.text()))errs.push(m.text());});
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
const login=async(u,pw)=>{await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(700);};
const err=async()=>p.textContent('#pwErr');
// forced change
await login('somchai','Temp1234!');
console.log(tag,'force screen:',await p.$('#forceForm')!==null,'nav hidden:',await p.$eval('#nav',e=>e.hidden),'has current field:',await p.$('#pwCur')!==null);
if(tag==='d')await p.screenshot({path:S+'pw_force.png'});
await p.fill('#pwNew','abc');await p.fill('#pwNew2','abc');await p.click('#pwOk');await p.waitForTimeout(100);console.log(tag,' short ->',await err());
await p.fill('#pwNew','รหัสไทย1234');await p.fill('#pwNew2','รหัสไทย1234');await p.click('#pwOk');await p.waitForTimeout(100);console.log(tag,' thai ->',await err());
await p.fill('#pwNew','Good Pass 1');await p.fill('#pwNew2','Good Pass 1');await p.click('#pwOk');await p.waitForTimeout(100);console.log(tag,' space ->',await err());
await p.fill('#pwNew','NewPass#2026');await p.fill('#pwNew2','NewPass#2027');await p.click('#pwOk');await p.waitForTimeout(100);console.log(tag,' mismatch ->',await err());
await p.fill('#pwNew','Temp1234!');await p.fill('#pwNew2','Temp1234!');await p.click('#pwOk');await p.waitForTimeout(100);console.log(tag,' same as old ->',await err());
await p.fill('#pwNew','NewPass#2026');await p.fill('#pwNew2','NewPass#2026');
console.log(tag,' checklist:',await p.$$eval('#pwChk li',e=>e.map(x=>x.className||'-').join(',')));
await p.click('#pwOk');await p.waitForTimeout(800);
console.log(tag,' after ok: force gone',await p.$('#forceForm')===null,'tabs',await p.$$eval('.tab',e=>e.length));
await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(300);
await login('somchai','Temp1234!');console.log(tag,'old pw ->',await p.textContent('#lerr'));
await login('somchai','NewPass#2026');console.log(tag,'new pw -> tabs',await p.$$eval('.tab',e=>e.length),'force?',await p.$('#forceForm')!==null);
// self change from topbar
await p.click('#nav [data-act=tab][data-v=profile]');await p.waitForTimeout(150);await p.click('[data-act=theme]');await p.click('.thpop [data-act=pw-self]');await p.waitForTimeout(150);
if(tag==='m')await p.screenshot({path:S+'pw_m_self.png'});
await p.fill('#pwCur','wrongpass');await p.fill('#pwNew','Another#99');await p.fill('#pwNew2','Another#99');await p.click('#pwOk');await p.waitForTimeout(300);console.log(tag,'self wrong current ->',await err());
await p.fill('#pwCur','NewPass#2026');await p.click('#pwOk');await p.waitForTimeout(500);console.log(tag,'self ok -> modal closed',await p.$('#pwForm')===null);
await p.click('[data-act=theme]');await p.click('[data-act=logout-ask]');await p.click('.thout [data-act=logout]');await p.waitForTimeout(300);
// admin reset
await login('admin','Admin@2026');
await p.click('[data-act=tab][data-v=people]');await p.waitForTimeout(200);
const btns=await p.$$eval('[data-act=pw-reset]',e=>e.length);console.log(tag,'reset buttons',btns,'self change button on own card',await p.$$eval('.pcard [data-act=pw-self]',e=>e.length));
await p.click('[data-pr] >> nth=1');await p.waitForTimeout(150);await p.click('[data-act=pw-reset]');await p.waitForTimeout(150);
console.log(tag,'reset dialog shows',await p.$eval('#pwForm .kv',e=>e.innerText.replace(/\s+/g,' ')),'| current field?',await p.$('#pwCur')!==null);
if(tag==='d')await p.screenshot({path:S+'pw_reset.png'});
await p.fill('#pwNew','short');await p.fill('#pwNew2','short');await p.click('#pwOk');await p.waitForTimeout(100);console.log(tag,' reset short ->',await err());
await p.fill('#pwNew','Reset#2026');await p.fill('#pwNew2','Reset#2026');await p.click('#pwOk');await p.waitForTimeout(600);
console.log(tag,' reset ok -> pending chips',await p.$$eval('.chip.late',e=>e.filter(x=>x.textContent.includes('รอตั้งรหัสใหม่')).length));
// new employee form
await p.click('[data-act=new-emp]');await p.fill('#fName','ทดสอบ รหัสใหม่');await p.fill('#fUser','tester'+tag);await p.fill('#fPin','Start#123');await p.fill('#fPin2','Start#124');await p.selectOption('#fTeam','OPS');
await p.click('[data-act=save-emp]');await p.waitForTimeout(200);console.log(tag,'new emp mismatch ->',await p.textContent('#fErr'));
await p.fill('#fPin2','Start#123');await p.click('[data-act=save-emp]');await p.waitForTimeout(500);console.log(tag,'new emp ok ->',(await p.textContent('#main')).includes('ทดสอบ รหัสใหม่'));
await p.click('[data-pr] >> nth=0');await p.waitForTimeout(150);await p.click('[data-act=edit-emp]');await p.waitForTimeout(100);console.log(tag,'edit form has pw field?',await p.$('#fPin')!==null);
await p.close();
}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
