/* รูปโปรไฟล์ + แก้ชื่อ (28 พ.ย. 2569)
   - ผู้ดูแลเปลี่ยนรูปได้ทุกคน (ของตัวเองที่หน้าโปรไฟล์ · คนอื่นที่หน้าพนักงาน กดชื่อ → "เปลี่ยนรูป")
   - สวิตช์ในหน้าโปรไฟล์ของผู้ดูแล: อนุญาตให้พนักงานแก้รูป / แก้ชื่อ ของตัวเอง (settings.allow_avatar / allow_name)
   - รูปย่อในเครื่องเป็น 160×160 JPEG ก่อนส่ง (ไม่กี่ KB) แล้วบันทึกผ่าน set_avatar */
var avFor=null,avMsg='',avErr='',nameEd=null,nameErr='';
function avHtml(e,cls){
  var ini=esc(((e&&e.name)||'?').trim().charAt(0).toUpperCase());
  return '<span class="pav'+(cls?' '+cls:'')+(e&&e.avatar?' img':'')+'" aria-hidden="true">'+(e&&e.avatar?'<img src="'+esc(e.avatar)+'" alt="">':ini)+'</span>';
}
function canEditAv(e){return !!me&&!!e&&(me.role==='admin'||(e.id===me.id&&ST().allowAvatar));}
function canEditName(){return !!me&&(me.role==='admin'||ST().allowName);}
var CAM='<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>';
function avPick(id){
  avFor=id;avErr='';avMsg='';
  var f=document.getElementById('avFile');
  if(!f){f=document.createElement('input');f.type='file';f.accept='image/*';f.id='avFile';f.hidden=true;document.body.appendChild(f);f.addEventListener('change',avChosen);}
  f.value='';f.click();
}
function avShrink(file){
  return new Promise(function(ok,bad){
    var u=URL.createObjectURL(file),im=new Image();
    im.onload=function(){
      try{
        var n=160,c=document.createElement('canvas');c.width=n;c.height=n;var g=c.getContext('2d');
        var s=Math.min(im.naturalWidth,im.naturalHeight),sx=(im.naturalWidth-s)/2,sy=(im.naturalHeight-s)/2;
        g.fillStyle='#fff';g.fillRect(0,0,n,n);g.drawImage(im,sx,sy,s,s,0,0,n,n);URL.revokeObjectURL(u);
        var q=0.85,d=c.toDataURL('image/jpeg',q);while(d.length>60000&&q>0.4){q-=0.15;d=c.toDataURL('image/jpeg',q);}
        ok(d);
      }catch(e){bad(e);}
    };
    im.onerror=function(){URL.revokeObjectURL(u);bad(new Error('เปิดไฟล์รูปไม่ได้ ลองใช้ไฟล์ JPG หรือ PNG'));};
    im.src=u;
  });
}
async function avSave(id,data){
  if(busy)return;busy=true;avErr='';avMsg='';
  try{await rpc('set_avatar',{p_emp:id,p_avatar:data});await loadAll();avMsg=data?'เปลี่ยนรูปแล้ว':'ลบรูปแล้ว';toast(avMsg,(emp(id)||{}).name||'');}
  catch(er){avErr=errMsg(er);toast('บันทึกรูปไม่สำเร็จ',avErr,'warn');}
  busy=false;renderAll();
}
async function avChosen(e){
  var f=e.target.files&&e.target.files[0],id=avFor;if(!f||!id)return;
  if(!/^image\//.test(f.type)){toast('บันทึกรูปไม่สำเร็จ','เลือกไฟล์รูปภาพ','warn');return;}
  try{var d=await avShrink(f);await avSave(id,d);}catch(er){toast('บันทึกรูปไม่สำเร็จ',errMsg(er),'warn');}
}
function avButtons(e){
  if(!canEditAv(e))return '';
  return '<div class="row avbtns" style="gap:6px"><button class="btn sec sm" data-act="av-pick" data-id="'+e.id+'">'+ico(CAM)+'<span>'+(e.avatar?'เปลี่ยนรูป':'ใส่รูป')+'</span></button>'+
    (e.avatar?'<button class="btn sec sm" data-act="av-del" data-id="'+e.id+'">ลบรูป</button>':'')+'</div>';
}
function nameHtml(e){
  if(nameEd===null)return '<h2>'+esc(e.name)+'</h2>';
  return '<div class="nameed"><label for="myName" class="small">ชื่อที่แสดง</label><input id="myName" maxlength="60" value="'+esc(nameEd)+'">'+
    '<div class="err" role="alert">'+esc(nameErr)+'</div><div class="row" style="gap:6px"><button class="btn sm" data-act="name-save">บันทึกชื่อ</button><button class="btn sec sm" data-act="name-cancel">ยกเลิก</button></div></div>';
}
function permCard(){
  if(!me||me.role!=='admin')return '';
  var sw=function(k,on,label,sub){return '<button type="button" class="swrow permsw" role="switch" aria-checked="'+on+'" data-act="perm-set" data-k="'+k+'"><span class="grow"><b>'+label+'</b><br><span class="muted small">'+sub+'</span></span><span class="sw'+(on?' on':'')+'"><i></i></span></button>';};
  return '<section class="card stack"><h2>สิทธิ์ของพนักงาน</h2><div class="list">'+
    sw('avatar',ST().allowAvatar,'อนุญาตให้แก้รูปของตัวเอง','เปิด: พนักงานเปลี่ยน/ลบรูปโปรไฟล์ของตัวเองได้')+
    sw('name',ST().allowName,'อนุญาตให้แก้ชื่อของตัวเอง','เปิด: พนักงานแก้ชื่อที่แสดงของตัวเองได้')+
    '</div></section>';
}
document.addEventListener('input',function(e){if(e.target&&e.target.id==='myName'){nameEd=e.target.value;}});
document.addEventListener('keydown',function(e){if(e.target&&e.target.id==='myName'&&e.key==='Enter'){e.preventDefault();var b=document.querySelector('[data-act="name-save"]');if(b)b.click();}});
document.addEventListener('click',async function(e){
  var b=e.target.closest&&e.target.closest('[data-act]');if(!b||!me||b.disabled)return;
  var a=b.getAttribute('data-act'),id=b.getAttribute('data-id');
  if(a==='av-pick'){e.stopPropagation();if(canEditAv(emp(id)))avPick(id);return;}
  if(a==='av-del'){e.stopPropagation();if(canEditAv(emp(id)))avSave(id,null);return;}
  if(a==='name-edit'){e.stopPropagation();if(!canEditName())return;nameEd=me.name;nameErr='';renderView();var i=document.getElementById('myName');if(i){i.focus();i.select();}return;}
  if(a==='name-cancel'){e.stopPropagation();nameEd=null;nameErr='';renderView();return;}
  if(a==='name-save'){
    e.stopPropagation();var nm=(nameEd||'').trim();
    if(nm.length<2||nm.length>60){nameErr='ชื่อต้องยาว 2–60 ตัวอักษร';renderView();return;}
    if(busy)return;busy=true;
    try{await rpc('set_my_name',{p_name:nm});await loadAll();nameEd=null;nameErr='';toast('เปลี่ยนชื่อแล้ว',nm);}catch(er){nameErr=errMsg(er);}
    busy=false;renderAll();return;
  }
  if(a==='perm-set'){
    e.stopPropagation();if(me.role!=='admin'||busy)return;var k=b.getAttribute('data-k'),on=b.getAttribute('aria-checked')!=='true';busy=true;
    try{await rpc('admin_set_profile_perms',{p_avatar:k==='avatar'?on:null,p_name:k==='name'?on:null});await loadAll();}catch(er){toast('บันทึกไม่สำเร็จ',errMsg(er),'warn');}
    busy=false;renderView();var nb=document.querySelector('[data-act="perm-set"][data-k="'+k+'"]');if(nb)try{nb.focus({preventScroll:true});}catch(x){}return;
  }
},true);
