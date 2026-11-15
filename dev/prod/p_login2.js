function renderLogin(){
  $('main').innerHTML=
    '<div class="login-wrap" style="grid-template-columns:minmax(0,440px)">'+
    '<section class="card hero"><h1>เข้าสู่ระบบ</h1><p class="muted" style="margin:4px 0 14px">ลงเวลาเข้า–ออกงานของทีมกะ</p>'+
    '<form id="loginForm" class="stack" autocomplete="on">'+
      '<div><label for="lu">ชื่อผู้ใช้</label><input id="lu" autocapitalize="none" autocomplete="username" required></div>'+
      '<div><label for="lp">รหัสผ่าน</label><input id="lp" type="password" maxlength="72" autocomplete="current-password" autocapitalize="none" spellcheck="false" required></div>'+
      '<button class="btn" type="submit" id="lbtn">เข้าสู่ระบบ</button><div class="err" id="lerr" role="alert">'+esc(loginMsg)+'</div>'+
    '</form><p class="muted small">ไม่มีการสมัครเอง บัญชีสร้างโดยผู้ดูแลเท่านั้น ลืมรหัสผ่านให้ติดต่อผู้ดูแล</p></section></div>';
}
async function doLogin(){
  if(busy||!sb)return;
  var u=$('lu').value.trim().toLowerCase(),p=$('lp').value.trim(),err=$('lerr'),btn=$('lbtn');
  if(!u||!p){err.textContent='กรอกชื่อผู้ใช้และรหัสผ่าน';return;}
  busy=true;btn.disabled=true;err.textContent='';loginMsg='';
  try{
    var r=await sb.auth.signInWithPassword({email:u+'@'+(CFG.USER_DOMAIN||'wifi-check.app'),password:p});
    if(r.error){err.textContent=/invalid|credentials/i.test(r.error.message)?'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง':errMsg(r.error);btn.disabled=false;busy=false;return;}
    busy=false;lastPw=p;
    await enter(r.data.user.id);
  }catch(e){err.textContent=errMsg(e);btn.disabled=false;}
  busy=false;
}
async function doLogout(){
  try{await sb.auth.signOut();}catch(e){}
  me=null;lastPw='';pwm=null;view='home';modal=null;bellOpen=false;dp=null;state=emptyState();loginMsg='';renderAll();
}

/* ---------- views ---------- */
