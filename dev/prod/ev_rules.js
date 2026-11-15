    case 'save-rules':
      var o=parseInt($('setOpen').value,10),l=parseInt($('setLate').value,10);
      io.ruleMsg='';io.ruleErr='';
      if(isNaN(o)||isNaN(l)||o<0||o>240||l<0||l>240){io.ruleErr='ใส่ตัวเลข 0–240 นาที';renderView();break;}
      (async function(){
        try{
          var changed=(o!==ST().openBefore||l!==ST().lateAfter);
          var ur=await sb.from('settings').update({open_before:o,late_after:l}).eq('id',1).select();
          if(ur.error)throw ur.error;
          if(!ur.data||!ur.data.length)throw new Error('ไม่มีสิทธิ์บันทึก');
          if(changed)notify(state.employees.filter(function(x){return x.active;}).map(function(x){return x.id;}),'ปรับกฎการลงเวลา','เปิดให้ลงเวลาก่อนเริ่มกะ '+o+' นาที · ถือว่าสายเมื่อเข้างานเกิน '+l+' นาทีหลังเริ่มกะ');
          io.ruleMsg='บันทึกกฎแล้ว';await loadAll();
        }catch(er){io.ruleErr=errMsg(er);}
        renderAll();
      })();
      break;
