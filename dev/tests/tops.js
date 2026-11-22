const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
for(const vp of [{width:1280,height:900}]){
const tag=vp.width>500?'d':'m';const p=await b.newPage({viewport:vp});
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|Failed to load/.test(m.text()))errs.push(m.text());});
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
await p.click('[data-act=tab][data-v=schedule]');await p.waitForTimeout(150);
await p.click('[data-act=sched-nav][data-n="1"]');await p.waitForTimeout(150);
// open Monday 10:00 cell next week
const cells=await p.$$('table.wk tbody tr:nth-child(2) [data-act=edit-slot]');await cells[0].click();await p.waitForTimeout(150);
console.log(tag,'editor:',await p.$eval('#slotEd h2',e=>e.textContent));
await p.check('input[name=edMode][value=swap]');await p.waitForTimeout(120);
const opts=await p.$$eval('#edOther option',o=>o.map(x=>x.value+'|'+x.textContent));console.log(tag,'swap options',opts.slice(1).map(x=>x.split('|')[1]).join(' / '));
await p.selectOption('#edOther',opts[1].split('|')[0]);await p.waitForTimeout(100);
await p.selectOption('#edRange','week');await p.waitForTimeout(100);
console.log(tag,'plan:',await p.$eval('#slotEd',e=>e.innerText.split('\n').filter(l=>/วัน|ข้าม|ไป/.test(l)).join(' | ')));
if(tag==='d')await p.screenshot({path:S+'ops_swap.png',fullPage:false});
await p.click('[data-act=save-days]');await p.waitForTimeout(600);
const grid=async()=>p.$$eval('table.wk tbody tr',rs=>rs.map(r=>[...r.children].slice(0,6).map(c=>c.innerText.split('\n').slice(0,2).join(' ').trim().slice(0,22)).join(' | ')));
console.log(tag,'after swap:\n  '+(await grid()).join('\n  '));
// revert one day
await (await p.$$('table.wk tbody tr:nth-child(2) [data-act=edit-slot]'))[1].click();await p.waitForTimeout(150);
await p.check('input[name=edMode][value=work]');await p.waitForTimeout(100);await p.click('[data-act=save-days]');await p.waitForTimeout(500);
console.log(tag,'after revert Tue:\n  '+(await grid()).slice(0,3).join('\n  '));
// cover with same team for 2 weeks
await (await p.$$('table.wk tbody tr:nth-child(1) [data-act=edit-slot]'))[0].click();await p.waitForTimeout(150);
await p.check('input[name=edMode][value=cover]');await p.waitForTimeout(100);
console.log(tag,'cover groups',await p.$$eval('#edOther optgroup',g=>g.map(x=>x.label+':'+x.children.length).join(', ')));
const co=await p.$$eval('#edOther option',o=>o.map(x=>x.value).filter(Boolean));await p.selectOption('#edOther',co[0]);await p.selectOption('#edRange','2w');await p.waitForTimeout(100);
console.log(tag,'cover plan:',await p.$eval('[data-act=save-days]',e=>e.textContent),'| skips',await p.$$eval('#slotEd .chip.mute',e=>e.length));
await p.click('[data-act=save-days]');await p.waitForTimeout(500);
// attendance on behalf: go to this week, a past day cell without record
await p.click('[data-act=sched-nav][data-n="-1"]');await p.waitForTimeout(150);
await (await p.$$('table.wk tbody tr:nth-child(1) [data-act=edit-slot]'))[0].click();await p.waitForTimeout(150);
console.log(tag,'att section:',await p.$eval('#attEd',e=>e.innerText.split('\n').slice(0,3).join(' | ')));
if(await p.$('[data-act=att-mode][data-m=both]:not([disabled])'))await p.click('[data-act=att-mode][data-m=both]');await p.waitForTimeout(100);await p.fill('#atInT','09:15');await p.fill('#atNote','ลืมเช็กอิน');await p.click('[data-act=save-att]');await p.waitForTimeout(500);
console.log(tag,'cell after att:',(await grid())[0]);
if(tag==='d')await p.screenshot({path:S+'ops_att.png',fullPage:false});
// detail -> go-edit
await p.click('[data-act=tab][data-v=today]');await p.waitForTimeout(150);await p.click('#main .pcard >> nth=0');await p.waitForTimeout(150);
await p.click('[data-act=go-edit]');await p.waitForTimeout(300);console.log(tag,'go-edit opens editor',await p.$('#slotEd')!==null,await p.$('#attEd')!==null);
// theme glass
await p.click('[data-act=theme]');await p.waitForTimeout(100);await p.click('[data-act=theme-set][data-t=glass]');await p.waitForTimeout(150);
await p.click('[data-act=theme]');await p.waitForTimeout(100);
await p.$eval('#glassRange',e=>{e.value=20;e.dispatchEvent(new Event('input',{bubbles:true}));});
console.log(tag,'theme',await p.evaluate(()=>document.documentElement.getAttribute('data-theme')),'ga',await p.evaluate(()=>document.documentElement.style.getPropertyValue('--ga')));
await p.screenshot({path:S+'glass_'+tag+'_clear.png'});
await p.$eval('#glassRange',e=>{e.value=90;e.dispatchEvent(new Event('input',{bubbles:true}));});await p.mouse.click(5,600);await p.waitForTimeout(100);
await p.click('[data-act=tab][data-v=today]');await p.waitForTimeout(200);
await p.screenshot({path:S+'glass_'+tag+'_frost.png'});
await p.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
