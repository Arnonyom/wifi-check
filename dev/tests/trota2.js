const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];
for(const vp of [{width:1280,height:900},{width:390,height:844}]){
const tag=vp.width>500?'d':'m';const p=await b.newPage({viewport:vp});
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|Failed to load/.test(m.text()))errs.push(m.text());});
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(500);
await p.fill('#lu','admin');await p.fill('#lp','Admin@2026');await p.click('#lbtn');await p.waitForTimeout(700);
await p.click('#nav [data-act=tab][data-v=profile]');await p.click('#main [data-act=tab][data-v=settings]');await p.waitForTimeout(200);
const tabs=async()=>p.$$eval('#main section.card',ss=>ss.slice(0,2).map(s=>s.innerText.split('\n').filter(Boolean).slice(0,40).join(' | ')));
if(tag==='d'){const t=await tabs();console.log('A card:',t[0].slice(0,900));console.log('B card:',t[1].slice(0,700));await p.screenshot({path:S+'r2_set.png',fullPage:true});}
// schedule team B: walk 5 weeks
await p.click('[data-act=tab][data-v=schedule]');await p.waitForTimeout(150);
await p.click('[data-act=sched-team][data-t=B]').catch(async()=>{await p.click('button:has-text("ทีม B")');});await p.waitForTimeout(150);
for(let w=0;w<6;w++){
  const g=await p.$$eval('table.wk tbody tr',rs=>rs.map(r=>[...r.children].map(c=>c.innerText.split('\n')[0].trim().slice(0,8)).join('|')));
  if(tag==='d')console.log('B wk',w,await p.$eval('.row.between p',e=>e.innerText.slice(0,80)),'\n   '+g.join('\n   '));
  await p.click('[data-act=sched-nav][data-n="1"]');await p.waitForTimeout(120);}
if(tag==='d')await p.screenshot({path:S+'r2_b.png'});
// edit rota A: change start week to 3rd option and save
await p.click('#nav [data-act=tab][data-v=profile]');await p.click('#main [data-act=tab][data-v=settings]');await p.evaluate(()=>{const o=document.querySelector('#main section.spop.open .spx');if(o)o.click();});await p.click('[data-set-open=rota]');await p.waitForTimeout(150);await p.click('[data-act=rota-edit]');await p.waitForTimeout(100);
console.log(tag,'A edit selects',await p.$$eval('#rotaEd select',s=>s.map(x=>x.id+'='+(x.selectedOptions[0]||{}).text).join(', ')));
await p.selectOption('#rotaStart',{index:5});await p.waitForTimeout(100);await p.click('[data-act=rota-save]');await p.waitForTimeout(500);
console.log(tag,'after A save rows:',await p.$$eval('#main section.card:first-of-type tbody tr',rs=>rs.map(r=>r.innerText.replace(/\s+/g,' ')).join(' / ')));
await p.evaluate(()=>{const o=document.querySelector('#main section.spop.open .spx');if(o)o.click();});await p.click('[data-set-open=rotab]');await p.waitForTimeout(150);await p.click('[data-act=rotab-edit]');await p.waitForTimeout(100);
await p.selectOption('#rotaBStart',{index:0});await p.waitForTimeout(80);const o=await p.$$eval('#rotaBDay option',x=>x.map(y=>y.value));await p.selectOption('#rotaBDay',o[2]);await p.selectOption('#rotaBNight',o[1]);await p.click('[data-act=rotab-save]');await p.waitForTimeout(500);
console.log(tag,'after B save:',await p.$$eval('#main section.card:nth-of-type(2) tbody tr',rs=>rs.slice(0,4).map(r=>r.innerText.replace(/\s+/g,' ')).join(' / ')));
await p.evaluate(()=>{const o=document.querySelector('#main section.spop.open .spx');if(o)o.click();});
for(const v2 of ['today','report','settings','sim','leaves','people','schedule']){await p.click((v2==='settings'?(await p.click('#nav [data-act=tab][data-v=profile]'),'#main '):v2==='sim'?'#main ':'#nav ')+(v2==='sim'?'[data-set-open=sim]':'[data-act=tab][data-v='+v2+']'));await p.waitForTimeout(120);}
await p.close();}
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
