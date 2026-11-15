
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
i=s.index('/* schedule */\nfunction cellHtml')
s=s[:i]+open(S+'prod/p_ops.js',encoding='utf-8').read()+'\n'+s[i:]
rep("  if(s.flex)return flexEditor(d,s,sl);\n  var head='<h2>แก้ไขกะ","  if(s.flex)return flexEditor(d,s,sl);\n  return slotEditor2(d,s,sl);\n  var head='<h2>แก้ไขกะ")
rep("    case 'theme':toggleTheme();break;","""    case 'theme':themeOpen=!themeOpen;renderChrome();break;
    case 'theme-set':themeOpen=false;setTheme(D.t);break;
    case 'save-days':saveDays();break;
    case 'save-att':saveAtt(false);break;
    case 'del-att':saveAtt(true);break;
    case 'go-edit':view='schedule';resetUi();schedAnchor=D.d;schedTeam=D.t;editSlot={d:D.d,s:D.s};renderAll();setTimeout(function(){var ed=$('slotEd');if(ed&&ed.scrollIntoView)ed.scrollIntoView({block:'start',behavior:'smooth'});},50);break;""")
rep("  if(bellOpen&&!e.target.closest('.bellwrap')){bellOpen=false;renderChrome();}","  if(bellOpen&&!e.target.closest('.bellwrap')){bellOpen=false;renderChrome();}\n  if(themeOpen&&!e.target.closest('.thwrap')){themeOpen=false;renderChrome();}")
rep("""function themeBtn(){return '<button class="iconbtn" data-act="theme" aria-label="สลับโหมดสว่าง/มืด" title="สลับโหมดสว่าง/มืด">'+ico(effDark()?ICONS.sun:ICONS.moon)+'</button>';}""",
    """function themeBtn(){return '<div class="thwrap"><button class="iconbtn" data-act="theme" aria-label="ธีมหน้าจอ" title="ธีมหน้าจอ" aria-expanded="'+themeOpen+'">'+ico(curTheme()==='dark'?ICONS.moon:ICONS.sun)+'</button>'+(themeOpen?themePanel():'')+'</div>';}""")
rep("    case 'jump':schedAnchor=val;break;","    case 'jump':schedAnchor=val;break;\n    case 'edTo':if(editSlot)editSlot.to=val;break;")
rep("    :sl.off\n    ?'<span class=\"pn\">'+esc(fn(sl.regular))+'</span><span class=\"chip off\">หยุด</span>",
    "    :sl.off&&sl.kind==='swap'?'<span class=\"pn\">'+esc(fn(sl.cover))+'</span><span class=\"chip\">สลับกะ</span><span class=\"muted small\">แทน '+esc(fn(sl.regular))+'</span>'\n    :sl.off\n    ?'<span class=\"pn\">'+esc(fn(sl.regular))+'</span><span class=\"chip off\">หยุด</span>")
s=s.replace("+chipsFor(rec);\n  }else if(w&&nowT>","+chipsFor(rec)+(rec.byAdmin?'<span class=\"chip mute\">ผู้ดูแลลงให้</span>':'');\n  }else if(w&&nowT>",1)
assert "ผู้ดูแลลงให้</span>':'');" in s
css="""
/* admin editor */
.fgbar{height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden;display:flex;min-width:60px;flex:1}
.fgbar i{display:block;height:100%}
.fgbar .a{background:var(--st-warn)}.fgbar .m{background:var(--st-bad)}
.fgrow{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(60px,2fr) minmax(0,15em);gap:12px;align-items:center}
@media (max-width:720px){.fgrow{grid-template-columns:1fr;gap:6px}.fgrow .row{justify-content:flex-start!important}}
.edmodes{gap:8px;flex-wrap:wrap}
.radchip{display:inline-flex;align-items:center;gap:6px;margin:0;padding:8px 12px;border:1px solid var(--line);border-radius:999px;cursor:pointer;background:var(--surface)}
.radchip.on{border-color:var(--brand-strong);background:var(--brand-soft);font-weight:600}
.radchip input{accent-color:var(--brand-strong)}
/* theme picker */
.thwrap{position:relative}
.thpop{width:min(300px,calc(100vw - 32px));padding:14px;display:flex;flex-direction:column;gap:10px}
.thopts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.thopt{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;border:1px solid var(--line);border-radius:12px;background:var(--surface);cursor:pointer;font-size:13px}
.thopt.on{border-color:var(--brand-strong);box-shadow:0 0 0 2px var(--brand-strong) inset;font-weight:600}
.thsw{width:36px;height:24px;border-radius:8px;border:1px solid rgba(0,0,0,.12);display:block}
.thsw-light{background:#F3F8EE}.thsw-dark{background:#0C1710}
.thsw-glass{background:linear-gradient(135deg,#a8e063 0%,#56c2b5 45%,#8e8cf0 100%);box-shadow:inset 0 0 0 3px rgba(255,255,255,.55)}
#glassRange{width:100%;accent-color:var(--brand-strong)}
/* liquid glass */
:root[data-theme="glass"]{
  --bg:transparent;
  --surface:rgba(255,255,255,var(--ga,.5));
  --surface-2:rgba(255,255,255,calc(var(--ga,.5) * .6));
  --ink:#0D2315; --muted:#38533F; --line:rgba(255,255,255,.7);
  --brand:#7AC143; --brand-strong:#1F6A0E; --on-strong:#FFFFFF; --brand-soft:rgba(122,193,67,.28); --on-brand:#0D2315;
  --late:#5E3A00; --late-soft:rgba(255,226,150,.6); --amber:#D99A00; --off:#8E241D; --off-soft:rgba(255,205,198,.6); --hatch:rgba(255,255,255,.3);
  --scrim:rgba(8,28,18,.35);
  --shadow:0 10px 30px rgba(16,60,36,.16),inset 0 1px 0 rgba(255,255,255,.75);
  --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --grid:rgba(255,255,255,.55); --axis:rgba(30,70,45,.35);
  color-scheme:light;
}
:root[data-theme="glass"] body{background:#d6eedd;background-image:radial-gradient(60vw 50vw at 8% 10%,rgba(141,214,90,.85),transparent 60%),radial-gradient(55vw 45vw at 92% 18%,rgba(72,190,180,.75),transparent 60%),radial-gradient(60vw 55vw at 75% 95%,rgba(140,130,240,.6),transparent 60%),radial-gradient(50vw 45vw at 15% 90%,rgba(255,206,120,.55),transparent 60%);background-attachment:fixed}
:root[data-theme="glass"] body::before{background:transparent}
:root[data-theme="glass"] .card,:root[data-theme="glass"] .modal,:root[data-theme="glass"] .iconbtn,:root[data-theme="glass"] .tab,:root[data-theme="glass"] .pop,:root[data-theme="glass"] .toast,:root[data-theme="glass"] .seg,:root[data-theme="glass"] .cell,:root[data-theme="glass"] .thopt,:root[data-theme="glass"] .radchip,:root[data-theme="glass"] input,:root[data-theme="glass"] select,:root[data-theme="glass"] textarea,:root[data-theme="glass"] .btn.sec{-webkit-backdrop-filter:blur(var(--gb,18px)) saturate(170%);backdrop-filter:blur(var(--gb,18px)) saturate(170%)}
:root[data-theme="glass"] .card,:root[data-theme="glass"] .modal,:root[data-theme="glass"] .pop{box-shadow:var(--shadow)}
:root[data-theme="glass"] .modal,:root[data-theme="glass"] .pop,:root[data-theme="glass"] .toast{background:linear-gradient(140deg,rgba(255,255,255,calc(var(--gp,.6) + .1)) 0%,rgba(255,255,255,var(--gp,.6)) 55%,rgba(255,255,255,calc(var(--gp,.6) * .85)) 100%);-webkit-backdrop-filter:blur(calc(var(--gb,18px) + 14px)) saturate(185%);backdrop-filter:blur(calc(var(--gb,18px) + 14px)) saturate(185%);border:1px solid rgba(255,255,255,.8);box-shadow:0 24px 60px rgba(16,60,36,.22),inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(255,255,255,.35)}
:root[data-theme="glass"] .toast{border-left:4px solid var(--brand-strong)}
:root[data-theme="glass"] .overlay{background:rgba(18,48,32,.16)}
:root[data-theme="glass"] .dhd{background:rgba(255,255,255,calc(var(--gp,.6) * .6 + .35))}
:root[data-theme="glass"] .topbar{background:rgba(255,255,255,calc(var(--ga,.5) * .5 + .4));margin-inline:calc(-1 * max(16px,env(safe-area-inset-left,0px)));padding-inline:max(16px,env(safe-area-inset-left,0px))}
:root[data-theme="glass"] input,:root[data-theme="glass"] select,:root[data-theme="glass"] textarea{background:rgba(255,255,255,calc(var(--ga,.5) * .8 + .15))}
@media (max-width:720px){:root[data-theme="glass"] .tabs{background:rgba(255,255,255,calc(var(--ga,.5) * .7 + .1));-webkit-backdrop-filter:blur(var(--gb,18px)) saturate(170%);backdrop-filter:blur(var(--gb,18px)) saturate(170%)}}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)

# ---- report: admin-recorded remarks + who forgets most ----
rep("+(r.rec&&r.rec.out?((r.rec.out-r.rec.in)/3600000).toFixed(1):'—')+'</td><td>'+kChip(r)+'</td></tr>';",
    "+(r.rec&&r.rec.out?((r.rec.out-r.rec.in)/3600000).toFixed(1):'—')+'</td><td>'+kChip(r)+adminRemark(r.rec)+'</td></tr>';")
rep("<div><b>'+missN+'</b><span class=\"muted small\">ไม่ครบ/ไม่มีบันทึก</span></div>",
    "<div><b>'+missN+'</b><span class=\"muted small\">ไม่ครบ/ไม่มีบันทึก</span></div><div><b>'+cntFin.filter(function(r){return r.rec.byAdmin;}).length+'</b><span class=\"muted small\">ผู้ดูแลลงเวลาให้</span></div>")
rep("    '<section class=\"card\"><h3>ใครหยุด ใครทำแทน</h3>","    forgotCard(rows)+\n    '<section class=\"card\"><h3>ใครหยุด ใครทำแทน</h3>")
rep("'worker_name','check_in','check_out','hours','late_minutes','early_minutes','status']];","'worker_name','check_in','check_out','hours','late_minutes','early_minutes','status','admin_recorded','admin_note']];")
rep("a&&a.lateFlag?a.late:0,a&&a.earlyFlag?a.early:0,statusText(r)]);","a&&a.lateFlag?a.late:0,a&&a.earlyFlag?a.early:0,statusText(r),a&&a.byAdmin?'ผู้ดูแลลงให้ ('+fn(emp(a.byAdmin))+')':'',a&&a.byAdmin?a.adminNote:'']);")
open(S+'app_src.html','w',encoding='utf-8').write(s);print('ops patch ok')
