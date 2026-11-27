-- 1) วันหยุดราชการ/นักขัตฤกษ์: ทีม A ไม่ทำงานวันหยุด · ทีม B ทำตามรอบปกติ (ไม่สนวันหยุด)
create table if not exists public.holidays (
  d          date primary key,
  name       text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);
alter table public.holidays enable row level security;
drop policy if exists holidays_read on public.holidays;
create policy holidays_read on public.holidays for select using (auth.uid() is not null);

-- เพิ่ม/แก้ (p_name มีค่า) หรือลบ (p_name ว่าง) — เฉพาะผู้ดูแล
create or replace function public.admin_set_holiday(p_d date, p_name text)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  if p_d is null then raise exception 'ข้อมูลไม่ถูกต้อง'; end if;
  if coalesce(btrim(p_name), '') = '' then delete from holidays where d = p_d; return; end if;
  insert into holidays(d, name) values (p_d, left(btrim(p_name), 80))
  on conflict (d) do update set name = excluded.name;
end $function$;
revoke execute on function public.admin_set_holiday(date, text) from public, anon;
grant execute on function public.admin_set_holiday(date, text) to authenticated;

-- ทีม A: จ.–ศ. ยกเว้นวันหยุด (ใช้ร่วมกันใน check_in, leave_slots, set_override_days, call_flex)
create or replace function public.team_works(p_team text, p_date date)
 returns boolean language plpgsql stable security definer set search_path to 'public'
as $function$
declare r public.rota_b;
begin
  if p_team = 'A' then
    return extract(dow from p_date) in (1,2,3,4,5) and not exists (select 1 from holidays h where h.d = p_date);
  end if;
  if p_team <> 'B' then return false; end if;
  r := rota_b_at(p_date);
  if r.start_date is null or not r.active then return extract(dow from p_date) in (5,6,0,1); end if;
  return ((p_date - r.start_date) % 14) in (0,1,2,3,7,8,9);
end $function$;

-- วันหยุดตั้งต้น ปี 2569 (ประกาศแล้ว) และ 2570 (ตามปฏิทินทั่วไป รอ ครม. ประกาศ — ผู้ดูแลแก้ได้ในหน้าตั้งค่า)
insert into public.holidays(d, name) values
 ('2026-01-01','วันขึ้นปีใหม่'),('2026-01-02','วันหยุดพิเศษ'),('2026-03-03','วันมาฆบูชา'),('2026-04-06','วันจักรี'),
 ('2026-04-13','วันสงกรานต์'),('2026-04-14','วันสงกรานต์'),('2026-04-15','วันสงกรานต์'),('2026-05-04','วันฉัตรมงคล'),
 ('2026-05-13','วันพืชมงคล'),('2026-05-31','วันวิสาขบูชา'),('2026-06-01','ชดเชยวันวิสาขบูชา'),
 ('2026-06-03','วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี'),('2026-07-28','วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว'),
 ('2026-07-29','วันอาสาฬหบูชา'),('2026-07-30','วันเข้าพรรษา'),('2026-08-12','วันแม่แห่งชาติ'),
 ('2026-10-13','วันคล้ายวันสวรรคต ร.9'),('2026-10-23','วันปิยมหาราช'),('2026-12-05','วันพ่อแห่งชาติ'),
 ('2026-12-07','ชดเชยวันพ่อแห่งชาติ'),('2026-12-10','วันรัฐธรรมนูญ'),('2026-12-31','วันสิ้นปี'),
 ('2027-01-01','วันขึ้นปีใหม่'),('2027-02-21','วันมาฆบูชา'),('2027-02-22','ชดเชยวันมาฆบูชา'),('2027-04-06','วันจักรี'),
 ('2027-04-13','วันสงกรานต์'),('2027-04-14','วันสงกรานต์'),('2027-04-15','วันสงกรานต์'),('2027-05-04','วันฉัตรมงคล'),
 ('2027-05-20','วันวิสาขบูชา'),('2027-06-03','วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี'),('2027-07-18','วันอาสาฬหบูชา'),
 ('2027-07-19','วันเข้าพรรษา'),('2027-07-20','ชดเชยวันอาสาฬหบูชา'),
 ('2027-07-28','วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว'),('2027-08-12','วันแม่แห่งชาติ'),
 ('2027-10-13','วันคล้ายวันสวรรคต ร.9'),('2027-10-23','วันปิยมหาราช'),('2027-10-25','ชดเชยวันปิยมหาราช'),
 ('2027-12-05','วันพ่อแห่งชาติ'),('2027-12-06','ชดเชยวันพ่อแห่งชาติ'),('2027-12-10','วันรัฐธรรมนูญ'),('2027-12-31','วันสิ้นปี')
on conflict (d) do nothing;

-- 2) ล้างข้อมูลทดสอบ (เฉพาะผู้ดูแล) · เลือกหมวดและช่วงวันที่ · p_dry = true นับอย่างเดียว ไม่ลบ
--    ไม่แตะบัญชีผู้ใช้ (profiles), กฎการลงเวลา (settings), วันหยุด (holidays)
create or replace function public.admin_clear_data(
  p_from date, p_to date, p_att boolean, p_sched boolean, p_notif boolean, p_rota boolean, p_dry boolean default true)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare n_att int := 0; n_ov int := 0; n_lv int := 0; n_nt int := 0; n_rt int := 0;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  if p_from is null or p_to is null or p_from > p_to then raise exception 'เลือกช่วงวันที่ให้ถูกต้อง'; end if;
  if p_att then select count(*) into n_att from attendance where work_date between p_from and p_to; end if;
  if p_sched then
    select count(*) into n_ov from overrides where work_date between p_from and p_to;
    select count(*) into n_lv from leaves where from_date <= p_to and to_date >= p_from;
  end if;
  if p_notif then select count(*) into n_nt from notifications where (ts at time zone 'Asia/Bangkok')::date between p_from and p_to; end if;
  if p_rota then
    select (select count(*) from rota_periods where week_from between p_from and p_to)
         + (select count(*) from rota_b where start_date between p_from and p_to) into n_rt;
  end if;
  if not p_dry then
    if p_att then delete from attendance where work_date between p_from and p_to; end if;  -- ตำแหน่งลบตามอัตโนมัติ
    if p_sched then
      delete from overrides where work_date between p_from and p_to;
      delete from leaves where from_date <= p_to and to_date >= p_from;
    end if;
    if p_notif then delete from notifications where (ts at time zone 'Asia/Bangkok')::date between p_from and p_to; end if;
    if p_rota then
      delete from rota_periods where week_from between p_from and p_to;
      delete from rota_b where start_date between p_from and p_to;
    end if;
  end if;
  return jsonb_build_object('attendance', n_att, 'overrides', n_ov, 'leaves', n_lv, 'notifications', n_nt, 'rota', n_rt);
end $function$;
revoke execute on function public.admin_clear_data(date, date, boolean, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.admin_clear_data(date, date, boolean, boolean, boolean, boolean, boolean) to authenticated;
