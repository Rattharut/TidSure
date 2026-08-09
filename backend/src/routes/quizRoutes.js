// src/routes/quizRoutes.js
// -----------------------------------------------------------------------------
// เส้นทาง API กลุ่ม "ข้อสอบ" (ผูกไว้ใต้ /api/quiz)
//   GET  /api/quiz          -> ดึงชุดข้อสอบ (กรองด้วย ?examType=&difficulty=)
//   POST /api/quiz/submit   -> ส่งคำตอบเพื่อตรวจและบันทึกผล
// รอบนี้: controller ยังเป็น placeholder
// -----------------------------------------------------------------------------
import { Router } from 'express'
import { getQuestions, submitAnswers } from '../controllers/quizController.js'

const router = Router()

router.get('/', getQuestions)
router.post('/submit', submitAnswers)

export default router
