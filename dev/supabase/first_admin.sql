-- รันหลังจากสร้างผู้ใช้ admin@wifi-check.app ในเมนู Authentication > Users แล้ว
insert into public.profiles(id, username, name, role)
select id, 'admin', 'ผู้ดูแลระบบ', 'admin'
from auth.users
where email = 'admin@wifi-check.app'
on conflict (id) do update set role = 'admin', active = true;

-- ตรวจผล: ต้องเห็น 1 แถว ชื่อผู้ใช้ admin บทบาท admin
select username, name, role, active from public.profiles;
