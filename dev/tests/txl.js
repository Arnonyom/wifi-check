const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:1280,height:900},acceptDownloads:true});const p=await ctx.newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
await p.click('[data-act=tab][data-v=report]');await p.click('[data-act=rsec][data-s=table]');await p.waitForTimeout(300);
for(const act of ['xl-rep','xl-forgot','xl-cover']){
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act='+act+']')]);
  const f=S+'xlout/'+dl.suggestedFilename();await dl.saveAs(f);console.log(act,'->',dl.suggestedFilename());}
console.log('csv card gone:',await p.$('[data-act=mk-rep]')===null);
await p.screenshot({path:S+'xl_rep.png'});
await p.click('#nav [data-act=tab][data-v=profile]');await p.click('#main [data-act=tab][data-v=settings]');await p.waitForTimeout(200);
const [dl2]=await Promise.all([p.waitForEvent('download'),p.click('[data-act=xl-sched]')]);const f2=S+'xlout/'+dl2.suggestedFilename();await dl2.saveAs(f2);console.log('xl-sched ->',dl2.suggestedFilename());
// import an Excel file created by openpyxl (deflate-compressed)
await p.setInputFiles('#csvFile',f2);await p.waitForTimeout(800);
console.log('import preview:',await p.$eval('#main',e=>{const t=[...e.querySelectorAll('section')].find(s=>s.innerText.includes('นำเข้าตารางกะ'));return t?t.innerText.split('\n').filter(l=>/แถว|ถูกต้อง|ผิด|นำเข้า/.test(l)).slice(0,6).join(' | '):'none';}));
// paste tab-separated
await p.fill('#csvIn','date\tday\tteam\tshift_start\tshift_end\tregular_username\tregular_name\tstatus\tcover_username\tcover_name\tnote\n'+(await p.evaluate(()=>{const d=new Date(Date.now()+7*864e5);return d.toISOString().slice(0,10)}))+'\tx\tทีม A\t10:00\t19:00\t\t\tทำงาน\t\t\t');
await p.click('[data-act=check-csv]');await p.waitForTimeout(300);
console.log('paste check:',await p.$eval('#main',e=>{const t=[...e.querySelectorAll('section')].find(s=>s.innerText.includes('นำเข้าตารางกะ'));return t.innerText.split('\n').filter(l=>/แถว|ถูกต้อง|ผิด|นำเข้า \d/.test(l)).slice(0,4).join(' | ');}));
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
