import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:90]);s=s.replace(a,b)
i=s.index('/* schedule */\nfunction cellHtml')
s=s[:i]+open(S+'prod/p_sim.js',encoding='utf-8').read()+'\n'+s[i:]
rep("['report','รายงาน','doc'],['settings','ตั้งค่า','sliders']]","['report','รายงาน','doc'],['sim','ทดสอบ','clock'],['settings','ตั้งค่า','sliders']]")
rep("settings:viewSettings,","settings:viewSettings,sim:viewSim,")
rep("    case 'dcJump':","    case 'simDate':sim.date=val;sim.shift='';simReset(false);break;\n    case 'dcJump':")
rep("    case 'pw-self':","""    case 'sim-in':var ri=simCheckIn();sim.rin=ri;sim.rout=null;sim.log.push(ri);renderView();break;
    case 'sim-out':var ro=simCheckOut();sim.rout=ro;sim.log.push(ro);renderView();break;
    case 'sim-set':sim[D.k]=D.v;if(D.k==='tin'){sim.rin=null;sim.rout=null;}else sim.rout=null;renderView();break;
    case 'sim-clear':sim.log=[];renderView();break;
    case 'pw-self':""")
css='''
/* simulator */
.simbanner{margin:0;padding:10px 14px;border-radius:10px;background:var(--late-soft);color:var(--late);border:1px dashed var(--amber);font-size:14px}
.simchips{gap:6px;flex-wrap:wrap}
.simlog{min-width:620px}
.simoff{opacity:.65}
.simres{border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}
.simres p{margin:0}
.simres.ok{background:var(--st-good);color:#fff}
.simres.warn{background:var(--st-warn);color:#2b2100}
.simres.bad{background:var(--st-bad);color:#fff}
.tl{position:relative;height:18px;border-radius:9px;overflow:visible;background:var(--surface-2);margin:26px 0 4px}
.tl>span{position:absolute;top:0;bottom:0}
.tl-pre{background:var(--grid);border-radius:9px 0 0 9px}
.tl-open{background:var(--st-good)}
.tl-late{background:var(--st-warn)}
.tl-end{background:var(--st-bad);border-radius:0 9px 9px 0}
.tl-mk{position:absolute;top:-6px;bottom:-6px;width:3px;margin-left:-1px;background:var(--ink);border-radius:2px;font-style:normal}
.tl-mk em{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:12px;font-style:normal;background:var(--ink);color:var(--surface);padding:1px 6px;border-radius:6px;margin-bottom:2px}
.tl-mk.out em{bottom:auto;top:100%;margin:2px 0 0}
.tl-lab{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:14px}
.tl-lab span{display:inline-flex;align-items:center;gap:6px}
.tl-k{width:12px;height:12px;border-radius:3px;display:inline-block}
.tl-k.pre{background:var(--grid)}.tl-k.open{background:var(--st-good)}.tl-k.late{background:var(--st-warn)}.tl-k.end{background:var(--st-bad)}
'''
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('sim patch ok')
