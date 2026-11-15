    case 'lv-reject-yes':
      rpc('reject_leave',{p_id:D.id,p_note:lvNote.trim()}).then(function(){lvReject=null;return loadAll();}).then(function(){renderAll();},function(er){lvErr=errMsg(er);renderView();});
      break;
