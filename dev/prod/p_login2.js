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
    if(r.error){var bad=/invalid|credentials/i.test(r.error.message);err.textContent=bad?'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง':errMsg(r.error);btn.disabled=false;busy=false;if(bad)loginShake();return;}
    busy=false;lastPw=p;
    await enter(r.data.user.id);
  }catch(e){err.textContent=errMsg(e);btn.disabled=false;}
  busy=false;
}
/* รหัสผิด: การ์ดสั่น + ช่องกรอกเป็นสีแดง (หายเมื่อพิมพ์ใหม่) */
function loginShake(){
  var c=document.querySelector('.login-wrap .hero');['lu','lp'].forEach(function(id){var x=$(id);if(x){x.classList.add('bad');x.setAttribute('aria-invalid','true');}});
  if(c){c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake');setTimeout(function(){c.classList.remove('shake');},500);}
  var p=$('lp');if(p){try{p.focus();p.select();}catch(e){}}
}
document.addEventListener('input',function(e){var t=e.target;if(t&&(t.id==='lu'||t.id==='lp')){['lu','lp'].forEach(function(id){var x=$(id);if(x){x.classList.remove('bad');x.removeAttribute('aria-invalid');}});}});
async function doLogout(){
  try{await sb.auth.signOut({scope:'local'});}catch(e){} // เฉพาะเครื่องนี้ ไม่ตัดเครื่องอื่นของบัญชีเดียวกัน
  me=null;lastPw='';pwm=null;view='home';themeOpen=false;logoutAsk=false;modal=null;bellOpen=false;dp=null;state=emptyState();loginMsg='';renderAll();
}

/* ---------- views ---------- */
