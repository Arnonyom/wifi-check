async function confirmModal(){
  var m=modal;if(!m||busy)return;
  busy=true;var ok=$('modal')&&document.querySelector('#modal [data-act="modal-ok"]');if(ok)ok.disabled=true;
  try{
    if(m.type==='in'){
      var a=await rpc('check_in',{p_date:m.date,p_shift:m.shift});geoSave('in',a&&a.id);
      flash={t:'เข้างานสำเร็จ เวลา '+fmtHM(Date.parse(a.check_in))+' น. · '+(a.late_flag?'สาย '+a.late_min+' นาที':'ตรงเวลา'),warn:!!a.late_flag};
    }else{
      var b=await rpc('check_out',{p_id:m.recId});geoSave('out',(b&&b.id)||m.recId);
      flash={t:'ออกงานสำเร็จ เวลา '+fmtHM(Date.parse(b.check_out))+' น. · '+(b.early_flag?'ออกก่อน '+b.early_min+' นาที':'ตรงเวลา'),warn:!!b.early_flag};
    }
  }catch(e){flash={t:errMsg(e),warn:true};}
  modal=null;
  try{await loadAll();}catch(e){}
  busy=false;renderAll();
}

