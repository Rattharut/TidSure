// src/data/questions/index.js
// -----------------------------------------------------------------------------
// "คลังข้อสอบกลาง" — รวมข้อสอบจากทุกไฟล์ไว้ที่เดียว แล้วมีฟังก์ชันคัดข้อสอบให้
//
// ทำไมต้องมีไฟล์นี้:
//   หน้าเล่นเกม (DungeonMode / TimedMode) ไม่ควรรู้ว่าข้อสอบเก็บอยู่กี่ไฟล์
//   มันแค่บอกว่า "ขอข้อสอบ TGAT วิชา TGAT2 ระดับปานกลาง 20 ข้อ" แล้วได้ของกลับไป
//   ถ้าอนาคตเปลี่ยนไปดึงจาก backend ก็แก้แค่ไฟล์นี้ไฟล์เดียว
//
// *** ข้อสอบทั้งหมดเป็นข้อสอบจำลองที่แต่งขึ้นเพื่อฝึกฝน ไม่ใช่ข้อสอบจริง ***
// -----------------------------------------------------------------------------
import { tgatQuestions } from './tgat.js'
import { tpatQuestions } from './tpat.js'
import { alevelQuestions } from './alevel.js'
import { alevelExtraQuestions } from './alevel-extra.js'
import { alevelLangQuestions } from './alevel-lang.js'
import { alevelFrQuestions } from './alevel-fr.js'
import { alevelDeQuestions } from './alevel-de.js'
import { alevelEsQuestions } from './alevel-es.js'
import { alevelKoQuestions } from './alevel-ko.js'
import { alevelPaliQuestions } from './alevel-pali.js'

// รวมข้อสอบทุกวิชาเข้าด้วยกัน
// หมายเหตุ: แยกเป็นหลายไฟล์เพราะไฟล์เดียวใหญ่เกินไป (เพิ่มไฟล์ใหม่ก็มา import ต่อท้ายตรงนี้)
//   alevel.js       = A-Level ชุดแรก (61, 64, 65, 66, 82)
//   alevel-extra.js = A-Level ชุดสอง (62, 63, 70, 81) + TPAT1, TPAT5
//   alevel-lang.js  = A-Level 85 ญี่ปุ่น, 87 จีน
//   alevel-fr/de/es/ko/pali.js = A-Level 83 ฝรั่งเศส, 84 เยอรมัน, 89 สเปน, 86 เกาหลี, 88 บาลี
export const ALL_QUESTIONS = [
  ...tgatQuestions,
  ...tpatQuestions,
  ...alevelQuestions,
  ...alevelExtraQuestions,
  ...alevelLangQuestions,
  ...alevelFrQuestions,
  ...alevelDeQuestions,
  ...alevelEsQuestions,
  ...alevelKoQuestions,
  ...alevelPaliQuestions,
]

// =============================================================================
// สลับลำดับแบบสุ่ม (Fisher-Yates shuffle)
// =============================================================================
// ทำไมต้องสลับ: กันผู้เล่นจำลำดับข้อ ทำให้ฝึกซ้ำแล้วยังได้ประโยชน์
// หมายเหตุ: ฟังก์ชันนี้ก็อปอาร์เรย์ใหม่ก่อน ไม่แก้ของเดิม
function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// =============================================================================
// คัดข้อสอบตามเงื่อนไขที่ผู้เล่นเลือก
// =============================================================================
// รับ: { examType, subjectCode, difficulty, count }
//   examType    'TGAT' | 'TPAT' | 'A-Level' (ไม่ใส่ = ไม่กรอง)
//   subjectCode เช่น 'TGAT2' (ไม่ใส่ = เอาทุกวิชาของ examType นั้น)
//   difficulty  'ง่าย' | 'ปานกลาง' | 'ยาก' (ไม่ใส่ = ไม่กรอง)
//   count       อยากได้กี่ข้อ (ไม่ใส่ = เอาทั้งหมดที่มี)
//
// คืน: อาร์เรย์ข้อสอบที่สลับลำดับแล้ว
//
// สำคัญ: ถ้าข้อสอบในคลังมีน้อยกว่า count จะคืนเท่าที่มี (ไม่ปั้นข้อปลอมขึ้นมา)
//        ผู้เรียก (หน้าเกม) ต้องเช็คความยาวเองแล้วปรับจำนวนข้อของด่านตาม
export function getQuestions({ examType, subjectCode, difficulty, count } = {}) {
  let list = ALL_QUESTIONS

  if (examType) list = list.filter((q) => q.examType === examType)
  if (subjectCode) list = list.filter((q) => q.subjectCode === subjectCode)
  if (difficulty) list = list.filter((q) => q.difficulty === difficulty)

  list = shuffle(list)

  // ถ้าระบุจำนวน ให้ตัดเท่าที่ขอ (แต่ไม่เกินที่มีจริง)
  if (count && count > 0) list = list.slice(0, count)

  return list
}

// =============================================================================
// นับจำนวนข้อสอบที่มีตามเงื่อนไข (ใช้เช็คก่อนเริ่มด่าน)
// =============================================================================
export function countQuestions({ examType, subjectCode, difficulty } = {}) {
  return getQuestions({ examType, subjectCode, difficulty }).length
}

// =============================================================================
// TODO (อนาคต): เปลี่ยนมาดึงจาก backend แทนไฟล์ในเครื่อง
// =============================================================================
// เมื่อพร้อม ให้เพิ่มฟังก์ชันแบบนี้แล้วเรียกใช้แทน getQuestions():
//
//   export async function fetchQuestions({ examType, subjectCode, difficulty, count }) {
//     const params = new URLSearchParams({ examType, subjectCode, difficulty, count })
//     const res = await fetch(`/api/quiz?${params}`)
//     const data = await res.json()
//     return data.questions
//   }
//
// ฝั่ง backend ให้ทำใน src/controllers/quizController.js -> Question.find({...})
// โดย field ในฐานข้อมูลใช้ชื่อเดียวกับไฟล์นี้ทุกตัว จึงสลับมาใช้ได้ทันที

export default ALL_QUESTIONS
