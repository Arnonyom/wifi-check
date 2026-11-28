setInterval(refreshData,45000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshData();});
(async function boot(){
  renderAll();
  if(!sb){$('main').innerHTML='<section class="card"><p class="err">โหลดระบบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้านี้</p></section>';return;}
  try{var r=await sb.auth.getSession();if(r.data&&r.data.session)await enter(r.data.session.user.id);else userThemeOff();}catch(e){}
  if(!me)userThemeOff(); // ไม่ได้ล็อกอิน → ธีมของเครื่อง
})();
})();
</script>
