import re
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src_before_detail.html',encoding='utf-8').read()
P=lambda n:open(S+'prod/'+n,encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a)
    assert n==count,(n,a[:80])
    s=s.replace(a,b)

# ---- chart helpers: clickable marks ----
rep("tipA(sd(r.d),r.vals.map(function(v,j){return [series[j].name,String(v),series[j].v];}))+'/>';",
    "tipA(sd(r.d),r.vals.map(function(v,j){return [series[j].name,String(v),series[j].v];}))+(r.k?dk(r.k):'')+'/>';")
rep("tipA(p.t,[['ตรงเวลา',p.v+unit,'var(--s1)'],['จำนวนกะ',String(p.n)]])+'/>';",
    "tipA(p.t,[['ตรงเวลา',p.v+unit,'var(--s1)'],['จำนวนกะ',String(p.n)]])+(p.k?dk(p.k):'')+'/>';")
rep("tipA(it.label,it.tip)+'/>';","tipA(it.label,it.tip)+(it.k?dk(it.k):'')+'/>';",2)
rep("tipA(it.tipT||it.label,it.tip)+'/>';","tipA(it.tipT||it.label,it.tip)+(it.k?dk(it.k):'')+'/>';")
rep("['สัดส่วน',Math.round(100*it.v/tot)+'%']])+'/>';","['สัดส่วน',Math.round(100*it.v/tot)+'%']])+(it.k?dk(it.k):'')+'/>';")
rep("[['สถานะ',DSTATE[o.st][0]]])+'/>';","[['สถานะ',DSTATE[o.st][0]]])+(o.k?dk(o.k):'')+'/>';")
# table rows + chart card expand button
rep("function tbl(head,rows){return '<table><thead><tr>'+head.map(function(h){return '<th>'+esc(h)+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+",
    "function tbl(head,rows,keys){return '<table><thead><tr>'+head.map(function(h){return '<th>'+esc(h)+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r,i){return '<tr'+(keys&&keys[i]?dk(keys[i]):'')+'>'+")
rep("function chartCard(title,sub,body,legend,table,span2){\n  return '<section class=\"card chartcard'+(span2?' span2':'')+'\"><h3>'+title+'</h3>'",
    "function chartCard(title,sub,body,legend,table,span2,key){\n  return '<section class=\"card chartcard'+(span2?' span2':'')+'\"><div class=\"cardh\"><h3>'+title+'</h3>'+(key?'<button class=\"btn sec sm xbtn\"'+dk('card:'+key)+' aria-label=\"ขยายกราฟ '+esc(title)+'\">⤢ ขยาย</button>':'')+'</div>'")
# live board cards
rep("cards.push('<article class=\"card pcard\">","cards.push('<article class=\"card pcard\"'+dk('slot:'+d+'|'+s.id)+'>")
# new viewDash + detail module
i=s.index('function viewDash(){');j=s.index('/* schedule */',i)
s=s[:i]+P('p_dcal.js')+'\n'+P('p_viewdash.js')+'\n'+P('p_detail.js')+'\n'+s[j:]
# container + render
rep("    case 'jump':schedAnchor=val;break;","    case 'jump':schedAnchor=val;break;\n    case 'dcJump':dcAnchor=val>bkk(now()).date?bkk(now()).date:val;break;")
rep("var PAIRS={","var PAIRS={dcFrom:['dcFrom','dcTo'],dcTo:['dcFrom','dcTo'],")
rep("function dayStatus(d,idx,t){\n","function dayStatus(d,idx,t){\n  if(d<dataStart())return {d:d,rows:[],bad:0,warn:0,ok:0,state:'nodata'};\n")
rep("none:['ไม่มีกะ','']};","none:['ไม่มีกะ',''],nodata:['ไม่มีข้อมูล (ก่อนเริ่มใช้ระบบ)','']};")
rep('<div id="modal"></div>','<div id="modal"></div><div id="detbox"></div>')
rep('function renderAll(){renderChrome();renderView();renderModal();renderDp();}','function renderAll(){renderChrome();renderView();renderModal();renderDet();renderDp();}')
# resetUi clears drill-down
rep("rep.calSel='';dp=null;}","rep.calSel='';dp=null;det=[];}")
# events
rep("    case 'dash':dashDays=Number(D.n);renderView();break;",
"""    case 'dash':dashDays=Number(D.n);renderView();break;
    case 'det':openDet(D.k);break;
    case 'dc-mode':dcMode=D.m;renderView();break;
    case 'dc-nav':dcNav(D.n);renderView();break;
    case 'dc-day':dcAnchor=D.d;renderView();break;
    case 'dc-month':dcMode='month';dcAnchor=D.m+'-01';renderView();break;
    case 'dc-preset':var tq=bkk(now()).date,pq=Number(D.i);
      if(pq===0){dv.dcFrom=addDays(tq,-6);dv.dcTo=tq;}else if(pq===1){dv.dcFrom=addDays(tq,-29);dv.dcTo=tq;}
      else if(pq===2){dv.dcFrom=mondayOf(tq);dv.dcTo=addDays(mondayOf(tq),6);}else if(pq===3){dv.dcFrom=tq.slice(0,7)+'-01';dv.dcTo=addDays(addMonth(tq.slice(0,7),1)+'-01',-1);}
      else{var lm=addMonth(tq.slice(0,7),-1);dv.dcFrom=lm+'-01';dv.dcTo=addDays(tq.slice(0,7)+'-01',-1);}
      renderView();break;
    case 'det-back':closeDet(false);break;
    case 'det-close':closeDet(true);break;
    case 'det-bg':if(e.target===el)closeDet(true);break;
    case 'go-leave':view='leaves';resetUi();lvFilter='pending';lvOpen=D.id;renderAll();window.scrollTo(0,0);break;
    case 'go-sched':view='schedule';resetUi();schedAnchor=D.d;schedTeam=D.t;renderAll();window.scrollTo(0,0);break;""")
rep("  if(e.key!=='Escape')return;\n  if(dp){dp=null;renderDp();}",
"""  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-act="det"]:not(button)')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
  if(e.key!=='Escape')return;
  if(dp){dp=null;renderDp();}
  else if(det.length){closeDet(false);}""")
rep("if(me&&view==='today'&&!dp&&!modal)renderView();},250);","if(me&&view==='today'&&!dp&&!modal){renderView();renderDet();}},250);")
# CSS
css='''
/* drill-down */
.cardh{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.xbtn{flex:none;min-height:32px;padding:4px 10px}
button.kpi{font:inherit;color:inherit;text-align:left;cursor:pointer;position:relative}
.kpi.go::after{content:'›';position:absolute;right:12px;top:8px;color:var(--muted);font-size:20px;line-height:1}
.kpi.go:hover,.pcard[data-act]:hover{border-color:var(--brand-strong)}
.pcard[data-act]{cursor:pointer}
.hit[data-act]{cursor:pointer}
.chart [data-act]:not(.hit){cursor:pointer}
tr[data-act]{cursor:pointer}
tr[data-act]:hover td{background:var(--surface-2)}
.lib{width:100%;background:none;border:0;border-bottom:1px solid var(--line);font:inherit;color:inherit;text-align:left;cursor:pointer;padding:10px 6px;border-radius:0}
.lib:hover{background:var(--surface-2)}
.lib .go{color:var(--muted);font-size:20px;line-height:1;flex:none}
[data-act="det"]:focus-visible{outline:2px solid var(--brand-strong);outline-offset:2px}
#detbox .overlay{z-index:45}
.detm{width:min(860px,100%);gap:10px}
.detm:focus{outline:none}
.dhd{display:flex;align-items:flex-start;gap:10px;position:sticky;top:-20px;margin-top:-20px;padding-top:20px;padding-bottom:8px;background:var(--surface);z-index:2;border-bottom:1px solid var(--line)}
.dhd h2{margin:0}
.dbody{display:flex;flex-direction:column;gap:12px;min-width:0}
.dbody h3{margin:6px 0 0}
.dft{gap:8px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:12px}
.hint{margin:0}
.lib>.grow{flex:1 1 200px}
.lib>.row{flex:0 1 auto;flex-wrap:wrap}
.dcard .seg button{white-space:nowrap;padding:8px 12px}
.calnav .btn{white-space:nowrap}
@media (max-width:720px){.calnav{flex-wrap:wrap}.calnav .dfield{flex:1 1 160px}.lib>.row{justify-content:flex-start!important}}
.dc.nodata,.ym.nodata,.sb.nodata{background:repeating-linear-gradient(135deg,var(--hatch) 0 4px,var(--surface-2) 4px 8px);color:var(--muted)}
.cd.nodata{background:var(--surface-2);color:var(--muted)}
.dsum i.nd{background:repeating-linear-gradient(135deg,var(--axis) 0 2px,var(--surface-2) 2px 4px)}
.dcx{min-height:0}
.smat{min-width:820px}
.smat td{padding:4px}
.sb{display:flex;flex-direction:column;align-items:flex-start;gap:1px;width:100%;min-height:58px;border:0;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px;line-height:1.3;text-align:left;min-width:0}
.sb b{font-family:var(--font-display);font-weight:600;font-size:14px}
.sb small{font-size:12px;opacity:.9}
button.sb{cursor:pointer}
button.sb:hover{box-shadow:inset 0 0 0 2px var(--ink)}
.sb.ok{background:var(--st-good);color:#fff}.sb.warn{background:var(--st-warn);color:#2b2100}.sb.bad{background:var(--st-bad);color:#fff}
.sb.open{background:var(--grid);color:var(--ink)}.sb.future,.sb.none{background:var(--surface-2);color:var(--muted)}
.sb.na{background:repeating-linear-gradient(135deg,var(--hatch) 0 6px,transparent 6px 12px);color:var(--muted);align-items:center;justify-content:center}
.dchip.dst{position:relative}
.dchip.dst i{font-style:normal;font-weight:700;font-size:12px;line-height:1}
.dchip.dst.ok i{color:var(--st-good)}.dchip.dst.warn i{color:#b07800}.dchip.dst.bad i{color:var(--st-bad)}
.dchip.dst.on i{color:inherit}
.dchip:disabled{opacity:.4;cursor:not-allowed}
.dban{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;border-radius:12px;padding:12px 14px;font-size:15px}
.dban.ok{background:var(--st-good);color:#fff}.dban.warn{background:var(--st-warn);color:#2b2100}.dban.bad{background:var(--st-bad);color:#fff}
.dban.open,.dban.future,.dban.none,.dban.nodata{background:var(--surface-2);color:var(--muted)}
.dcard .ygrid{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}
.mhead{display:flex;justify-content:space-between;align-items:center;gap:6px;border:0;background:none;font:inherit;color:inherit;padding:0;cursor:pointer;text-align:left}
.mhead:hover b{text-decoration:underline}
.yd{display:inline-block;width:8px;height:8px;border-radius:2px;margin:0 2px 0 4px}
.yd.ok{background:var(--st-good)}.yd.warn{background:var(--st-warn)}.yd.bad{background:var(--st-bad)}
.ym{border:0;border-radius:4px;font:inherit;font-size:11px;line-height:1;padding:4px 0;text-align:center;font-variant-numeric:tabular-nums;min-width:0}
button.ym{cursor:pointer}
button.ym:hover{box-shadow:inset 0 0 0 2px var(--ink)}
.ym.ok{background:var(--st-good);color:#fff}.ym.warn{background:var(--st-warn);color:#2b2100}.ym.bad{background:var(--st-bad);color:#fff}
.ym.open{background:var(--grid)}.ym.future,.ym.none{background:transparent;color:var(--muted)}
.ym.tod{box-shadow:inset 0 0 0 2px var(--brand-strong)}
.calnav{gap:6px;flex-wrap:nowrap}
.calnav select{width:auto;min-height:36px;padding:4px 8px}
.calnav .btn{min-height:36px}
.dsums{gap:6px;flex-wrap:wrap}
.dsum{display:inline-flex;align-items:center;gap:6px;border:0;font:inherit;font-size:13px;cursor:pointer;background:var(--surface-2);color:var(--ink)}
.dsum i{width:12px;height:12px;border-radius:3px;display:inline-block}
.dsum.ok i{background:var(--st-good)} .dsum.warn i{background:var(--st-warn)} .dsum.bad i{background:var(--st-bad)} .dsum i.op{background:var(--grid)}
span.dsum{cursor:default}
.dcal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
.dcal.hd span{text-align:center;color:var(--muted);font-size:13px}
.dc{min-height:72px;border:0;border-radius:10px;padding:6px 8px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;font:inherit;font-variant-numeric:tabular-nums;min-width:0;position:relative}
.dc b{font-family:var(--font-display);font-size:16px;font-weight:600;line-height:1.2}
.dc .g{position:absolute;right:8px;top:6px;font-weight:700;font-size:15px;line-height:1}
.dc .nt{font-size:12px;line-height:1.3;margin-top:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
button.dc{cursor:pointer}
button.dc:hover{filter:brightness(1.06);box-shadow:inset 0 0 0 2px var(--ink)}
.dc.ok{background:var(--st-good);color:#fff}
.dc.warn{background:var(--st-warn);color:#2b2100}
.dc.bad{background:var(--st-bad);color:#fff}
.dc.open{background:var(--grid);color:var(--ink)}
.dc.future{background:var(--surface-2);color:var(--muted)}
.dc.none{background:repeating-linear-gradient(135deg,var(--hatch) 0 6px,transparent 6px 12px);color:var(--muted)}
.dc.tod{box-shadow:inset 0 0 0 2px var(--brand-strong)}
@media (max-width:720px){.dc{min-height:48px;padding:4px 5px}.dc .nt{display:none}.dc b{font-size:14px}.dc .g{right:5px;top:4px;font-size:12px}.dcal{gap:4px}.cardh{flex-wrap:wrap}}
@media (max-width:720px){.hint{display:none}.detm{max-height:92vh}}
'''
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s)
print('ok',len(s))
