-- ทีม A: หมุนกะ 10.00 / 18.00 / 23.30 ทุกวันจันทร์ (รอบ 3 สัปดาห์) + กะฉุกเฉิน 19.00–04.00
-- เก็บการตั้งหมุนกะเป็นช่วง ๆ (มีผลตั้งแต่สัปดาห์ week_from) เพื่อไม่ให้ประวัติย้อนหลังเปลี่ยนเมื่อแก้การหมุนกะ
create table if not exists public.rota_periods(
  week_from date primary key check (extract(isodow from week_from) = 1),
  active    boolean not null default true,
  a2 uuid references public.profiles(id) on delete set null,   -- คนที่อยู่กะ 10.00 ในสัปดาห์ week_from
  a3 uuid references public.profiles(id) on delete set null,   -- กะ 18.00
  a4 uuid references public.profiles(id) on delete set null,   -- กะ 23.30
  set_by uuid references public.profiles(id) on delete set null,
  set_at timestamptz not null default now()
);
alter table public.rota_periods enable row level security;
drop policy if exists rota_read on public.rota_periods;
create policy rota_read on public.rota_periods for select to authenticated using (true);
grant select on public.rota_periods to authenticated;
insert into public.shifts(id,team,start_time,end_time) values ('A5','A','19:00','04:00') on conflict (id) do nothing;

create or replace function public.rota_at(p_date date) returns public.rota_periods
language sql stable security definer set search_path = public as $$
  select * from public.rota_periods where week_from <= date_trunc('week', p_date)::date order by week_from desc limit 1;
$$;

-- กะที่พนักงานคนนี้ทำในวันที่กำหนด
create or replace function public.shift_on(p_emp uuid, p_date date) returns text
language plpgsql stable security definer set search_path = public as $$
declare r public.rota_periods; p public.profiles; i int; k int;
begin
  select * into p from profiles where id = p_emp;
  if p.id is null then return null; end if;
  r := rota_at(p_date);
  if r.week_from is null or not r.active then return p.shift_id; end if;
  i := array_position(array[r.a2, r.a3, r.a4], p_emp);
  if i is null then
    return case when p.shift_id in ('A2','A3','A4') then null else p.shift_id end;
  end if;
  k := (date_trunc('week', p_date)::date - r.week_from) / 7;
  return (array['A2','A3','A4'])[((i - 1 + k) % 3 + 3) % 3 + 1];
end $$;

-- ผู้ประจำกะ (ก่อนคิดการหยุด/ทำแทน) ของวันที่และกะที่กำหนด
create or replace function public.regular_of(p_date date, p_shift text) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare r public.rota_periods; j int; k int; who uuid;
begin
  if p_shift = 'A5' then return null; end if;
  j := array_position(array['A2','A3','A4'], p_shift);
  r := rota_at(p_date);
  if j is not null and r.week_from is not null and r.active then
    k := (date_trunc('week', p_date)::date - r.week_from) / 7;
    who := (array[r.a2, r.a3, r.a4])[((j - 1 - k) % 3 + 3) % 3 + 1];
    return (select id from profiles where id = who and active and role = 'staff');
  end if;
  select id into who from profiles where shift_id = p_shift and active and role = 'staff'
    and (r.week_from is null or not r.active or not (id = any(array[r.a2, r.a3, r.a4]))) limit 1;
  return who;
end $$;

create or replace function public.leave_slots(p_emp uuid, p_from date, p_to date)
returns table(work_date date, shift_id text) language sql stable security definer set search_path = public as $$
  select d::date, x.sid
  from generate_series(p_from, p_to, interval '1 day') d
  cross join lateral (select public.shift_on(p_emp, d::date) sid) x
  join public.shifts s on s.id = x.sid
  where public.team_works(s.team, d::date);
$$;

create or replace function public.check_in(p_date date, p_shift text)
returns public.attendance language plpgsql security definer set search_path = public as $$
declare
  me public.profiles; st settings; sh shifts; ov overrides;
  t timestamptz := now(); s_ts timestamptz; e_ts timestamptz;
  works uuid; is_cov boolean := false; late int; rec public.attendance;
begin
  select * into me from profiles where id = auth.uid() and active;
  if me.id is null then raise exception 'บัญชีนี้ไม่ได้ใช้งาน'; end if;
  select * into st from settings where id = 1;
  select * into sh from shifts where id = p_shift;
  if sh.id is null then raise exception 'ไม่พบกะนี้'; end if;
  if not team_works(sh.team, p_date) then raise exception 'ทีมนี้ไม่ทำงานวันดังกล่าว'; end if;

  select * into ov from overrides where work_date = p_date and shift_id = p_shift;
  if ov.work_date is not null then works := ov.cover; is_cov := true; else works := regular_of(p_date, p_shift); end if;
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

-- ผู้ดูแลตั้งการหมุนกะ: ระบุว่าใครอยู่กะ 10.00 / 18.00 / 23.30 ในสัปดาห์ของ p_week
-- (p_week = null คือปิดการหมุนตั้งแต่สัปดาห์นี้) · สัปดาห์ก่อนหน้ายังคงเป็นแบบเดิม
create or replace function public.set_rotation(p_week date, p_a2 uuid, p_a3 uuid, p_a4 uuid)
returns void language plpgsql security definer set search_path = public as $$
declare ids uuid[] := array_remove(array[p_a2,p_a3,p_a4], null); x uuid;
  wk date := date_trunc('week', coalesce(p_week, (now() at time zone 'Asia/Bangkok')::date))::date;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  delete from rota_periods where week_from > wk;
  if p_week is null then
    insert into rota_periods(week_from,active,set_by) values (wk,false,auth.uid())
    on conflict (week_from) do update set active=false,a2=null,a3=null,a4=null,set_by=excluded.set_by,set_at=now();
    return;
  end if;
  if cardinality(ids) = 0 then raise exception 'เลือกอย่างน้อย 1 คน'; end if;
  if (select count(distinct v) from unnest(ids) v) <> cardinality(ids) then raise exception 'เลือกคนซ้ำกันไม่ได้'; end if;
  foreach x in array ids loop
    if not exists(select 1 from profiles where id = x and active and role = 'staff' and team = 'A') then
      raise exception 'ต้องเลือกพนักงานทีม A ที่ใช้งานอยู่';
    end if;
  end loop;
  insert into rota_periods(week_from,active,a2,a3,a4,set_by) values (wk,true,p_a2,p_a3,p_a4,auth.uid())
  on conflict (week_from) do update set active=true,a2=excluded.a2,a3=excluded.a3,a4=excluded.a4,set_by=excluded.set_by,set_at=now();
  -- กะในโปรไฟล์ของคนหมุนกะ = กะในสัปดาห์นี้ (ใช้แสดงผลและเมื่อปิดการหมุน)
  update profiles set shift_id = null where role = 'staff' and (shift_id in ('A2','A3','A4') or id = any(ids));
  if p_a2 is not null then update profiles set shift_id = 'A2' where id = p_a2; end if;
  if p_a3 is not null then update profiles set shift_id = 'A3' where id = p_a3; end if;
  if p_a4 is not null then update profiles set shift_id = 'A4' where id = p_a4; end if;
  perform notify_users(ids, 'ตารางหมุนกะ', 'ผู้ดูแลตั้งการหมุนกะทีม A ใหม่ เริ่มสัปดาห์ '||to_char(wk,'DD/MM'), '');
end $$;

-- เรียกตัวเข้ากะฉุกเฉิน 19.00–04.00 (p_emp = null คือยกเลิก) · p_move = ให้หยุดกะประจำของวันนั้น
create or replace function public.call_flex(p_date date, p_emp uuid, p_move boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare home text; nm text;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  delete from overrides where work_date = p_date and kind = 'flex';
  if p_emp is null then return; end if;
  if not team_works('A', p_date) then raise exception 'ทีม A ไม่ทำงานวันดังกล่าว'; end if;
  select name into nm from profiles where id = p_emp and active;
  if nm is null then raise exception 'ไม่พบพนักงาน'; end if;
  insert into overrides(work_date,shift_id,cover,note,kind,set_by)
  values (p_date,'A5',p_emp,left(coalesce(nullif(p_note,''),'เรียกเข้ากะฉุกเฉิน'),80),'flex',auth.uid())
  on conflict (work_date,shift_id) do update set cover=excluded.cover,note=excluded.note,kind='flex',leave_id=null,set_by=excluded.set_by,set_at=now();
  if p_move then
    select s.id into home from shifts s where s.id <> 'A5' and team_works(s.team, p_date) and regular_of(p_date, s.id) = p_emp limit 1;
    if home is not null and not exists(select 1 from overrides where work_date = p_date and shift_id = home) then
      insert into overrides(work_date,shift_id,cover,note,kind,set_by)
      values (p_date,home,null,'ย้ายไปกะ 19.00–04.00','flex',auth.uid());
    end if;
  end if;
  perform notify_users(array[p_emp], 'เรียกเข้ากะฉุกเฉิน', nm||' เข้ากะ 19.00–04.00 วันที่ '||to_char(p_date,'DD/MM')||case when p_move then ' (หยุดกะประจำวันนั้น)' else '' end, 'warn');
end $$;

revoke all on function public.rota_at(date) from public, anon;
revoke all on function public.shift_on(uuid,date) from public, anon;
revoke all on function public.regular_of(date,text) from public, anon;
revoke all on function public.set_rotation(date,uuid,uuid,uuid) from public, anon;
revoke all on function public.call_flex(date,uuid,boolean,text) from public, anon;
grant execute on function public.rota_at(date) to authenticated;
grant execute on function public.shift_on(uuid,date) to authenticated;
grant execute on function public.regular_of(date,text) to authenticated;
grant execute on function public.set_rotation(date,uuid,uuid,uuid) to authenticated;
grant execute on function public.call_flex(date,uuid,boolean,text) to authenticated;
notify pgrst, 'reload schema';
