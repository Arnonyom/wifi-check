/* ลูกเล่นการแสดงผล (29 พ.ย. 2569)
   - ภาพรวม/รายงาน: ตัวเลข KPI นับขึ้น · กราฟแท่ง/เส้น/โดนัท ค่อย ๆ วิ่งขึ้น (เฉพาะตอนเปิดหน้า/เปลี่ยนช่วง ไม่ใช่ทุกครั้งที่ข้อมูลรีเฟรช)
   - กระดิ่งขยับเมื่อมีแจ้งเตือนใหม่ (และตอนเข้าระบบถ้ามีที่ยังไม่อ่าน)
   - ผู้ที่ตั้งค่า "ลดการเคลื่อนไหว" ในเครื่อง จะไม่เห็นการเคลื่อนไหวเหล่านี้ */
var fxKey='',bellRingTs=0;
function fxReduced(){try{return window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}
function countUp(el,dur){
  if(el.children.length)return;
  var t=el.textContent,m=t.match(/^(\D*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);if(!m)return;
  var to=parseFloat(m[2].replace(/,/g,'')),dec=(m[2].split('.')[1]||'').length;if(!isFinite(to)||to===0)return;
  var t0=null;
  var step=function(ts){
    if(!el.isConnected)return;
    if(t0===null)t0=ts;var k=Math.min(1,(ts-t0)/dur),e=1-Math.pow(1-k,3);
    el.textContent=m[1]+(to*e).toFixed(dec)+m[3];
    if(k<1)requestAnimationFrame(step);else el.textContent=t;
  };
  el.textContent=m[1]+(0).toFixed(dec)+m[3];requestAnimationFrame(step);
}
function animMain(){
  var k=view+'|'+(view==='report'?rep.sec:'')+'|'+dashDays+'|'+(typeof dashEmp!=='undefined'?dashEmp:'');
  if(k===fxKey)return;fxKey=k;
  if(fxReduced()||!/^(today|report|home)$/.test(view))return;
  var m=$('main');if(!m)return;
  m.querySelectorAll('.kpi b, .sum b, .bal b').forEach(function(b){countUp(b,900);});
  m.querySelectorAll('svg.chart').forEach(function(sv){
    sv.querySelectorAll('.bar').forEach(function(x,i){x.style.animationDelay=Math.min(i*35,700)+'ms';});
    sv.querySelectorAll('.ln').forEach(function(x){x.setAttribute('pathLength','1');});
  });
  m.classList.remove('anim');void m.offsetWidth;m.classList.add('anim');
  clearTimeout(animMain.t);animMain.t=setTimeout(function(){m.classList.remove('anim');},2200);
}
function bellRing(){
  bellRingTs=Date.now();if(fxReduced())return;
  var b=document.querySelector('.bellwrap [data-act="bell"]');if(!b)return;
  b.classList.remove('bswing');void b.offsetWidth;b.classList.add('bswing');
}
function ringCls(){return Date.now()-bellRingTs<1200&&!fxReduced()?' bswing':'';}
