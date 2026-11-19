const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
for(const vp of [{width:1280,height:900},{width:390,height:844}]){
const tag=vp.width>500?'d':'m';const p=await b.newPage({viewport:vp});
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|Failed to load/.test(m.text()))errs.push(m.text());});
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
await p.click('#nav [data-act=tab][data-v=settings]');await p.click('#main [data-act=tab][data-v=sim]');await p.waitForTimeout(200);
const res=async()=>(await p.$$eval('.simres',e=>e.map(x=>x.innerText.replace(/\s+/g,' ')).join(' || ')));
console.log(tag,'emp',await p.$eval('#simEmp',e=>e.selectedOptions[0].text),'| shift',await p.$eval('#simShift',e=>e.selectedOptions[0].text));
for(const i of [0,1,2,3,4,5]){await p.click('[data-act=sim-set][data-k=tin] >> nth='+i);await p.click('[data-act=sim-in]');await p.waitForTimeout(80);console.log(tag,' in preset',i,'->',await res());}
await p.click('[data-act=sim-set][data-k=tin] >> nth=4');await p.click('[data-act=sim-in]');
for(const i of [0,1,2]){await p.click('[data-act=sim-set][data-k=tout] >> nth='+i);await p.click('[data-act=sim-out]');await p.waitForTimeout(80);console.log(tag,' out preset',i,'->',(await res()).split(' || ')[1]);}
if(tag==='d')await p.screenshot({path:S+'sim_d.png',fullPage:true});else await p.screenshot({path:S+'sim_m.png',fullPage:true});
// wrong person
await p.selectOption('#simShift','B1');await p.waitForTimeout(100);await p.click('[data-act=sim-in]');await p.waitForTimeout(80);console.log(tag,'wrong shift ->',await res());
// custom datetime
await p.selectOption('#simEmp',{index:2});await p.waitForTimeout(100);console.log(tag,'emp2 shift auto',await p.$eval('#simShift',e=>e.selectedOptions[0].text));
await p.fill('#simIn','2026-11-10T09:05');await p.dispatchEvent('#simIn','change');await p.click('[data-act=sim-in]');await p.waitForTimeout(80);console.log(tag,'custom ->',await res());
console.log(tag,'log rows',await p.$$eval('table tbody tr',e=>e.length));
await p.click('[data-act=tab][data-v=today]');await p.click('[data-act=tab][data-v=settings]');await p.click('#main [data-act=tab][data-v=sim]');console.log(tag,'log kept across tabs',await p.$$eval('table tbody tr',e=>e.length));
await p.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
