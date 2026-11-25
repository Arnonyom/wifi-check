# ภาษาอังกฤษ: หุ้มข้อความไทยที่ "แสดงผล" ในโค้ดด้วย _tx('...') หลัง build_prod (ทำกับ dev/index.html)
#   โหมดไทย _tx() คืนข้อความเดิม → พฤติกรรมเหมือนเดิมทุกไบต์ที่ผู้ใช้เห็น
#   ไม่หุ้ม: ข้อความที่ใช้เทียบค่า (=== !== case), คีย์ของ object, อาร์กิวเมนต์ของ notify(...) (เก็บลงฐานข้อมูลเป็นไทยเสมอ)
#   แจ้งเตือน/ข้อความผิดพลาดจากฐานข้อมูล → แปลตอนแสดงผลด้วย _td() (แทนวลีที่รู้จัก)
#   คำแปลอยู่ใน i18n_en.json  ·  ใช้: python3 i18n.py [--list]
import json,re,sys
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
TH=re.compile('[฀-๿]')

def scan(js):
    """คืนรายการ (start,end,quote,text) ของสตริง ' หรือ " ในโค้ด JS ข้ามคอมเมนต์ / template / regex"""
    out=[];i=0;n=len(js);last=''  # last = ตัวอักษรสำคัญล่าสุด (ไม่ใช่ช่องว่าง) ใช้เดาว่า / คือ regex
    while i<n:
        c=js[i]
        if c in ' \t\r\n':i+=1;continue
        if js.startswith('//',i):
            j=js.find('\n',i);i=n if j<0 else j;continue
        if js.startswith('/*',i):
            i=js.index('*/',i+2)+2;continue
        if c in '\'"`':
            j=i+1
            while js[j]!=c:
                if js[j]=='\\':j+=1
                j+=1
            if c!='`':out.append((i,j+1,c,js[i+1:j]))
            i=j+1;last='a';continue
        if c=='/' and (last=='' or last in '(,=:[!&|?{};+-*%<>~^' or re.search(r'\b(return|typeof|case|in|of)\s*$',js[max(0,i-8):i])):
            j=i+1;cls=False
            while True:
                d=js[j]
                if d=='\\':j+=2;continue
                if d=='[':cls=True
                elif d==']':cls=False
                elif d=='/' and not cls:break
                j+=1
            j+=1
            while j<n and js[j].isalpha():j+=1
            i=j;last='a';continue
        last=c;i+=1
    return out

def calls_ranges(js,name):
    """ช่วงตำแหน่งของอาร์กิวเมนต์ในการเรียก name(...)"""
    r=[]
    for m in re.finditer(r'(?<![\w.])'+name+r'\(',js):
        if js[max(0,m.start()-9):m.start()].endswith('function '):continue
        d=0;j=m.end()-1;q=None
        while True:
            c=js[j]
            if q:
                if c=='\\':j+=1
                elif c==q:q=None
            elif c in '\'"`':q=c
            elif c=='(':d+=1
            elif c==')':
                d-=1
                if d==0:break
            j+=1
        r.append((m.end(),j))
    return r

def classify(js,lits):
    keep=[];wrap=[]
    noti=calls_ranges(js,'notify')
    for (a,b,q,t) in lits:
        if not TH.search(t):continue
        before=js[max(0,a-12):a].rstrip();after=js[b:b+6].lstrip()
        why=None
        if re.search(r'(===|!==|==|!=|\bcase)$',before) or re.match(r'(===|!==|==|!=)',after):why='compare'
        elif re.match(r':',after) and re.search(r'[{,]$',before):why='key'
        elif any(x<=a<y for x,y in noti):why='notify'
        (keep if why else wrap).append((a,b,q,t,why))
    return keep,wrap

# ปุ่ม/เมนูภาษา (อยู่นอกส่วนที่ถูกแปล จึงแสดงชื่อภาษาตามจริงเสมอ) · เปลี่ยนแล้วโหลดหน้าใหม่ (ยังล็อกอินอยู่)
LANGJS=r"""function setLang(l){try{localStorage.setItem('wc-lang',l);}catch(e){}location.reload();}
function langBtn(){var en=LANG==='en';return '<button class="iconbtn langbtn" data-act="lang-set" data-l="'+(en?'th':'en')+'" lang="'+(en?'th':'en')+'" aria-label="'+(en?'เปลี่ยนเป็นภาษาไทย':'Switch to English')+'" title="'+(en?'ภาษาไทย':'English')+'">'+(en?'ไทย':'EN')+'</button>';}
function langRow(){return '<p class="small muted">'+(LANG==='en'?'Language · ภาษา':'ภาษา · Language')+'</p><div class="thopts langopts" role="group">'+[['th','ไทย'],['en','English']].map(function(o){var on=LANG===o[0];return '<button class="thopt'+(on?' on':'')+'" data-act="lang-set" data-l="'+o[0]+'" lang="'+o[0]+'" aria-pressed="'+on+'">'+o[1]+'</button>';}).join('')+'</div>';}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-act="lang-set"]');if(b){e.stopPropagation();if(b.getAttribute('data-l')!==LANG)setLang(b.getAttribute('data-l'));}},true);
if(LANG==='en'){var nv=document.getElementById('nav');if(nv)nv.setAttribute('aria-label','Menu');}
"""
CSS=".langopts{grid-template-columns:1fr 1fr}.langbtn{font-weight:700;font-size:13px;width:auto;min-width:40px;padding:0 10px}\n"
def main():
    h=open(S+'index.html',encoding='utf-8').read()
    i=h.index("<script>\n(function(){\n'use strict';\n")+len("<script>\n(function(){\n'use strict';\n")
    j=h.index('</script>',i)
    js=h[i:j]
    def rep(x,y,count=1):
        nonlocal js
        n=js.count(x);assert n==count,(n,x[:90]);js=js.replace(x,y)
    # วันที่ตามภาษา (อังกฤษ = ค.ศ.)
    rep("toLocaleDateString('th-TH',","toLocaleDateString(LANG==='en'?'en-GB':'th-TH',")
    # ข้อความผิดพลาดจากฐานข้อมูล / แจ้งเตือน → แปลตอนแสดงผล (ข้อมูลในฐานข้อมูลยังเป็นไทย)
    rep("  return m;\n}\nasync function adminFn(","  return _td(m);\n}\nasync function adminFn(")
    rep("esc(n.title)+'</b><span class=\"pre\">'+esc(n.body)","esc(_td(n.title))+'</b><span class=\"pre\">'+esc(_td(n.body))")
    rep("toast(n.title,n.body,n.kind,n.id);","toast(_td(n.title),_td(n.body),n.kind,n.id);")
    rep("new Notification(n.title,{body:n.body})","new Notification(_td(n.title),{body:_td(n.body)})")
    # เมนูภาษา: ในหน้าต่างธีม (หลังล็อกอิน) + ปุ่มบนหน้าล็อกอิน
    rep("<span>ใส</span><span>ขุ่น</span></div>':'')+'</div>';","<span>ใส</span><span>ขุ่น</span></div>':'')+langRow()+'</div>';")
    rep("top.innerHTML=brandHtml()+'<div class=\"top-right\">'+themeBtn()+'</div>';","top.innerHTML=brandHtml()+'<div class=\"top-right\">'+langBtn()+themeBtn()+'</div>';")
    lits=scan(js)
    keep,wrap=classify(js,lits)
    D=json.load(open(S+'i18n_en.json',encoding='utf-8'))
    if '--list' in sys.argv:
        seen=set()
        for a,b,q,t,w in wrap:
            if t not in seen:seen.add(t);print('W',json.dumps(t,ensure_ascii=False))
        for a,b,q,t,w in keep:print('K',w,json.dumps(t,ensure_ascii=False))
        return
    # ชนกัน: ข้อความเดียวกันทั้งถูกเทียบค่าและถูกแปล → อาจเทียบไม่ตรงในโหมดอังกฤษ
    cmp_=set(t for a,b,q,t,w in keep if w=='compare');clash=sorted(set(t for a,b,q,t,w in wrap if t in cmp_))
    allowed=set(D.get('__clash_ok__',[]))
    bad=[c for c in clash if c not in allowed]
    assert not bad,('ข้อความที่ทั้งเทียบค่าและแปล ต้องตรวจเอง แล้วใส่ใน __clash_ok__',bad)
    miss=sorted(set(t for a,b,q,t,w in wrap if t not in D))
    assert not miss,('ยังไม่มีคำแปล %d ข้อความ'%len(miss),miss[:20])
    for a,b,q,t,w in sorted(wrap,reverse=True):
        js=js[:a]+'_tx('+js[a:b]+')'+js[b:]
    EN={k:v for k,v in D.items() if not k.startswith('__')}
    frag=D.get('__data__',{})  # แจ้งเตือน/ข้อความผิดพลาดที่มาจากฐานข้อมูล
    head=("var LANG=(function(){try{return localStorage.getItem('wc-lang')==='en'?'en':'th';}catch(e){return 'th';}})();\n"
          "var EN=LANG==='en'?"+json.dumps(EN,ensure_ascii=False)+":{};\n"
          "var EN_D=LANG==='en'?"+json.dumps(frag,ensure_ascii=False)+":{};\n"
          "var EN_DK=Object.keys(EN_D).sort(function(a,b){return b.length-a.length;});\n"
          "function _tx(s){return LANG==='en'&&Object.prototype.hasOwnProperty.call(EN,s)?EN[s]:s;}\n"
          "function _td(s){if(LANG!=='en'||!s)return s;s=String(s);EN_DK.forEach(function(k){if(s.indexOf(k)>=0)s=s.split(k).join(EN_D[k]);});return s;}\n"
          "if(LANG==='en')document.documentElement.lang='en';\n"+LANGJS)
    h=h[:i]+head+js+h[j:]
    assert h.count('</style>')>=1;h=h.replace('</style>',CSS+'</style>',1)
    open(S+'index.html','w',encoding='utf-8').write(h)
    print('i18n ok · แปล %d จุด · คงไทย %d จุด'%(len(wrap),len(keep)))
if __name__=='__main__':main()
