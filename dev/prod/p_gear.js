/* เมนูฟันเฟือง (28 พ.ย. 2569)
   - ทุกการเปลี่ยนแปลงในเมนูนี้ถามยืนยันก่อน: ภาษา · ธีม · ความใส (Liquid Glass) · สีที่เลือกเอง
     (แถบเลื่อน/ตัวเลือกสีแสดงผลให้ดูก่อน กด "ยกเลิก" กลับเป็นค่าเดิม)
   - ธีม: สว่าง · มืด · Black (ดำสนิท) · Liquid Glass · กำหนดสีเอง (เลือกสีหลัก + พื้นสว่าง/มืด) · จำไว้ในเครื่องนี้
   - เปลี่ยนรหัสผ่าน (ย้ายมาจากหน้าโปรไฟล์) · ออกจากระบบ (ถามยืนยันเหมือนเดิม) */
var gearPend=null,CUSTOM_KEY='wc-custom';
var THEMES=[['light','สว่าง'],['dark','มืด'],['black','Black'],['glass','Liquid Glass'],['custom','กำหนดสีเอง']];
function themeName(t){var o=THEMES.find(function(x){return x[0]===t;});return o?o[1]:t;}
function customCfg(){var c={c:'#7AC143',dark:false};try{var x=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'null');if(x&&/^#[0-9a-fA-F]{6}$/.test(x.c))c={c:x.c,dark:!!x.dark};}catch(e){}return c;}
function hexRgb(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function rgbHex(a){return '#'+a.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16);}).join('');}
function mixC(a,b,p){var x=hexRgb(a),y=hexRgb(b);return rgbHex(x.map(function(v,i){return v*p+y[i]*(1-p);}));}
function lum(h){return hexRgb(h).map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}).reduce(function(s,v,i){return s+v*[0.2126,0.7152,0.0722][i];},0);}
function contrast(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
// ปรับสีให้อ่านออกบนพื้นหลัง (ความต่างอย่างน้อย 4.5:1)
function readable(c,bg,toward){var x=c;for(var i=0;i<20&&contrast(x,bg)<4.5;i++)x=mixC(toward,x,0.12+i*0.04);return x;}
var CUSTOM_VARS=['--bg','--surface','--surface-2','--ink','--muted','--line','--brand','--brand-strong','--on-strong','--brand-soft','--on-brand','--late','--late-soft','--amber','--off','--off-soft','--hatch','--scrim','--shadow','--grid','--axis','color-scheme'];
function applyCustom(cfg){
  var r=document.documentElement.style,c=cfg.c,v;
  if(cfg.dark){
    var bg=mixC(c,'#0a0c0b',0.07);
    v={'--bg':bg,'--surface':mixC(c,'#111413',0.10),'--surface-2':mixC(c,'#181c1a',0.14),'--ink':'#EDF1EE','--muted':'#A3AEA8','--line':mixC(c,'#222724',0.22),
       '--brand':readable(c,bg,'#ffffff'),'--brand-strong':readable(c,bg,'#ffffff'),'--on-strong':bg,'--brand-soft':mixC(c,bg,0.22),'--on-brand':lum(c)>0.35?'#0a0c0b':'#ffffff',
       '--late':'#F2C265','--late-soft':'#3A2D10','--amber':'#F2C265','--off':'#F19A92','--off-soft':'#3A1B18','--hatch':mixC(c,'#141816',0.08),'--scrim':'rgba(0,0,0,.65)',
       '--shadow':'0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.35)','--grid':mixC(c,'#1d221f',0.18),'--axis':mixC(c,'#3a423d',0.25),'color-scheme':'dark'};
  }else{
    var bg2=mixC(c,'#ffffff',0.07);
    v={'--bg':bg2,'--surface':'#FFFFFF','--surface-2':mixC(c,'#ffffff',0.11),'--ink':mixC(c,'#101412',0.08),'--muted':readable(mixC(c,'#5d6661',0.12),bg2,'#000000'),'--line':mixC(c,'#ffffff',0.22),
       '--brand':c,'--brand-strong':readable(c,'#ffffff','#000000'),'--on-strong':'#FFFFFF','--brand-soft':mixC(c,'#ffffff',0.16),'--on-brand':lum(c)>0.35?'#101412':'#ffffff',
       '--late':'#7A4A00','--late-soft':'#FFF0CF','--amber':'#E0A100','--off':'#A8322A','--off-soft':'#FBE6E3','--hatch':mixC(c,'#ffffff',0.09),'--scrim':'rgba(8,12,10,.55)',
       '--shadow':'0 1px 2px rgba(16,24,20,.06),0 8px 24px rgba(16,24,20,.07)','--grid':mixC(c,'#e8ece9',0.10),'--axis':mixC(c,'#b9c2bd',0.15),'color-scheme':'light'};
  }
  CUSTOM_VARS.forEach(function(k){r.setProperty(k,v[k]);});
}
function clearCustom(){var r=document.documentElement.style;CUSTOM_VARS.forEach(function(k){r.removeProperty(k);});}
function setTheme(t){
  document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem(THEME_KEY,t);}catch(e){}
  if(t==='custom')applyCustom(customCfg());else clearCustom();
  if(t==='glass')applyGlass(glassLevel());
  renderAll();
}
function effDark(){var t=document.documentElement.getAttribute('data-theme');if(t)return t==='dark'||t==='black'||(t==='custom'&&customCfg().dark);return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches;}
if(document.documentElement.getAttribute('data-theme')==='custom')applyCustom(customCfg());
/* ขอเปลี่ยน → แสดงแถบยืนยันในเมนู · ภาษา/ธีม ยังไม่เปลี่ยนจนกว่าจะยืนยัน · แถบเลื่อน/สี แสดงให้ดูก่อน ยกเลิกแล้วกลับค่าเดิม */
function gearAsk(k,v){
  if(k==='lang'||k==='theme'){gearRevert();gearPend={k:k,v:v};}
  else{if(!gearPend||gearPend.k!==k){gearRevert();gearPend={k:k,old:k==='glass'?glassLevel():customCfg()};}gearPend.v=v;}
  renderChrome();var y=document.querySelector('.thpop [data-act="gear-yes"]');if(y&&k!=='glass'&&k!=='color')try{y.focus({preventScroll:true});}catch(e){}
}
function gearRevert(){
  var p=gearPend;gearPend=null;if(!p)return;
  if(p.k==='glass')applyGlass(p.old);
  if(p.k==='color'&&curTheme()==='custom')applyCustom(p.old);
}
function gearConfirm(){
  var p=gearPend;gearPend=null;if(!p)return;
  if(p.k==='lang'){setLang(p.v);return;}
  if(p.k==='theme'){themeOpen=true;setTheme(p.v);return;}
  if(p.k==='glass'){try{localStorage.setItem(GLASS_KEY,String(p.v));}catch(x){}applyGlass(p.v);}
  if(p.k==='color'){try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(p.v));}catch(x){}applyCustom(p.v);}
  renderAll();
}
function gearAskHtml(){
  var p=gearPend;if(!p)return '';
  var msg=p.k==='lang'?(p.v==='en'?'เปลี่ยนภาษาเป็น English ใช่ไหม?':'เปลี่ยนภาษาเป็นภาษาไทย ใช่ไหม?')
    :p.k==='theme'?'เปลี่ยนธีมเป็น "'+themeName(p.v)+'" ใช่ไหม?'
    :p.k==='glass'?'ใช้ความใส '+p.v+'% ใช่ไหม?':'ใช้สีนี้ใช่ไหม?';
  return '<div class="gask" role="alert"><p class="small"><b>'+msg+'</b></p><div class="row" style="gap:8px"><button class="btn grow" data-act="gear-yes">ยืนยัน</button><button class="btn sec" data-act="gear-no">ยกเลิก</button></div></div>';
}
function themePanel(){
  var t=curTheme(),p=gearPend,v=p&&p.k==='glass'?p.v:glassLevel(),cc=p&&p.k==='color'?p.v:customCfg(),sel=p&&p.k==='theme'?p.v:t;
  var sw=function(o){return o==='custom'?' style="background:linear-gradient(135deg,'+cc.c+' 0 50%,'+(cc.dark?'#0a0c0b':'#ffffff')+' 50% 100%)"':'';};
  return '<div class="pop thpop" role="dialog" aria-label="ตั้งค่า">'+langRow()+(p&&p.k==='lang'?gearAskHtml():'')+
    '<p class="small muted">ธีมหน้าจอ</p><div class="thopts">'+
    THEMES.map(function(o){return '<button class="thopt'+(t===o[0]?' on':'')+(sel===o[0]&&sel!==t?' pend':'')+'" data-act="theme-set" data-t="'+o[0]+'" aria-pressed="'+(t===o[0])+'"><span class="thsw thsw-'+o[0]+'"'+sw(o[0])+'></span>'+o[1]+'</button>';}).join('')+'</div>'+
    (p&&p.k==='theme'?gearAskHtml():'')+
    (t==='glass'?'<label for="glassRange" class="small">ความใส ↔ ขุ่น <b class="tnum" id="glassVal">'+v+'%</b></label><input id="glassRange" type="range" min="0" max="100" step="1" value="'+v+'"><div class="row between small muted"><span>ใส</span><span>ขุ่น</span></div>'+(p&&p.k==='glass'?gearAskHtml():''):'')+
    (t==='custom'?'<div class="cust"><label for="custColor" class="small">สีหลัก</label><input id="custColor" type="color" value="'+cc.c+'">'+
       '<div class="seg" role="group" aria-label="พื้นหลัง"><button type="button" data-act="cust-base" data-d="0" aria-pressed="'+!cc.dark+'">พื้นสว่าง</button><button type="button" data-act="cust-base" data-d="1" aria-pressed="'+cc.dark+'">พื้นมืด</button></div></div>'+
       '<div class="custsw" role="group" aria-label="สีแนะนำ">'+['#7AC143','#2F80ED','#9B51E0','#E2557B','#F2994A','#14A3A3','#6B7280'].map(function(x){return '<button type="button" class="csw'+(x.toLowerCase()===cc.c.toLowerCase()?' on':'')+'" data-act="cust-pick" data-c="'+x+'" style="background:'+x+'" aria-label="สี '+x+'"></button>';}).join('')+'</div>'+
       (p&&p.k==='color'?gearAskHtml():''):'')+
    (me?'<div class="thout">'+(me.mustChange?'':'<button class="btn sec grow" data-act="pw-self">'+ico('<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3M17 6l3 3M14.5 8.5l2.5 2.5"/>')+'<span>เปลี่ยนรหัสผ่าน</span></button>')+
      (logoutAsk?'<p class="small" role="alert"><b>ออกจากระบบใช่ไหม?</b></p><div class="row" style="gap:8px"><button class="btn danger grow" data-act="logout">ใช่ ออกจากระบบ</button><button class="btn sec" data-act="logout-no">ยกเลิก</button></div>'
               :'<button class="btn sec grow" data-act="logout-ask">'+ico(ICONS.out)+'<span>ออกจากระบบ</span></button>')+'</div>':'')+'</div>';
}
document.addEventListener('input',function(e){
  var t=e.target;if(!t)return;
  // ระหว่างลาก ไม่วาดเมนูใหม่ (แถบเลื่อน/ตัวเลือกสีจะได้ไม่ปิด) · แสดงแถบยืนยันเมื่อปล่อย (change)
  var start=function(k,old){if(!gearPend||gearPend.k!==k){gearRevert();gearPend={k:k,old:old};}};
  if(t.id==='glassRange'){var v=+t.value;start('glass',glassLevel());gearPend.v=v;applyGlass(v);var gv=$('glassVal');if(gv)gv.textContent=v+'%';}
  else if(t.id==='custColor'){start('color',customCfg());var cur=gearPend.v||gearPend.old,nv={c:t.value,dark:cur.dark};gearPend.v=nv;applyCustom(nv);}
});
// สีจากตัวเลือกสี: วาดเมนูใหม่เมื่อปล่อย (ระหว่างลากไม่วาดใหม่ เพื่อไม่ให้ตัวเลือกสีปิด)
document.addEventListener('change',function(e){var t=e.target;if(t&&(t.id==='custColor'||t.id==='glassRange')&&gearPend)renderChrome();});
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;
  var a=b.getAttribute('data-act');
  if(a==='theme-set'){e.stopPropagation();var tt=b.getAttribute('data-t');if(tt===curTheme()&&!gearPend)return;if(tt===curTheme()){gearRevert();renderChrome();return;}gearAsk('theme',tt);return;}
  if(a==='gear-yes'){e.stopPropagation();gearConfirm();return;}
  if(a==='gear-no'){e.stopPropagation();gearRevert();renderChrome();return;}
  if(a==='cust-base'||a==='cust-pick'){e.stopPropagation();var cur=gearPend&&gearPend.k==='color'?gearPend.v:customCfg(),nv=a==='cust-base'?{c:cur.c,dark:b.getAttribute('data-d')==='1'}:{c:b.getAttribute('data-c'),dark:cur.dark};applyCustom(nv);gearAsk('color',nv);return;}
  if(a==='theme'&&gearPend){gearRevert();} // ปิดเมนูโดยไม่ยืนยัน = ยกเลิก
  if(a==='pw-self'&&themeOpen){themeOpen=false;logoutAsk=false;gearRevert();setTimeout(renderChrome,0);} // เปิดหน้าต่างเปลี่ยนรหัสผ่านจากเมนู (ปิดเมนูก่อน)
},true);
// กดนอกเมนู / Esc = ยกเลิกสิ่งที่ยังไม่ยืนยัน
document.addEventListener('click',function(e){if(gearPend&&themeOpen&&!(e.target.closest&&e.target.closest('.thwrap'))){gearRevert();}},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&gearPend){e.stopPropagation();gearRevert();renderChrome();}},true);
