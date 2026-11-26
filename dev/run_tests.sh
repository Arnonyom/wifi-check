#!/usr/bin/env bash
# ทดสอบอัตโนมัติ (Playwright + ข้อมูลจำลอง ไม่แตะฐานข้อมูลจริง) · ต้อง build ก่อน
# หมายเหตุ: tsim (หน้าทดสอบลงเวลา) ล้มเฉพาะวันเสาร์–อาทิตย์ เพราะทีม A ไม่มีกะ — ถือว่าปกติ
cd "$(dirname "$0")"
mkdir -p xlout
fail=0
for t in torder tplist ten tlang tprofile tprod tpw tclear trota2 tops tglass tmob trep txl tempty tnl tnl2 tnl3 tslim tfix thome tnophone tmobile tatt tconc tsim; do
  out=$(timeout 180 node tests/$t.js 2>&1 | grep -v 'agent-proxy\|connect_rejected\|Allowed domains\|For details\|While this command')
  if echo "$out" | tail -1 | grep -q "NO ERRORS"; then echo "PASS $t"; else echo "FAIL $t"; echo "$out" | tail -5; fail=1; fi
done
exit $fail
