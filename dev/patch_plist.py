# หน้าพนักงาน (ผู้ดูแล): การ์ดพนักงาน → รายชื่อในการ์ดของแต่ละทีม · กดชื่อแล้วขยายเห็นปุ่ม แก้ไข/รีเซ็ตรหัสผ่าน/ลบ
# (แก้บั๊กป้ายกะว่างด้วย: ไม่แสดงป้ายถ้าไม่มีข้อความกะ)
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)

# แทนฟังก์ชัน pcard ทั้งก้อน
i=s.index('function pcard(e){');j=s.index('\n}\n',i)+3
assert 'data-drag' in s[i:j] and s.count('function pcard(e){')==1
s=s[:i]+open(S+'prod/p_plist.js',encoding='utf-8').read()+s[j:]
# แต่ละทีมเป็นการ์ดเดียว
rep("""    return '<section class="stack" style="gap:8px"><h2>'+g[1]+' <span class="muted small">'+list.length+' คน</span></h2>'+
      (list.length?'<div class="pgrid" data-grp="'+g[0]+'">'+byOrder(list).map(pcard).join('')+'</div>'""",
    """    return '<section class="card pteam"><h2>'+g[1]+' <span class="muted small">'+list.length+' คน</span></h2>'+
      (list.length?'<div class="pgrid plist" data-grp="'+g[0]+'">'+byOrder(list).map(pcard).join('')+'</div>'""")
rep('ลากที่ปุ่มจุด ⠿ มุมการ์ดเพื่อสลับตำแหน่ง (ย้ายได้ในกลุ่มเดียวกัน)',
    'กดที่ชื่อเพื่อแก้ไข รีเซ็ตรหัสผ่าน หรือลบ · ลากที่ปุ่มจุด ⠿ เพื่อสลับตำแหน่ง (ย้ายได้ในกลุ่มเดียวกัน)')
css="""
/* หน้าพนักงาน: รายชื่อในการ์ดทีม */
.pteam{padding:14px 14px 8px;max-width:760px}
.pteam h2{margin:0 0 6px}
.plist{display:flex;flex-direction:column;gap:0}
.plist .prow{display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;gap:2px;padding:0;border-bottom:1px solid var(--line);border-radius:10px;background:transparent}
.plist .prow:last-child{border-bottom:0}
.prhd{flex:1;min-width:0;display:flex;align-items:center;gap:10px;padding:9px 6px;cursor:pointer;border-radius:10px}
.prhd:hover{background:var(--surface-2)}
.prhd:focus-visible{outline:2px solid var(--brand);outline-offset:1px}
.prnm{min-width:0;display:flex;flex-direction:column}
.prnm b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prflag{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.prflag .chip{font-size:12px;padding:2px 8px}
.prhd .pmchev{color:var(--muted);transition:transform .15s}
.plist .prow.open{background:var(--surface-2);border-color:transparent;margin:4px 0}
.prow.open .pmchev{transform:rotate(90deg)}
.plist .prow .dragh{margin:0}
.prx{flex-basis:100%;display:flex;flex-direction:column;gap:10px;padding:2px 10px 12px 50px;animation:pmin .15s ease-out}
.plist .prow.dragging{background:var(--surface);border:1px solid var(--line)}
.plist .pcard-ph{border-radius:10px;margin:2px 0}
@media (max-width:480px){.prx{padding-left:10px}}
@media (prefers-reduced-motion:reduce){.prx{animation:none}.prhd .pmchev{transition:none}}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('plist patch ok')
