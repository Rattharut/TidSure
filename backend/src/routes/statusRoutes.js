// src/routes/statusRoutes.js
// -----------------------------------------------------------------------------
// เส้นทาง API กลุ่ม "สถานะผู้เล่น" (ผูกไว้ใต้ /api/status)
//
//   POST /api/status/result -> บันทึกผลการเล่น 1 ครั้ง
//   GET  /api/status/me     -> ค่าพลังรายวิชา + การตั้งค่าแกน 6 แกน
//   PUT  /api/status/axes   -> บันทึกว่าแต่ละแกนคือวิชาอะไร
//
// ทุกเส้นทางใส่ protect เพราะข้อมูลเหล่านี้เป็นของรายบุคคล
//
// สังเกตว่าไม่มี /:userId ใน URL แล้ว — controller อ่าน req.userId จาก token แทน
// เหตุผลด้านความปลอดภัย: ถ้ารับ userId จาก URL ใครก็แก้เลขแล้วดูค่าพลังคนอื่นได้
// -----------------------------------------------------------------------------
import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { saveResult, getMyStatus, updateAxes } from '../controllers/statusController.js'

const router = Router()

router.post('/result', protect, saveResult)
router.get('/me', protect, getMyStatus)
router.put('/axes', protect, updateAxes)

export default router
