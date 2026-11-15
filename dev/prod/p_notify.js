function notify(to,title,body,kind){
  /* แจ้งเตือนที่ผู้ดูแลเป็นคนสร้าง (เปลี่ยนกะ นำเข้า ปรับกฎ ฯลฯ) บันทึกที่เซิร์ฟเวอร์ ส่วนเหตุการณ์อื่น (สาย ลา) เซิร์ฟเวอร์สร้างเอง */
  if(!sb||!me||me.role!=='admin')return;
  var ids=[];(to||[]).forEach(function(x){if(x&&ids.indexOf(x)<0)ids.push(x);});
  sb.rpc('admin_notify',{p_to:ids,p_title:title,p_body:body,p_kind:kind||''}).then(function(){},function(){});
}
