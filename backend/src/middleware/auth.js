// src/middleware/auth.js
// -----------------------------------------------------------------------------
// Middleware "ยามเฝ้าประตู" — ใช้กับ route ที่ต้องล็อกอินก่อนถึงจะเข้าได้
//
// วิธีใช้ใน route:
//   router.get('/me', protect, getMe)
//   ^ ถ้า token ถูกต้อง -> ไปต่อที่ getMe และมี req.userId ให้ใช้
//     ถ้าไม่ถูกต้อง    -> ตอบ 401 ทันที ไม่ไปต่อ
//
// ฝั่งเว็บต้องส่ง token มาแบบนี้:
//   Authorization: Bearer <token>
// -----------------------------------------------------------------------------
import { verifyToken } from '../utils/token.js'

export function protect(req, res, next) {
  // ดึงค่า header "Authorization"
  const header = req.headers.authorization || ''

  // ต้องขึ้นต้นด้วยคำว่า "Bearer " เท่านั้น
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' })
  }

  const token = header.slice(7) // ตัดคำว่า "Bearer " (7 ตัวอักษร) ออก

  try {
    const payload = verifyToken(token)
    // แปะ userId ไว้ที่ req เพื่อให้ controller ถัดไปใช้ได้
    req.userId = payload.sub
    next() // ผ่าน! ไปต่อได้
  } catch (err) {
    // token ปลอม หรือหมดอายุ
    return res.status(401).json({ ok: false, message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' })
  }
}
