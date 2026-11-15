async function applyCsv(){
  if(!io.preview||!io.preview.results||busy)return;
  busy=true;var changed=0,failed=0;
  try{
    var list=io.preview.results.filter(function(r){return r.ok;});
    for(var i=0;i<list.length;i++){
      var r=list[i],a=r.action,parts=a.key.split('|'),d=parts[0],s=shiftById(parts[1]),sl=slot(d,s),prev=state.overrides[a.key];
      var when=dayShort(d)+' กะ '+shiftLabel(s)+' ('+TEAMS[s.team].name+')';
      try{
        if(!a.off){
          if(prev){await rpc('set_override',{p_date:d,p_shift:s.id,p_cover:null,p_note:''});var pc=emp(prev.cover);changed++;notify([sl.regular.id,pc&&pc.id],'ยกเลิกการหยุด',sl.regular.name+' กลับมาทำงานตามปกติ '+when);}
        }else if(!prev||prev.cover!==a.cover||(prev.note||'')!==(a.note||'')){
          await rpc('set_override',{p_date:d,p_shift:s.id,p_cover:a.cover,p_note:a.note||''});changed++;
          var c=emp(a.cover);
          if(prev&&prev.cover!==a.cover)notify([prev.cover],'ยกเลิกการทำแทน','ไม่ต้องทำแทน '+sl.regular.name+' '+when+' แล้ว');
          notify([sl.regular.id,a.cover],'เปลี่ยนตารางกะ',sl.regular.name+' หยุด '+when+' · '+c.name+' ทำแทน'+(a.note?' · '+a.note:''));
        }
      }catch(e){failed++;}
    }
    var skipped=io.preview.results.filter(function(r){return !r.ok;}).length;
    notify([me.id],'นำเข้าตารางกะ','นำเข้าแล้ว: เปลี่ยนแปลง '+changed+' รายการ · ข้ามแถวที่ไม่ถูกต้อง '+skipped+' แถว'+(failed?' · ผิดพลาด '+failed+' แถว':''));
    io.msg='นำเข้าสำเร็จ เปลี่ยนแปลง '+changed+' รายการ ข้าม '+skipped+' แถว'+(failed?' ผิดพลาด '+failed+' แถว':'');io.preview=null;
    await loadAll();
  }catch(e){io.msg='นำเข้าไม่สำเร็จ: '+errMsg(e);}
  busy=false;renderAll();
}
