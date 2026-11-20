-- ลบคอลัมน์เบอร์โทรออกจาก profiles (หน้าเว็บและ Edge Function admin-users เลิกใช้แล้ว) · 20 พ.ย. 2569
alter table public.profiles drop column if exists phone;
