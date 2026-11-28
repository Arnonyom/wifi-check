/* หน้าตั้งค่าระบบ (ผู้ดูแล): แท็บหมวด + ตารางการ์ด (ไอคอน ชื่อ คำอธิบาย ปุ่ม "เปิด") · กดเปิด → หน้านั้นเด้งเป็นหน้าต่าง (popup)
   ปิดได้ด้วยปุ่ม ✕ · กดพื้นหลัง · ปุ่ม Esc · ทำหลังวาดหน้า (settingsAcc) จึงไม่ต้องแก้โค้ดของแต่ละหน้า
   หน้าต่างที่เปิดอยู่และแท็บที่เลือก จำไว้แม้หน้าถูกวาดใหม่ (เช่น หลังกดบันทึก) */
var accOpen='',setTab='all';
var SET_TABS=[['all','ทั้งหมด'],['shift','กะ & ทีม'],['hol','วันหยุด'],['leave','วันลา'],['rule','กฎ'],['io','นำเข้า/ส่งออก'],['test','ทดสอบ']];
var SET_IC={
  rota:'<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9"/><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2"/>',
  team:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M18 14.2c2.2.3 3.8 2.2 3.8 4.8"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bell:'<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  down:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  up:'<path d="M12 15V3M7 8l5-5 5 5M5 21h14"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m12 13 1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 15.3l2-.3z"/>',
  flask:'<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
  bag:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
};
// รหัสการ์ด → หมวด ไอคอน ชื่อ คำอธิบาย
var SET_META={
  rota:['shift','rota','การหมุนกะทีม A','เวียนครบ 4 กะ เปลี่ยนทุกวันจันทร์'],
  rotab:['shift','team','รอบทำงานทีม B','ศ.–จ. สลับ ศ.–อา. · สลับกะทุก 2 สัปดาห์'],
  hol:['hol','cal','วันหยุดราชการ / นักขัตฤกษ์','ทีม A หยุด · ทีม B ทำตามรอบ'],
  lvq:['leave','bag','การตั้งค่าวันลา','สิทธิ์วันลารายคน · ปรับเพิ่ม/ลด · ลาแทนพนักงาน'],
  rules:['rule','clock','กฎการลงเวลา','เวลาเปิดให้ลงเวลา และเกณฑ์สาย'],
  push:['rule','bell','แจ้งเตือนบนมือถือ','สถานะการแจ้งเตือน (Push)'],
  export:['io','down','ส่งออกตารางกะ','ดาวน์โหลดเป็น Excel'],
  import:['io','up','นำเข้าตารางกะ','จากไฟล์ Excel หรือ .csv'],
  sim:['test','flask','ทดสอบเข้า-ออกงาน','ลองลงเวลาแทนพนักงาน (ไม่บันทึกจริง)'],
  clr:['test','trash','ล้างข้อมูลทดสอบ','ลบข้อมูลที่ใส่ระหว่างทดสอบ']
};
var SET_ORDER=['rota','rotab','hol','lvq','rules','push','export','import','sim','clr'];
function accIdOf(c,i){
  if(c.querySelector('[data-v="sim"]'))return 'sim';
  if(c.querySelector('[data-act^="rotab"]')||c.id==='rotaBEd')return 'rotab';
  if(c.querySelector('[data-act^="rota-"]')||c.id==='rotaEd')return 'rota';
  if(c.querySelector('[data-act="save-rules"]'))return 'rules';
  if(c.querySelector('[data-act="xl-sched"]'))return 'export';
  if(c.querySelector('#csvIn'))return 'import';
  if(c.id==='holCard')return 'hol';
  if(c.id==='clrCard')return 'clr';
  if(c.id==='lvqCard')return 'lvq';
  var h2=c.querySelector('h2');if(h2&&/Push/.test(h2.textContent))return 'push';
  return 'c'+i;
}
function settingsAcc(){
  var wrap=document.querySelector('#main > .stack');if(!wrap)return;
  var cards=[].slice.call(wrap.querySelectorAll(':scope > section.card')),have={};
  cards.forEach(function(c,i){
    var id=accIdOf(c,i);have[id]=1;
    c.classList.add('spop');c.setAttribute('data-acc',id);c.setAttribute('role','dialog');c.setAttribute('aria-modal','true');
    if(id==='sim'){c.hidden=true;return;} // ทดสอบเข้า-ออกงาน เป็นหน้าแยก กดแล้วไปหน้านั้น
    var m=SET_META[id],h=c.querySelector(':scope > h2');
    if(h){if(!h.id)h.id='spt-'+id;c.setAttribute('aria-labelledby',h.id);}
    var x=document.createElement('button');x.type='button';x.className='iconbtn spx';x.setAttribute('data-acc-t',id);x.setAttribute('aria-label','ปิด');
    x.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    c.insertBefore(x,c.firstChild);
  });
  var head=wrap.firstElementChild;
  var tabs=document.createElement('div');tabs.className='seg settabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','หมวดการตั้งค่า');
  tabs.innerHTML=SET_TABS.map(function(t){return '<button type="button" role="tab" data-set-tab="'+t[0]+'" aria-selected="'+(setTab===t[0])+'"'+(setTab===t[0]?' class="on"':'')+'>'+t[1]+'</button>';}).join('');
  var grid=document.createElement('div');grid.className='setgrid';
  grid.innerHTML=SET_ORDER.filter(function(id){return have[id];}).map(function(id){
    var m=SET_META[id],sub=m[3];
    if(id==='hol'){var n=Object.keys(state.holidays||{}).filter(function(d){return d>=bkk(now()).date;}).length;sub=n+' วันข้างหน้า · '+sub;}
    return '<div class="card stile" data-tile="'+id+'" data-grp="'+m[0]+'"><span class="stic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+SET_IC[m[1]]+'</svg></span>'+
      '<div class="grow"><b>'+m[2]+'</b><span class="muted small">'+sub+'</span></div>'+
      '<button type="button" class="btn sm" data-set-open="'+id+'" aria-haspopup="dialog">เปิด</button></div>';
  }).join('');
  var bg=document.createElement('div');bg.className='spbg';bg.setAttribute('data-acc-t','');
  wrap.insertBefore(tabs,head.nextSibling);wrap.insertBefore(grid,tabs.nextSibling);wrap.appendChild(bg);
  accPaint();
}
function accPaint(){
  var any=false;
  document.querySelectorAll('#main section.spop').forEach(function(c){var op=c.getAttribute('data-acc')===accOpen;c.classList.toggle('open',op);if(op)any=true;});
  var bg=document.querySelector('#main .spbg');if(bg)bg.classList.toggle('on',any);
  document.body.classList.toggle('noscroll',any);
  document.querySelectorAll('#main [data-set-tab]').forEach(function(b){var on=b.getAttribute('data-set-tab')===setTab;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on));});
  document.querySelectorAll('#main .stile').forEach(function(t){t.hidden=!(setTab==='all'||t.getAttribute('data-grp')===setTab);});
}
function accFocus(){
  var c=accOpen&&document.querySelector('#main section.spop.open');
  if(c){c.scrollTop=0;var f=c.querySelector('h2 button,input,select,textarea,button:not(.spx)')||c.querySelector('.spx');if(f&&f.focus)try{f.focus({preventScroll:true});}catch(x){}}
}
document.addEventListener('click',function(e){
  if(view!=='settings'){if(accOpen){accOpen='';document.body.classList.remove('noscroll');}return;}
  var tb=e.target.closest&&e.target.closest('[data-set-tab]');
  if(tb){e.stopPropagation();setTab=tb.getAttribute('data-set-tab');accPaint();return;}
  var op=e.target.closest&&e.target.closest('[data-set-open]');
  if(op){
    e.stopPropagation();var id=op.getAttribute('data-set-open');
    if(id==='sim'){view='sim';resetUi();renderAll();window.scrollTo(0,0);return;}
    accOpen=id;accPaint();accFocus();return;
  }
  var t=e.target.closest&&e.target.closest('[data-acc-t]');
  if(t){e.stopPropagation();var was=accOpen;accOpen='';accPaint();var tl=was&&document.querySelector('#main [data-set-open="'+was+'"]');if(tl&&tl.focus)try{tl.focus({preventScroll:true});}catch(x){}}
},true);
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&view==='settings'&&accOpen&&!dp&&!pwm){e.stopPropagation();var was=accOpen;accOpen='';accPaint();var tl=document.querySelector('#main [data-set-open="'+was+'"]');if(tl&&tl.focus)try{tl.focus({preventScroll:true});}catch(x){}}
},true);
