# มือถือ (ทดสอบบน vivo):
# 1) การ์ดลงเวลาพอดีจอทุกเครื่อง: คำนวณขนาดปุ่มใหม่เมื่อฟอนต์โหลดเสร็จ/การ์ดเปลี่ยนขนาด/หมุนจอ
#    (เดิมคำนวณครั้งเดียวก่อนฟอนต์ Prompt โหลด → ฟอนต์จริงสูงกว่า การ์ดล้นจอ ต้องซูมออก)
# 2) หน้าต่างที่เด้งขึ้นจากด้านล่าง (รายละเอียด ยืนยัน เปลี่ยนรหัส เลือกวันที่) ปัดลงเพื่อปิดได้
# 3) หน้าลงเวลาแสดงเวลาเข้างาน–ออกงานของกะล่าสุด
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

# --- 1) fitRing แบบปรับต่อเนื่อง
i=s.index("function fitRing(){");j=s.index("\n}\n",i)+3
s=s[:i]+"""var ringRO=null,ringTight=false;
function fitRing(){
  var ring=document.querySelector('#main .ring'),card=ring&&ring.closest('.card');if(!ring||!card)return;
  card.classList.toggle('tight',ringTight);
  var nav=$('nav'),nr=nav&&!nav.hidden?nav.getBoundingClientRect():null;
  var bottom=nr&&nr.top>innerHeight/2?nr.top:innerHeight;
  var maxW=Math.min(340,document.documentElement.clientWidth*0.84);
  var cr=card.getBoundingClientRect(),rw=ring.getBoundingClientRect().width;
  var top=cr.top+(window.scrollY||0),other=cr.height-rw,room=bottom-top-other-12;
  /* จอเล็กมาก/ตัวอักษรใหญ่: ซ่อนบรรทัดกฎเวลา ลดขนาดนาฬิกา (ค้างไว้จนกว่าจะหมุนจอ/เปลี่ยนขนาดจอ) */
  if(!ringTight&&room<200){ringTight=true;card.classList.add('tight');requestAnimationFrame(fitRing);return;}
  var want=Math.floor(Math.max(ringTight?150:170,Math.min(maxW,room)));
  if(Math.abs(want-rw)>1)ring.style.setProperty('--rw',want+'px');
  if(window.ResizeObserver&&(!ringRO||ringRO.card!==card)){
    if(ringRO)ringRO.disconnect();
    ringRO=new ResizeObserver(function(){requestAnimationFrame(fitRing);});ringRO.card=card;ringRO.observe(card);
  }
}
window.addEventListener('orientationchange',function(){ringTight=false;});
try{if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(me&&view==='home')fitRing();});}catch(e){}
"""+s[j:]

rep("else if(me&&view==='home')fitRing();","else if(me&&view==='home'){ringTight=false;fitRing();}")
rep("""'<p class="center muted small" style="margin-top:8px">เปิดให้ลงเวลาก่อนเริ่มกะ""","""'<p class="center muted small rules" style="margin-top:8px">เปิดให้ลงเวลาก่อนเริ่มกะ""")

# --- 3) เวลาเข้างาน–ออกงาน
rep("""    msg='เข้างาน '+fmtHM(st.rec.in)+' น. · '+(left>0?'เหลืออีก '+hm(left):'เลยเวลาเลิกกะ '+hm(-left)+' แล้ว');""",
    """    msg=(left>0?'เหลืออีก '+hm(left):'เลยเวลาเลิกกะ '+hm(-left)+' แล้ว');""")
rep("""  var f=flash;flash=null;
  var stale=""",
"""  var f=flash;flash=null;
  var io=st.mode==='out'?st.rec:state.attendance.filter(function(a){return a.emp===me.id&&a.out&&a.out>t-16*3600000;}).sort(function(a,b){return b.in-a.in;})[0];
  var ioHtml=io?'<div class="iotimes" role="group" aria-label="เวลาลงเวลากะล่าสุด">'+(io.date!==today?'<span class="iod muted small">'+esc(dayShort(io.date))+'</span>':'')+
    '<span><small>เข้างาน</small><b class="tnum">'+fmtHM(io.in)+'</b></span><span><small>ออกงาน</small><b class="tnum">'+(io.out?fmtHM(io.out):'—')+'</b></span></div>':'';
  var stale=""")
rep("""    '<p class="center"><b>'+info+'</b></p>'+""",
    """    '<p class="center"><b>'+info+'</b></p>'+ioHtml+""")

# --- 2) ปัดลงเพื่อปิด
rep("var rzT=null;","""/* ปัดหน้าต่างด้านล่างลงเพื่อปิด (มือถือ) */
(function(){
  var drag=null,CLOSE='[data-act=modal-cancel],[data-act=det-close],[data-act=pw-close],[data-act=dp-close]';
  function scrolledInside(el,m){for(var x=el;x&&x!==m.parentNode;x=x.parentNode){if(x.scrollTop>0)return true;if(x===m)break;}return false;}
  document.addEventListener('touchstart',function(e){
    drag=null;
    if(innerWidth>720||e.touches.length!==1)return;
    var m=e.target.closest&&e.target.closest('.overlay .modal');if(!m)return;
    if(e.target.closest('input,select,textarea')||scrolledInside(e.target,m))return;
    drag={m:m,y:e.touches[0].clientY,x:e.touches[0].clientX,dy:0,t:Date.now(),on:false};
  },{passive:true});
  document.addEventListener('touchmove',function(e){
    if(!drag)return;
    var dy=e.touches[0].clientY-drag.y,dx=e.touches[0].clientX-drag.x;
    if(!drag.on){
      if(dy>8&&dy>Math.abs(dx)*1.2){drag.on=true;drag.m.style.transition='none';}
      else if(Math.abs(dy)>8||Math.abs(dx)>8){drag=null;return;}
      else return;
    }
    drag.dy=Math.max(0,dy);drag.m.style.transform='translateY('+drag.dy+'px)';
    if(e.cancelable)e.preventDefault();
  },{passive:false});
  function end(){
    var d=drag;drag=null;if(!d||!d.on)return;
    var fast=d.dy/Math.max(1,Date.now()-d.t)>0.6;
    d.m.style.transition='transform .18s ease-out';
    var ov=d.m.closest('.overlay'),btn=ov&&ov.querySelector(CLOSE);
    if(btn&&!btn.disabled&&(d.dy>110||(fast&&d.dy>40))){
      d.m.style.transform='translateY(110%)';setTimeout(function(){btn.click();},160);return;
    }
    d.m.style.transform='';
  }
  document.addEventListener('touchend',end);document.addEventListener('touchcancel',end);
})();
var rzT=null;""")

css="""
/* mobile: sheet handle + check-in times */
@media (max-width:720px){.overlay .modal::before{content:'';display:block;flex:none;width:42px;height:5px;border-radius:3px;background:var(--line);margin:-8px auto 0}}
.iotimes{display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px}
.iotimes span{display:flex;flex-direction:column;align-items:center;min-width:92px;padding:6px 12px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line)}
.iotimes span.iod{flex-basis:100%;background:none;border:0;padding:0}
.iotimes small{font-size:12.5px;color:var(--muted)}
.iotimes b{font-family:var(--font-display);font-size:20px;line-height:1.2}
.card.hero.tight .rules{display:none}.card.hero.tight .clock{font-size:clamp(32px,10vw,46px)}.card.hero.tight .ring{margin:10px auto}.card.hero.tight .iotimes{margin-top:4px}.card.hero.tight .iotimes span{padding:3px 10px}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('mobile patch ok')
