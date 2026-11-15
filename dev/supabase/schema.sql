-- =====================================================================
-- WiFi-Check : ฐานข้อมูล Supabase (Postgres)
-- วิธีใช้: Supabase > SQL Editor > New query > วางทั้งไฟล์ > Run
-- รันซ้ำได้ (ไม่ลบข้อมูลเดิม)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- ตารางกะ (คงที่) ----------
create table if not exists public.shifts (
  id         text primary key,
  team       text not null check (team in ('A','B')),
  start_time time not null,
  end_time   time not null
);
insert into public.shifts(id,team,start_time,end_time) values
  ('A1','A','08:30','17:30'),
  ('A2','A','10:00','19:00'),
  ('A3','A','18:00','03:00'),
  ('A4','A','23:30','08:30'),
  ('B1','B','07:00','19:00'),
  ('B2','B','19:00','07:00')
on conflict (id) do update set team=excluded.team,start_time=excluded.start_time,end_time=excluded.end_time;

-- ---------- ตั้งค่ากฎ (แถวเดียว) ----------
create table if not exists public.settings (
  id          int primary key default 1 check (id = 1),
  open_before int not null default 30 check (open_before between 0 and 240),
  late_after  int not null default 30 check (late_after between 0 and 240)
);
insert into public.settings(id) values (1) on conflict do nothing;

-- ---------- โปรไฟล์พนักงาน (ผูกกับบัญชีล็อกอินของ Supabase Auth) ----------
create table if not exists public.profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  username  text not null unique check (username ~ '^[a-z0-9._-]{3,20}$'),
  name      text not null,
  role      text not null default 'staff' check (role in ('admin','staff')),
  team      text check (team in ('A','B','OPS')),
  shift_id  text references public.shifts(id),
  phone     text not null default '',
  active    boolean not null default true,
  can_work  boolean not null default false,     -- ผู้ดูแลที่ช่วยทำงานแทนได้
  notify    boolean not null default true,      -- เปิด/ปิดแจ้งเตือนในเว็บ
  created_at timestamptz not null default now()
);
-- ผู้ประจำกะหนึ่งกะมีได้คนเดียว (เฉพาะที่ใช้งานอยู่)
create unique index if not exists profiles_one_per_shift
  on public.profiles(shift_id) where shift_id is not null and active and role = 'staff';

-- ---------- ใบลา ----------
create table if not exists public.leaves (
  id         uuid primary key default gen_random_uuid(),
  emp        uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('vac','per','sick')),
  from_date  date not null,
  to_date    date not null,
  days       int  not null check (days > 0),
  reason     text not null default '',
  status     text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  note       text not null default '',
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (to_date >= from_date)
);

-- ---------- กะที่เปลี่ยนเป็นหยุด + ผู้ทำแทน ----------
create table if not exists public.overrides (
  work_date date not null,
  shift_id  text not null references public.shifts(id),
  cover     uuid references public.profiles(id) on delete set null,
  note      text not null default '',
  kind      text not null default '',
  leave_id  uuid references public.leaves(id) on delete set null,
  set_by    uuid references public.profiles(id) on delete set null,
  set_at    timestamptz not null default now(),
  primary key (work_date, shift_id)
);

-- ---------- บันทึกเวลาเข้า-ออก ----------
create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  emp        uuid not null references public.profiles(id) on delete cascade,
  work_date  date not null,               -- วันที่เริ่มกะ (กะข้ามคืนนับเป็นวันที่เริ่ม)
  shift_id   text not null references public.shifts(id),
  check_in   timestamptz not null,
  check_out  timestamptz,
  late_min   int not null default 0,
  late_flag  boolean not null default false,
  early_min  int not null default 0,
  early_flag boolean not null default false,
  is_cover   boolean not null default false,
  unique (emp, work_date, shift_id),
  unique (work_date, shift_id)
);
create index if not exists attendance_date_idx on public.attendance(work_date);

-- ---------- แจ้งเตือน ----------
create table if not exists public.notifications (
  id     uuid primary key default gen_random_uuid(),
  ts     timestamptz not null default now(),
  to_ids uuid[] not null default '{}',     -- ผู้รับ (ผู้ดูแลเห็นทุกรายการเสมอ)
  title  text not null,
  body   text not null default '',
  kind   text not null default ''
);
create index if not exists notifications_ts_idx on public.notifications(ts desc);
create table if not exists public.notification_reads (
  notif_id uuid not null references public.notifications(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (notif_id, user_id)
);

-- =====================================================================
-- ฟังก์ชันช่วย
-- =====================================================================
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and active);
$$;

create or replace function public.team_works(p_team text, p_date date) returns boolean
language sql immutable as $$
  select case p_team
    when 'A' then extract(dow from p_date) in (1,2,3,4,5)
    when 'B' then extract(dow from p_date) in (5,6,0,1)
    else false end;
$$;

create or replace function public.shift_start(p_date date, p_shift text) returns timestamptz
language sql stable as $$
  select ((p_date + s.start_time) at time zone 'Asia/Bangkok') from public.shifts s where s.id = p_shift;
$$;
create or replace function public.shift_end(p_date date, p_shift text) returns timestamptz
language sql stable as $$
  select public.shift_start(p_date, p_shift)
       + (case when s.end_time <= s.start_time then s.end_time - s.start_time + interval '24 hours'
               else s.end_time - s.start_time end)
  from public.shifts s where s.id = p_shift;
$$;

create or replace function public.notify_users(p_to uuid[], p_title text, p_body text, p_kind text default '')
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(to_ids,title,body,kind) values (coalesce(p_to,'{}'),p_title,p_body,coalesce(p_kind,''));
$$;
revoke all on function public.notify_users(uuid[],text,text,text) from public, anon, authenticated;

-- =====================================================================
-- ลงเวลาเข้างาน / ออกงาน (ใช้เวลาจากเซิร์ฟเวอร์เท่านั้น)
-- =====================================================================
create or replace function public.check_in(p_date date, p_shift text)
returns public.attendance language plpgsql security definer set search_path = public as $$
declare
  me public.profiles; st settings; sh shifts; ov overrides; reg public.profiles;
  t timestamptz := now(); s_ts timestamptz; e_ts timestamptz;
  works uuid; is_cov boolean := false; late int; rec public.attendance;
begin
  select * into me from profiles where id = auth.uid() and active;
  if me.id is null then raise exception 'บัญชีนี้ไม่ได้ใช้งาน'; end if;
  select * into st from settings where id = 1;
  select * into sh from shifts where id = p_shift;
  if sh.id is null then raise exception 'ไม่พบกะนี้'; end if;
  if not team_works(sh.team, p_date) then raise exception 'ทีมนี้ไม่ทำงานวันดังกล่าว'; end if;

  select * into reg from profiles where shift_id = p_shift and active and role = 'staff';
  select * into ov from overrides where work_date = p_date and shift_id = p_shift;
  if ov.work_date is not null then works := ov.cover; is_cov := true; else works := reg.id; end if;
  if works is distinct from me.id then raise exception 'คุณไม่ได้อยู่ในกะนี้'; end if;

  s_ts := shift_start(p_date, p_shift); e_ts := shift_end(p_date, p_shift);
  if t < s_ts - make_interval(mins => st.open_before) then raise exception 'ยังไม่ถึงเวลาเปิดให้ลงเวลา'; end if;
  if t > e_ts then raise exception 'กะนี้สิ้นสุดแล้ว'; end if;
  if exists(select 1 from attendance where emp = me.id and check_out is null) then
    raise exception 'ยังมีกะที่ไม่ได้ออกงาน';
  end if;

  late := floor(extract(epoch from (t - s_ts)) / 60);   -- ติดลบ = เข้าก่อนเวลา
  insert into attendance(emp,work_date,shift_id,check_in,late_min,late_flag,is_cover)
  values (me.id,p_date,p_shift,t,greatest(0,late),late > st.late_after,is_cov)
  returning * into rec;

  if rec.late_flag then
    perform notify_users(array[me.id],'เข้างานสาย',me.name||' เข้างานสาย '||rec.late_min||' นาที (กะ '||to_char(sh.start_time,'HH24.MI')||' · '||to_char(p_date,'DD/MM')||')','warn');
  end if;
  return rec;
exception when unique_violation then
  raise exception 'ลงเวลาเข้างานกะนี้ไปแล้ว';
end $$;

create or replace function public.check_out(p_id uuid)
returns public.attendance language plpgsql security definer set search_path = public as $$
declare rec public.attendance; me public.profiles; e_ts timestamptz; t timestamptz := now(); early int;
begin
  select * into me from profiles where id = auth.uid() and active;
  select * into rec from attendance where id = p_id and emp = auth.uid();
  if rec.id is null then raise exception 'ไม่พบรายการเข้างาน'; end if;
  if rec.check_out is not null then raise exception 'ออกงานไปแล้ว'; end if;
  e_ts := shift_end(rec.work_date, rec.shift_id);
  early := floor(extract(epoch from (e_ts - t)) / 60);
  update attendance set check_out = t, early_min = greatest(0,early), early_flag = early > 0
   where id = p_id returning * into rec;
  if rec.early_flag then
    perform notify_users(array[me.id],'ออกงานก่อนเวลา',me.name||' ออกงานก่อนเวลา '||rec.early_min||' นาที ('||to_char(rec.work_date,'DD/MM')||')','warn');
  end if;
  return rec;
end $$;

-- =====================================================================
-- ลา: ยื่น / ยกเลิก / อนุมัติ / ไม่อนุมัติ
-- =====================================================================
create or replace function public.leave_slots(p_emp uuid, p_from date, p_to date)
returns table(work_date date, shift_id text) language sql stable security definer set search_path = public as $$
  select d::date, p.shift_id
  from profiles p, generate_series(p_from, p_to, interval '1 day') d
  join shifts s on true
  where p.id = p_emp and p.shift_id is not null and s.id = p.shift_id and team_works(s.team, d::date);
$$;

create or replace function public.request_leave(p_type text, p_from date, p_to date, p_reason text)
returns public.leaves language plpgsql security definer set search_path = public as $$
declare me public.profiles; n int; used int; quota int; rec public.leaves; today date := (now() at time zone 'Asia/Bangkok')::date;
begin
  select * into me from profiles where id = auth.uid() and active;
  if me.shift_id is null then raise exception 'บัญชีนี้ไม่มีกะประจำ'; end if;
  if p_type not in ('vac','per','sick') then raise exception 'ประเภทการลาไม่ถูกต้อง'; end if;
  if p_to < p_from then raise exception 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม'; end if;
  if p_from < (case when p_type = 'sick' then today - 7 else today end) then
    raise exception '%', case when p_type = 'sick' then 'ลาป่วยย้อนหลังได้ไม่เกิน 7 วัน' else 'เลือกวันที่ตั้งแต่วันนี้เป็นต้นไป' end;
  end if;
  select count(*) into n from leave_slots(me.id, p_from, p_to);
  if n = 0 then raise exception 'ช่วงนี้ไม่มีกะของคุณ ไม่ต้องยื่นลา'; end if;
  if exists(select 1 from leaves where emp = me.id and status in ('pending','approved') and from_date <= p_to and to_date >= p_from) then
    raise exception 'มีคำขอลาที่ทับช่วงวันนี้อยู่แล้ว';
  end if;
  quota := case p_type when 'vac' then 10 when 'per' then 3 else 30 end;
  select coalesce(sum(days),0) into used from leaves
   where emp = me.id and type = p_type and status in ('pending','approved') and extract(year from from_date) = extract(year from p_from);
  if used + n > quota then raise exception 'เกินสิทธิ์คงเหลือ'; end if;
  insert into leaves(emp,type,from_date,to_date,days,reason) values (me.id,p_type,p_from,p_to,n,left(coalesce(p_reason,''),120)) returning * into rec;
  perform notify_users('{}', 'คำขอลาใหม่', me.name||' ขอลา รออนุมัติ ('||n||' วัน)', '');
  return rec;
end $$;

create or replace function public.cancel_leave(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update leaves set status = 'cancelled' where id = p_id and emp = auth.uid() and status = 'pending';
  if not found then raise exception 'ยกเลิกไม่ได้'; end if;
end $$;

-- p_covers = [{"work_date":"2026-11-20","shift_id":"A1","cover":"<uuid>"}, ...] ต้องครบทุกกะ
create or replace function public.approve_leave(p_id uuid, p_covers jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare l public.leaves; e public.profiles; slot record; c uuid; lbl text;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  select * into l from leaves where id = p_id and status = 'pending';
  if l.id is null then raise exception 'ไม่พบคำขอที่รออนุมัติ'; end if;
  select * into e from profiles where id = l.emp;
  lbl := case l.type when 'vac' then 'ลาพักร้อน' when 'per' then 'ลากิจ' else 'ลาป่วย' end;
  for slot in select * from leave_slots(l.emp, l.from_date, l.to_date) loop
    select (x->>'cover')::uuid into c from jsonb_array_elements(p_covers) x
     where (x->>'work_date')::date = slot.work_date and x->>'shift_id' = slot.shift_id;
    if c is null then raise exception 'เลือกผู้ทำแทนให้ครบทุกกะ'; end if;
    if c = l.emp then raise exception 'ผู้ทำแทนต้องไม่ใช่คนเดียวกับผู้ลา'; end if;
    insert into overrides(work_date,shift_id,cover,note,kind,leave_id,set_by)
    values (slot.work_date,slot.shift_id,c,lbl,l.type,l.id,auth.uid())
    on conflict (work_date,shift_id) do update set cover=excluded.cover,note=excluded.note,kind=excluded.kind,leave_id=excluded.leave_id,set_by=excluded.set_by,set_at=now();
    perform notify_users(array[c],'มอบหมายให้ทำแทน','ทำแทน '||e.name||' วันที่ '||to_char(slot.work_date,'DD/MM'),'');
  end loop;
  update leaves set status='approved', decided_by=auth.uid(), decided_at=now() where id = p_id;
  perform notify_users(array[l.emp],'อนุมัติการลา','ผู้ดูแลอนุมัติ'||lbl||' '||to_char(l.from_date,'DD/MM')||' – '||to_char(l.to_date,'DD/MM'),'');
end $$;

create or replace function public.reject_leave(p_id uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare l public.leaves;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  update leaves set status='rejected', note=left(coalesce(p_note,''),120), decided_by=auth.uid(), decided_at=now()
   where id = p_id and status='pending' returning * into l;
  if l.id is null then raise exception 'ไม่พบคำขอที่รออนุมัติ'; end if;
  perform notify_users(array[l.emp],'ไม่อนุมัติการลา','คำขอลา '||to_char(l.from_date,'DD/MM')||' ไม่ได้รับอนุมัติ'||case when l.note<>'' then ' · '||l.note else '' end,'warn');
end $$;

-- ตั้งกะเป็นหยุด/กลับมาทำงาน (ผู้ดูแล)
create or replace function public.set_override(p_date date, p_shift text, p_cover uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  if p_cover is null then
    delete from overrides where work_date = p_date and shift_id = p_shift;
  else
    insert into overrides(work_date,shift_id,cover,note,set_by) values (p_date,p_shift,p_cover,left(coalesce(p_note,''),80),auth.uid())
    on conflict (work_date,shift_id) do update set cover=excluded.cover,note=excluded.note,kind='',leave_id=null,set_by=excluded.set_by,set_at=now();
  end if;
end $$;

-- ตั้งค่าแจ้งเตือนของตัวเอง + อ่านแล้ว
create or replace function public.set_my_notify(p_on boolean) returns void
language sql security definer set search_path = public as $$ update profiles set notify = p_on where id = auth.uid(); $$;
create or replace function public.mark_read(p_ids uuid[]) returns void
language sql security definer set search_path = public as $$
  insert into notification_reads(notif_id,user_id)
  select n.id, auth.uid() from notifications n where n.id = any(p_ids) and (is_admin() or auth.uid() = any(n.to_ids))
  on conflict do nothing;
$$;


-- เวลาจากเซิร์ฟเวอร์ (ให้หน้าเว็บใช้แสดงนาฬิกา ไม่เชื่อเวลาของเครื่องผู้ใช้)
create or replace function public.server_now() returns timestamptz
language sql stable as $$ select now() $$;

-- แจ้งเตือนที่ผู้ดูแลเป็นคนสร้าง (เปลี่ยนกะ นำเข้า ปรับกฎ ฯลฯ)
create or replace function public.admin_notify(p_to uuid[], p_title text, p_body text, p_kind text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  insert into notifications(to_ids,title,body,kind) values (coalesce(p_to,'{}'),left(p_title,120),left(coalesce(p_body,''),500),coalesce(p_kind,''));
end $$;

-- =====================================================================
-- RLS: เปิดทุกตาราง แล้วอนุญาตเฉพาะที่จำเป็น
-- =====================================================================
alter table public.shifts            enable row level security;
alter table public.settings          enable row level security;
alter table public.profiles          enable row level security;
alter table public.leaves            enable row level security;
alter table public.overrides         enable row level security;
alter table public.attendance        enable row level security;
alter table public.notifications     enable row level security;
alter table public.notification_reads enable row level security;

drop policy if exists shifts_read on public.shifts;
create policy shifts_read on public.shifts for select to authenticated using (true);

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select to authenticated using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using (is_admin()) with check (is_admin());
drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles for delete to authenticated using (is_admin() and id <> auth.uid());

drop policy if exists leaves_read on public.leaves;
create policy leaves_read on public.leaves for select to authenticated using (emp = auth.uid() or is_admin());

drop policy if exists overrides_read on public.overrides;
create policy overrides_read on public.overrides for select to authenticated using (true);

drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance for select to authenticated using (true);

drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select to authenticated using (is_admin() or auth.uid() = any(to_ids));

drop policy if exists reads_own on public.notification_reads;
create policy reads_own on public.notification_reads for select to authenticated using (user_id = auth.uid());

-- ไม่มี policy insert/update/delete สำหรับ leaves, overrides, attendance, notifications
-- การเขียนทั้งหมดต้องผ่านฟังก์ชันด้านบน (ซึ่งตรวจสิทธิ์และใช้เวลาเซิร์ฟเวอร์)

-- สิทธิ์เรียกฟังก์ชัน: เฉพาะผู้ที่ล็อกอิน
revoke all on all functions in schema public from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.server_now() to authenticated;
grant execute on function public.admin_notify(uuid[],text,text,text) to authenticated;
grant execute on function public.check_in(date,text) to authenticated;
grant execute on function public.check_out(uuid) to authenticated;
grant execute on function public.request_leave(text,date,date,text) to authenticated;
grant execute on function public.cancel_leave(uuid) to authenticated;
grant execute on function public.approve_leave(uuid,jsonb) to authenticated;
grant execute on function public.reject_leave(uuid,text) to authenticated;
grant execute on function public.set_override(date,text,uuid,text) to authenticated;
grant execute on function public.set_my_notify(boolean) to authenticated;
grant execute on function public.mark_read(uuid[]) to authenticated;
grant execute on function public.team_works(text,date) to authenticated;
grant execute on function public.shift_start(date,text) to authenticated;
grant execute on function public.shift_end(date,text) to authenticated;
revoke all on function public.leave_slots(uuid,date,date) from public, anon, authenticated;

-- ให้ฟังก์ชันอัปเดตข้อมูลผ่าน Realtime ได้ (ถ้าจะใช้ในอนาคต)
-- alter publication supabase_realtime add table public.attendance, public.notifications;
