/* เมนูฟันเฟือง (28 พ.ย. 2569)
   - ทุกการเปลี่ยนแปลงในเมนูนี้ถามยืนยันก่อน: ภาษา · ธีม · ความใส (Liquid Glass) · สีที่เลือกเอง
     (แถบเลื่อน/ตัวเลือกสีแสดงผลให้ดูก่อน กด "ยกเลิก" กลับเป็นค่าเดิม)
   - ธีม: สว่าง · มืด · Black (ดำสนิท) · Liquid Glass · กำหนดสีเอง (เลือกสีหลัก + พื้นสว่าง/มืด) · จำไว้ในเครื่องนี้
   - เปลี่ยนรหัสผ่าน (ย้ายมาจากหน้าโปรไฟล์) · ออกจากระบบ (ถามยืนยันเหมือนเดิม) */
var gearPend=null,CUSTOM_KEY='wc-custom';
var THEMES=[['light','โหมดกลางวัน'],['dark','โหมดกลางคืน'],['white','White'],['black','Black'],['glass','Liquid Glass'],['custom','กำหนดสีเอง']];
var CBASE=[['light','สว่าง'],['dark','มืด'],['glass','แก้ว']];
function themeName(t){var o=THEMES.find(function(x){return x[0]===t;});return o?o[1]:t;}
// สีที่เลือกเอง: {c: สีหลัก, base: light|dark|glass} (แบบเดิม {dark:true} = มืด)
function customCfg(){var c={c:'#7AC143',base:'light'};try{var x=UP&&UP.custom?UP.custom:JSON.parse(devGet(CUSTOM_KEY)||'null');if(x&&/^#[0-9a-fA-F]{6}$/.test(x.c))c={c:x.c,base:['light','dark','glass'].indexOf(x.base)>=0?x.base:(x.dark?'dark':'light')};}catch(e){}return c;}
function hueShift(h,deg){var a=hexRgb(h).map(function(v){return v/255;}),mx=Math.max.apply(null,a),mn=Math.min.apply(null,a),l=(mx+mn)/2,d=mx-mn,hh=0,ss=0;
  if(d){ss=d/(1-Math.abs(2*l-1));hh=mx===a[0]?((a[1]-a[2])/d)%6:mx===a[1]?(a[2]-a[0])/d+2:(a[0]-a[1])/d+4;hh*=60;}
  hh=((hh+deg)%360+360)%360;var C=(1-Math.abs(2*l-1))*ss,X=C*(1-Math.abs((hh/60)%2-1)),m=l-C/2,r=hh<60?[C,X,0]:hh<120?[X,C,0]:hh<180?[0,C,X]:hh<240?[0,X,C]:hh<300?[X,0,C]:[C,0,X];
  return rgbHex(r.map(function(v){return (v+m)*255;}));}
function rgba(h,a){var x=hexRgb(h);return 'rgba('+x[0]+','+x[1]+','+x[2]+','+a+')';}
function hexRgb(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function rgbHex(a){return '#'+a.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16);}).join('');}
function mixC(a,b,p){var x=hexRgb(a),y=hexRgb(b);return rgbHex(x.map(function(v,i){return v*p+y[i]*(1-p);}));}
function lum(h){return hexRgb(h).map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}).reduce(function(s,v,i){return s+v*[0.2126,0.7152,0.0722][i];},0);}
function contrast(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
// ปรับสีให้อ่านออกบนพื้นหลัง (ความต่างอย่างน้อย 4.5:1)
function readable(c,bg,toward){var x=c;for(var i=0;i<20&&contrast(x,bg)<4.5;i++)x=mixC(toward,x,0.12+i*0.04);return x;}
var CUSTOM_VARS=['--cg1','--cg2','--cg3','--cg4','--cgb','--bg','--surface','--surface-2','--ink','--muted','--line','--brand','--brand-strong','--on-strong','--brand-soft','--on-brand','--late','--late-soft','--amber','--off','--off-soft','--hatch','--scrim','--shadow','--grid','--axis','color-scheme'];
function applyCustom(cfg){
  var r=document.documentElement.style,c=cfg.c,v,root=document.documentElement;
  clearCustom();
  if(cfg.base==='glass'){
    // แก้ว: ใช้ Liquid Glass แต่เปลี่ยนสีพื้นหลังและสีหลักเป็นสีที่เลือก
    root.setAttribute('data-theme','glass');root.setAttribute('data-cust','1');
    v={'--cg1':rgba(c,.85),'--cg2':rgba(hueShift(c,40),.7),'--cg3':rgba(hueShift(c,-70),.55),'--cg4':rgba(hueShift(c,150),.45),'--cgb':mixC(c,'#ffffff',0.18),
       '--brand':c,'--brand-strong':readable(mixC(c,'#000000',0.85),'#ffffff','#000000'),'--brand-soft':rgba(c,.28),'--on-brand':lum(c)>0.35?'#101412':'#ffffff','--ink':mixC(c,'#0d1512',0.10)};
    Object.keys(v).forEach(function(k){r.setProperty(k,v[k]);});applyGlass(glassLevel());return;
  }
  root.setAttribute('data-theme','custom');
  if(cfg.base==='dark'){
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
  CUSTOM_VARS.forEach(function(k){if(v[k]!=null)r.setProperty(k,v[k]);});
}
function clearCustom(){var r=document.documentElement.style;CUSTOM_VARS.forEach(function(k){r.removeProperty(k);});document.documentElement.removeAttribute('data-cust');}
// ธีมที่เลือก (กำหนดสีเองแบบแก้ว ใช้ data-theme=glass + data-cust)
function curTheme(){var R=document.documentElement;if(R.hasAttribute('data-cust'))return 'custom';return R.getAttribute('data-theme')||(effDark()?'dark':'light');}
/* ธีม + ภาษา จำแยกตามบัญชี (29 พ.ย. 2569)
   - ล็อกอินอยู่: ธีม/ความใส/สีที่เลือกเอง เก็บในโปรไฟล์ของคนนั้น (profiles.prefs ผ่าน set_my_prefs) → ล็อกอินเครื่องไหนก็ได้ธีมของตัวเอง
   - ยังไม่ล็อกอิน (หน้าล็อกอิน): ใช้ธีมของเครื่อง (localStorage เหมือนเดิม) · ออกจากระบบแล้วกลับเป็นธีมของเครื่อง
   - คนที่ยังไม่เคยเลือกธีม ใช้ธีมของเครื่อง · จำค่าของคนล่าสุดไว้ในเครื่องด้วย (wc-u-…) เปิดหน้าใหม่จะได้ไม่กะพริบ */
var UP=null,upTimer=null;
function devGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function devSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function devDel(k){try{localStorage.removeItem(k);}catch(e){}}
function glassLevel(){var x=UP&&UP.glass!=null?UP.glass:devGet(GLASS_KEY),v=x==null||x===''?60:+x;return isNaN(v)?60:Math.max(0,Math.min(100,v));}
function prefSave(k,v){
  if(me&&UP){
    UP[k]=v;devSet('wc-u-'+me.id,JSON.stringify(UP));var uid=me.id,snap=JSON.stringify(UP);
    clearTimeout(upTimer);upTimer=setTimeout(function(){if(!me||me.id!==uid||!sb)return;sb.rpc('set_my_prefs',{p_prefs:JSON.parse(snap)}).then(function(r){if(!r.error){var e=emp(uid);if(e)e.prefs=JSON.parse(snap);}});},300);
    return;
  }
  if(k==='lang')devSet('wc-lang',v);else if(k==='theme')devSet(THEME_KEY,v);else if(k==='glass')devSet(GLASS_KEY,String(v));else if(k==='custom')devSet(CUSTOM_KEY,JSON.stringify(v));
}
function applyTheme(t){
  var R=document.documentElement;
  if(t)R.setAttribute('data-theme',t);else R.removeAttribute('data-theme');
  if(t==='custom')applyCustom(customCfg());else clearCustom();
  applyGlass(glassLevel());
}
function setTheme(t){prefSave('theme',t);applyTheme(t);renderAll();}
function validPrefs(p){return p&&typeof p==='object'&&!Array.isArray(p)?p:{};}
// เข้าระบบ: ใช้ธีมของคนนี้ · ออกจากระบบ: กลับเป็นธีมของเครื่อง
function userThemeOn(e){
  var p=validPrefs(e&&e.prefs);if(!p.theme){var c=null;try{c=JSON.parse(devGet('wc-u-'+e.id)||'null');}catch(x){}if(c&&c.theme)p=c;}
  UP={theme:p.theme||null,glass:p.glass!=null?p.glass:null,custom:p.custom||null,lang:p.lang==='en'||p.lang==='th'?p.lang:null};
  devSet('wc-last-uid',e.id);devSet('wc-u-'+e.id,JSON.stringify(UP));gearPend=null;
  applyTheme(UP.theme||devGet(THEME_KEY)||'');
  if(UP.lang&&UP.lang!==LANG)setLang(UP.lang,true); // ภาษาของคนนี้ (ยังไม่เคยเลือก = ใช้ภาษาที่เปิดอยู่)
}
function userThemeOff(){var dl=devGet('wc-lang')==='en'?'en':'th';if(dl!==LANG)setLang(dl,true);if(!UP&&!devGet('wc-last-uid'))return;UP=null;gearPend=null;devDel('wc-last-uid');applyTheme(devGet(THEME_KEY)||'');}
// เปิดหน้าใหม่ขณะยังล็อกอินอยู่: ใช้ธีมของคนล่าสุดทันที (ยืนยันอีกครั้งหลังโหลดข้อมูล)
(function(){var u=devGet('wc-last-uid');if(!u)return;var c=null;try{c=JSON.parse(devGet('wc-u-'+u)||'null');}catch(x){}if(c&&c.theme){UP=c;applyTheme(c.theme);UP=null;}else applyTheme(devGet(THEME_KEY)||'');})();
function effDark(){var t=document.documentElement.getAttribute('data-theme');if(t)return t==='dark'||t==='black'||(t==='custom'&&customCfg().base==='dark');return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches;}
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
  if(p.k==='glass'){prefSave('glass',p.v);applyGlass(p.v);}
  if(p.k==='color'){prefSave('custom',p.v);applyCustom(p.v);}
  renderAll();
}
function gearAskHtml(){
  var p=gearPend;if(!p)return '';
  var msg=p.k==='lang'?(p.v==='en'?'เปลี่ยนภาษาเป็น English ใช่ไหม?':'เปลี่ยนภาษาเป็นภาษาไทย ใช่ไหม?')
    :p.k==='theme'?'เปลี่ยนธีมเป็น "'+themeName(p.v)+'" ใช่ไหม?'
    :p.k==='glass'?'ใช้ความใส '+p.v+'% ใช่ไหม?':'ใช้สีนี้ใช่ไหม?';
  return '<div class="gask" role="alert"><p class="small"><b>'+msg+'</b></p><div class="row" style="gap:8px"><button class="btn grow" data-act="gear-yes">ยืนยัน</button><button class="btn sec" data-act="gear-no">ยกเลิก</button></div></div>';
}
/* โหมดกลางวัน ↔ กลางคืน เป็นสวิตช์ (ธีมสว่าง/มืดเดิม) · ธีมอื่น (White Black Glass สีเอง) เลือกจากปุ่มด้านล่าง
   สวิตช์อยู่ฝั่งกลางคืนเมื่อธีมตอนนี้เป็นแบบมืด · กดแล้วถามยืนยันเหมือนทุกการเปลี่ยนในเมนูนี้ */
function dayRow(t,sel){
  var night=effDark(),act=t==='light'||t==='dark',pend=sel!==t&&(sel==='light'||sel==='dark');
  return '<button type="button" class="swrow daysw'+(act?' on':'')+(pend?' pend':'')+'" role="switch" aria-checked="'+night+'" data-act="theme-set" data-t="'+(night?'light':'dark')+'" aria-label="'+(night?'โหมดกลางคืน (กดเพื่อเปลี่ยนเป็นกลางวัน)':'โหมดกลางวัน (กดเพื่อเปลี่ยนเป็นกลางคืน)')+'">'+
    '<span>'+(night?'โหมดกลางคืน':'โหมดกลางวัน')+'</span><span class="dsw"><span class="dic'+(night?'':' on')+'" aria-hidden="true">'+ico(ICONS.sun)+'</span><span class="sw'+(night?' on':'')+'"><i></i></span><span class="dic'+(night?' on':'')+'" aria-hidden="true">'+ico(ICONS.moon)+'</span></span></button>';
}
function themePanel(){
  var t=curTheme(),p=gearPend,v=p&&p.k==='glass'?p.v:glassLevel(),cc=p&&p.k==='color'?p.v:customCfg(),sel=p&&p.k==='theme'?p.v:t;
  var sw=function(o){return o==='custom'?' style="background:linear-gradient(135deg,'+cc.c+' 0 50%,'+(cc.base==='dark'?'#0a0c0b':cc.base==='glass'?'#cfe9ff':'#ffffff')+' 50% 100%)"':'';};
  return '<div class="pop thpop" role="dialog" aria-label="ตั้งค่า">'+langRow()+(p&&p.k==='lang'?gearAskHtml():'')+
    '<p class="small muted">ธีมหน้าจอ</p>'+dayRow(t,sel)+'<div class="thopts">'+
    THEMES.filter(function(o){return o[0]!=='light'&&o[0]!=='dark';}).map(function(o){return '<button class="thopt'+(t===o[0]?' on':'')+(sel===o[0]&&sel!==t?' pend':'')+'" data-act="theme-set" data-t="'+o[0]+'" aria-pressed="'+(t===o[0])+'"><span class="thsw thsw-'+o[0]+'"'+sw(o[0])+'>'+(o[0]==='light'?ico(ICONS.sun):o[0]==='dark'?ico(ICONS.moon):'')+'</span>'+o[1]+'</button>';}).join('')+'</div>'+
    (p&&p.k==='theme'?gearAskHtml():'')+
    (t==='glass'||(t==='custom'&&cc.base==='glass')?'<label for="glassRange" class="small">ความใส ↔ ขุ่น <b class="tnum" id="glassVal">'+v+'%</b></label><input id="glassRange" type="range" min="0" max="100" step="1" value="'+v+'"><div class="row between small muted"><span>ใส</span><span>ขุ่น</span></div>'+(p&&p.k==='glass'?gearAskHtml():''):'')+
    (t==='custom'?'<div class="cust"><label for="custColor" class="small">สีหลัก</label><input id="custColor" type="color" value="'+cc.c+'">'+
       '<div class="seg" role="group" aria-label="พื้นหลัง">'+CBASE.map(function(x){return '<button type="button" data-act="cust-base" data-b="'+x[0]+'" aria-pressed="'+(cc.base===x[0])+'">'+x[1]+'</button>';}).join('')+'</div></div>'+
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
  else if(t.id==='custColor'){start('color',customCfg());var cur=gearPend.v||gearPend.old,nv={c:t.value,base:cur.base};gearPend.v=nv;applyCustom(nv);}
});
// สีจากตัวเลือกสี: วาดเมนูใหม่เมื่อปล่อย (ระหว่างลากไม่วาดใหม่ เพื่อไม่ให้ตัวเลือกสีปิด)
document.addEventListener('change',function(e){var t=e.target;if(t&&(t.id==='custColor'||t.id==='glassRange')&&gearPend)renderChrome();});
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;
  var a=b.getAttribute('data-act');
  if(a==='theme-set'){e.stopPropagation();var tt=b.getAttribute('data-t');if(tt===curTheme()&&!gearPend)return;if(tt===curTheme()){gearRevert();renderChrome();return;}gearAsk('theme',tt);return;}
  if(a==='gear-yes'){e.stopPropagation();gearConfirm();return;}
  if(a==='gear-no'){e.stopPropagation();gearRevert();renderChrome();return;}
  if(a==='cust-base'||a==='cust-pick'){e.stopPropagation();var cur=gearPend&&gearPend.k==='color'?gearPend.v:customCfg(),nv=a==='cust-base'?{c:cur.c,base:b.getAttribute('data-b')}:{c:b.getAttribute('data-c'),base:cur.base};applyCustom(nv);gearAsk('color',nv);return;}
  if(a==='theme'&&gearPend){gearRevert();} // ปิดเมนูโดยไม่ยืนยัน = ยกเลิก
  if(a==='pw-self'&&themeOpen){themeOpen=false;logoutAsk=false;gearRevert();setTimeout(renderChrome,0);} // เปิดหน้าต่างเปลี่ยนรหัสผ่านจากเมนู (ปิดเมนูก่อน)
},true);
// กดนอกเมนู / Esc = ยกเลิกสิ่งที่ยังไม่ยืนยัน
document.addEventListener('click',function(e){if(gearPend&&themeOpen&&!(e.target.closest&&e.target.closest('.thwrap'))){gearRevert();}},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&gearPend){e.stopPropagation();gearRevert();renderChrome();}},true);
