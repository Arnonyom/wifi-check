import math,sys
def arc(cx,cy,r,a0=-135,a1=-45):
    x0=cx+r*math.cos(math.radians(a0));y0=cy+r*math.sin(math.radians(a0))
    x1=cx+r*math.cos(math.radians(a1));y1=cy+r*math.sin(math.radians(a1))
    return f'M{x0:.1f} {y0:.1f}A{r} {r} 0 0 1 {x1:.1f} {y1:.1f}'
def star(x,y,s,fill,op=1):
    return f'<path d="M{x} {y-s}Q{x} {y} {x+s} {y}Q{x} {y} {x} {y+s}Q{x} {y} {x-s} {y}Q{x} {y} {x} {y-s}Z" fill="{fill}" opacity="{op}"/>'
def rays(cx,cy,n,r,fill,op,w=4.5):
    out=[]
    for i in range(n):
        a=2*math.pi*i/n;b=math.radians(w/2)
        out.append(f'M{cx} {cy}L{cx+r*math.cos(a-b):.1f} {cy+r*math.sin(a-b):.1f}L{cx+r*math.cos(a+b):.1f} {cy+r*math.sin(a+b):.1f}Z')
    return f'<path d="{"".join(out)}" fill="{fill}" opacity="{op}"/>'
CHECK='M-30 2L-9 23L32 -20'

def optA(u):
    cx,cy=256,350
    return f'''<defs>
<radialGradient id="{u}bg" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#2F9E44"/><stop offset=".5" stop-color="#0E5326"/><stop offset="1" stop-color="#03200D"/></radialGradient>
<linearGradient id="{u}au" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6C4"/><stop offset=".45" stop-color="#F7C948"/><stop offset="1" stop-color="#C47F0E"/></linearGradient>
<radialGradient id="{u}halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE68A" stop-opacity=".55"/><stop offset="1" stop-color="#FFE68A" stop-opacity="0"/></radialGradient>
<filter id="{u}gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="512" height="512" fill="url(#{u}bg)"/>
{rays(cx,cy,32,420,"#FFF3B0",.09)}
<circle cx="{cx}" cy="{cy}" r="190" fill="url(#{u}halo)"/>
<g fill="none" stroke="url(#{u}au)" stroke-width="34" stroke-linecap="round" filter="url(#{u}gl)">
<path d="{arc(cx,cy,110)}"/><path d="{arc(cx,cy,172)}"/><path d="{arc(cx,cy,234)}"/></g>
<circle cx="{cx}" cy="{cy}" r="70" fill="#03200D" opacity=".35"/>
<circle cx="{cx}" cy="{cy}" r="64" fill="url(#{u}au)" filter="url(#{u}gl)"/>
<circle cx="{cx}" cy="{cy}" r="52" fill="none" stroke="#7A4A00" stroke-opacity=".35" stroke-width="3"/>
<path d="{CHECK}" transform="translate({cx} {cy})" fill="none" stroke="#0B4A1E" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
{star(112,96,22,"#FFF3B0",.95)}{star(408,118,14,"#FFF3B0",.85)}{star(430,300,10,"#FFF3B0",.7)}{star(84,262,9,"#FFF3B0",.6)}'''

def optB(u):
    cx,cy=256,256
    ticks=[]
    for i in range(60):
        a=2*math.pi*i/60;r0=214 if i%5 else 200;r1=226
        ticks.append(f'M{cx+r0*math.cos(a):.1f} {cy+r0*math.sin(a):.1f}L{cx+r1*math.cos(a):.1f} {cy+r1*math.sin(a):.1f}')
    return f'''<defs>
<linearGradient id="{u}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0A1A3F"/><stop offset=".55" stop-color="#120A33"/><stop offset="1" stop-color="#02040F"/></linearGradient>
<linearGradient id="{u}ne" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#9CFF3A"/><stop offset=".5" stop-color="#3AF2C8"/><stop offset="1" stop-color="#38B6FF"/></linearGradient>
<radialGradient id="{u}core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#3AF2C8" stop-opacity=".45"/><stop offset="1" stop-color="#3AF2C8" stop-opacity="0"/></radialGradient>
<filter id="{u}gl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="512" height="512" fill="url(#{u}bg)"/>
<circle cx="{cx}" cy="{cy}" r="230" fill="url(#{u}core)"/>
<path d="{"".join(ticks)}" stroke="#7FE9FF" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>
<path d="{arc(cx,cy,226,-90,30)}" fill="none" stroke="url(#{u}ne)" stroke-width="10" stroke-linecap="round" filter="url(#{u}gl)"/>
<g fill="none" stroke="url(#{u}ne)" stroke-width="28" stroke-linecap="round" filter="url(#{u}gl)" transform="translate(0 62)">
<path d="{arc(cx,cy,74)}"/><path d="{arc(cx,cy,126)}"/><path d="{arc(cx,cy,178)}"/></g>
<circle cx="{cx}" cy="{cy+62}" r="44" fill="#0A1A3F" stroke="url(#{u}ne)" stroke-width="8" filter="url(#{u}gl)"/>
<path d="{CHECK}" transform="translate({cx} {cy+62}) scale(.78)" fill="none" stroke="#9CFF3A" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" filter="url(#{u}gl)"/>
{star(420,72,16,"#BFF7FF",.9)}{star(86,440,12,"#BFF7FF",.7)}'''

def laurel(side,u):
    out=[];cx,cy,r=256,262,196
    angs=[100+i*14 for i in range(9)] if side<0 else [80-i*14 for i in range(9)]
    stem=f'M{cx+r*math.cos(math.radians(angs[0])):.1f} {cy+r*math.sin(math.radians(angs[0])):.1f}A{r} {r} 0 0 {1 if side<0 else 0} {cx+r*math.cos(math.radians(angs[-1])):.1f} {cy+r*math.sin(math.radians(angs[-1])):.1f}'
    for i,ad in enumerate(angs):
        a=math.radians(ad);sc=1-i*0.05
        for off in (-1,1):
            x=cx+(r+off*16)*math.cos(a);y=cy+(r+off*16)*math.sin(a)
            rot=ad+off*28*(-side)
            out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{8*sc:.1f}" ry="{20*sc:.1f}" transform="rotate({rot:.1f} {x:.1f} {y:.1f})"/>')
    return f'<path d="{stem}" fill="none" stroke="url(#{u}au)" stroke-width="5"/><g fill="url(#{u}au)">'+''.join(out)+'</g>'
def optC(u):
    sh='M256 70L388 116Q392 250 340 330Q300 390 256 412Q212 390 172 330Q120 250 124 116Z'
    cx,cy=256,300
    return f'''<defs>
<radialGradient id="{u}bg" cx="50%" cy="38%" r="80%"><stop offset="0" stop-color="#1F6B34"/><stop offset=".6" stop-color="#0B3519"/><stop offset="1" stop-color="#021108"/></radialGradient>
<linearGradient id="{u}au" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".5" stop-color="#F2BE3A"/><stop offset="1" stop-color="#A86A08"/></linearGradient>
<linearGradient id="{u}sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4CC35A"/><stop offset="1" stop-color="#0E5A27"/></linearGradient>
<filter id="{u}gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="{u}ds"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter>
</defs>
<rect width="512" height="512" fill="url(#{u}bg)"/>
{rays(256,240,40,400,"#F7D774",.08,3.5)}
{laurel(-1,u)}{laurel(1,u)}
<g filter="url(#{u}ds)"><path d="{sh}" fill="url(#{u}au)"/><path d="{sh}" fill="url(#{u}sh)" transform="translate(256 241) scale(.88) translate(-256 -241)"/></g>
<g fill="none" stroke="#FFFFFF" stroke-width="22" stroke-linecap="round" filter="url(#{u}gl)">
<path d="{arc(cx,cy,62)}"/><path d="{arc(cx,cy,104)}"/><path d="{arc(cx,cy,146)}" stroke="#FFF4C2"/></g>
<circle cx="{cx}" cy="{cy}" r="34" fill="url(#{u}au)"/>
<path d="{CHECK}" transform="translate({cx} {cy}) scale(.6)" fill="none" stroke="#0B4A1E" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M256 30L266 52L290 54L272 69L278 92L256 80L234 92L240 69L222 54L246 52Z" fill="url(#{u}au)" filter="url(#{u}gl)"/>
<g filter="url(#{u}ds)"><path d="M96 404L416 404L432 432L416 460L96 460L80 432Z" fill="url(#{u}au)"/>
<path d="M104 412L408 412L420 432L408 452L104 452L92 432Z" fill="#0B3519"/>
<text x="256" y="444" text-anchor="middle" font-family="Arial Black,Arial,Helvetica,sans-serif" font-weight="900" font-size="34" letter-spacing="4" fill="url(#{u}au)">WIFI TEAM</text></g>'''

OPTS={'A':optA,'B':optB,'C':optC}
def svg(k,mode='any',u=None):
    u=u or k.lower()
    body=OPTS[k](u)
    if mode=='mask':  # full bleed, content scaled into safe zone
        bg,rest=body.split('</defs>',1);rect,rest=rest.split('\n',2)[1],rest.split('\n',2)[2]
        body=bg+'</defs>'+rect+f'<g transform="translate(256 256) scale(.82) translate(-256 -256)">{rest}</g>'
    clip=''
    if mode=='any':
        body=f'<clipPath id="{u}cp"><rect width="512" height="512" rx="112"/></clipPath><g clip-path="url(#{u}cp)">{body}</g>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{body}</svg>'
if __name__=='__main__':
    for k in OPTS:
        for m in ('any','full','mask'):
            open(f'{k}_{m}.svg','w').write(svg(k,m,k.lower()+m))
    print('ok')
