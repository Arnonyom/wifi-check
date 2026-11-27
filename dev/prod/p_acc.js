/* หน้าตั้งค่าระบบ: ทุกการ์ดหุบเหลือแค่หัวข้อ · กดหัวข้อแล้วขยาย (เปิดได้ทีละใบ) · กดหัวข้อซ้ำ / กดปุ่มปิด / กดที่อื่น → หุบ
   ทำหลังวาดหน้า (settingsAcc) จึงไม่ต้องแก้โค้ดของการ์ดแต่ละใบ · id ของการ์ดดูจากเนื้อหา เปิดค้างไว้ได้แม้หน้าถูกวาดใหม่ */
var accOpen='';
function accIdOf(c,i){
  if(c.querySelector('[data-act^="rotab"]')||c.id==='rotaBEd')return 'rotab';
  if(c.querySelector('[data-act^="rota-"]')||c.id==='rotaEd')return 'rota';
  if(c.querySelector('[data-act="save-rules"]'))return 'rules';
  if(c.querySelector('[data-act="xl-sched"]'))return 'export';
  if(c.querySelector('#csvIn'))return 'import';
  if(c.id==='holCard')return 'hol';
  if(c.id==='clrCard')return 'clr';
  var h2=c.querySelector('h2');if(h2&&/Push/.test(h2.textContent))return 'push';
  return 'c'+i;
}
function settingsAcc(){
  var cards=[].slice.call(document.querySelectorAll('#main > .stack > section.card'));
  cards.forEach(function(c,i){
    var h=null;for(var k=0;k<c.children.length;k++)if(c.children[k].tagName==='H2'){h=c.children[k];break;}
    if(!h)return;
    var id=accIdOf(c,i),op=accOpen===id;
    c.classList.add('sacc');c.setAttribute('data-acc',id);if(op)c.classList.add('open');
    // หัวข้อเดิม (h2) ใส่ปุ่มไว้ข้างใน: แบบ accordion ที่โปรแกรมอ่านหน้าจอเข้าใจ
    h.classList.add('acchead');if(c.firstChild!==h)c.insertBefore(h,c.firstChild);
    h.innerHTML='<button type="button" class="acchd" data-acc-t="'+id+'" aria-expanded="'+op+'"><span class="acct">'+h.innerHTML+'</span><span class="accchev" aria-hidden="true">›</span></button>';
    var cl=document.createElement('div');cl.className='accfoot';cl.innerHTML='<button type="button" class="btn sec sm" data-acc-t="'+id+'">'+'ปิด'+'</button>';
    c.appendChild(cl);
  });
}
function accPaint(){
  document.querySelectorAll('#main section.sacc').forEach(function(c){
    var op=c.getAttribute('data-acc')===accOpen;c.classList.toggle('open',op);
    var hd=c.querySelector('.acchd');if(hd)hd.setAttribute('aria-expanded',String(op));
  });
}
document.addEventListener('click',function(e){
  if(view!=='settings'){accOpen='';return;}
  var t=e.target.closest&&e.target.closest('[data-acc-t]');
  if(t){
    e.stopPropagation();var id=t.getAttribute('data-acc-t');accOpen=accOpen===id?'':id;accPaint();
    var c=accOpen&&document.querySelector('#main section.sacc[data-acc="'+accOpen+'"]');
    if(c&&c.scrollIntoView){var r=c.getBoundingClientRect();if(r.top<70||r.top>innerHeight*0.6)c.scrollIntoView({block:'start',behavior:'smooth'});}
    return;
  }
  // กดที่อื่น → หุบ (ไม่นับหน้าต่างเลือกวันที่ ป๊อปอัป แถบด้านบน)
  if(accOpen&&!e.target.closest('section.sacc.open,#dpbox,.overlay,#pwbox,#toast,.pop,#top,#nav')){accOpen='';accPaint();}
},true);
