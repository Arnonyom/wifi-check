import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
i=s.index('/* schedule */\nfunction cellHtml')
s=s[:i]+open(S+'prod/p_rota.js',encoding='utf-8').read()+'\n'+s[i:]
rep("  {id:'B2',team:'B',start:'19:00',end:'07:00'}\n];","  {id:'B2',team:'B',start:'19:00',end:'07:00'},\n  {id:'A5',team:'A',start:'19:00',end:'04:00',flex:true}\n];")
rep("  var regular=S.employees.find(function(e){return e.active&&e.role==='staff'&&e.shift===s.id;})||null;\n  var o=S.overrides[d+'|'+s.id];",
    "  var o=S.overrides[d+'|'+s.id];\n  if(s.flex&&!o)return null;\n  var regular=regularOfS(S,d,s);")
rep("""  var e=emp(l.emp),out=[];if(!e||!e.shift)return out;
  var s=shiftById(e.shift);
  for(var d=l.from;d<=l.to;d=addDays(d,1))if(TEAMS[s.team].days.indexOf(dowOf(d))>=0)out.push({d:d,s:s,key:d+'|'+s.id});""",
"""  var e=emp(l.emp),out=[];if(!e||!e.shift)return out;
  for(var d=l.from;d<=l.to;d=addDays(d,1)){var s=shiftById(shiftOn(e,d));if(s&&TEAMS[s.team].days.indexOf(dowOf(d))>=0)out.push({d:d,s:s,key:d+'|'+s.id});}""")
rep("  return SHIFTS.filter(function(s){return s.team===team;}).map(function(s){return '<option value=\"'+s.id+'\"'+(sel===s.id?' selected':'')",
    "  return SHIFTS.filter(function(s){return s.team===team&&!s.flex;}).map(function(s){return '<option value=\"'+s.id+'\"'+(sel===s.id?' selected':'')")
rep("(e.shift?' · กะ '+shiftLabel(shiftById(e.shift)):' · สำรอง')","(e.shift?' · '+shiftTxt(e):' · สำรอง')")
rep("'<span class=\"chip mute tnum\">กะ '+shiftLabel(shiftById(e.shift))+'</span>'","'<span class=\"chip mute tnum\">'+shiftTxt(e)+'</span>'")
rep("(กะ '+shiftLabel(shiftById(me.shift))+')'","('+shiftTxt(me)+')'")
rep("(me.shift?' · กะประจำ '+shiftLabel(shiftById(me.shift)):'')","(me.shift?' · '+shiftTxt(me):'')")
# schedule cells
rep("  if(!sl)return '<div class=\"cell na\">–</div>';\n  var nowT=now(),w=sl.working;",
    "  if(!sl){if(s.flex&&admin&&TEAMS[s.team].days.indexOf(dowOf(d))>=0)return '<button class=\"cell flexc'+(editSlot&&editSlot.d===d&&editSlot.s===s.id?' sel':'')+'\" data-act=\"edit-slot\" data-d=\"'+d+'\" data-s=\"'+s.id+'\" aria-label=\"เรียกเข้ากะฉุกเฉิน '+dayShort(d)+'\"><span class=\"muted small\">เรียกเมื่อฉุกเฉิน</span></button>';return '<div class=\"cell na\">–</div>';}\n  var nowT=now(),w=sl.working;")
rep("  var inner=sl.off\n    ?'<span class=\"pn\">'+esc(fn(sl.regular))+'</span><span class=\"chip off\">หยุด</span>",
    "  var inner=sl.off&&s.flex?'<span class=\"pn\">'+esc(fn(sl.cover))+'</span><span class=\"chip late\">เรียกตัว</span>'+(sl.note?'<span class=\"muted small\">'+esc(sl.note)+'</span>':'')\n    :sl.off&&sl.kind==='flex'&&!sl.cover?'<span class=\"pn\">'+esc(fn(sl.regular))+'</span><span class=\"chip mute\">ย้ายไป 19.00–04.00</span>'\n    :sl.off\n    ?'<span class=\"pn\">'+esc(fn(sl.regular))+'</span><span class=\"chip off\">หยุด</span>")
rep("sl=slot(d,s);\n  var head='<h2>แก้ไขกะ","sl=slot(d,s);\n  if(s.flex)return flexEditor(d,s,sl);\n  var head='<h2>แก้ไขกะ")
rep("<p class=\"muted\">กฎเวลาลงเวลา และนำเข้า/ส่งออกตารางกะ</p></div>'+","<p class=\"muted\">การหมุนกะ กฎเวลาลงเวลา และนำเข้า/ส่งออกตารางกะ</p></div>'+rotaCard()+rotaBCard()+")
rep("    case 'pw-self':","""    case 'flex-save':saveFlex(false);break;
    case 'flex-clear':saveFlex(true);break;
    case 'rota-edit':rotaEdit=true;renderView();break;
    case 'rota-cancel':rotaEdit=false;rotaWeek=null;renderView();break;
    case 'rotab-edit':rotaBEdit=true;renderView();break;
    case 'rotab-cancel':rotaBEdit=false;rotaBStart=null;renderView();break;
    case 'rotab-save':saveRotaB();break;
    case 'rota-save':saveRota(false);break;
    case 'rota-off':saveRota(true);break;
    case 'pw-self':""")
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}\n.cell.flexc{border-style:dashed;align-items:center;justify-content:center;opacity:.85}\n')
import re as _re
s,_n=_re.subn(r"TEAMS\[([^\]]+)\]\.days\.indexOf\(dowOf\(([^()]+)\)\)",r"teamDayIdx(\1,\2)",s)
print('team-day replacements',_n)
rep("  if(team.days.indexOf(dowOf(d))<0)return null","  if(!teamWorksS(S,s.team,d))return null")
rep("var work=T.days.indexOf(dowOf(d))>=0,","var work=teamDayIdx(T.id,d)>=0,")
rep("var cards=T.days.indexOf(dowOf(d))<0","var cards=teamDayIdx(T.id,d)<0")
rep("var off=team.days.indexOf(dowOf(d))<0;","var off=teamDayIdx(team.id,d)<0;")
rep("return team.days.indexOf(dowOf(d))>=0;});","return teamDayIdx(team.id,d)>=0;});")
rep("+team.dayText+","+teamDayText(team.id)+")
rep("' ('+TEAMS[me.team].dayText+')'","' ('+teamDayText(me.team)+')'")
open(S+'app_src.html','w',encoding='utf-8').write(s);print('rota patch ok')
