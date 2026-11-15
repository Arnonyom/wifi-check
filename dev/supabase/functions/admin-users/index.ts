// Edge Function: admin-users
// - ผู้ดูแลระบบ: สร้างบัญชี / รีเซ็ตรหัสผ่าน / ลบบัญชี (ไม่มีการสมัครเอง)
// - ผู้ใช้ทุกคน: เปลี่ยนรหัสผ่านของตัวเอง (ต้องยืนยันรหัสเดิม)
// ใช้ service role ฝั่งเซิร์ฟเวอร์เท่านั้น คีย์นี้ Supabase ใส่ให้ฟังก์ชันอัตโนมัติ
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const DOMAIN = "wifi-check.app"; // อีเมลภายในระบบ = ชื่อผู้ใช้@wifi-check.app (ผู้ใช้ไม่ต้องรู้)
const SHIFT_TEAM: Record<string, string> = { A1: "A", A2: "A", A3: "A", A4: "A", B1: "B", B2: "B" };
const PW_MSG = "รหัสผ่านต้องยาว 8–72 ตัว ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และอักขระพิเศษ (ไม่มีช่องว่าง)";
// อย่างน้อย 8 ตัว: A–Z a–z 0–9 และอักขระพิเศษที่พิมพ์ได้ (ASCII 33–126) — 72 คือขีดจำกัดของระบบเข้ารหัส
const validPw = (p: unknown) => typeof p === "string" && /^[\x21-\x7E]{8,72}$/.test(p);
const validUser = (s: unknown) => typeof s === "string" && /^[a-z0-9._-]{3,20}$/.test(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1) ตรวจว่าผู้เรียกล็อกอินอยู่
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: u, error: ue } = await admin.auth.getUser(token);
  if (ue || !u?.user) return json({ error: "ยังไม่ได้ล็อกอิน" }, 401);
  const { data: me } = await admin.from("profiles").select("role,active").eq("id", u.user.id).maybeSingle();
  if (!me || !me.active) return json({ error: "บัญชีนี้ถูกปิดใช้งาน" }, 403);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "ข้อมูลไม่ถูกต้อง" }, 400); }
  const action = b.action;

  // 2) ผู้ใช้เปลี่ยนรหัสผ่านของตัวเอง (ทุกบทบาท) — ต้องยืนยันรหัสเดิมก่อน
  if (action === "change_own") {
    const { current, password } = b;
    if (typeof current !== "string" || !current) return json({ error: "กรอกรหัสผ่านปัจจุบัน" }, 400);
    if (!validPw(password)) return json({ error: PW_MSG }, 400);
    if (password === current) return json({ error: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม" }, 400);
    const check = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: se } = await check.auth.signInWithPassword({ email: u.user.email!, password: current });
    if (se) return json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, 400);
    await check.auth.signOut().catch(() => {});
    const { error } = await admin.auth.admin.updateUserById(u.user.id, { password });
    if (error) return json({ error: error.message }, 400);
    await admin.from("profiles").update({ must_change_pw: false }).eq("id", u.user.id);
    return json({ ok: true });
  }

  // 3) คำสั่งที่เหลือเฉพาะผู้ดูแลระบบ
  if (me.role !== "admin") return json({ error: "เฉพาะผู้ดูแลระบบ" }, 403);

  if (action === "create") {
    const { username, name, role, team, shift_id, phone, can_work } = b;
    const password = b.password ?? b.pin;
    if (!validUser(username)) return json({ error: "ชื่อผู้ใช้ 3–20 ตัว ใช้ a-z 0-9 . _ - เท่านั้น" }, 400);
    if (!validPw(password)) return json({ error: PW_MSG }, 400);
    if (!name || typeof name !== "string") return json({ error: "กรอกชื่อ-นามสกุล" }, 400);
    if (!["admin", "staff"].includes(role)) return json({ error: "บทบาทไม่ถูกต้อง" }, 400);
    if (role === "staff") {
      if (!["A", "B", "OPS"].includes(team)) return json({ error: "ทีมไม่ถูกต้อง" }, 400);
      if (team !== "OPS" && SHIFT_TEAM[shift_id] !== team) return json({ error: "กะไม่ตรงกับทีม" }, 400);
    }
    const { data: created, error: ce } = await admin.auth.admin.createUser({
      email: `${username}@${DOMAIN}`, password, email_confirm: true,
    });
    if (ce || !created.user) return json({ error: ce?.message?.includes("already") ? "ชื่อผู้ใช้นี้ถูกใช้แล้ว" : (ce?.message || "สร้างบัญชีไม่สำเร็จ") }, 400);
    const { error: pe } = await admin.from("profiles").insert({
      id: created.user.id, username, name: name.trim(), role,
      team: role === "admin" ? null : team,
      shift_id: role === "admin" || team === "OPS" ? null : shift_id,
      phone: phone || "", can_work: role === "admin" && !!can_work,
      must_change_pw: true, // รหัสที่ผู้ดูแลตั้งให้เป็นรหัสชั่วคราว ผู้ใช้ต้องเปลี่ยนเองตอนล็อกอินครั้งแรก
    });
    if (pe) {
      await admin.auth.admin.deleteUser(created.user.id); // ย้อนกลับ ไม่ให้เหลือบัญชีค้าง
      return json({ error: pe.message.includes("profiles_one_per_shift") ? "กะนี้มีผู้ประจำอยู่แล้ว ย้ายคนนั้นไปกะอื่นก่อน" : pe.message }, 400);
    }
    await admin.rpc("notify_users", { p_to: [created.user.id, u.user.id], p_title: "สร้างบัญชีใหม่", p_body: `ผู้ดูแลสร้างบัญชีให้ ${name}`, p_kind: "" });
    return json({ ok: true, id: created.user.id });
  }

  if (action === "set_password" || action === "set_pin") {
    const password = b.password ?? b.pin;
    if (!b.id) return json({ error: "ไม่พบผู้ใช้" }, 400);
    if (!validPw(password)) return json({ error: PW_MSG }, 400);
    const { data: target } = await admin.from("profiles").select("name").eq("id", b.id).maybeSingle();
    if (!target) return json({ error: "ไม่พบผู้ใช้" }, 400);
    const { error } = await admin.auth.admin.updateUserById(b.id, { password });
    if (error) return json({ error: error.message }, 400);
    await admin.from("profiles").update({ must_change_pw: true }).eq("id", b.id);
    await admin.rpc("notify_users", { p_to: [b.id, u.user.id], p_title: "รีเซ็ตรหัสผ่าน", p_body: `ผู้ดูแลรีเซ็ตรหัสผ่านของ ${target.name} ต้องตั้งรหัสใหม่เมื่อล็อกอินครั้งถัดไป`, p_kind: "" });
    return json({ ok: true });
  }

  if (action === "delete") {
    if (!b.id || b.id === u.user.id) return json({ error: "ลบบัญชีตัวเองไม่ได้" }, 400);
    const { error } = await admin.auth.admin.deleteUser(b.id); // profiles ถูกลบตามด้วย (on delete cascade)
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }

  return json({ error: "ไม่รู้จักคำสั่ง" }, 400);
});
