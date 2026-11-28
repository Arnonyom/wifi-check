async function submitLeave(){
  if(busy)return;
  // พักร้อน/ลากิจ: เริ่มได้ตั้งแต่วันนี้ (ลาวันนี้ได้ถึงเที่ยงคืน) · ลาป่วย: เริ่มได้เฉพาะวันนี้ ครั้งละไม่เกิน 3 วัน
  var today=bkk(now()).date,f=lv.type==='sick'?today:getDv('lvFrom',today),t=addDays(f,lvLen()-1);lv.err='';lv.ok='';
  var days=countDays(me.id,f,t),y=+f.slice(0,4);
  if(lv.type==='sick'&&f!==today)lv.err='ลาป่วยต้องเริ่มวันนี้ (ลาล่วงหน้าหรือย้อนหลังไม่ได้)';
  else if(lv.type==='sick'&&t>addDays(today,2))lv.err='ลาป่วยได้ครั้งละไม่เกิน 3 วัน';
  else if(f<today)lv.err='เลือกวันที่ตั้งแต่วันนี้เป็นต้นไป';
  else if(!days)lv.err='ช่วงนี้ไม่มีกะของคุณ ไม่ต้องยื่นลา';
  else if(state.leaves.some(function(l){return l.emp===me.id&&(l.status==='pending'||l.status==='approved')&&l.from<=t&&l.to>=f;}))lv.err='มีคำขอลาที่ทับช่วงวันนี้อยู่แล้ว';
  else if(usedY(me.id,lv.type,['approved','pending'],y)+days>quotaOf(me.id,y,lv.type))lv.err='เกินสิทธิ์'+LEAVE_TH[lv.type]+'คงเหลือ';
  if(lv.err){renderView();return;}
  busy=true;
  try{
    await rpc('request_leave',{p_type:lv.type,p_from:f,p_to:t,p_reason:lv.reason.trim()});
    lv.reason='';lv.len=1;lv.ok='ส่งคำขอแล้ว รอผู้ดูแลอนุมัติ';await loadAll();
  }catch(e){lv.err=errMsg(e);}
  busy=false;renderAll();
}
