# ตำแหน่งตอนเข้า/ออกงาน (prod/p_geo.js) · หน้าต่างยืนยันแสดงตำแหน่ง · หน้าลงเวลาแสดงตำแหน่งกะล่าสุด · รายละเอียดกะ (ผู้ดูแล) แสดงตำแหน่ง + ลิงก์แผนที่
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
rep("function openModal(type){",open(S+'prod/p_geo.js',encoding='utf-8').read()+"function openModal(type){")
rep("  renderModal();\n  var b=document.querySelector('#modal [data-act=\"modal-ok\"]');if(b)b.focus();\n}",
    "  geoStart();\n  renderModal();\n  var b=document.querySelector('#modal [data-act=\"modal-ok\"]');if(b)b.focus();\n}")
rep("      '<div><dt>สถานะ</dt><dd id=\"mStatus\">'+dyn.chip+'</dd></div>'+\n    '</dl>'+",
    "      '<div><dt>สถานะ</dt><dd id=\"mStatus\">'+dyn.chip+'</dd></div>'+\n      '<div><dt>ตำแหน่ง</dt><dd id=\"mLoc\" aria-live=\"polite\">'+geoModalHtml()+'</dd></div>'+\n    '</dl>'+")
rep("'<p class=\"muted small\">ระบบบันทึกเวลาตอนที่กดยืนยัน</p>'","'<p class=\"muted small\">ระบบบันทึกเวลาและตำแหน่งตอนที่กดยืนยัน · ตำแหน่งเห็นได้เฉพาะคุณและผู้ดูแล</p>'")
rep("'<span><small>เข้างาน</small><b class=\"tnum\">'+fmtHM(io.in)+'</b></span><span><small>ออกงาน</small><b class=\"tnum\">'+(io.out?fmtHM(io.out):'—')+'</b></span></div>':'';",
    "'<span><small>เข้างาน</small><b class=\"tnum\">'+fmtHM(io.in)+'</b></span><span><small>ออกงาน</small><b class=\"tnum\">'+(io.out?fmtHM(io.out):'—')+'</b></span></div>'+homeLoc(io):'';")
rep("      if(a.out)kvh+='<div><dt>ชั่วโมงทำงาน</dt>","      kvh+=locRows(a);\n      if(a.out)kvh+='<div><dt>ชั่วโมงทำงาน</dt>")
css="""
/* ตำแหน่งตอนเข้า/ออกงาน */
.ioloc{margin:6px auto 0;max-width:100%;color:var(--muted);text-align:center;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ioloc .chip{font-size:12px;padding:1px 8px}
.ioloc b{font-weight:600;color:var(--ink)}
.maplink{white-space:nowrap;font-size:13px;color:var(--brand-strong);font-weight:600}
.locp{word-break:keep-all;overflow-wrap:break-word}
#mLoc{max-width:65%}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('geo patch ok')
