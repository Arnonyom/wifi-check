/* ตำแหน่งตอนเข้า/ออกงาน
   1) เปิดหน้าต่างยืนยันเข้า/ออกงาน → ขอพิกัดจากเครื่อง (navigator.geolocation)
   2) แปลงพิกัดเป็นชื่อสถานที่ด้วย OpenStreetMap (Nominatim, ภาษาไทย)
   3) กดยืนยันสำเร็จ → บันทึกผ่าน set_my_location (ตาราง attendance_locations: เห็นได้เฉพาะเจ้าตัวและผู้ดูแล)
   ไม่อนุญาต/หาไม่เจอ ก็ยังลงเวลาได้ แต่บันทึกสถานะไว้ให้ผู้ดูแลเห็น
   (หน้าตัวอย่างใช้ window.__geoMock แทนเครื่องจริง) */
var geo=null;
function geoPlaceOf(a){
  if(!a)return null;
  var parts=[a.amenity||a.building||a.shop||a.office||a.tourism,a.road,a.suburb||a.quarter||a.neighbourhood||a.village,a.city_district||a.district||a.county||a.town||a.municipality,a.city||a.state||a.province],out=[];
  parts.forEach(function(v){if(v&&out.indexOf(v)<0)out.push(v);});
  return out.length?out.join(', ').slice(0,200):null;
}
function geoReverse(lat,lng){
  var M=window.__geoMock;if(M&&M.place!==undefined)return new Promise(function(r){setTimeout(function(){r(M.place);},150);});
  var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ctl)ctl.abort();},7000);
  return fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=th&lat='+lat.toFixed(6)+'&lon='+lng.toFixed(6),ctl?{signal:ctl.signal}:{})
    .then(function(r){return r.ok?r.json():null;})
    .then(function(j){clearTimeout(tm);if(!j)return null;return geoPlaceOf(j.address)||((j.display_name||'').split(',').slice(0,3).join(',').trim()||null);})
    .catch(function(){clearTimeout(tm);return null;});
}
function geoStart(){
  var g={status:'wait',lat:null,lng:null,acc:null,place:null,placeWait:false};geo=g;
  g.p=new Promise(function(res){
    var M=window.__geoMock,nav=M&&M.geo?M.geo:(navigator.geolocation||null);
    if(!nav){g.status='unsupported';geoPaint();res(g);return;}
    try{
      nav.getCurrentPosition(function(pos){
        if(geo!==g){res(g);return;}
        g.status='ok';g.lat=pos.coords.latitude;g.lng=pos.coords.longitude;g.acc=Math.round(pos.coords.accuracy||0);g.placeWait=true;geoPaint();
        geoReverse(g.lat,g.lng).then(function(pl){g.place=pl;g.placeWait=false;geoPaint();res(g);});
      },function(err){g.status=err&&err.code===1?'denied':(err&&err.code===3?'timeout':'unavailable');geoPaint();res(g);},
      {enableHighAccuracy:true,timeout:12000,maximumAge:60000});
    }catch(e){g.status='unavailable';geoPaint();res(g);}
  });
  return g;
}
function geoCoords(L){return L.lat.toFixed(5)+', '+L.lng.toFixed(5);}
function geoMap(L){return 'https://www.google.com/maps?q='+L.lat.toFixed(6)+','+L.lng.toFixed(6);}
function geoBad(st){return st==='denied'?'ไม่ได้อนุญาตตำแหน่ง':st==='unsupported'?'เครื่องไม่รองรับตำแหน่ง':'หาตำแหน่งไม่เจอ';}
/* ข้อความในหน้าต่างยืนยัน */
function geoModalHtml(){
  var g=geo;
  if(!g||g.status==='wait')return '<span class="muted">กำลังหาตำแหน่ง…</span>';
  if(g.status==='ok')return (g.place?'<span class="locp">'+esc(g.place)+'</span>':'<span class="tnum">'+geoCoords(g)+'</span>'+(g.placeWait?' <span class="muted small">กำลังหาชื่อสถานที่…</span>':''))+' <span class="muted small tnum">±'+g.acc+' ม.</span>';
  return '<span class="chip late">'+geoBad(g.status)+'</span><br><span class="muted small">ยังลงเวลาได้ แต่ผู้ดูแลจะเห็นว่าไม่มีตำแหน่ง</span>';
}
function geoPaint(){var el=document.getElementById('mLoc');if(el)el.innerHTML=geoModalHtml();}
/* บันทึกหลังเข้า/ออกงานสำเร็จ (ไม่ทำให้การลงเวลาช้า) */
async function geoSave(kind,attId){
  var g=geo;if(!g||!attId)return;
  await Promise.race([g.p,new Promise(function(r){setTimeout(r,15000);})]);
  var st=g.status==='wait'?'timeout':g.status;
  try{
    var r=await sb.rpc('set_my_location',{p_att:attId,p_kind:kind,p_status:st,p_lat:st==='ok'?g.lat:null,p_lng:st==='ok'?g.lng:null,p_acc:st==='ok'?g.acc:null,p_place:st==='ok'?g.place:null});
    if(r.error)throw r.error;
    if(!state.locs)state.locs={};
    state.locs[attId+'|'+kind]={status:st,lat:st==='ok'?g.lat:null,lng:st==='ok'?g.lng:null,acc:st==='ok'?g.acc:null,place:st==='ok'?g.place:null};
    if(!modal&&(view==='home'||det.length)){if(view==='home')renderView();if(det.length)renderDet();}
  }catch(e){}
}
/* แสดงตำแหน่งที่บันทึกแล้ว (หน้าลงเวลาของเจ้าตัว / รายละเอียดกะของผู้ดูแล) */
function locOf(a,kind){return a&&state.locs?state.locs[a.id+'|'+kind]:null;}
function locHtml(L,withMap){
  if(!L)return '';
  if(L.status!=='ok')return '<span class="chip late">'+geoBad(L.status)+'</span>';
  return (L.place?'<span class="locp">'+esc(L.place)+'</span>':'<span class="tnum">'+geoCoords(L)+'</span>')+' <span class="muted small tnum">±'+(L.acc||0)+' ม.</span>'+
    (withMap?' <a class="maplink" href="'+geoMap(L)+'" target="_blank" rel="noopener">ดูแผนที่</a>':'');
}
function locRows(a){
  var h='';
  [['in','ตำแหน่งเข้างาน'],['out','ตำแหน่งออกงาน']].forEach(function(k){var L=locOf(a,k[0]);if(L)h+='<div><dt>'+k[1]+'</dt><dd>'+locHtml(L,true)+'</dd></div>';});
  return h;
}
function homeLoc(io){
  var a=locOf(io,'in'),b=locOf(io,'out');if(!a&&!b)return '';
  return '<p class="ioloc small">'+(a?'<span><b>ตำแหน่งเข้างาน</b> '+locHtml(a,false)+'</span>':'')+(b?'<span><b>ตำแหน่งออกงาน</b> '+locHtml(b,false)+'</span>':'')+'</p>';
}
