const {chromium}=require('playwright');const fs=require('fs');const D=__dirname+'/';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:512,height:512}});
for(const k of ['A','B','C'])for(const m of ['any','full','mask']){
  await p.setContent('<style>body{margin:0;background:transparent}</style>'+fs.readFileSync(D+k+'_'+m+'.svg','utf8'));
  await p.screenshot({path:D+k+'_'+m+'.png',omitBackground:true});}
await b.close();})();
