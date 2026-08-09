// src/routes/authRoutes.js
// -----------------------------------------------------------------------------
// เส้นทาง API กลุ่ม "บัญชีผู้ใช้" (ผูกไว้ใต้ /api/auth ใน server.js)
//   POST /api/auth/register -> สมัครสมาชิก        (เปิดสาธารณะ)
//   POST /api/auth/login    -> เข้าสู่ระบบ         (เปิดสาธารณะ)
//   GET   /api/auth/me      -> ข้อมูลผู้ใช้ปัจจุบัน (ต้องล็อกอิน -> ผ่าน protect ก่อน)
//   PATCH /api/auth/me      -> แก้ชื่อที่ใช้แสดง    (ต้องล็อกอิน)
// -----------------------------------------------------------------------------
import { Router } from 'express'
import { register, login, getMe, updateMe, unlockSkill } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'

const router = Router()

// authLimiter = จำกัดจำนวนครั้ง กันเดารหัสผ่าน/สแปมสมัคร (ดู middleware/rateLimit.js)
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)

// protect = ยามเฝ้าประตู ถ้า token ไม่ผ่านจะไม่ถึง controller
router.get('/me', protect, getMe)
router.patch('/me', protect, updateMe)
router.post('/skills/unlock', protect, unlockSkill)

export default router
