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
function startPdrag(h,x,y){
  var card=h.closest('.pcard'),grid=card&&card.parentNode;if(!grid)return false;
  var r=card.getBoundingClientRect(),ph=document.createElement('div');
  ph.className='pcard-ph';ph.style.height=r.height+'px';grid.insertBefore(ph,card);
  card.classList.add('dragging');card.style.width=r.width+'px';card.style.height=r.height+'px';card.style.left=r.left+'px';card.style.top=r.top+'px';
  document.body.classList.add('pdragging');
  pdrag={card:card,grid:grid,ph:ph,dx:x-r.left,dy:y-r.top,before:gridIds(grid).join()};
  return true;
}
function movePdrag(x,y){
  var d=pdrag,c=d.card;c.style.left=(x-d.dx)+'px';c.style.top=(y-d.dy)+'px';
  if(y<70)scrollBy(0,-14);else if(y>innerHeight-70)scrollBy(0,14);
  var t=document.elementsFromPoint(x,y).find(function(el){return el!==c&&el.classList&&el.classList.contains('pcard')&&el.parentNode===d.grid;});
  if(!t)return;
  var kids=[].slice.call(d.grid.children);
  d.grid.insertBefore(d.ph,kids.indexOf(d.ph)<kids.indexOf(t)?t.nextSibling:t);
}
function endPdrag(){
  if(!pdrag)return;var d=pdrag;pdrag=null;
  d.grid.insertBefore(d.card,d.ph);d.ph.remove();d.card.classList.remove('dragging');
  ['width','height','left','top'].forEach(function(k){d.card.style[k]='';});
  document.body.classList.remove('pdragging');
  var ids=gridIds(d.grid);if(ids.join()!==d.before)saveOrder(ids);
}
/* เมาส์/ปากกา: pointer events · นิ้ว: touch events (iPhone/แอปบนหน้าจอโฮมยกเลิก pointer กลางทางได้ จึงใช้ touch โดยตรง) */
document.addEventListener('pointerdown',function(e){
  if(e.pointerType==='touch')return;
  var h=e.target.closest&&e.target.closest('[data-drag]');if(!h||busy||pdrag||e.button>0)return;
  if(startPdrag(h,e.clientX,e.clientY)){e.preventDefault();try{h.setPointerCapture(e.pointerId);}catch(_){}}
});
document.addEventListener('pointermove',function(e){if(pdrag&&e.pointerType!=='touch'){e.preventDefault();movePdrag(e.clientX,e.clientY);}});
document.addEventListener('pointerup',function(e){if(e.pointerType!=='touch')endPdrag();});
document.addEventListener('pointercancel',function(e){if(e.pointerType!=='touch')endPdrag();});
document.addEventListener('touchstart',function(e){
  var h=e.target.closest&&e.target.closest('[data-drag]');if(!h||busy||pdrag||e.touches.length!==1)return;
  var t=e.touches[0];if(startPdrag(h,t.clientX,t.clientY))e.preventDefault();
},{passive:false});
document.addEventListener('touchmove',function(e){if(!pdrag)return;e.preventDefault();var t=e.touches[0];if(t)movePdrag(t.clientX,t.clientY);},{passive:false});
document.addEventListener('touchend',function(e){if(pdrag&&!e.touches.length)endPdrag();});
document.addEventListener('touchcancel',function(){endPdrag();});
document.addEventListener('keydown',function(e){
  var h=e.target.closest&&e.target.closest('[data-drag]');if(!h||busy)return;
  var k=e.key,dir=(k==='ArrowUp'||k==='ArrowLeft')?-1:(k==='ArrowDown'||k==='ArrowRight')?1:0;if(!dir)return;
  e.preventDefault();
  var card=h.closest('.pcard'),grid=card.parentNode,sib=dir<0?card.previousElementSibling:card.nextElementSibling;if(!sib)return;
  grid.insertBefore(card,dir<0?sib:sib.nextSibling);h.focus();saveOrder(gridIds(grid));
});
