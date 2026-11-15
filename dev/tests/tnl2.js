const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.clock.install();
await p.goto('file://'+S+'preview_hook.html');await p.clock.runFor(800);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.clock.runFor(1500);
await p.click('[data-act=tab][data-v=leaves]');await p.clock.runFor(300);
await p.click('[data-act=lv-open]');await p.clock.runFor(300);await p.click('[data-act=lv-approve]');await p.clock.runFor(600);console.log('toast right after approve:',await p.$eval('#toast',e=>e.innerText.replace(/\n/g,' | ')));
await p.click('[data-act=tab][data-v=today]');await p.clock.runFor(300);
await p.evaluate(()=>{__t.st().notifications.unshift({id:'tz',ts:Date.now(),to:['e2'],title:'คำขอลาใหม่',body:'มาลี ขอลาพักร้อน 24/11',kind:'',read:[]});__t.toast('คำขอลาใหม่','มาลี ขอลาพักร้อน 24/11','','tz');__t.toast('อื่นๆ','ไม่มีลิงก์','');});await p.clock.runFor(300);
await p.screenshot({path:S+'nl_toast.png'});
console.log('toast:',await p.$eval('#toast',e=>e.innerText.replace(/\n/g,' | ')));
await p.click('.toast.tgo');await p.clock.runFor(400);
console.log('after ->',await p.evaluate(()=>document.querySelector('[data-act=tab][aria-current]').dataset.v+' toasts:'+document.querySelectorAll('.toast').length+' '+document.querySelector('[data-act=bell]').getAttribute('aria-label')));
// staff
await p.click('[data-act=logout]').catch(()=>{});
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
