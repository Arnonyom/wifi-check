-- ผู้ดูแลลงเวลาแทน + เปลี่ยนคนทำงาน/สลับกะหลายวัน
alter table public.attendance add column if not exists by_admin uuid references public.profiles(id) on delete set null;
alter table public.attendance add column if not exists admin_note text not null default '';

-- ลงเวลาแทน/แก้เวลา ของกะ (p_date, p_shift) · p_in = null คือลบบันทึกเวลา
create or replace function public.admin_attendance(p_date date, p_shift text, p_emp uuid, p_in timestamptz, p_out timestamptz, p_note text)
returns void language plpgsql security definer set search_path = public as $$
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
  s_ts := shift_start(p_date, p_shift); e_ts := shift_end(p_date, p_shift);
  if s_ts is null then raise exception 'ไม่พบกะนี้'; end if;
  if p_in < s_ts - interval '12 hours' or p_in > e_ts + interval '12 hours' then raise exception 'เวลาเข้างานห่างจากเวลากะมากเกินไป'; end if;
  if p_out is null and exists(select 1 from attendance where emp = p_emp and check_out is null and not (work_date = p_date and shift_id = p_shift)) then
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
end $$;

-- เปลี่ยนคนทำงานหลายวัน · p_mode: 'work' = กลับเป็นตามปกติ, 'cover' = p_other ทำแทน, 'swap' = สลับกะกับ p_other
create or replace function public.set_override_days(p_shift text, p_dates date[], p_mode text, p_other uuid, p_note text)
returns json language plpgsql security definer set search_path = public as $$
declare d date; reg uuid; oth text; sh shifts; nm_reg text; nm_oth text; done int := 0; skipped date[] := '{}';
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  if p_mode not in ('work','cover','swap') then raise exception 'คำสั่งไม่ถูกต้อง'; end if;
  select * into sh from shifts where id = p_shift;
  if sh.id is null or sh.id = 'A5' then raise exception 'ไม่พบกะนี้'; end if;
  if p_mode <> 'work' and not exists(select 1 from profiles where id = p_other and active and (role = 'staff' or can_work)) then
    raise exception 'เลือกผู้ทำงานแทน';
  end if;
  select name into nm_oth from profiles where id = p_other;
  foreach d in array coalesce(p_dates, '{}') loop
    if not team_works(sh.team, d) then skipped := skipped || d; continue; end if;
    reg := regular_of(d, p_shift);
    if p_mode = 'work' then
      delete from overrides o where o.work_date = d and o.kind = 'swap'
        and o.cover = reg and o.shift_id <> p_shift;                      -- คืนอีกฝั่งของการสลับ
      delete from overrides where work_date = d and shift_id = p_shift;
      done := done + 1; continue;
    end if;
    if reg is null or reg = p_other then skipped := skipped || d; continue; end if;
    if p_mode = 'cover' then
      insert into overrides(work_date,shift_id,cover,note,kind,set_by) values (d,p_shift,p_other,left(coalesce(p_note,''),80),'',auth.uid())
      on conflict (work_date,shift_id) do update set cover=excluded.cover,note=excluded.note,kind='',leave_id=null,set_by=excluded.set_by,set_at=now();
    else
      oth := shift_on(p_other, d);
      if oth is null or oth = p_shift or not exists(select 1 from shifts where id = oth and team_works(team, d)) then skipped := skipped || d; continue; end if;
      select name into nm_reg from profiles where id = reg;
      insert into overrides(work_date,shift_id,cover,note,kind,set_by) values (d,p_shift,p_other,left('สลับกะกับ '||nm_reg,80),'swap',auth.uid())
      on conflict (work_date,shift_id) do update set cover=excluded.cover,note=excluded.note,kind='swap',leave_id=null,set_by=excluded.set_by,set_at=now();
      insert into overrides(work_date,shift_id,cover,note,kind,set_by) values (d,oth,reg,left('สลับกะกับ '||nm_oth,80),'swap',auth.uid())
      on conflict (work_date,shift_id) do update set cover=excluded.cover,note=excluded.note,kind='swap',leave_id=null,set_by=excluded.set_by,set_at=now();
    end if;
    done := done + 1;
  end loop;
  if done > 0 and p_mode <> 'work' then
    perform notify_users(array_remove(array[p_other, regular_of(p_dates[1], p_shift)], null),
      case when p_mode = 'swap' then 'สลับกะ' else 'มอบหมายให้ทำแทน' end,
      coalesce(nm_oth,'')||case when p_mode = 'swap' then ' สลับกะ ' else ' ทำแทน ' end||done||' วัน (กะ '||to_char(sh.start_time,'HH24.MI')||')', '');
  end if;
  return json_build_object('done', done, 'skipped', skipped);
end $$;

revoke all on function public.admin_attendance(date,text,uuid,timestamptz,timestamptz,text) from public, anon;
revoke all on function public.set_override_days(text,date[],text,uuid,text) from public, anon;
grant execute on function public.admin_attendance(date,text,uuid,timestamptz,timestamptz,text) to authenticated;
grant execute on function public.set_override_days(text,date[],text,uuid,text) to authenticated;
notify pgrst, 'reload schema';
