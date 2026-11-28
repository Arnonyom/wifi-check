-- 28–29 พ.ย. 2569: สิทธิ์วันลารายคน · ผู้ดูแลลาแทน · กติกาวันลาใหม่ · รูปโปรไฟล์ · ให้พนักงานแก้ชื่อ/รูปเองได้
-- migration: leave_quota_avatar

-- 1) ค่าตั้งต้นสิทธิ์วันลา (ใช้กับคนที่ยังไม่ได้กำหนดเอง) + สวิตช์สิทธิ์แก้รูป/ชื่อ
alter table public.settings
  add column if not exists q_vac int not null default 10 check (q_vac between 0 and 366),
  add column if not exists q_per int not null default 3 check (q_per between 0 and 366),
  add column if not exists q_sick int not null default 30 check (q_sick between 0 and 366),
  add column if not exists allow_avatar boolean not null default false,
  add column if not exists allow_name boolean not null default false;

-- 2) สิทธิ์วันลาที่ผู้ดูแลกำหนดให้แต่ละคน (ต่อปี ต่อประเภท)
create table if not exists public.leave_quota(
  emp uuid not null references public.profiles(id) on delete cascade,
  yr int not null check (yr between 2000 and 2200),
  type text not null check (type in ('vac','per','sick')),
  days int not null check (days between 0 and 366),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (emp, yr, type)
);
alter table public.leave_quota enable row level security;
drop policy if exists leave_quota_read on public.leave_quota;
create policy leave_quota_read on public.leave_quota for select using (emp = auth.uid() or is_admin());

-- 3) ประวัติการปรับสิทธิ์วันลา (ใครปรับ เมื่อไร จากเท่าไรเป็นเท่าไร)
create table if not exists public.leave_quota_log(
  id bigserial primary key,
  emp uuid not null references public.profiles(id) on delete cascade,
  yr int not null, type text not null, old_days int not null, new_days int not null,
  note text not null default '',
  by_id uuid references public.profiles(id) on delete set null,
  at timestamptz not null default now()
);
alter table public.leave_quota_log enable row level security;
drop policy if exists leave_quota_log_read on public.leave_quota_log;
create policy leave_quota_log_read on public.leave_quota_log for select using (emp = auth.uid() or is_admin());

-- 4) การลาที่ผู้ดูแลบันทึกแทน
alter table public.leaves add column if not exists by_admin uuid references public.profiles(id) on delete set null;

-- 5) รูปโปรไฟล์ (รูปเล็กที่ย่อในเครื่องแล้ว เก็บเป็น data URL)
alter table public.profiles add column if not exists avatar text
  check (avatar is null or (avatar like 'data:image/%' and length(avatar) <= 80000));

-- 6) ธีมหน้าจอของแต่ละคน (จำตามบัญชี ไม่ใช่ตามเครื่อง): {theme, glass, custom:{c, base}}
alter table public.profiles add column if not exists prefs jsonb not null default '{}'::jsonb
  check (jsonb_typeof(prefs) = 'object' and length(prefs::text) <= 1000);

-- สิทธิ์วันลาของคนหนึ่งในปีหนึ่ง (กำหนดเอง ถ้าไม่มีใช้ค่าตั้งต้น)
create or replace function public.leave_quota_of(p_emp uuid, p_yr int, p_type text)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(
    (select days from leave_quota where emp = p_emp and yr = p_yr and type = p_type),
    (select case p_type when 'vac' then q_vac when 'per' then q_per else q_sick end from settings where id = 1),
    0);
$$;

-- ผู้ดูแลกำหนด/เพิ่ม/ลดสิทธิ์วันลาให้หลายคนพร้อมกัน · p_mode: 'set' = ตั้งเป็น · 'add' = เพิ่ม (ติดลบ = ลด)
create or replace function public.admin_set_quota(p_emps uuid[], p_yr int, p_type text, p_mode text, p_days int, p_note text)
returns int language plpgsql security definer set search_path = public as $$
declare e uuid; o int; n int; c int := 0;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  if p_type not in ('vac','per','sick') then raise exception 'ประเภทการลาไม่ถูกต้อง'; end if;
  if p_mode not in ('set','add') then raise exception 'ข้อมูลไม่ถูกต้อง'; end if;
  if p_yr is null or p_yr < 2000 or p_yr > 2200 then raise exception 'ปีไม่ถูกต้อง'; end if;
  if p_days is null or abs(p_days) > 366 then raise exception 'จำนวนวันต้องอยู่ระหว่าง 0–366'; end if;
  if p_emps is null or cardinality(p_emps) = 0 then raise exception 'เลือกพนักงานอย่างน้อย 1 คน'; end if;
  foreach e in array p_emps loop
    if not exists(select 1 from profiles where id = e) then continue; end if;
    o := leave_quota_of(e, p_yr, p_type);
    n := greatest(0, least(366, case when p_mode = 'set' then p_days else o + p_days end));
    insert into leave_quota(emp, yr, type, days, updated_by, updated_at) values (e, p_yr, p_type, n, auth.uid(), now())
      on conflict (emp, yr, type) do update set days = excluded.days, updated_by = excluded.updated_by, updated_at = now();
    if n <> o then
      insert into leave_quota_log(emp, yr, type, old_days, new_days, note, by_id) values (e, p_yr, p_type, o, n, left(coalesce(p_note,''),120), auth.uid());
      c := c + 1;
    end if;
  end loop;
  return c;
end $$;

-- ผู้ดูแลตั้งค่าตั้งต้นสิทธิ์วันลา (คนที่ยังไม่ได้กำหนดเองจะได้ค่านี้)
create or replace function public.admin_set_leave_defaults(p_vac int, p_per int, p_sick int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  if least(p_vac,p_per,p_sick) < 0 or greatest(p_vac,p_per,p_sick) > 366 then raise exception 'จำนวนวันต้องอยู่ระหว่าง 0–366'; end if;
  update settings set q_vac = p_vac, q_per = p_per, q_sick = p_sick where id = 1;
end $$;

-- พนักงานยื่นลา (กติกาใหม่)
--  ลาพักร้อน/ลากิจ: วันเริ่มตั้งแต่วันนี้เป็นต้นไป (ลาวันนี้ได้ถึงเที่ยงคืน) ย้อนหลังไม่ได้
--  ลาป่วย: เริ่มได้เฉพาะวันนี้ (ตั้งแต่ 00.00) ลาล่วงหน้า/ย้อนหลังไม่ได้ ครั้งละไม่เกิน 3 วัน
--  สิทธิ์คงเหลือตามที่ผู้ดูแลกำหนดรายคน (leave_quota_of)
create or replace function public.request_leave(p_type text, p_from date, p_to date, p_reason text)
returns leaves language plpgsql security definer set search_path = public as $function$
declare me public.profiles; n int; used int; quota int; rec public.leaves; today date := (now() at time zone 'Asia/Bangkok')::date;
begin
  select * into me from profiles where id = auth.uid() and active;
  if me.shift_id is null then raise exception 'บัญชีนี้ไม่มีกะประจำ'; end if;
  if p_type not in ('vac','per','sick') then raise exception 'ประเภทการลาไม่ถูกต้อง'; end if;
  if p_to < p_from then raise exception 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม'; end if;
  if p_type = 'sick' then
    if p_from <> today then raise exception 'ลาป่วยต้องเริ่มวันนี้ (ลาล่วงหน้าหรือย้อนหลังไม่ได้)'; end if;
    if p_to > today + 2 then raise exception 'ลาป่วยได้ครั้งละไม่เกิน 3 วัน'; end if;
  elsif p_from < today then
    raise exception 'เลือกวันที่ตั้งแต่วันนี้เป็นต้นไป';
  end if;
  if p_to > p_from + 60 then raise exception 'ลาได้ครั้งละไม่เกิน 60 วัน'; end if;
  select count(*) into n from leave_slots(me.id, p_from, p_to);
  if n = 0 then raise exception 'ช่วงนี้ไม่มีกะของคุณ ไม่ต้องยื่นลา'; end if;
  if exists(select 1 from leaves where emp = me.id and status in ('pending','approved') and from_date <= p_to and to_date >= p_from) then
    raise exception 'มีคำขอลาที่ทับช่วงวันนี้อยู่แล้ว';
  end if;
  quota := leave_quota_of(me.id, extract(year from p_from)::int, p_type);
  select coalesce(sum(days),0) into used from leaves
   where emp = me.id and type = p_type and status in ('pending','approved') and extract(year from from_date) = extract(year from p_from);
  if used + n > quota then raise exception 'เกินสิทธิ์คงเหลือ'; end if;
  insert into leaves(emp,type,from_date,to_date,days,reason) values (me.id,p_type,p_from,p_to,n,left(coalesce(p_reason,''),120)) returning * into rec;
  perform notify_users('{}', 'คำขอลาใหม่', me.name||' ขอลา รออนุมัติ ('||n||' วัน)', '');
  return rec;
end $function$;

-- ผู้ดูแลบันทึกการลาแทนพนักงาน (ต้องใส่เหตุผล) · เลือกวันย้อนหลัง/ล่วงหน้าได้ · ยังต้องอยู่ในสิทธิ์คงเหลือ
-- สร้างเป็น "รออนุมัติ" แล้วผู้ดูแลเลือกผู้ทำแทนและอนุมัติต่อทันที (approve_leave เดิม)
create or replace function public.admin_request_leave(p_emp uuid, p_type text, p_from date, p_to date, p_reason text)
returns leaves language plpgsql security definer set search_path = public as $function$
declare e public.profiles; n int; used int; quota int; rec public.leaves; lbl text;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  select * into e from profiles where id = p_emp and active;
  if e.id is null then raise exception 'ไม่พบผู้ใช้'; end if;
  if e.shift_id is null then raise exception 'บัญชีนี้ไม่มีกะประจำ'; end if;
  if p_type not in ('vac','per','sick') then raise exception 'ประเภทการลาไม่ถูกต้อง'; end if;
  if p_to < p_from then raise exception 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม'; end if;
  if p_to > p_from + 60 then raise exception 'ลาได้ครั้งละไม่เกิน 60 วัน'; end if;
  if coalesce(btrim(p_reason),'') = '' then raise exception 'กรอกเหตุผลที่ลาแทน'; end if;
  select count(*) into n from leave_slots(e.id, p_from, p_to);
  if n = 0 then raise exception 'ช่วงนี้ไม่มีกะของพนักงานคนนี้'; end if;
  if exists(select 1 from leaves where emp = e.id and status in ('pending','approved') and from_date <= p_to and to_date >= p_from) then
    raise exception 'มีคำขอลาที่ทับช่วงวันนี้อยู่แล้ว';
  end if;
  quota := leave_quota_of(e.id, extract(year from p_from)::int, p_type);
  select coalesce(sum(days),0) into used from leaves
   where emp = e.id and type = p_type and status in ('pending','approved') and extract(year from from_date) = extract(year from p_from);
  if used + n > quota then raise exception 'เกินสิทธิ์คงเหลือ'; end if;
  insert into leaves(emp,type,from_date,to_date,days,reason,by_admin) values (e.id,p_type,p_from,p_to,n,left(btrim(p_reason),120),auth.uid()) returning * into rec;
  lbl := case p_type when 'vac' then 'ลาพักร้อน' when 'per' then 'ลากิจ' else 'ลาป่วย' end;
  perform notify_users(array[e.id], 'ผู้ดูแลบันทึกการลาให้', lbl||' '||to_char(p_from,'DD/MM')||' – '||to_char(p_to,'DD/MM')||' ('||n||' วัน)', '');
  return rec;
end $function$;

-- รูปโปรไฟล์: ผู้ดูแลแก้ได้ทุกคน · พนักงานแก้ของตัวเองได้เมื่อผู้ดูแลเปิดสิทธิ์ · p_avatar = null คือเอารูปออก
create or replace function public.set_avatar(p_emp uuid, p_avatar text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'ยังไม่ได้ล็อกอิน'; end if;
  if not is_admin() then
    if p_emp <> auth.uid() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
    if not coalesce((select allow_avatar from settings where id = 1), false) then raise exception 'ผู้ดูแลยังไม่เปิดให้แก้รูปเอง'; end if;
  end if;
  if p_avatar is not null and (p_avatar not like 'data:image/%' or length(p_avatar) > 80000) then raise exception 'รูปใหญ่เกินไปหรือไม่ใช่ไฟล์รูป'; end if;
  update profiles set avatar = p_avatar where id = p_emp;
  if not found then raise exception 'ไม่พบผู้ใช้'; end if;
end $$;

-- พนักงานแก้ชื่อตัวเอง (เมื่อผู้ดูแลเปิดสิทธิ์) · ผู้ดูแลแก้ชื่อคนอื่นในหน้าพนักงานเหมือนเดิม
create or replace function public.set_my_name(p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare nm text := btrim(coalesce(p_name,''));
begin
  if auth.uid() is null then raise exception 'ยังไม่ได้ล็อกอิน'; end if;
  if not is_admin() and not coalesce((select allow_name from settings where id = 1), false) then raise exception 'ผู้ดูแลยังไม่เปิดให้แก้ชื่อเอง'; end if;
  if length(nm) < 2 or length(nm) > 60 then raise exception 'ชื่อต้องยาว 2–60 ตัวอักษร'; end if;
  update profiles set name = nm where id = auth.uid();
end $$;

-- ผู้ดูแลเปิด/ปิดสิทธิ์ให้พนักงานแก้รูป/ชื่อเอง
create or replace function public.admin_set_profile_perms(p_avatar boolean, p_name boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  update settings set allow_avatar = coalesce(p_avatar, allow_avatar), allow_name = coalesce(p_name, allow_name) where id = 1;
end $$;

-- บันทึกธีมของตัวเอง (ทุกคน)
create or replace function public.set_my_prefs(p_prefs jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'ยังไม่ได้ล็อกอิน'; end if;
  if p_prefs is null or jsonb_typeof(p_prefs) <> 'object' or length(p_prefs::text) > 1000 then raise exception 'ข้อมูลไม่ถูกต้อง'; end if;
  update profiles set prefs = p_prefs where id = auth.uid();
end $$;

revoke execute on function public.set_my_prefs(jsonb) from public, anon;
grant execute on function public.set_my_prefs(jsonb) to authenticated;
revoke execute on function public.leave_quota_of(uuid,int,text) from public, anon;
grant execute on function public.leave_quota_of(uuid,int,text) to authenticated;
revoke execute on function public.admin_set_quota(uuid[],int,text,text,int,text) from public, anon;
grant execute on function public.admin_set_quota(uuid[],int,text,text,int,text) to authenticated;
revoke execute on function public.admin_set_leave_defaults(int,int,int) from public, anon;
grant execute on function public.admin_set_leave_defaults(int,int,int) to authenticated;
revoke execute on function public.admin_request_leave(uuid,text,date,date,text) from public, anon;
grant execute on function public.admin_request_leave(uuid,text,date,date,text) to authenticated;
revoke execute on function public.set_avatar(uuid,text) from public, anon;
grant execute on function public.set_avatar(uuid,text) to authenticated;
revoke execute on function public.set_my_name(text) from public, anon;
grant execute on function public.set_my_name(text) to authenticated;
revoke execute on function public.admin_set_profile_perms(boolean,boolean) from public, anon;
grant execute on function public.admin_set_profile_perms(boolean,boolean) to authenticated;
