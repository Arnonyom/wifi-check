-- ลำดับการ์ดพนักงาน (หน้าพนักงาน) ที่ผู้ดูแลลากจัดเอง · ค่าว่าง = ต่อท้ายตามวันที่สร้างบัญชี
alter table public.profiles add column if not exists sort_order integer;

create or replace function public.set_profile_order(p_ids uuid[])
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if not is_admin() then raise exception 'เฉพาะผู้ดูแลระบบ'; end if;
  update profiles p set sort_order = x.ord
    from unnest(p_ids) with ordinality as x(id, ord)
   where p.id = x.id;
end $function$;

revoke execute on function public.set_profile_order(uuid[]) from public, anon;
grant execute on function public.set_profile_order(uuid[]) to authenticated;
