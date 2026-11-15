-- ทีม A หมุนครบ 4 กะ (10.00 → 18.00 → 23.30 → 08.30 → 10.00) · ทีม B รอบ 2 สัปดาห์ (ทำ 4 หยุด 3 / ทำ 3 หยุด 4) สลับกะทุก 2 สัปดาห์
alter table public.rota_periods add column if not exists a1 uuid references public.profiles(id) on delete set null; -- คนที่อยู่กะ 08.30
alter table public.rota_periods add column if not exists cyc int not null default 3;  -- 3 = แบบเดิม (08.30 คงที่), 4 = หมุนครบ 4 กะ
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'rota_periods_cyc_check') then
    alter table public.rota_periods add constraint rota_periods_cyc_check check (cyc in (3,4));
  end if;
end $$;

create table if not exists public.rota_b(
  start_date date primary key check (extract(isodow from start_date) = 5),  -- วันศุกร์แรกของรอบ (ทำ 4 วันก่อน)
  active  boolean not null default true,
  b_day   uuid references public.profiles(id) on delete set null,  -- คนกะ 07.00 ในรอบแรก
  b_night uuid references public.profiles(id) on delete set null,  -- คนกะ 19.00 ในรอบแรก
  set_by  uuid references public.profiles(id) on delete set null,
  set_at  timestamptz not null default now()
);
alter table public.rota_b enable row level security;
drop policy if exists rota_b_read on public.rota_b;
create policy rota_b_read on public.rota_b for select to authenticated using (true);
grant select on public.rota_b to authenticated;

create or replace function public.rota_b_at(p_date date) returns public.rota_b
language sql stable security definer set search_path = public as $$
  select * from public.rota_b where start_date <= p_date order by start_date desc limit 1;
$$;

-- วันทำงานของทีม
create or replace function public.team_works(p_team text, p_date date) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r public.rota_b;
begin
  if p_team = 'A' then return extract(dow from p_date) in (1,2,3,4,5); end if;
  if p_team <> 'B' then return false; end if;
  r := rota_b_at(p_date);
  if r.start_date is null or not r.active then return extract(dow from p_date) in (5,6,0,1); end if;
  return ((p_date - r.start_date) % 14) in (0,1,2,3,7,8,9);   -- ศ.–จ. แล้ว ศ.–อา.
end $$;

create or replace function public.shift_on(p_emp uuid, p_date date) returns text
language plpgsql stable security definer set search_path = public as $$
declare r public.rota_periods; rb public.rota_b; p public.profiles; i int; k int; n int; sh text[]; ids uuid[]; c int;
begin
  select * into p from profiles where id = p_emp;
  if p.id is null then return null; end if;
  if p.shift_id in ('B1','B2') or p.team = 'B' then
    rb := rota_b_at(p_date);
    if rb.start_date is null or not rb.active then return p.shift_id; end if;
    c := ((p_date - rb.start_date) / 14) % 2;
    if p_emp = rb.b_day then return case when c = 0 then 'B1' else 'B2' end; end if;
    if p_emp = rb.b_night then return case when c = 0 then 'B2' else 'B1' end; end if;
    return case when p.shift_id in ('B1','B2') then null else p.shift_id end;
  end if;
  r := rota_at(p_date);
  if r.week_from is null or not r.active then return p.shift_id; end if;
  n := r.cyc;
  sh := (array['A2','A3','A4','A1'])[1:n];
  ids := (array[r.a2, r.a3, r.a4, r.a1])[1:n];
  i := array_position(ids, p_emp);
  if i is null then
    return case when p.shift_id = any(sh) then null else p.shift_id end;
  end if;
  k := (date_trunc('week', p_date)::date - r.week_from) / 7;
  return sh[((i - 1 + k) % n + n) % n + 1];
end $$;

create or replace function public.regular_of(p_date date, p_shift text) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare r public.rota_periods; rb public.rota_b; j int; k int; n int; who uuid; c int; ids uuid[];
begin
  if p_shift = 'A5' then return null; end if;
  if p_shift in ('B1','B2') then
    rb := rota_b_at(p_date);
    if rb.start_date is not null and rb.active then
      c := ((p_date - rb.start_date) / 14) % 2;
      who := case when (p_shift = 'B1') = (c = 0) then rb.b_day else rb.b_night end;
      return (select id from profiles where id = who and active and role = 'staff');
    end if;
    return (select id from profiles where shift_id = p_shift and active and role = 'staff' limit 1);
  end if;
  r := rota_at(p_date);
  if r.week_from is not null and r.active then
    n := r.cyc;
    ids := (array[r.a2, r.a3, r.a4, r.a1])[1:n];
    j := array_position((array['A2','A3','A4','A1'])[1:n], p_shift);
    if j is not null then
      k := (date_trunc('week', p_date)::date - r.week_from) / 7;
      who := ids[((j - 1 - k) % n + n) % n + 1];
      return (select id from profiles where id = who and active and role = 'staff');
    end if;
    return (select id from profiles where shift_id = p_shift and active and role = 'staff' and not (id = any(array_remove(ids, null))) limit 1);
  end if;
  return (select id from profiles where shift_id = p_shift and active and role = 'staff' limit 1);
end $$;

-- ตั้งการหมุนกะทีม A (4 กะ) ตั้งแต่สัปดาห์ของ p_week · p_week = null คือปิดการหมุนตั้งแต่สัปดาห์นี้
drop function if exists public.set_rotation(date,uuid,uuid,uuid);
create or replace function public.set_rotation(p_week date, p_a2 uuid, p_a3 uuid, p_a4 uuid, p_a1 uuid)
returns void language plpgsql security definer set search_path = public as $$
declare ids uuid[] := array_remove(array[p_a2,p_a3,p_a4,p_a1], null); x uuid;
  wk date := date_trunc('week', coalesce(p_week, (now() at time zone 'Asia/Bangkok')::date))::date;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  delete from rota_periods where week_from > wk;
  if p_week is null then
    insert into rota_periods(week_from,active,cyc,set_by) values (wk,false,4,auth.uid())
    on conflict (week_from) do update set active=false,a1=null,a2=null,a3=null,a4=null,set_by=excluded.set_by,set_at=now();
    return;
  end if;
  if cardinality(ids) = 0 then raise exception 'เลือกอย่างน้อย 1 คน'; end if;
  if (select count(distinct v) from unnest(ids) v) <> cardinality(ids) then raise exception 'เลือกคนซ้ำกันไม่ได้'; end if;
  foreach x in array ids loop
    if not exists(select 1 from profiles where id = x and active and role = 'staff' and team = 'A') then
      raise exception 'ต้องเลือกพนักงานทีม A ที่ใช้งานอยู่';
    end if;
  end loop;
  insert into rota_periods(week_from,active,cyc,a2,a3,a4,a1,set_by) values (wk,true,4,p_a2,p_a3,p_a4,p_a1,auth.uid())
  on conflict (week_from) do update set active=true,cyc=4,a2=excluded.a2,a3=excluded.a3,a4=excluded.a4,a1=excluded.a1,set_by=excluded.set_by,set_at=now();
  -- ไม่แก้กะในโปรไฟล์ เพื่อให้สัปดาห์ก่อนเริ่มรอบยังเป็นแบบเดิม
  perform notify_users(ids, 'ตารางหมุนกะ', 'ผู้ดูแลตั้งการหมุนกะทีม A เริ่มสัปดาห์ '||to_char(wk,'DD/MM'), '');
end $$;

-- ตั้งรอบทีม B เริ่มวันศุกร์ p_start (ทำ 4 วันก่อน) · p_day = คนกะ 07.00 ในรอบแรก · ทั้งคู่ null = ปิดรอบ ใช้ ศ.–จ. ทุกสัปดาห์
create or replace function public.set_rotation_b(p_start date, p_day uuid, p_night uuid)
returns void language plpgsql security definer set search_path = public as $$
declare ids uuid[] := array_remove(array[p_day,p_night], null); x uuid;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  if p_start is null or extract(isodow from p_start) <> 5 then raise exception 'วันเริ่มรอบต้องเป็นวันศุกร์'; end if;
  delete from rota_b where start_date > p_start;
  if cardinality(ids) = 0 then
    insert into rota_b(start_date,active,set_by) values (p_start,false,auth.uid())
    on conflict (start_date) do update set active=false,b_day=null,b_night=null,set_by=excluded.set_by,set_at=now();
    return;
  end if;
  if p_day = p_night then raise exception 'เลือกคนซ้ำกันไม่ได้'; end if;
  foreach x in array ids loop
    if not exists(select 1 from profiles where id = x and active and role = 'staff' and team = 'B') then
      raise exception 'ต้องเลือกพนักงานทีม B ที่ใช้งานอยู่';
    end if;
  end loop;
  insert into rota_b(start_date,active,b_day,b_night,set_by) values (p_start,true,p_day,p_night,auth.uid())
  on conflict (start_date) do update set active=true,b_day=excluded.b_day,b_night=excluded.b_night,set_by=excluded.set_by,set_at=now();
  -- ไม่แก้กะในโปรไฟล์ เพื่อให้ช่วงก่อนเริ่มรอบยังเป็นแบบเดิม
  perform notify_users(ids, 'ตารางกะทีม B', 'ผู้ดูแลตั้งรอบทำงานทีม B เริ่ม '||to_char(p_start,'DD/MM'), '');
end $$;

revoke all on function public.rota_b_at(date) from public, anon;
revoke all on function public.team_works(text,date) from public, anon;
revoke all on function public.set_rotation(date,uuid,uuid,uuid,uuid) from public, anon;
revoke all on function public.set_rotation_b(date,uuid,uuid) from public, anon;
grant execute on function public.rota_b_at(date) to authenticated;
grant execute on function public.team_works(text,date) to authenticated;
grant execute on function public.set_rotation(date,uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.set_rotation_b(date,uuid,uuid) to authenticated;
notify pgrst, 'reload schema';
