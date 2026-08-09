// src/game/timedEngine.js
// -----------------------------------------------------------------------------
// "สมองกล" ของโหมดจำกัดเวลา (จำลองห้องสอบ) — LOGIC ล้วน ไม่มี UI
//
// ความต่างจากโหมดดันเจี้ยน (สำคัญ):
//   • ผู้เล่น "และ" บอมังกร เป็นอมตะทั้งคู่ -> หัวใจไม่ลดเลย มีไว้โชว์เฉย ๆ
//   • มีบอสมังกรตัวเดียว ไม่มี Monster ตัวอื่น
//   • ไม่มีระบบสกิลเด็ดขาด (ไฟล์นี้จึงไม่ import อะไรที่เกี่ยวกับสกิลเลย)
//   • ไม่บอกว่าตอบถูกหรือผิดระหว่างทำ (เหมือนห้องสอบจริง) -> รู้ผลตอนจบด่านทีเดียว
//   • ทุกครั้งที่ตอบ 1 ข้อ จะ "สุ่ม" ว่าผู้เล่นฟันบอส หรือบอสฟันผู้เล่น 1 ครั้ง
//     -> เป็นภาพประกอบล้วน ๆ ไม่ผูกกับความถูก/ผิด และไม่มีใครเสียหัวใจ
//     (ถ้าผูกกับความถูกผิด ผู้เล่นจะเดาคำตอบได้จากอนิเมชัน ซึ่งขัดกับ "ไม่บอกถูกผิด")
//   • แพ้/ชนะตัดสินด้วย "เวลา" อย่างเดียว
//       - ทำครบทุกข้อก่อนหมดเวลา -> ผู้เล่นฆ่าบอส (ชนะ)
//       - หมดเวลาก่อนทำครบ       -> บอสฆ่าผู้เล่น (แพ้)
//
// -----------------------------------------------------------------------------
// โครงสร้างข้อมูลของ "การเล่น 1 ด่าน" (run):
// {
//   mode: 'timed',
//   difficulty,
//   player: { hearts: 1, maxHearts: 1, immortal: true },   // หัวใจสีทอง
//   boss:   { name, hearts, maxHearts },                   // มังกร
//   questionIndex, totalQuestions,
//   stats: { answered, correct },
//   timeLeft, totalTime,        // หน่วยวินาที
//   status: 'playing' | 'win' | 'lose',
//   lastEvent
// }
// -----------------------------------------------------------------------------
import {
  MODE_TIMED,
  TIMED_PLAYER_HEARTS,
  TIMED_PLAYER_IMMORTAL,
  TIMED_QUESTIONS_PER_STAGE,
  TIMED_SECONDS,
  POINTS_PER_QUESTION,
} from '../data/gameConfig.js'

// =============================================================================
// เริ่มด่านใหม่
// =============================================================================
export function createTimedRun({ difficulty, totalQuestions = TIMED_QUESTIONS_PER_STAGE }) {
  const totalTime = TIMED_SECONDS[difficulty] ?? TIMED_SECONDS['ปานกลาง']

  return {
    mode: MODE_TIMED,
    difficulty,
    // ผู้เล่น: หัวใจสีทอง 1 ดวง + อมตะ (หัวใจไม่ลดเลย มีไว้โชว์)
    player: {
      hearts: TIMED_PLAYER_HEARTS,
      maxHearts: TIMED_PLAYER_HEARTS,
      immortal: TIMED_PLAYER_IMMORTAL,
    },
    // บอสมังกร: อมตะเหมือนกัน หัวใจไม่ลด มีไว้โชว์คู่กับผู้เล่น
    // (รอบนี้ภาพเป็น placeholder)
    boss: {
      name: 'มังกรผู้เฝ้าสนามสอบ',
      hearts: 1,
      maxHearts: 1,
      immortal: true,
    },
    questionIndex: 0,
    totalQuestions,
    stats: { answered: 0, correct: 0 },
    timeLeft: totalTime,
    totalTime,
    status: 'playing',
    lastEvent: null,
  }
}

// =============================================================================
// ตอบคำถาม 1 ข้อ
// =============================================================================
// กติกา (ตามสเปกล่าสุด):
//   • ยังคงนับว่าตอบถูกกี่ข้อไว้ "เงียบ ๆ" เพื่อเอาไปคิดคะแนนตอนจบ
//     แต่ไม่บอกผู้เล่นระหว่างทำ
//   • ทุกครั้งที่ตอบ จะสุ่มว่า "ผู้เล่นฟันบอส" หรือ "บอสฟันผู้เล่น" 1 ครั้ง
//     -> เป็นภาพประกอบล้วน ๆ ไม่มีใครเสียหัวใจ (อมตะทั้งคู่)
//     -> ***ห้ามผูกการสุ่มนี้กับ isCorrect เด็ดขาด*** ไม่งั้นผู้เล่นจะอ่านคำตอบออกจากอนิเมชัน
//   • ทำครบทุกข้อ (และเวลายังเหลือ) -> ชนะ: ผู้เล่นฟันบอสจบในตอนท้าย
//
// หมายเหตุ: เงื่อนไขชนะคือ "ทำครบทุกข้อก่อนหมดเวลา" ไม่ใช่ "ต้องตอบถูกหมด"
export function answerTimedQuestion(run, isCorrect) {
  if (run.status !== 'playing') return run

  const next = {
    ...run,
    player: { ...run.player },
    boss: { ...run.boss },
    stats: { ...run.stats },
  }

  next.stats.answered += 1
  if (isCorrect) next.stats.correct += 1 // นับไว้เงียบ ๆ ใช้ตอนสรุปคะแนน

  // ---- สุ่มการปะทะ 1 ครั้ง (ภาพประกอบเท่านั้น ไม่มีใครเสียหัวใจ) ----
  // Math.random() < 0.5 -> ผู้เล่นฟันบอส / ไม่งั้น -> บอสฟันผู้เล่น
  next.lastEvent = Math.random() < 0.5
    ? { type: 'playerSwing' }  // ผู้เล่นเข้าฟันมังกร
    : { type: 'bossSwing' }    // มังกรฟาดกลับ

  next.questionIndex += 1

  // ทำครบทุกข้อแล้ว และเวลายังเหลือ -> ชนะ (ฟันบอสจบ)
  if (next.questionIndex >= next.totalQuestions && next.timeLeft > 0) {
    next.status = 'win'
    next.lastEvent = { type: 'finishingBlow' }
  }

  return next
}

// =============================================================================
// เดินเวลา (ให้ UI เรียกทุก ๆ 1 วินาที)
// =============================================================================
// รับ: run + จำนวนวินาทีที่ผ่านไป (ปกติ 1)
// คืน: run ใหม่ที่เวลาลดลง และถ้าเวลาหมด -> แพ้ (บอสฆ่าผู้เล่น)
export function tickTimedRun(run, deltaSeconds = 1) {
  if (run.status !== 'playing') return run

  const timeLeft = Math.max(0, run.timeLeft - deltaSeconds)
  const next = { ...run, timeLeft, player: { ...run.player } }

  if (timeLeft === 0) {
    // หมดเวลา = บอสฆ่าผู้เล่น (ข้อยกเว้นเดียวที่หัวใจสีทองหายไป)
    next.status = 'lose'
    next.player.hearts = 0
    next.lastEvent = { type: 'timeUp' }
  }

  return next
}

// =============================================================================
// คำนวณคะแนน (ใช้ในหน้าสรุปผล)
// =============================================================================
// คืน: { score, maxScore, text }  เช่น { score:67, maxScore:80, text:'67/80 คะแนน' }
export function computeTimedScore(run) {
  const score = run.stats.correct * POINTS_PER_QUESTION
  const maxScore = run.totalQuestions * POINTS_PER_QUESTION
  return {
    score,
    maxScore,
    percent: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    text: `${score}/${maxScore} คะแนน`,
  }
}

// =============================================================================
// แปลงผลด่าน -> ข้อมูลที่หน้า Status เอาไปใช้
// =============================================================================
// สำคัญมากตามสเปก: ค่าในกราฟเรดาร์หน้า Status ต้องมาจาก "โหมดจำกัดเวลา" เท่านั้น
//   (โหมดดันเจี้ยนมีสกิลช่วย ค่าจึงไม่สะท้อนความสามารถจริง -> ห้ามนำมาคิด)
//
// ฟังก์ชันนี้จึงเป็น "ประตูทางเดียว" ที่ผลการเล่นจะไหลเข้าไปที่ Status ได้
//
// ผลก้อนนี้ถูกส่งต่อไปที่ lib/playerStats.js -> saveRun()
// ซึ่งจะเลือกเองว่าจะเก็บลง backend (ถ้าล็อกอิน) หรือ localStorage (ผู้เยี่ยมชม)
//
// รับ: run = สถานะด่าน, subject = วิชาที่เลือก, examType = 'TGAT' | 'TPAT' | 'A-Level'
export function toStatusResult(run, subject, examType) {
  const { percent } = computeTimedScore(run)

  // เวลาที่ใช้จริง = เวลาตั้งต้น ลบเวลาที่เหลือ
  // กันค่าติดลบไว้ด้วย เผื่อนาฬิกาถูกปรับหรือค่าเพี้ยน
  const timeSpentSec = Math.max(0, (run.totalTime ?? 0) - (run.timeLeft ?? 0))

  return {
    source: MODE_TIMED,          // ตราประทับว่ามาจากโหมดจำกัดเวลา (กันเผลอเอาดันเจี้ยนมาปน)
    examType: examType ?? null,
    subjectCode: subject?.code ?? null,
    subjectName: subject?.name ?? null,
    difficulty: run.difficulty,
    percent,                      // 0–100 -> ใช้เป็นค่าพลังบนแกนเรดาร์
    correct: run.stats.correct,   // จำนวนข้อที่ตอบถูก (เช่น 7 จาก 15)
    total: run.totalQuestions,
    timeSpentSec,
  }
}
