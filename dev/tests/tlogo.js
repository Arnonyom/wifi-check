const {chromium}=require('playwright');const S=require('path').join(__dirname,'..')+'/';const tag=process.argv[2]||'A';
(async()=>{const b=await chromium.launch();
for(const [u,pw] of [['admin','Admin@2026'],['malee','Temp1234!']])for(const w of [360,390,430,1280]){const p=await (await b.newContext({viewport:{width:w,height:400},deviceScaleFactor:2})).newPage();
await p.goto('file://'+S+'preview_detail.html');await p.waitForTimeout(400);
await p.evaluate(()=>{const d=document.body.firstElementChild;if(d&&/ตัวอย่าง/.test(d.textContent))d.remove();});
if(u==='admin'&&w===390)await p.screenshot({path:S+'logo_login_'+tag+'.png',clip:{x:0,y:0,width:w,height:70}});
await p.fill('#lu',u);await p.fill('#lp',pw);await p.click('#lbtn');await p.waitForTimeout(700);
const r=await p.evaluate(()=>{const t=document.querySelector('.topbar');const br=document.querySelector('.brand').getBoundingClientRect();const rr=document.querySelector('.top-right').getBoundingClientRect();return {sw:document.documentElement.scrollWidth,brandR:Math.round(br.right),rightL:Math.round(rr.left),h:Math.round(t.getBoundingClientRect().height),name:getComputedStyle(document.querySelector('.brand b')).display};});
console.log(u,w,JSON.stringify(r));
await p.screenshot({path:S+'logo_'+u+'_'+w+'_'+tag+'.png',clip:{x:0,y:0,width:Math.min(w,1280),height:70}});}
await b.close();})();
