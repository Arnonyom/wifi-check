const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';
(async()=>{const b=await chromium.launch();const errs=[];const p=await b.newPage({viewport:{width:1280,height:900}});
p.on('pageerror',e=>errs.push(e.message));
await p.route('**/supabase-js@*/**',r=>r.fulfill({body:'',contentType:'text/javascript'}));
await p.addInitScript({path:S+(process.argv[2]||'mock_empty.js')});
await p.goto('file://'+S+'index.html');await p.waitForTimeout(900);
const ks0=await p.$$eval('#main [data-act=det]',e=>[...new Set(e.map(x=>x.dataset.k.split(':')[0]))]);
await p.click('[data-act=tab][data-v=report]');await p.waitForTimeout(150);
for(const m of ['day','week','month','year','range']){await p.click('[data-act=dc-mode][data-m='+m+']');await p.waitForTimeout(100);}
await p.click('[data-act=rsec][data-s=stats]');await p.waitForTimeout(100);
for(const n of [7,30,90]){await p.click('[data-act=dash][data-n="'+n+'"]');await p.waitForTimeout(100);}
const ks=[...new Set(ks0.concat(await p.$$eval('#main [data-act=det]',e=>[...new Set(e.map(x=>x.dataset.k.split(':')[0]))])))];
const onView=async k=>{for(const [v,sec] of [['today',null],['report','stats'],['report','cal']]){await p.click('#nav [data-act=tab][data-v='+v+']');if(sec)await p.click('[data-act=rsec][data-s='+sec+']');await p.waitForTimeout(60);if(await p.$('#main [data-act=det][data-k^="'+k+':"]'))return;}};
for(const k of ks){await onView(k);await p.evaluate(k=>{document.querySelector('#main [data-act=det][data-k^="'+k+':"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))},k);await p.waitForTimeout(60);await p.click('[data-act=det-close]');}
for(const v of ['schedule','people','leaves','report','settings']){await p.click('[data-act=tab][data-v='+v+']');await p.waitForTimeout(150);}
console.log('kinds',ks.join(','),'| miss kpi',await (await p.click('[data-act=tab][data-v=report]'),await p.click('[data-act=rsec][data-s=stats]'),p.$eval('[data-k="st:miss"] b',e=>e.textContent)));
console.log(errs.length?errs.join('\n'):'NO ERRORS');await b.close();})();
