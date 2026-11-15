import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
i=s.index('/* schedule */\nfunction cellHtml')
s=s[:i]+open(S+'prod/p_notelink.js',encoding='utf-8').read()+'\n'+s[i:]
rep("""<span class="muted small tnum">'+esc(thDate(b.date,{day:'numeric',month:'short'}))+' '+b.hhmm+' น.</span></span></button>';""",
    """<span class="muted small tnum">'+esc(thDate(b.date,{day:'numeric',month:'short'}))+' '+b.hhmm+' น.</span>'+(function(g){return g?'<span class="notego">ไปที่หน้า'+esc(g.label)+' <span aria-hidden="true">›</span></span>':'';})(noteTarget(n))+'</span></button>';""")
rep("""function toast(title,body,kind){
  var box=$('toast');if(!box)return;
  var el=document.createElement('div');el.className='toast'+(kind==='warn'?' warn':'');""",
"""function toast(title,body,kind,nid){
  var box=$('toast');if(!box)return;
  var tn=nid!=null&&state.notifications.find(function(x){return x.id===nid;}),tg=tn&&noteTarget(tn);
  var el=document.createElement(tg?'button':'div');el.className='toast'+(kind==='warn'?' warn':'')+(tg?' tgo':'');
  if(tg){el.type='button';el.setAttribute('data-act','toast-go');el.setAttribute('data-id',nid);el.title='ไปที่หน้า'+tg.label;}""")
rep("""  el.appendChild(b);el.appendChild(s);box.appendChild(el);""",
"""  el.appendChild(b);el.appendChild(s);
  if(tg){var g=document.createElement('span');g.className='notego';g.textContent='กดเพื่อไปที่หน้า'+tg.label+' ›';el.appendChild(g);}
  box.appendChild(el);""")
css="""
/* notification links */
.notego{display:block;margin-top:4px;font-size:12.5px;font-weight:600;color:var(--brand-strong)}
.toast.tgo{cursor:pointer;text-align:left;font:inherit;color:inherit;width:100%}
.toast.tgo:hover{filter:brightness(.98);transform:translateY(-1px)}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('nl patch ok')
