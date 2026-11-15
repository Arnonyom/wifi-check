    case 'bell-notify':
      var nv=(me.notify===false);
      rpc('set_my_notify',{p_on:nv}).then(function(){me.notify=nv;renderChrome();toast(nv?'เปิดแจ้งเตือนในเว็บแล้ว':'ปิดแจ้งเตือนในเว็บแล้ว',nv?'จะมีป๊อปอัปและตัวเลขที่กระดิ่งเมื่อมีการแจ้งเตือน':'จะไม่มีป๊อปอัปและตัวเลขที่กระดิ่ง (ยังดูรายการได้)');},function(er){toast('ตั้งค่าไม่สำเร็จ',errMsg(er),'warn');});
      break;
    case 'bell-push':
      if(me.push){me.push=false;lsSet('wc-push-'+me.id,'0');renderChrome();break;}
      try{
        if(!window.Notification)throw new Error('none');
        Notification.requestPermission().then(function(p){
          me.push=(p==='granted');lsSet('wc-push-'+me.id,me.push?'1':'0');renderChrome();
          toast(me.push?'เปิด Push แล้ว':'เบราว์เซอร์ไม่อนุญาต',me.push?'จะเด้งแจ้งเตือนเมื่อเปิดแอปอยู่ (Push ตอนปิดแอปเพิ่มในขั้นถัดไป)':'อนุญาตการแจ้งเตือนในตั้งค่าเบราว์เซอร์ก่อน');
        },function(){toast('เปิด Push ไม่ได้','เบราว์เซอร์ไม่อนุญาตในหน้านี้');});
      }catch(err){toast('เครื่องนี้ยังเปิด Push ไม่ได้','ลองเพิ่มเว็บลงหน้าจอโฮมแล้วเปิดจากไอคอน');}
      break;
