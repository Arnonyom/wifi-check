# ทดสอบตำแหน่ง (Admin tool › ทดสอบ): สแกนตำแหน่งเครื่องนี้แบบเดียวกับตอนลงเวลา แสดงผลอย่างเดียว ไม่บันทึก (prod/p_geotest.js)
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
rep("/* ---------- leave ---------- */",open(S+'prod/p_geotest.js',encoding='utf-8').read()+"/* ---------- leave ---------- */")
rep("    holCard()+lvqCard()+bkCard()+clrCard()+","    holCard()+lvqCard()+bkCard()+geoTestCard()+clrCard()+")
css="""
/* ทดสอบตำแหน่ง */
.gtlist{display:flex;flex-direction:column;gap:10px}
.gtrow{border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.gtrow.gtnew{border-color:var(--brand-strong)}
.gtrow:not(.gtnew){opacity:.75}
.gtres{display:flex;flex-direction:column;gap:6px}.gtplace{font-size:15px}
.gtkv div{padding:4px 0}
.gtres .btn{align-self:flex-start}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('geotest patch ok')
