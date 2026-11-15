    case 'lv-cancel':
      rpc('cancel_leave',{p_id:D.id}).then(function(){return loadAll();}).then(function(){renderAll();},function(er){lv.err=errMsg(er);renderView();});
      break;
