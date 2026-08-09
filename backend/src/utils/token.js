// src/utils/token.js
// -----------------------------------------------------------------------------
// ตัวจัดการ JWT (JSON Web Token) — "บัตรผ่าน" ที่เซิร์ฟเวอร์ออกให้หลังล็อกอินสำเร็จ
//
// JWT ทำงานยังไง (อธิบายแบบเข้าใจง่าย):
//   1) ผู้ใช้ล็อกอินสำเร็จ -> เซิร์ฟเวอร์สร้าง token ที่ข้างในมี userId
//   2) token ถูก "เซ็น" ด้วย JWT_SECRET (กุญแจลับที่มีแค่เซิร์ฟเวอร์รู้)
//   3) ฝั่งเว็บเก็บ token ไว้ แล้วแนบมากับทุก request ที่ต้องล็อกอิน
//   4) เซิร์ฟเวอร์ตรวจลายเซ็น -> ถ้าถูกต้องแปลว่าเป็นผู้ใช้คนนั้นจริง
//
// ข้อดี: เซิร์ฟเวอร์ไม่ต้องจำว่าใครล็อกอินอยู่ (ตัว token บอกเอง)
// -----------------------------------------------------------------------------
import jwt from 'jsonwebtoken'

// อ่านค่าลับจาก .env
const SECRET = process.env.JWT_SECRET
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// กันพลาด: ถ้าลืมตั้ง JWT_SECRET ให้ล้มตั้งแต่ตอนเริ่ม ดีกว่าไปพังตอนผู้ใช้ล็อกอิน
if (!SECRET) {
  throw new Error('ไม่พบ JWT_SECRET ใน .env — กรุณาตั้งค่าก่อนเริ่มเซิร์ฟเวอร์')
}

// สร้าง token จาก userId
export function signToken(userId) {
  // payload = ข้อมูลที่ฝังใน token (ใส่แค่ id พอ ห้ามใส่รหัสผ่านหรือข้อมูลลับ)
  return jwt.sign({ sub: String(userId) }, SECRET, { expiresIn: EXPIRES_IN })
}

// ตรวจสอบ token -> คืน payload ถ้าถูกต้อง, โยน error ถ้าปลอม/หมดอายุ
export function verifyToken(token) {
  return jwt.verify(token, SECRET)
}
