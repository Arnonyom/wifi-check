async function saveSlot(){
  if(busy)return;
  var d=editSlot.d,s=shiftById(editSlot.s),key=d+'|'+s.id,sl=slot(d,s),err=$('slotErr');
  var mode=document.querySelector('input[name=mode]:checked').value,prev=state.overrides[key];
  var when=dayShort(d)+' กะ '+shiftLabel(s)+' ('+TEAMS[s.team].name+')';
  var cv=null,note='';
  if(mode==='off'){
    cv=$('covSel').value;note=$('covNote').value.trim();
    if(!cv){err.textContent='ระบุผู้ทำงานแทนก่อนบันทึก';return;}
  }
  busy=true;err.textContent='';
  try{
    await rpc('set_override',{p_date:d,p_shift:s.id,p_cover:cv,p_note:note});
    if(mode==='work'){
      if(prev){var pc=emp(prev.cover);notify([sl.regular.id,pc&&pc.id],'ยกเลิกการหยุด',sl.regular.name+' กลับมาทำงานตามปกติ '+when+(pc?' · '+pc.name+' ไม่ต้องทำแทนแล้ว':''));}
    }else{
      var c=emp(cv);
      if(prev&&prev.cover!==cv){var oc=emp(prev.cover);if(oc)notify([oc.id],'ยกเลิกการทำแทน','ไม่ต้องทำแทน '+sl.regular.name+' '+when+' แล้ว');}
      notify([sl.regular.id,cv],'เปลี่ยนตารางกะ',sl.regular.name+' หยุด '+when+' · '+c.name+' ทำแทน'+(note?' · '+note:''));
    }
    editSlot=null;await loadAll();busy=false;renderAll();
  }catch(e){busy=false;var er=$('slotErr');if(er)er.textContent=errMsg(e);}
}

