/* จัดลำดับการ์ดพนักงาน (หน้าพนักงานเท่านั้น): ลากที่ขีดจับมุมขวาบน (เมาส์/นิ้ว) หรือกดลูกศรบนคีย์บอร์ด
   ย้ายได้เฉพาะในกลุ่มเดียวกัน · บันทึกลง profiles.sort_order ผ่าน set_profile_order (ผู้ดูแลทุกคนเห็นลำดับเดียวกัน) */
function byOrder(list){
  return list.map(function(e,i){return [e,i];}).sort(function(a,b){
    var x=a[0].sortOrder==null?1e9:a[0].sortOrder,y=b[0].sortOrder==null?1e9:b[0].sortOrder;return x-y||a[1]-b[1];
  }).map(function(p){return p[0];});
}
async function saveOrder(ids){
  var old={};state.employees.forEach(function(e){old[e.id]=e.sortOrder;});
  ids.forEach(function(id,i){var e=emp(id);if(e)e.sortOrder=i+1;});
  busy=true;
  try{var r=await sb.rpc('set_profile_order',{p_ids:ids});if(r.error)throw r.error;}
  catch(err){state.employees.forEach(function(e){e.sortOrder=old[e.id];});if(view==='people')renderView();toast('บันทึกลำดับไม่สำเร็จ',errMsg(err),'warn');}
  finally{busy=false;}
}
function gridIds(g){return [].map.call(g.querySelectorAll('.pcard[data-eid]'),function(c){return c.getAttribute('data-eid');});}
var pdrag=null;
document.addEventListener('pointerdown',function(e){
  var h=e.target.closest&&e.target.closest('[data-drag]');if(!h||busy||pdrag||e.button>0)return;
  var card=h.closest('.pcard'),grid=card&&card.parentNode;if(!grid)return;
  e.preventDefault();
  var r=card.getBoundingClientRect(),ph=document.createElement('div');
  ph.className='pcard-ph';ph.style.height=r.height+'px';grid.insertBefore(ph,card);
  card.classList.add('dragging');card.style.width=r.width+'px';card.style.height=r.height+'px';card.style.left=r.left+'px';card.style.top=r.top+'px';
  document.body.classList.add('pdragging');
  pdrag={card:card,grid:grid,ph:ph,dx:e.clientX-r.left,dy:e.clientY-r.top,before:gridIds(grid).join()};
  try{h.setPointerCapture(e.pointerId);}catch(_){}
});
document.addEventListener('pointermove',function(e){
  if(!pdrag)return;e.preventDefault();
  var d=pdrag,c=d.card;c.style.left=(e.clientX-d.dx)+'px';c.style.top=(e.clientY-d.dy)+'px';
  if(e.clientY<70)scrollBy(0,-14);else if(e.clientY>innerHeight-70)scrollBy(0,14);
  var t=document.elementsFromPoint(e.clientX,e.clientY).find(function(el){return el!==c&&el.classList&&el.classList.contains('pcard')&&el.parentNode===d.grid;});
  if(!t)return;
  var kids=[].slice.call(d.grid.children);
  d.grid.insertBefore(d.ph,kids.indexOf(d.ph)<kids.indexOf(t)?t.nextSibling:t);
});
function endPdrag(){
  if(!pdrag)return;var d=pdrag;pdrag=null;
  d.grid.insertBefore(d.card,d.ph);d.ph.remove();d.card.classList.remove('dragging');
  ['width','height','left','top'].forEach(function(k){d.card.style[k]='';});
  document.body.classList.remove('pdragging');
  var ids=gridIds(d.grid);if(ids.join()!==d.before)saveOrder(ids);
}
document.addEventListener('pointerup',endPdrag);
document.addEventListener('pointercancel',endPdrag);
document.addEventListener('keydown',function(e){
  var h=e.target.closest&&e.target.closest('[data-drag]');if(!h||busy)return;
  var k=e.key,dir=(k==='ArrowUp'||k==='ArrowLeft')?-1:(k==='ArrowDown'||k==='ArrowRight')?1:0;if(!dir)return;
  e.preventDefault();
  var card=h.closest('.pcard'),grid=card.parentNode,sib=dir<0?card.previousElementSibling:card.nextElementSibling;if(!sib)return;
  grid.insertBefore(card,dir<0?sib:sib.nextSibling);h.focus();saveOrder(gridIds(grid));
});
