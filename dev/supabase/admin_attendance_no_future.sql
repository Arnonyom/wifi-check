-- migration: admin_attendance_no_future
-- 1) ห้ามลงเวลาเข้า/ออกที่ยังมาไม่ถึง (เผื่อ 5 นาที) — เดิมใส่เวลาออกงานล่วงหน้าได้ ทำให้คนที่ยังทำงานอยู่ไม่ถูกนับว่า "กำลังทำงาน"
-- 2) กะที่ลืมออกงานและเลยเลิกกะเกิน 12 ชม. ไม่บล็อกการลงเวลาแทน (กฎเดียวกับ check_in)
CREATE OR REPLACE FUNCTION public.admin_attendance(p_date date, p_shift text, p_emp uuid, p_in timestamp with time zone, p_out timestamp with time zone, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare st settings; s_ts timestamptz; e_ts timestamptz; late int; early int; cov boolean; nm text;
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  if p_in is null then
    delete from attendance where work_date = p_date and shift_id = p_shift;
    return;
  end if;
  select name into nm from profiles where id = p_emp and active;
  if nm is null then raise exception 'ไม่พบพนักงาน'; end if;
  if p_out is not null and p_out <= p_in then raise exception 'เวลาออกงานต้องอยู่หลังเวลาเข้างาน'; end if;
  if p_in > now() + interval '5 minutes' then raise exception 'เวลาเข้างานยังมาไม่ถึง'; end if;
  if p_out is not null and p_out > now() + interval '5 minutes' then raise exception 'เวลาออกงานยังมาไม่ถึง ถ้าพนักงานยังทำงานอยู่ ให้ลงเฉพาะเวลาเข้างาน'; end if;
  s_ts := shift_start(p_date, p_shift); e_ts := shift_end(p_date, p_shift);
  if s_ts is null then raise exception 'ไม่พบกะนี้'; end if;
  if p_in < s_ts - interval '12 hours' or p_in > e_ts + interval '12 hours' then raise exception 'เวลาเข้างานห่างจากเวลากะมากเกินไป'; end if;
  if p_out is null and exists(select 1 from attendance a where a.emp = p_emp and a.check_out is null
       and not (a.work_date = p_date and a.shift_id = p_shift)
       and shift_end(a.work_date, a.shift_id) + interval '12 hours' > now()) then
    raise exception '% ยังมีกะอื่นที่ไม่ได้ออกงาน', nm;
  end if;
  select * into st from settings where id = 1;
  late := floor(extract(epoch from (p_in - s_ts)) / 60);
  early := case when p_out is null then 0 else floor(extract(epoch from (e_ts - p_out)) / 60) end;
  cov := exists(select 1 from overrides where work_date = p_date and shift_id = p_shift);
  delete from attendance where work_date = p_date and shift_id = p_shift and emp <> p_emp;
  insert into attendance(emp,work_date,shift_id,check_in,check_out,late_min,late_flag,early_min,early_flag,is_cover,by_admin,admin_note)
  values (p_emp,p_date,p_shift,p_in,p_out,greatest(0,late),late > st.late_after,greatest(0,early),early > 0,cov,auth.uid(),left(coalesce(p_note,''),120))
  on conflict (work_date,shift_id) do update set emp=excluded.emp,check_in=excluded.check_in,check_out=excluded.check_out,
    late_min=excluded.late_min,late_flag=excluded.late_flag,early_min=excluded.early_min,early_flag=excluded.early_flag,
    is_cover=excluded.is_cover,by_admin=excluded.by_admin,admin_note=excluded.admin_note;
  perform notify_users(array[p_emp], 'ผู้ดูแลลงเวลาแทน',
    'บันทึกเวลา '||to_char(p_date,'DD/MM')||' เข้า '||to_char(p_in at time zone 'Asia/Bangkok','HH24:MI')||
    coalesce(' ออก '||to_char(p_out at time zone 'Asia/Bangkok','HH24:MI'),''), '');
end $function$;
