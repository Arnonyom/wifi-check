-- ตำแหน่งตอนเข้า/ออกงาน (แยกจากตาราง attendance ที่ทุกคนอ่านได้)
-- เห็นได้เฉพาะเจ้าตัวและผู้ดูแล · บันทึกผ่าน set_my_location เท่านั้น (ภายใน 30 นาทีหลังกดเข้า/ออกงาน)
create table if not exists public.attendance_locations (
  att_id     uuid not null references public.attendance(id) on delete cascade,
  kind       text not null check (kind in ('in','out')),
  emp        uuid not null references public.profiles(id) on delete cascade,
  status     text not null check (status in ('ok','denied','unavailable','timeout','unsupported')),
  lat        double precision check (lat between -90 and 90),
  lng        double precision check (lng between -180 and 180),
  acc        integer check (acc >= 0),
  place      text check (char_length(place) <= 200),
  created_at timestamptz not null default now(),
  primary key (att_id, kind)
);
create index if not exists attendance_locations_created_idx on public.attendance_locations (created_at);

alter table public.attendance_locations enable row level security;
drop policy if exists attendance_locations_read on public.attendance_locations;
create policy attendance_locations_read on public.attendance_locations
  for select using (emp = auth.uid() or is_admin());

create or replace function public.set_my_location(
  p_att uuid, p_kind text, p_status text,
  p_lat double precision default null, p_lng double precision default null,
  p_acc integer default null, p_place text default null)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare a attendance;
begin
  select * into a from attendance where id = p_att;
  if not found or a.emp is distinct from auth.uid() then raise exception 'ไม่พบรายการเข้างาน'; end if;
  if p_kind not in ('in','out') then raise exception 'คำสั่งไม่ถูกต้อง'; end if;
  if p_kind = 'in' and a.check_in < now() - interval '30 minutes' then raise exception 'หมดเวลาบันทึกตำแหน่ง'; end if;
  if p_kind = 'out' and (a.check_out is null or a.check_out < now() - interval '30 minutes') then raise exception 'หมดเวลาบันทึกตำแหน่ง'; end if;
  if p_status <> 'ok' then p_lat := null; p_lng := null; p_acc := null; p_place := null; end if;
  insert into attendance_locations(att_id, kind, emp, status, lat, lng, acc, place)
  values (p_att, p_kind, a.emp, p_status, p_lat, p_lng, p_acc, left(p_place, 200))
  on conflict (att_id, kind) do update
    set status = excluded.status, lat = excluded.lat, lng = excluded.lng,
        acc = excluded.acc, place = excluded.place, created_at = now();
end $function$;

revoke execute on function public.set_my_location(uuid, text, text, double precision, double precision, integer, text) from public, anon;
grant execute on function public.set_my_location(uuid, text, text, double precision, double precision, integer, text) to authenticated;
