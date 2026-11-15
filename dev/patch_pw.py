import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:90]);s=s.replace(a,b)
i=s.index('/* schedule */\nfunction cellHtml')
s=s[:i]+open(S+'prod/p_pw.js',encoding='utf-8').read()+'\n'+s[i:]
rep('<div id="detbox"></div>','<div id="detbox"></div><div id="pwbox"></div>')
rep('renderDet();renderDp();}','renderDet();renderPw();renderDp();}')
rep("  if(!me){renderLogin();return;}\n","  if(!me){renderLogin();return;}\n  if(me.mustChange){if(!$('forceForm')){$('main').innerHTML=viewForcePw();pwLive();}return;}\n")
rep("  nav.hidden=false;","  nav.hidden=!!me.mustChange;")
rep("'<button class=\"iconbtn\" data-act=\"logout\"","(me.mustChange?'':'<button class=\"iconbtn\" data-act=\"pw-self\" aria-label=\"เปลี่ยนรหัสผ่าน\" title=\"เปลี่ยนรหัสผ่าน\">'+ico('<circle cx=\"8\" cy=\"15\" r=\"4\"/><path d=\"M10.8 12.2 20 3M17 6l3 3M14.5 8.5l2.5 2.5\"/>')+'</button>')+'<button class=\"iconbtn\" data-act=\"logout\"")
rep("    case 'dash':dashDays=Number(D.n);renderView();break;","""    case 'dash':dashDays=Number(D.n);renderView();break;
    case 'pw-self':pwm={mode:'self'};renderPw();break;
    case 'pw-reset':pwm={mode:'reset',id:D.id};renderPw();break;
    case 'pw-close':pwm=null;renderPw();break;
    case 'pw-bg':if(e.target===el){pwm=null;renderPw();}break;
    case 'pw-eye':var pi2=$(D.id);if(pi2){pi2.type=pi2.type==='password'?'text':'password';el.setAttribute('aria-label',pi2.type==='password'?'แสดงรหัสผ่าน':'ซ่อนรหัสผ่าน');}break;""")
rep("  if(dp){dp=null;renderDp();}\n  else if(det.length)","  if(dp){dp=null;renderDp();}\n  else if(pwm){pwm=null;renderPw();}\n  else if(det.length)")
# people card buttons
rep(":'<button class=\"btn sec sm\" data-act=\"edit-emp\" data-id=\"'+e.id+'\">แก้ไข</button>'+(e.id===me.id?'':'<button class=\"btn sec sm\" data-act=\"del-emp\" data-id=\"'+e.id+'\">ลบ</button>');",
    ":'<button class=\"btn sec sm\" data-act=\"edit-emp\" data-id=\"'+e.id+'\">แก้ไข</button>'+(e.id===me.id?'<button class=\"btn sec sm\" data-act=\"pw-self\">เปลี่ยนรหัสผ่าน</button>':'<button class=\"btn sec sm\" data-act=\"pw-reset\" data-id=\"'+e.id+'\">รีเซ็ตรหัสผ่าน</button><button class=\"btn sec sm\" data-act=\"del-emp\" data-id=\"'+e.id+'\">ลบ</button>');")
rep("  var chips='<span class=\"chip '+(e.active?'':'mute')+'\">'+(e.active?'ใช้งาน':'ปิดใช้งาน')+'</span>';",
    "  var chips='<span class=\"chip '+(e.active?'':'mute')+'\">'+(e.active?'ใช้งาน':'ปิดใช้งาน')+'</span>'+(e.mustChange?'<span class=\"chip late\">รอตั้งรหัสใหม่</span>':'');")
# employee form password fields
rep("""    '<div><label for="fPin">รหัสผ่าน 6 หลัก'+(isNew?'':' (เว้นว่างถ้าไม่เปลี่ยน)')+'</label><input id="fPin" inputmode="numeric" maxlength="6" placeholder="เช่น 482915"></div>'+""",
    """    (isNew?'<div><label for="fPin">รหัสผ่านเริ่มต้น (ชั่วคราว)</label><div class="pwrow"><input id="fPin" type="password" maxlength="72" autocomplete="new-password" autocapitalize="none" spellcheck="false"><button type="button" class="iconbtn pweye" data-act="pw-eye" data-id="fPin" aria-label="แสดงรหัสผ่าน">👁</button></div></div><div><label for="fPin2">ยืนยันรหัสผ่านเริ่มต้น</label><div class="pwrow"><input id="fPin2" type="password" maxlength="72" autocomplete="new-password" autocapitalize="none" spellcheck="false"><button type="button" class="iconbtn pweye" data-act="pw-eye" data-id="fPin2" aria-label="แสดงรหัสผ่าน">👁</button></div></div>':'')+""")
rep("""    '<p class="muted small" id="fOpsHint\"""","""    (isNew?'<p class="muted small">'+PW_RULE+' · ผู้ใช้จะต้องตั้งรหัสใหม่ของตัวเองเมื่อล็อกอินครั้งแรก</p>':'<p class="muted small">เปลี่ยนรหัสผ่านของพนักงานคนนี้ ใช้ปุ่ม "รีเซ็ตรหัสผ่าน" ในการ์ดพนักงาน</p>')+
    '<p class="muted small" id="fOpsHint\"""")
rep("ผู้ดูแลสร้างและแก้ไขโปรไฟล์ รหัสผ่านที่ตั้งที่นี่ใช้ล็อกอินได้ทันที","ผู้ดูแลสร้างและแก้ไขโปรไฟล์ · รหัสผ่านที่ผู้ดูแลตั้งเป็นรหัสชั่วคราว ผู้ใช้ต้องตั้งรหัสใหม่เองเมื่อล็อกอินครั้งแรก")
css='''
/* password */
.pwrow{display:flex;gap:6px;align-items:center}
.pwrow input{flex:1;min-width:0}
.pweye{width:44px;height:44px;font-size:16px}
.pwchk{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:13px;color:var(--muted)}
.pwchk li::before{content:'○ ';}
.pwchk li.on{color:var(--brand-strong)}
.pwchk li.on::before{content:'✓ ';font-weight:700}
.pwbar{height:4px;border-radius:2px;background:var(--line);overflow:hidden}
.pwbar i{display:block;height:100%;width:0;background:var(--st-bad);transition:width .2s}
.pwbar i.s2{background:var(--st-warn)}.pwbar i.s3,.pwbar i.s4,.pwbar i.s5{background:var(--st-good)}
#pwbox .overlay{z-index:46}
#pwForm{gap:10px}
'''
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('pw patch ok')
