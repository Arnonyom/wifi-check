# WiFi-Check — คู่มือสำหรับ Claude

ระบบลงเวลาเข้า–ออกงาน ตารางกะ และคำขอลา ของทีม WiFi
เว็บจริง: https://arnonyom.github.io/wifi-check/ (GitHub Pages จาก branch `main` โฟลเดอร์ราก)
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

ลำดับ build: `patch_detail → patch_pw → patch_sim → patch_rota → patch_ops → patch_xl → patch_nl → patch_logo → build_prod → make_preview`
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
- ธีม: สว่าง / มืด / Liquid Glass (ปรับความใส–ขุ่นได้)
- Migration ที่ใช้ไปแล้ว: fix_function_search_path, add_must_change_pw, team_a_rotation_and_flex_shift, rotation_4_shifts_and_team_b_cycle, admin_attendance_and_multi_day_override (+ schema.sql ตั้งต้น)
- repo เป็นสาธารณะ: ห้ามใส่รหัสผ่านจริง, service key หรือข้อมูลส่วนตัวพนักงานลงไฟล์ใด ๆ
