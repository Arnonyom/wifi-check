#!/usr/bin/env bash
# สร้าง dev/index.html (ตัวเว็บ) + dev/preview_*.html (ตัวอย่างข้อมูลจำลอง) จากไฟล์ต้นฉบับ
# ใช้: bash dev/build_all.sh        (โลโก้หน้าจอโฮมคือแบบ B)
set -e
cd "$(dirname "$0")"
export LOGO=${LOGO:-B}
python3 patch_detail.py >/dev/null
python3 patch_pw.py >/dev/null
python3 patch_sim.py >/dev/null
python3 patch_rota.py >/dev/null
python3 patch_ops.py >/dev/null
python3 patch_xl.py >/dev/null
python3 patch_nl.py >/dev/null
python3 patch_logo.py >/dev/null
python3 patch_slim.py >/dev/null
python3 patch_fix.py >/dev/null
python3 patch_home.py >/dev/null
python3 patch_nophone.py >/dev/null
python3 patch_mobile.py >/dev/null
python3 patch_att.py >/dev/null
python3 patch_order.py >/dev/null
python3 patch_profile.py >/dev/null
python3 patch_plist.py >/dev/null
python3 patch_geo.py >/dev/null
python3 patch_hol.py >/dev/null
python3 patch_ui2.py >/dev/null
python3 patch_leaveq.py >/dev/null
python3 patch_gear.py >/dev/null
python3 patch_avatar.py >/dev/null
python3 patch_stats.py >/dev/null
python3 patch_fx.py >/dev/null
python3 patch_r4.py >/dev/null
python3 build_prod.py >/dev/null
python3 i18n.py
python3 make_preview.py >/dev/null
if cmp -s index.html ../index.html; then echo "build ok · ตรงกับเว็บจริง (../index.html) ทุกไบต์"; else echo "build ok · ต่างจากเว็บจริง (มีการแก้ไข) → ตรวจ + ทดสอบ + ขออนุมัติก่อน deploy"; fi
