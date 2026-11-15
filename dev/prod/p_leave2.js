async function submitLeave(){
  if(busy)return;
  var today=bkk(now()).date,f=getDv('lvFrom',today),t=getDv('lvTo',today);lv.err='';lv.ok='';
  var days=countDays(me.id,f,t);
  if(t<f)lv.err='วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม';
  else if(f<(lv.type==='sick'?addDays(today,-7):today))lv.err=lv.type==='sick'?'ลาป่วยย้อนหลังได้ไม่เกิน 7 วัน':'เลือกวันที่ตั้งแต่วันนี้เป็นต้นไป';
  else if(!days)lv.err='ช่วงนี้ไม่มีกะของคุณ ไม่ต้องยื่นลา';
  else if(state.leaves.some(function(l){return l.emp===me.id&&(l.status==='pending'||l.status==='approved')&&l.from<=t&&l.to>=f;}))lv.err='มีคำขอลาที่ทับช่วงวันนี้อยู่แล้ว';
  else if(usedDays(me.id,lv.type,['approved','pending'])+days>QUOTA[lv.type])lv.err='เกินสิทธิ์'+LEAVE_TH[lv.type]+'คงเหลือ';
  if(lv.err){renderView();return;}
  busy=true;
  try{
    await rpc('request_leave',{p_type:lv.type,p_from:f,p_to:t,p_reason:lv.reason.trim()});
    lv.reason='';lv.ok='ส่งคำขอแล้ว รอผู้ดูแลอนุมัติ';await loadAll();
  }catch(e){lv.err=errMsg(e);}
  busy=false;renderAll();
}
