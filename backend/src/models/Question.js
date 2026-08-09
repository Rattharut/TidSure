// src/models/Question.js
// -----------------------------------------------------------------------------
// โครง schema ของ "ข้อสอบ" (Question) สำหรับเก็บใน MongoDB
// ****ให้ field ตรงกับไฟล์ mock ฝั่ง frontend: src/data/mockQuestions.js****
// เพื่อให้ข้อมูลจาก backend ใช้แทน mock ได้ทันทีโดยไม่ต้องแก้ฝั่งหน้าเว็บ
//
// รอบนี้เป็นโครง: กำหนดรูปร่างข้อมูลไว้ แต่ยังไม่มีการเขียน/อ่านจริง
// -----------------------------------------------------------------------------
import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    // รหัสข้อสอบไม่ซ้ำ เช่น "tgat2-med-001"
    id: { type: String, required: true, unique: true },

    // ชื่อวิชา/หมวด เช่น "TGAT2 การคิดอย่างมีเหตุผล"
    subject: { type: String, required: true },

    // ประเภทข้อสอบ (ให้ตรงกับตัวเลือกหน้า TakeQuiz) — ใช้กรองตอนดึงข้อสอบ
    examType: { type: String, enum: ['TGAT', 'TPAT', 'A-Level'], required: true },

    // ระดับความยาก (ให้ตรงกับตัวเลือกหน้า TakeQuiz)
    difficulty: { type: String, enum: ['ง่าย', 'ปานกลาง', 'ยาก'], required: true },

    // ข้อความโจทย์
    question: { type: String, required: true },

    // ตัวเลือก 4 ข้อ
    choices: {
      type: [String],
      required: true,
      // validate ให้มี 4 ตัวเลือกพอดี
      validate: [(arr) => arr.length === 4, 'ต้องมีตัวเลือก 4 ข้อ'],
    },

    // ตำแหน่งคำตอบที่ถูก เริ่มนับจาก 0 (0–3)
    correct: { type: Number, required: true, min: 0, max: 3 },

    // สูตร/หลักการที่ใช้ (โชว์ตอนเฉลย)
    formula: { type: String, default: '' },

    // วิธีทำสั้น กระชับ (โชว์ตอนเฉลย)
    explanation: { type: String, default: '' },
  },
  { timestamps: true } // เพิ่ม createdAt / updatedAt ให้อัตโนมัติ
)

export default mongoose.model('Question', questionSchema)
