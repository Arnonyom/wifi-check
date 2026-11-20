# หน้าพนักงาน: เอาเบอร์โทรออก (ไม่แสดงในการ์ด และไม่มีช่องกรอกในฟอร์ม)
# ค่าเดิมในฐานข้อมูลไม่ถูกลบ (p_emp.js ส่งค่าเดิมกลับไปตอนบันทึก)
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
rep("""    '<div><label for="fPhone">เบอร์โทร</label><input id="fPhone" inputmode="tel" value="'+esc(c.phone)+'"></div>'+\n""","")
rep("""esc(e.username)+(e.phone?' · '+esc(e.phone):'')+'</span>""","""esc(e.username)+'</span>""")
open(S+'app_src.html','w',encoding='utf-8').write(s);print('nophone patch ok')
