// src/controllers/quizController.js
// -----------------------------------------------------------------------------
// Controller กลุ่มข้อสอบ — รอบนี้เป็น PLACEHOLDER
// -----------------------------------------------------------------------------

// GET /api/quiz?examType=TGAT&difficulty=ปานกลาง — ดึงชุดข้อสอบตามเงื่อนไข
export async function getQuestions(req, res) {
  // TODO: ใช้ Question.find({ examType, difficulty }) ดึงจากฐานข้อมูลจริง
  const { examType, difficulty } = req.query
  res.status(501).json({
    ok: false,
    message: 'ยังไม่ได้ต่อฐานข้อมูลข้อสอบ (placeholder)',
    filter: { examType: examType ?? null, difficulty: difficulty ?? null },
  })
}

// POST /api/quiz/submit — ส่งคำตอบเพื่อตรวจและบันทึกผล
export async function submitAnswers(req, res) {
  // TODO: 1) ตรวจคำตอบเทียบ field correct  2) คำนวณคะแนน  3) บันทึกลง Result
  res.status(501).json({ ok: false, message: 'ยังไม่ได้ทำระบบตรวจ/บันทึกคำตอบ (placeholder)' })
}
