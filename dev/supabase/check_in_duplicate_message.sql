-- migration: check_in_duplicate_message
-- กดเข้างานซ้ำ (กดสองครั้ง/เปิด 2 เครื่อง) ให้ขึ้น 'ลงเวลาเข้างานกะนี้ไปแล้ว' แทน 'ยังมีกะที่ไม่ได้ออกงาน'
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
  if exists(select 1 from attendance where work_date = p_date and shift_id = p_shift and emp = me.id) then
    raise exception 'ลงเวลาเข้างานกะนี้ไปแล้ว';
  end if;

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
