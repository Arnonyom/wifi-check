# WiFi-Check — คู่มือสำหรับ Claude

ระบบลงเวลาเข้า–ออกงาน ตารางกะ และคำขอลา ของทีม WiFi
เว็บจริง: https://wifiworkload.github.io/wifi-check/ (repo `wifiworkload/wifi-check` ย้ายจาก `Arnonyom/wifi-check` เมื่อ 23 พ.ย. 2569 · ลิงก์เดิมใช้ไม่ได้แล้ว) (GitHub Pages จาก branch `main` โฟลเดอร์ราก)
ฐานข้อมูล: Supabase project `hbobreapsefiudnlmtyu`

เจ้าของเป็นมือใหม่ **ตอบเป็นภาษาไทย** ใช้คำง่าย ๆ

## กติกาที่ต้องทำทุกครั้ง (สำคัญที่สุด)

1. **ห้ามแก้ของจริงก่อนได้รับอนุมัติ** ทั้งหน้าเว็บ ฐานข้อมูล และ Edge Function
2. **ทำหน้าตัวอย่างให้ดูทุกครั้ง** ใช้ไฟล์ `dev/preview_artifact.html` ที่ build สร้างให้ (ข้อมูลจำลอง ไม่แตะฐานข้อมูลจริง) แล้วเผยแพร่เป็นหน้าเว็บตัวอย่าง
3. **ขออนุมัติด้วยปุ่ม** (AskUserQuestion) เช่น "อนุมัติ deploy" / "ยังไม่ deploy / ขอแก้ก่อน" อย่าให้พิมพ์เอง
4. **ระวังไม่ให้โค้ดเดิมพัง** รันชุดทดสอบให้ผ่านก่อนขออนุมัติทุกครั้ง
5. ห้าม push ไฟล์ที่ไม่ได้ตั้งใจ และห้ามลบข้อมูลในฐานข้อมูลจริงโดยไม่ถาม

## โครงสร้าง

```
index.html, manifest.json, config.js, *.png   ← ตัวเว็บจริง (GitHub Pages เสิร์ฟไฟล์เหล่านี้)
favicon.png                                     ← ไอคอนแท็บเบราว์เซอร์ (โลโก้เดิมสีเขียว)
icon-*.png, apple-touch-icon.png                ← ไอคอนหน้าจอโฮมมือถือ (แบบ B นีออนนาฬิกา)
dev/                                            ← ต้นฉบับ + เครื่องมือ (ไม่กระทบเว็บ)
  app_src_before_detail.html   ต้นแบบแอป (เวอร์ชันข้อมูลในเครื่อง)
  patch_*.py                   แพตช์ทีละฟีเจอร์ ต่อกันเป็นลำดับ
  prod/*.js                    ชิ้นโค้ดที่ใช้ Supabase จริง (build_prod.py ประกอบเข้า)
  build_all.sh                 สร้าง dev/index.html + หน้าตัวอย่าง
  run_tests.sh                 ทดสอบอัตโนมัติด้วย Playwright + ข้อมูลจำลอง
  mock*.js                     Supabase จำลองสำหรับหน้าตัวอย่าง/ทดสอบ
  icons/gen.py, render.js      สร้างไอคอน (SVG → PNG)
  supabase/                    SQL ที่เคยใช้ + Edge Function admin-users
```

ลำดับ build: ดูใน `build_all.sh` (patch_detail → … → patch_order → patch_profile → … → patch_ui2 → patch_leaveq → patch_gear → patch_avatar → patch_stats → patch_fx → build_prod → i18n → make_preview)
(`patch_detail.py` สร้าง `app_src.html` ใหม่จาก `app_src_before_detail.html` ทุกครั้ง)

## ขั้นตอนทำงาน

1. แก้ไฟล์ใน `dev/` เท่านั้น อย่าแก้ `index.html` ที่รากตรง ๆ
   - ฟีเจอร์ใหม่: เพิ่มไฟล์ `dev/prod/p_xxx.js` + `dev/patch_xxx.py` แล้วต่อท้ายใน `build_all.sh`
   - ใน patch ใช้ฟังก์ชัน `rep(a,b)` ที่ assert ว่าเจอข้อความเดิมพอดี จะได้รู้ทันทีถ้าโค้ดเปลี่ยน
2. `bash dev/build_all.sh` ถ้าไม่ได้แก้อะไร จะขึ้นว่า "ตรงกับเว็บจริงทุกไบต์"
3. `bash dev/run_tests.sh` ต้องผ่านทั้งหมด (`tsim` ล้มเฉพาะเสาร์–อาทิตย์ ถือว่าปกติ) และเขียนเทสต์ใหม่ให้ฟีเจอร์ใหม่
4. เผยแพร่ `dev/preview_artifact.html` เป็นหน้าตัวอย่าง แล้วขออนุมัติด้วยปุ่ม
   (ล็อกอินตัวอย่าง: admin / Admin@2026 · somchai / Temp1234! (บังคับตั้งรหัสใหม่) · malee / Temp1234! — เป็นข้อมูลจำลองเท่านั้น)
5. หลังได้รับอนุมัติ deploy ตามลำดับนี้:
   1. ฐานข้อมูล (ถ้ามี): Supabase `apply_migration` — **อ่านนิยามฟังก์ชันปัจจุบันจากฐานข้อมูลจริงก่อนแก้เสมอ** (`select pg_get_functiondef('public.ชื่อ'::regproc)`) เพราะไฟล์ใน `dev/supabase/` อาจไม่ใช่เวอร์ชันล่าสุด แล้วเก็บ SQL ใหม่ไว้ใน `dev/supabase/`
   2. Edge Function (ถ้ามี): `deploy_edge_function` ชื่อ `admin-users` (verify_jwt = false)
   3. หน้าเว็บ: `cp dev/index.html index.html` → commit → push `main`
6. ตรวจว่าใช้งานได้ บอกผลเจ้าของสั้น ๆ เป็นภาษาไทย

## ถ้าพัง — ย้อนกลับ

- branch `stable-2026-11-15` คือเวอร์ชันที่ใช้งานได้ดีล่าสุด (ห้ามลบ ห้าม push ทับ)
- ย้อนหน้าเว็บ: `git checkout origin/stable-2026-11-15 -- index.html` แล้ว commit + push (หรือ `git revert <commit>`)
- migration ในฐานข้อมูลย้อนเองไม่ได้ ต้องเขียน SQL แก้กลับ ดังนั้นทดสอบ SQL ให้ดีก่อน

## กฎของงาน (อย่าเปลี่ยนถ้าไม่ได้สั่ง)

- **ทีม A**: 4 คน 4 กะ หมุนทุกวันจันทร์ 10.00 → 18.00 → 23.30 → 08.30 → 10.00 (เริ่ม จ. 30 พ.ย. 2569: wave=10.00, Por=18.00, best=23.30, F=08.30) ทำงาน จ.–ศ.
  กะ 08.30 สลับเป็นกะเรียกฉุกเฉิน 19.00–04.00 (A5) รายวันได้ (call_flex)
  ประวัติการหมุนเก็บในตาราง `rota_periods` — `set_rotation` ไม่แก้ `profiles.shift_id`
- **ทีม B**: 2 คนทำวันเดียวกัน ศ.–จ. (4 วัน) สลับ ศ.–อา. (3 วัน) กะ 07.00–19.00 / 19.00–07.00 สลับกลางวัน–กลางคืนทุก 2 สัปดาห์ (ตาราง `rota_b`) ผู้ดูแลเลือกคนเริ่มเองในหน้าตั้งค่า
- รหัสผ่าน 8–72 ตัว อักษร ASCII ที่พิมพ์ได้
- เวลาเป็น Asia/Bangkok ปีแสดงเป็น พ.ศ.

## ข้อควรรู้ทางเทคนิค

- หน้าเว็บเป็นไฟล์เดียว vanilla JS ห่อใน IIFE (`'use strict'`) ตัวแปรไม่อยู่ใน global — เทสต์ต้องตรวจผ่าน DOM (หรือใช้ `preview_hook.html`)
- Supabase: RLS + ฟังก์ชัน SECURITY DEFINER, ผู้ใช้ล็อกอินด้วย `username@wifi-check.app`
- Excel: เขียน/อ่าน .xlsx เองใน `prod/p_xlsx.js` (ไม่ใช้ CDN)
- ภาษา ไทย/อังกฤษ: `dev/i18n.py` (รันหลัง build_prod) หุ้มข้อความไทยในโค้ดด้วย `_tx()` คำแปลอยู่ใน `dev/i18n_en.json`
  - **เพิ่มข้อความไทยใหม่ ต้องเพิ่มคำแปลใน `i18n_en.json`** ไม่งั้น build จะหยุดและบอกว่าขาดคำไหน (`python3 dev/i18n.py --list` ดูรายการ)
  - ข้อความที่เก็บลงฐานข้อมูล (notify, ข้อความจาก SQL) เก็บเป็นไทยเสมอ แล้วแปลตอนแสดงด้วย `_td()` ผ่าน `__data__` ใน i18n_en.json
  - เปลี่ยนภาษาทันทีไม่โหลดหน้าใหม่ · ค่าคงที่ที่แปลตอนเปิดแอป (TEAMS, DOW_TH, LEAVE_TH ฯลฯ) ถูกแปลใหม่ใน `relocalize()` ที่ i18n.py สร้างให้
  - เทสต์: `ten` (ไม่มีคำไทยหลงในโหมดอังกฤษ), `tlang` (สลับไป-กลับแล้วเหมือนเดิม)
- โปรไฟล์ = แท็บสุดท้ายของเมนูล่าง: ข้อมูลของฉัน (รูป · แก้ชื่อ) · ผู้ดูแล: รายชื่อผู้ดูแล + สวิตช์ "สิทธิ์ของพนักงาน" (แก้รูป/ชื่อเอง = `settings.allow_avatar/allow_name`) + การ์ดสีเข้ม **Admin tool** (= หน้าตั้งค่าระบบ) · เปลี่ยนรหัสผ่านอยู่ที่ฟันเฟือง
- รูปโปรไฟล์ (`prod/p_avatar.js`): ย่อในเครื่องเป็น JPEG 160×160 เก็บใน `profiles.avatar` (data URL ≤ 80 KB) ผ่าน `set_avatar` · แก้ชื่อเอง `set_my_name` · ผู้ดูแลเปลี่ยนรูปคนอื่นที่หน้าพนักงาน
- หน้าพนักงาน (ผู้ดูแล): การ์ดละทีม ข้างในเป็นรายชื่อ · กดชื่อ (`data-pr`) แล้วขยายเห็นปุ่ม แก้ไข/รีเซ็ตรหัสผ่าน/ลบ · ลาก ⠿ สลับลำดับ (`prod/p_plist.js`, `p_order.js`)
- ตำแหน่งตอนเข้า/ออกงาน (`prod/p_geo.js`): ต้องอนุญาตตำแหน่งจึงลงเวลาได้ · อ่านค่าไม่ได้ก็ลงได้ (ติดป้าย) · ชื่อสถานที่จาก OpenStreetMap · เก็บในตาราง `attendance_locations` (เห็นเฉพาะเจ้าตัว + ผู้ดูแล) ผ่าน `set_my_location` · หน้าตัวอย่างใช้ `window.__geoMock` · เทสต์ `tgeo`
- แถบด้านบน: ชื่อ → กระดิ่ง → ปุ่มฟันเฟือง (`data-act=theme`: สวิตช์ภาษา ธีม เปลี่ยนรหัสผ่าน ออกจากระบบ) · **ทุกการเปลี่ยนในฟันเฟืองต้องยืนยัน** (`.gask` → `gear-yes`/`gear-no`, `prod/p_gear.js`) · ออกจากระบบ `logout-ask` → `logout`
- ธีม: สวิตช์โหมดกลางวัน ↔ กลางคืน (`.daysw` = light ↔ dark) + ปุ่ม White / Black / Liquid Glass / กำหนดสีเอง (`wc-custom` = `{c, base: light|dark|glass}` · แบบแก้วใช้ `data-theme=glass` + `data-cust` · `applyCustom`)
  - **ธีมจำแยกตามบัญชี**: ล็อกอินอยู่ → เก็บใน `profiles.prefs` (`{theme,glass,custom}`) ผ่าน `set_my_prefs` (`prefSave`) · หน้าล็อกอิน/ยังไม่ล็อกอิน → ธีมของเครื่อง (localStorage) · `userThemeOn(e)` ตอนเข้า, `userThemeOff()` ตอนออก · แคชในเครื่อง `wc-u-<id>` + `wc-last-uid` กันกะพริบ · เทสต์ `tthemeu`
- **ถามยืนยันก่อนทุกปุ่ม ส่ง/อนุมัติ/บันทึก** (`prod/p_confirm.js` วางต้นสคริปต์ ดักแบบ capture ด้วย `CF_ACTS`, หน้าต่าง `#cfbox` ปุ่ม `[data-cf=yes|no]`) · ส่งคำขอลา/ลาแทน ตรวจข้อมูลก่อนแล้วค่อยถาม (`askConfirm`) · ปุ่มเพิ่มใหม่ที่บันทึกข้อมูล ต้องใส่ใน `CF_ACTS` · เทสต์ที่กดปุ่มเหล่านี้ต้องกด `#cfbox [data-cf=yes]` ต่อ
- ลูกเล่น (`prod/p_fx.js`): KPI นับขึ้น + กราฟวิ่ง (`animMain` เฉพาะตอนเปิดหน้า/เปลี่ยนช่วง) · กระดิ่งขยับ (`bellRing`) · toast สำเร็จ `toast(t,b,'ok')` · ล็อกอินผิด สั่น+แดง (`loginShake`) · คำขอลามีขั้นตอน (`lvFlow`) · เทสต์ `tfx`
- วันลา (`prod/p_leaveq.js`, ตาราง `leave_quota` + `leave_quota_log`, ค่าตั้งต้น `settings.q_vac/q_per/q_sick`): สิทธิ์รายคนต่อปี `leave_quota_of` · ปรับ `admin_set_quota` (set/add) · ผู้ดูแลลาแทน `admin_request_leave` (ต้องมีเหตุผล, `leaves.by_admin`) · พักร้อน/ลากิจ เริ่มได้ตั้งแต่วันนี้ · ลาป่วยเริ่มได้เฉพาะวันนี้ ≤ 3 วัน · เลือกวันเริ่ม + จำนวนวัน · เมนูชื่อ "ลา" · รายงานมีการ์ดสิทธิ์คงเหลือ (`#lvBal`) · เทสต์ `tleave`
- รายงาน › สถิติ: เลือก "ดูของ" ทุกคน/คนเดียว (`dashEmp`) กราฟพฤติกรรมเป็นของคนนั้น กราฟเปรียบเทียบยังแสดงทุกคนแต่คนอื่นจาง · ตารางกะเปิดมาเป็นมุมมองเดือน
- วันหยุดราชการ (`prod/p_hol.js`, ตาราง `holidays`): ทีม A หยุด (`team_works` ในฐานข้อมูล + `teamWorksS` ในเว็บ) · ทีม B ทำตามรอบ · ผู้ดูแลเพิ่ม/ลบผ่าน `admin_set_holiday` · วันหยุดปี 2570 ใส่ตามปฏิทินทั่วไป รอตรวจกับประกาศ ครม.
- ล้างข้อมูลทดสอบ: `admin_clear_data(from,to,att,sched,notif,rota,dry)` — dry=true นับอย่างเดียว · ไม่แตะ profiles/settings/holidays
- หน้าตั้งค่าระบบ = **Admin tool** (`prod/p_acc.js`): แท็บหมวด (ทั้งหมด/กะ & ทีม/วันหยุด/วันลา/กฎ/นำเข้า-ส่งออก/ทดสอบ) + ตารางการ์ด กด "เปิด" (`data-set-open`) เป็น popup · การ์ดเพิ่มใหม่ต้องใส่ใน SET_META/SET_ORDER และ accIdOf
- ออกจากระบบ = เฉพาะเครื่องนี้ (`signOut({scope:'local'})`) ห้ามใช้ `signOut()` เฉย ๆ เพราะจะตัดทุกเครื่องของบัญชี · `adminFn` เจอ 401 → ต่ออายุแล้วลองใหม่ 1 ครั้ง ไม่ได้ → กลับหน้าล็อกอิน (เทสต์ `tsess`)
- Migration ที่ใช้ไปแล้ว: fix_function_search_path, add_must_change_pw, team_a_rotation_and_flex_shift, rotation_4_shifts_and_team_b_cycle, admin_attendance_and_multi_day_override, fix_forgot_checkout_and_admin_cancel_leave, drop_profiles_phone, admin_attendance_no_future, check_in_duplicate_message, profile_sort_order, attendance_locations, holidays_and_clear_data (+ schema.sql ตั้งต้น) · รอ deploy: leave_quota_avatar (`dev/supabase/leave_quota_avatar.sql`)
- repo เป็นสาธารณะ: ห้ามใส่รหัสผ่านจริง, service key หรือข้อมูลส่วนตัวพนักงานลงไฟล์ใด ๆ
