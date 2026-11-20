-- ล้างเบอร์โทรพนักงานทั้งหมด (หน้าเว็บเลิกแสดง/เก็บเบอร์โทรแล้ว) · 20 พ.ย. 2569
update public.profiles set phone = '' where coalesce(phone,'') <> '';
