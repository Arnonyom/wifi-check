-- migration: fix_forgot_checkout_and_admin_cancel_leave
-- 1) check_in: กะที่ลืมออกงานและเลยเวลาเลิกกะเกิน 12 ชม. ไม่บล็อกการเข้างานกะใหม่
--    (ตรงกับหน้าเว็บที่ซ่อนปุ่มออกงานของกะนั้นหลัง 12 ชม.) ผู้ดูแลแก้เวลาออกได้ที่ admin_attendance
-- 2) admin_cancel_leave: ผู้ดูแลยกเลิกการลาที่อนุมัติแล้ว (ก่อนวันเริ่มลา) เอาผู้ทำแทนออก + แจ้งเตือน

CREATE OR REPLACE FUNCTION public.check_in(p_date date, p_shift text)
 RETURNS attendance
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  if exists(select 1 from attendance a where a.emp = me.id and a.check_out is null
            and shift_end(a.work_date, a.shift_id) + interval '12 hours' > t) then
    raise exception 'ยังมีกะที่ไม่ได้ออกงาน';
  end if;

  late := floor(extract(epoch from (t - s_ts)) / 60);
  insert into attendance(emp,work_date,shift_id,check_in,late_min,late_flag,is_cover)
  values (me.id,p_date,p_shift,t,greatest(0,late),late > st.late_after,is_cov)
  returning * into rec;

  if rec.late_flag then
    perform notify_users(array[me.id],'เข้างานสาย',me.name||' เข้างานสาย '||rec.late_min||' นาที (กะ '||to_char(sh.start_time,'HH24.MI')||' · '||to_char(p_date,'DD/MM')||')','warn');
  end if;
  return rec;
exception when unique_violation then
  raise exception 'ลงเวลาเข้างานกะนี้ไปแล้ว';
end $function$;

CREATE OR REPLACE FUNCTION public.admin_cancel_leave(p_id uuid, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare l public.leaves; today date := (now() at time zone 'Asia/Bangkok')::date; covs uuid[]; nm text;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  select * into l from leaves where id = p_id and status = 'approved' for update;
  if l.id is null then raise exception 'ไม่พบการลาที่อนุมัติแล้ว'; end if;
  if l.from_date < today then raise exception 'เริ่มลาไปแล้ว ยกเลิกไม่ได้ ให้แก้ในตารางกะแทน'; end if;
  select array_agg(distinct cover) into covs from overrides where leave_id = p_id and cover is not null;
  delete from overrides where leave_id = p_id;
  update leaves set status = 'cancelled', note = left(coalesce(p_note,''),120), decided_by = auth.uid(), decided_at = now() where id = p_id;
  select name into nm from profiles where id = l.emp;
  perform notify_users(array[l.emp], 'ยกเลิกการลา',
    'ผู้ดูแลยกเลิกการลา '||to_char(l.from_date,'DD/MM')||' – '||to_char(l.to_date,'DD/MM')||' ต้องมาทำงานตามกะเดิม'
    ||case when coalesce(p_note,'') <> '' then ' · '||p_note else '' end, 'warn');
  if covs is not null then
    perform notify_users(covs, 'ยกเลิกการทำแทน',
      'ไม่ต้องทำแทน '||coalesce(nm,'')||' แล้ว ('||to_char(l.from_date,'DD/MM')||' – '||to_char(l.to_date,'DD/MM')||')', '');
  end if;
end $function$;

revoke execute on function public.admin_cancel_leave(uuid, text) from public, anon;
grant execute on function public.admin_cancel_leave(uuid, text) to authenticated;
