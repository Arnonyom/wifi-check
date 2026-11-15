    case 'read':
      var n=state.notifications.find(function(x){return x.id===D.id;});
      if(!n)break;
      markNoteRead(n);
      if(!goNote(n))renderChrome();
      break;
    case 'toast-go':
      var tn=state.notifications.find(function(x){return x.id===D.id;});
      if(el.parentNode)el.parentNode.removeChild(el);
      if(!tn)break;
      markNoteRead(tn);
      if(!goNote(tn))renderChrome();
      break;
    case 'read-all':
      var rids=[];visibleNotes().forEach(function(x){if(x.read.indexOf(me.id)<0){x.read.push(me.id);rids.push(x.id);}});
      renderChrome();if(rids.length)rpc('mark_read',{p_ids:rids}).catch(function(){});
      break;
