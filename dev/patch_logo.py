import os,sys
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
K=os.environ.get('LOGO','A')
sys.path.insert(0,S+'icons');import gen
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
mk=gen.svg(K,'full','mk').replace('width="512" height="512"','width="40" height="40" aria-hidden="true" focusable="false"').replace("'","\\'").replace('\n','')
rep("""  .topbar.in .brand>div{display:none}
  .uname span{display:none}
  .uname b{max-width:96px}""",
"""  .topbar.in .brand small{display:none}
  .topbar.in .brand b{font-size:16px;white-space:nowrap}
  .topbar.in .mark{width:36px;height:36px;border-radius:11px}
  .topbar.in .iconbtn{width:36px;height:36px;border-radius:11px}
  .topbar.in .top-right{gap:6px}
  .uname span{display:none}
  .uname b{max-width:84px}
}
@media (max-width:400px){
  .topbar.in .uname{display:none}
  .topbar.in .iconbtn{width:34px;height:34px}""")
open(S+'app_src.html','w',encoding='utf-8').write(s);print('logo patch ok',K)
