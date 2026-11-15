
import os as _os; S=_os.path.dirname(_os.path.abspath(__file__))+'/'
s=open(S+'app_src.html',encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a);assert n==count,(n,a[:100]);s=s.replace(a,b)
i=s.index('/* schedule */\nfunction cellHtml')
s=s[:i]+open(S+'prod/p_xlsx.js',encoding='utf-8').read()+'\n'+s[i:]
# report: table header with Excel, remove CSV card
rep("    '<div class=\"scroll\"><table class=\"rt\" style=\"min-width:860px\">","    tblHead('รายละเอียดรายกะ',rows.length+' กะ · ตามช่วงวันที่และตัวกรองด้านบน','xl-rep')+\n    '<div class=\"scroll\"><table class=\"rt\" style=\"min-width:860px\">")
i=s.index("    '<section class=\"card stack\"><div class=\"row\"><button class=\"btn\" data-act=\"mk-rep\">")
j=s.index("'</section></div>';",i)
s=s[:i]+"    '</div>';"+s[j+len("'</section></div>';"):]
rep("    '<section class=\"card\"><h3>ใครหยุด ใครทำแทน</h3><p class=\"muted small\">ลาพักร้อน '+lt.vac+' · ลากิจ '+lt.per+' · ลาป่วย '+lt.sick+(lt.other?' · อื่นๆ '+lt.other:'')+' กะ ในช่วงที่เลือก</p>",
    "    '<section class=\"card stack\">'+tblHead('ใครหยุด ใครทำแทน','ลาพักร้อน '+lt.vac+' · ลากิจ '+lt.per+' · ลาป่วย '+lt.sick+(lt.other?' · อื่นๆ '+lt.other:'')+' กะ ในช่วงที่เลือก','xl-cover')+'")
# settings export -> Excel
rep("""    '<div class="row"><button class="btn" data-act="mk-csv">สร้างไฟล์ CSV</button>'+(io.exp?'<button class="btn sec" data-act="copy-csv" data-ta="expOut" data-m="expMsg">คัดลอก</button>':'')+'<span class="ok" id="expMsg" role="status"></span></div>'+""",
    """    '<div class="row">'+xlBtn('xl-sched','ดาวน์โหลด Excel')+'<span class="ok" id="expMsg" role="status"></span></div><p class="muted small">แก้ในไฟล์ Excel แล้วนำเข้ากลับมาได้ที่การ์ดด้านล่าง (อย่าแก้ชื่อหัวคอลัมน์แถวแรก)</p>'+""")
i=s.index("    (io.exp?'<textarea id=\"expOut\"")
j=s.index("'</section>'+",i)
s=s[:i]+"    '</section>'+"+s[j+len("'</section>'+"):]
rep("ส่งออกเป็น CSV แก้ใน Excel แล้วนำเข้ากลับมา","ดาวน์โหลด Excel แก้ไข แล้วนำเข้ากลับมา")
rep("<label for=\"csvFile\">เลือกไฟล์ .csv</label><input type=\"file\" id=\"csvFile\" accept=\".csv,text/csv\">","<label for=\"csvFile\">เลือกไฟล์ Excel (.xlsx) หรือ .csv</label><input type=\"file\" id=\"csvFile\" accept=\".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv\">")
rep("<label for=\"csvIn\">หรือวางข้อมูล CSV ที่นี่</label>","<label for=\"csvIn\">หรือคัดลอกตารางจาก Excel มาวางที่นี่</label>")
rep("    case 'check-csv':io.csv=$('csvIn').value;","    case 'check-csv':io.csv=pasteToCsv($('csvIn').value);")
rep("    case 'apply-csv':io.csv=$('csvIn')?$('csvIn').value:io.csv;","    case 'apply-csv':io.csv=$('csvIn')?pasteToCsv($('csvIn').value):io.csv;")
rep("""    var fr=new FileReader();
    fr.onload=function(){io.csv=String(fr.result||'');io.msg='';io.preview=checkCsv(io.csv);renderView();};
    fr.readAsText(t.files[0],'utf-8');""","""    var fr=new FileReader(),fl=t.files[0],isX=/\\.xlsx$/i.test(fl.name);
    fr.onload=function(){
      if(!isX){io.csv=String(fr.result||'');io.msg='';io.preview=checkCsv(io.csv);renderView();return;}
      XL.read(fr.result).then(function(rows){io.csv=rowsToCsv(rows);io.msg='';io.preview=checkCsv(io.csv);renderView();}).catch(function(err){io.preview=null;io.msg=err.message||'อ่านไฟล์ Excel ไม่ได้';renderView();});
    };
    if(isX)fr.readAsArrayBuffer(fl);else fr.readAsText(fl,'utf-8');""")
rep("    case 'mk-rep':rep.csv=buildRepCsv(repRows());renderView();break;","""    case 'xl-rep':xlReport();toast('กำลังดาวน์โหลด Excel','รายงานรายกะ');break;
    case 'xl-forgot':xlForgot();toast('กำลังดาวน์โหลด Excel','ใครลืมลงเวลามากที่สุด');break;
    case 'xl-cover':xlCover();toast('กำลังดาวน์โหลด Excel','ใครหยุด ใครทำแทน');break;
    case 'xl-sched':var xf=getDv('expFrom',mondayOf(bkk(now()).date)),xt=getDv('expTo',xf);if(!xf||!xt||xf>xt){$('expMsg').textContent='เลือกช่วงวันที่ให้ถูกต้อง';break;}xlSchedule(xf,xt);toast('กำลังดาวน์โหลด Excel','ตารางกะ '+sd(xf)+' – '+sd(xt));break;""")
css="""
/* table header with Excel */
.tblhead{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;flex-wrap:wrap}
.tblhead h3{margin:0}
.xlbtn{display:inline-flex;align-items:center;gap:6px;background:#1D6F42;border-color:#1D6F42;color:#fff}
.xlbtn:hover{filter:brightness(1.08)}
"""
rep('#dpbox .overlay{z-index:50}','#dpbox .overlay{z-index:50}'+css)
open(S+'app_src.html','w',encoding='utf-8').write(s);print('xl patch ok')
