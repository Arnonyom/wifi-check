/* ---------- Excel (.xlsx) เขียน/อ่าน โดยไม่ใช้ไลบรารีภายนอก ---------- */
var XL=(function(){
  var CRC=(function(){var t=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  var enc=new TextEncoder();
  function u16(v){return [v&255,(v>>>8)&255];}
  function u32(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];}
  /* zip แบบไม่บีบอัด (STORE) */
  function zip(files){
    var parts=[],central=[],off=0;
    files.forEach(function(f){
      var name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
      var head=[].concat([0x50,0x4b,0x03,0x04],u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0));
      parts.push(new Uint8Array(head),name,data);
      central.push(new Uint8Array([].concat([0x50,0x4b,0x01,0x02],u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off))),name);
      off+=head.length+name.length+data.length;
    });
    var csize=central.reduce(function(s,a){return s+a.length;},0);
    var end=new Uint8Array([].concat([0x50,0x4b,0x05,0x06],u16(0),u16(0),u16(files.length),u16(files.length),u32(csize),u32(off),u16(0)));
    return new Blob(parts.concat(central,[end]),{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
  function x(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');}
  function col(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;}
  function sheetXml(sh){
    var rows=sh.rows,cols=(sh.widths||[]).map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';}).join('');
    var body=rows.map(function(r,ri){
      return '<row r="'+(ri+1)+'">'+r.map(function(v,ci){
        var ref=col(ci)+(ri+1),st=ri===0?' s="1"':'';
        if(v===null||v===undefined||v==='')return '<c r="'+ref+'"'+st+'/>';
        if(typeof v==='number'&&isFinite(v))return '<c r="'+ref+'"'+st+'><v>'+v+'</v></c>';
        return '<c r="'+ref+'" t="inlineStr"'+st+'><is><t xml:space="preserve">'+x(v)+'</t></is></c>';
      }).join('')+'</row>';
    }).join('');
    var last=col(Math.max(0,(rows[0]||[]).length-1))+Math.max(1,rows.length);
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+
      (cols?'<cols>'+cols+'</cols>':'')+'<sheetData>'+body+'</sheetData>'+(rows.length>1?'<autoFilter ref="A1:'+last+'"/>':'')+'</worksheet>';
  }
  function safeName(n,i,used){var s=String(n||('Sheet'+(i+1))).replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,31)||('Sheet'+(i+1));while(used[s])s=s.slice(0,28)+'_'+(i+1);used[s]=1;return s;}
  function build(sheets){
    var used={},names=sheets.map(function(s,i){return safeName(s.name,i,used);});
    var files=[
      {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map(function(s,i){return '<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';}).join('')+'</Types>'},
      {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
      {name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+names.map(function(n,i){return '<sheet name="'+x(n)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>';}).join('')+'</sheets></workbook>'},
      {name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map(function(s,i){return '<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>';}).join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
      {name:'xl/styles.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Tahoma"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Tahoma"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2E7D1A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'}
    ];
    sheets.forEach(function(s,i){files.push({name:'xl/worksheets/sheet'+(i+1)+'.xml',data:sheetXml(s)});});
    return zip(files);
  }
  function download(sheets,filename){
    var blob=build(sheets),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;a.rel='noopener';document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(url);a.remove();},4000);
    return blob;
  }
  /* อ่าน .xlsx (แผ่นแรก) → array ของแถว */
  async function inflate(data){
    if(typeof DecompressionStream==='undefined')throw new Error('เบราว์เซอร์นี้เปิดไฟล์ Excel ไม่ได้ ให้บันทึกเป็น .csv แล้วนำเข้าแทน');
    var ds=new DecompressionStream('deflate-raw'),w=ds.writable.getWriter();w.write(data);w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }
  async function unzip(buf){
    var b=new Uint8Array(buf),dv=new DataView(buf),out={},e=b.length-22;
    while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;
    if(e<0)throw new Error('ไฟล์นี้ไม่ใช่ไฟล์ Excel (.xlsx)');
    var n=dv.getUint16(e+10,true),p=dv.getUint32(e+16,true),dec=new TextDecoder();
    for(var i=0;i<n;i++){
      var method=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true);
      var name=dec.decode(b.subarray(p+46,p+46+nl));
      var lnl=dv.getUint16(lo+26,true),lxl=dv.getUint16(lo+28,true),start=lo+30+lnl+lxl,raw=b.subarray(start,start+csz);
      out[name]={method:method,raw:raw};p+=46+nl+xl+cl;
    }
    return {get:async function(nm){var f=out[nm];if(!f)return null;var d=f.method===0?f.raw:await inflate(f.raw);return dec.decode(d);},names:Object.keys(out)};
  }
  function colIdx(ref){var m=/^([A-Z]+)/.exec(ref||'');if(!m)return -1;var n=0;for(var i=0;i<m[1].length;i++)n=n*26+(m[1].charCodeAt(i)-64);return n-1;}
  async function read(buf){
    var z=await unzip(buf),P=new DOMParser();
    var wb=await z.get('xl/workbook.xml'),rels=await z.get('xl/_rels/workbook.xml.rels');
    var target='xl/worksheets/sheet1.xml';
    if(wb&&rels){var w=P.parseFromString(wb,'application/xml'),r=P.parseFromString(rels,'application/xml');var s0=w.getElementsByTagName('sheet')[0];if(s0){var rid=s0.getAttribute('r:id')||s0.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');var rel=Array.prototype.find.call(r.getElementsByTagName('Relationship'),function(x){return x.getAttribute('Id')===rid;});if(rel){var t=rel.getAttribute('Target').replace(/^\//,'');target=t.indexOf('xl/')===0?t:'xl/'+t;}}}
    var ssx=await z.get('xl/sharedStrings.xml'),ss=[];
    if(ssx){var sd=P.parseFromString(ssx,'application/xml');Array.prototype.forEach.call(sd.getElementsByTagName('si'),function(si){ss.push(Array.prototype.map.call(si.getElementsByTagName('t'),function(t){return t.textContent;}).join(''));});}
    var sx=await z.get(target);if(!sx)throw new Error('ไม่พบแผ่นงานในไฟล์');
    var doc=P.parseFromString(sx,'application/xml'),rows=[];
    Array.prototype.forEach.call(doc.getElementsByTagName('row'),function(row){
      var arr=[];
      Array.prototype.forEach.call(row.getElementsByTagName('c'),function(c){
        var ci=colIdx(c.getAttribute('r')),t=c.getAttribute('t'),v='';
        if(t==='inlineStr'){v=Array.prototype.map.call(c.getElementsByTagName('t'),function(x){return x.textContent;}).join('');}
        else{var ve=c.getElementsByTagName('v')[0];v=ve?ve.textContent:'';if(t==='s')v=ss[+v]||'';}
        if(ci<0)ci=arr.length;while(arr.length<ci)arr.push('');arr[ci]=v;
      });
      rows.push(arr);
    });
    return rows;
  }
  return {build:build,download:download,read:read};
})();
function xlDate(d){return d;}
function xlName(base,f,t){return 'WiFi-Check_'+base+'_'+f+(t&&t!==f?'_to_'+t:'')+'.xlsx';}
/* Excel serial date (ตัวเลขวันที่ใน Excel) → YYYY-MM-DD */
function xlCellText(v){
  if(/^\d{5}(\.\d+)?$/.test(v)){var d=new Date(Math.round((+v-25569)*864e5));return d.toISOString().slice(0,10);}
  return v;
}
function xlTime(v){if(/^0?\.\d+$/.test(v)||v==='0'){var m=Math.round(parseFloat(v)*1440);return ('0'+Math.floor(m/60)%24).slice(-2)+':'+('0'+m%60).slice(-2);}return v;}
function rowsToCsv(rows){
  rows=rows.filter(function(r){return r.some(function(c){return String(c).trim()!=='';});});
  var head=(rows[0]||[]).map(function(h){return String(h).trim().toLowerCase();});
  return rows.map(function(r,ri){return r.map(function(c,ci){c=String(c);if(ri>0){if(head[ci]==='date')c=xlCellText(c);else if(head[ci]==='shift_start'||head[ci]==='shift_end')c=xlTime(c);}return csvCell(c);}).join(',');}).join('\n');
}
/* ข้อมูลที่วางจาก Excel จะคั่นด้วย Tab → แปลงเป็น CSV */
function pasteToCsv(t){
  var first=(t.split(/\r?\n/)[0]||'');
  if(first.indexOf('\t')<0)return t;
  return rowsToCsv(t.split(/\r?\n/).map(function(l){return l.split('\t');}));
}
/* ---------- ส่งออก Excel จากหน้ารายงาน / ตั้งค่า ---------- */
function xlBtn(act,label){return '<button class="btn sm xlbtn" data-act="'+act+'" title="ดาวน์โหลดไฟล์ Excel"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>'+(label||'Excel')+'</button>';}
function tblHead(title,sub,act){return '<div class="tblhead"><div><h3>'+title+'</h3>'+(sub?'<p class="muted small">'+sub+'</p>':'')+'</div>'+xlBtn(act)+'</div>';}
function hhmmOf(ts){return ts?bkk(ts).hhmm:'';}
function xlReport(){
  var R=repRange(),rows=repRows();
  var head=['วันที่','วัน','ทีม','กะ','ผู้ประจำกะ','ตาราง','ผู้ทำงานจริง','การลา/หมายเหตุ','เข้างาน','ออกงาน','ชั่วโมง','สาย (นาที)','ออกก่อน (นาที)','สถานะ','ผู้ดูแลลงเวลาให้','หมายเหตุผู้ดูแล'];
  var data=[head].concat(rows.map(function(r){var a=r.rec,s=r.s,sl=r.sl;
    return [r.d,DOW_TH[dowOf(r.d)],TEAMS[s.team].name,shiftLabel(s),sl.regular?sl.regular.name:'',sl.off?(sl.kind==='swap'?'สลับกะ':'หยุด'):'ทำงาน',r.w?r.w.name:'',sl.off?(LEAVE_TH[sl.kind]||sl.note||''):'',
      a?hhmmOf(a.in):'',a&&a.out?hhmmOf(a.out):'',a&&a.out?Math.round((a.out-a.in)/36e3)/100:'',a&&a.lateFlag?a.late:0,a&&a.earlyFlag?a.early:0,statusText(r),a&&a.byAdmin?'ใช่ ('+fn(emp(a.byAdmin))+')':'',a&&a.byAdmin?a.adminNote:''];}));
  return XL.download([{name:'รายงานรายกะ',rows:data,widths:[12,9,10,14,20,9,20,16,9,9,8,10,12,22,20,26]}],xlName('report',R.f,R.t));
}
function xlForgot(){
  var R=repRange(),L=forgotData(repRows());
  var data=[['อันดับ','ชื่อ','กะในช่วงนี้','ผู้ดูแลลงเวลาให้ (ครั้ง)','ไม่มีบันทึก/ไม่ครบ (ครั้ง)','รวม (ครั้ง)','เหตุผลที่พบบ่อย']].concat(L.map(function(p,i){return [i+1,p.e.name,p.shifts,p.adm,p.miss,p.adm+p.miss,p.reason||''];}));
  return XL.download([{name:'ใครลืมลงเวลา',rows:data,widths:[8,22,12,20,22,11,26]}],xlName('forgot',R.f,R.t));
}
function xlCover(){
  var R=repRange(),rows=repRows().filter(function(r){return r.sl.off;});
  var data=[['วันที่','วัน','ทีม','กะ','ผู้หยุด','ประเภท','ผู้ทำงานแทน','หมายเหตุ']].concat(rows.map(function(r){var sl=r.sl;return [r.d,DOW_TH[dowOf(r.d)],TEAMS[r.s.team].name,shiftLabel(r.s),sl.regular?sl.regular.name:'',sl.kind==='swap'?'สลับกะ':(LEAVE_TH[sl.kind]||'หยุด'),sl.cover?sl.cover.name:'ยังไม่มีผู้ทำแทน',sl.note||''];}));
  return XL.download([{name:'ใครหยุด ใครทำแทน',rows:data,widths:[12,9,10,14,20,12,20,26]}],xlName('leave-cover',R.f,R.t));
}
function xlSchedule(f,t){
  var rows=parseCsv(buildCsv(f,t));
  return XL.download([{name:'schedule',rows:rows,widths:[12,9,10,11,11,16,20,9,16,20,24]}],xlName('schedule',f,t));
}
