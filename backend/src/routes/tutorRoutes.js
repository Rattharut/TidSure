// src/routes/tutorRoutes.js
// -----------------------------------------------------------------------------
// เส้นทาง API ของครู AI "จอมปราชญ์" (ผูกไว้ใต้ /api/tutor)
//   POST /api/tutor -> ถามครู AI (ไม่ต้องล็อกอินก็ถามได้ เพราะเป็นตัวช่วยเรียนรู้)
//
// มี tutorLimiter คุมจำนวนครั้งต่อ IP ไว้ กันคนยิงรัว ๆ จนโควตา Gemini หมด
// -----------------------------------------------------------------------------
import { Router } from 'express'
import { askTutor } from '../controllers/tutorController.js'
import { tutorLimiter } from '../middleware/rateLimit.js'

const router = Router()

router.post('/', tutorLimiter, askTutor)

export default router
