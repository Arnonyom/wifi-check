async function approveLeave(id){
  var l=state.leaves.find(function(x){return x.id===id;});if(!l||l.status!=='pending'||busy)return;
  var slots=leaveSlots(l),covers=[],bad='';
  slots.forEach(function(x,i){var sel=$('cv'+i);var v=sel?sel.value:'';if(!v)bad='เลือกผู้ทำแทนให้ครบทุกกะ';covers.push({work_date:x.d,shift_id:x.s.id,cover:v});});
  if(bad){lvErr=bad;renderView();return;}
  busy=true;
  try{
    await rpc('approve_leave',{p_id:id,p_covers:covers});
    lvOpen=null;lvErr='';await loadAll();
  }catch(e){lvErr=errMsg(e);}
  busy=false;renderAll();
}

