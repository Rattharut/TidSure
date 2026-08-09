// src/models/Result.js
// -----------------------------------------------------------------------------
// "ผลการทำข้อสอบ 1 ครั้ง" — บันทึกทุกครั้งที่ผู้เล่นจบด่าน
//
// ใช้ทำอะไร:
//   นำไปคำนวณค่าพลังรายวิชาบนกราฟเรดาร์หน้า Status
//
// *** กฎเหล็ก ***
//   เฉพาะ mode === 'timed' เท่านั้นที่ถูกนำไปคิดค่าพลัง
//   โหมดดันเจี้ยนบันทึกไว้ดูประวัติได้ แต่ห้ามนำมาคิด เพราะมีสกิลช่วย
//   (การกรองทำที่ statusController.js ไม่ใช่ที่นี่)
// -----------------------------------------------------------------------------
import mongoose from 'mongoose'

const resultSchema = new mongoose.Schema(
  {
    // อ้างอิงถึงผู้ใช้ที่ทำข้อสอบ
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // เงื่อนไขที่เลือกก่อนทำ (ตรงกับหน้า TakeQuiz)
    mode: { type: String, enum: ['dungeon', 'timed'], required: true },
    examType: { type: String, enum: ['TGAT', 'TPAT', 'A-Level'], required: true },

    // รหัสวิชาย่อย เช่น 'TGAT2', 'A-Level 64'
    // สำคัญมาก: กราฟเรดาร์แยกค่าพลัง "รายวิชาย่อย" ไม่ใช่รายประเภทข้อสอบ
    subjectCode: { type: String, required: true, trim: true },
    subjectName: { type: String, default: '' },

    difficulty: { type: String, enum: ['ง่าย', 'ปานกลาง', 'ยาก'], required: true },

    // สรุปคะแนน
    score: { type: Number, required: true, min: 0 },  // จำนวนข้อที่ตอบถูก
    total: { type: Number, required: true, min: 1 },  // จำนวนข้อทั้งหมด
    timeSpentSec: { type: Number, default: 0 },       // เวลาที่ใช้ (วินาที)
  },
  { timestamps: true }
)

// ดัชนีช่วยให้ query ตอนคำนวณค่าพลังเร็วขึ้น
// (หาผลของผู้ใช้คนหนึ่ง เฉพาะโหมด timed แยกตามวิชา)
resultSchema.index({ user: 1, mode: 1, subjectCode: 1 })

export default mongoose.model('Result', resultSchema)
