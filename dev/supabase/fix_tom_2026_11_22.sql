-- แก้ข้อมูล 22 พ.ย. 2569: กะ B1 ผู้ดูแลลงเวลาเข้า 07:00 แต่ระบบเดิมใส่เวลาออก 19:00 ล่วงหน้าให้อัตโนมัติ
-- เอาเวลาออกออก ให้พนักงานกดออกงานเองตอนเลิกกะ
update public.attendance set check_out = null, early_min = 0, early_flag = false
 where work_date = '2026-11-22' and shift_id = 'B1' and by_admin is not null and check_out > now();
