# ลูกเล่น + ถามยืนยัน (29 พ.ย. 2569): ตัวเลข KPI นับขึ้น กราฟวิ่ง · กระดิ่งขยับ · toast สำเร็จมีเครื่องหมายถูก
# ถามยืนยันก่อนทุกปุ่ม ส่ง/อนุมัติ/บันทึก (prod/p_confirm.js ต้องอยู่ต้นสคริปต์) · prod/p_fx.js
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
rep("/* ---------- theme ---------- */",open(S+'prod/p_confirm.js',encoding='utf-8').read()+open(S+'prod/p_fx.js',encoding='utf-8').read()+"/* ---------- theme ---------- */")
rep("  if(view==='settings')settingsAcc();\n","  if(view==='settings')settingsAcc();\n  animMain();\n")
rep("<div class=\"bellwrap\"><button class=\"iconbtn\" data-act=\"bell\"","<div class=\"bellwrap\"><button class=\"iconbtn'+ringCls()+'\" data-act=\"bell\"")
rep("'<path class=\"bar '+(it.cls||opt.cls||'f-s1')+'\" d=\"'+rowPath(lw,y,bw,bh,4)","'<path class=\"bar hb '+(it.cls||opt.cls||'f-s1')+'\" d=\"'+rowPath(lw,y,bw,bh,4)")
rep("'<path class=\"bar f-s1\" d=\"'+(it.v>=0?rowPath(x0","'<path class=\"bar hb'+(it.v<0?' hbn':'')+' f-s1\" d=\"'+(it.v>=0?rowPath(x0")
# toast: แบบสำเร็จ (ok) มีเครื่องหมายถูก · ขึ้นมาแล้วค่อย ๆ หายไป
rep("el.className='toast'+(kind==='warn'?' warn':'')+(tg?' tgo':'');","el.className='toast'+(kind==='warn'?' warn':kind==='ok'?' ok':'')+(tg?' tgo':'');")
rep("  el.appendChild(b);el.appendChild(s);\n","  if(kind==='ok'){var ic=document.createElement('span');ic.className='tok';ic.setAttribute('aria-hidden','true');ic.innerHTML='<svg viewBox=\"0 0 24 24\" width=\"22\" height=\"22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path class=\"tokp\" d=\"M5 12.5l4.5 4.5L19 7.5\"/></svg>';el.appendChild(ic);var tw=document.createElement('span');tw.className='tokt';tw.appendChild(b);tw.appendChild(s);el.appendChild(tw);}\n  else{el.appendChild(b);el.appendChild(s);}\n")
rep("  setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},5500);","  var life=kind==='ok'?3200:5500;setTimeout(function(){el.classList.add('out');},life);setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},life+350);")
css="""
/* ถามยืนยัน */
#cfbox .overlay{z-index:70}
.cfm{max-width:380px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;animation:cfin .16s ease-out}
.cfm p{margin:0}.cfbtns{width:100%;gap:8px;flex-wrap:nowrap}
.cfic{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:var(--brand-soft);color:var(--brand-strong)}
@keyframes cfin{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
/* toast */
.toast{animation:tin .25s ease-out}
.toast.out{animation:tout .35s ease-in forwards}
@keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes tout{to{opacity:0;transform:translateX(24px)}}
.toast.ok{flex-direction:row;align-items:center;gap:10px;border-left-color:#1F9D55}
.tok{flex:none;width:34px;height:34px;border-radius:50%;background:#1F9D55;color:#fff;display:grid;place-items:center;animation:tokpop .35s cubic-bezier(.3,1.6,.5,1) both}
.tokp{stroke-dasharray:24;stroke-dashoffset:24;animation:tokd .35s .2s ease-out forwards}
.tokt{display:flex;flex-direction:column;gap:2px;min-width:0}
@keyframes tokpop{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}
@keyframes tokd{to{stroke-dashoffset:0}}
/* กระดิ่งขยับ */
[data-act="bell"].ring svg{animation:bellring 1.1s ease-in-out;transform-origin:50% 12%}
[data-act="bell"].ring .badge{animation:bpop .5s ease-out}
@keyframes bellring{0%,100%{transform:rotate(0)}10%{transform:rotate(18deg)}20%{transform:rotate(-15deg)}30%{transform:rotate(12deg)}40%{transform:rotate(-9deg)}50%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}70%{transform:rotate(2deg)}}
@keyframes bpop{0%{transform:scale(.4)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
/* KPI + กราฟวิ่ง */
.anim svg.chart .bar{transform-box:fill-box;transform-origin:50% 100%;animation:fxup .75s cubic-bezier(.2,.8,.2,1) both}
.anim svg.chart .bar.hb{transform-origin:0 50%;animation-name:fxright}
.anim svg.chart .bar.hbn{transform-origin:100% 50%}
.anim svg.chart circle.bar{transform-origin:50% 50%;animation:fxspin .9s cubic-bezier(.2,.8,.2,1) both}
.anim svg.chart .ln{stroke-dasharray:1;stroke-dashoffset:1;animation:fxdraw 1.1s .1s ease-out forwards}
.anim svg.chart .ar{animation:fxfade .9s .3s ease-out both}
.anim .lvbar i{animation:fxw .9s cubic-bezier(.2,.8,.2,1) both}
.anim .kpi,.anim .sum>div{animation:fxfade .45s ease-out both}
@keyframes fxup{from{transform:scaleY(0)}to{transform:none}}
@keyframes fxright{from{transform:scaleX(0)}to{transform:none}}
@keyframes fxspin{from{transform:rotate(-90deg) scale(.6);opacity:0}to{transform:none;opacity:1}}
@keyframes fxdraw{to{stroke-dashoffset:0}}
@keyframes fxfade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes fxw{from{width:0}}
@media (prefers-reduced-motion:reduce){.anim *,.toast,.toast.out,.tok,.tokp,[data-act="bell"].ring svg,.cfm{animation:none!important}.tokp{stroke-dashoffset:0}}
/* หน้าล็อกอิน: รหัสผิด สั่น + สีแดง */
.shake{animation:shake .45s cubic-bezier(.36,.07,.19,.97)}
@keyframes shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-8px)}40%,60%{transform:translateX(8px)}}
input.bad{border-color:var(--off)!important;box-shadow:0 0 0 3px var(--off-soft)!important;background:var(--off-soft)}
#lerr:not(:empty){color:var(--off);font-weight:600;display:flex;align-items:center;gap:6px}
@media (prefers-reduced-motion:reduce){.shake{animation:none}}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('fx patch ok')
