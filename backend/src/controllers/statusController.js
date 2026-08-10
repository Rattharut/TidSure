// src/controllers/statusController.js
// -----------------------------------------------------------------------------
// Controller กลุ่ม "สถานะผู้เล่น" — ป้อนข้อมูลให้กราฟเรดาร์ 6 แกนหน้า Status
//
// เส้นทางในไฟล์นี้ (ทุกเส้นต้องล็อกอินก่อน):
//   POST /api/status/result -> บันทึกผลการเล่น 1 ครั้ง
//   GET  /api/status/me     -> ดึงค่าพลังรายวิชา + การตั้งค่าแกน
//   PUT  /api/status/axes   -> บันทึกว่าแต่ละแกนคือวิชาอะไร
//
// *** กฎการคิดค่าพลัง (สเปกจากผู้ใช้) ***
//   1) นับเฉพาะผลจากโหมดจำกัดเวลา (timed) เท่านั้น
//      โหมดดันเจี้ยนมีสกิลช่วย ค่าจึงไม่สะท้อนความสามารถจริง
//   2) ถ้าเล่นวิชาเดียวกันหลายระดับ -> ยึด "ระดับที่ยากที่สุด" ที่เคยเล่น
//      ตัวอย่าง: ง่าย 10/15 กับ ยาก 7/15 -> ใช้ 7/15 (ระดับยาก)
//      เหตุผล: ทำข้อยากได้ 7/15 สะท้อนความสามารถมากกว่าทำข้อง่ายได้ 10/15
//   3) ถ้าเล่นระดับเดียวกันซ้ำหลายครั้ง -> เอาครั้งที่ทำได้ดีที่สุด
//      (เป็นค่าที่ผู้เล่น "ทำได้จริง" แล้ว จึงถือเป็นความสามารถของเขา)
// -----------------------------------------------------------------------------
import Result from '../models/Result.js'
import User from '../models/User.js'

// อันดับความยาก — ตัวเลขมากกว่า = ยากกว่า ใช้เปรียบเทียบตามกฎข้อ 2
const DIFFICULTY_RANK = { 'ง่าย': 1, 'ปานกลาง': 2, 'ยาก': 3 }

const VALID_MODES = ['dungeon', 'timed']
const VALID_EXAM_TYPES = ['TGAT', 'TPAT', 'A-Level']

// =============================================================================
// POST /api/status/result — บันทึกผลการเล่น 1 ครั้ง
// =============================================================================
export async function saveResult(req, res, next) {
  try {
    const { mode, examType, subjectCode, subjectName, difficulty, score, total, timeSpentSec } = req.body || {}

    // ---- ตรวจข้อมูลก่อนบันทึก ----
    // ทำที่นี่ด้วย (ไม่พึ่ง schema อย่างเดียว) เพราะอยากได้ข้อความไทยที่บอกชัดว่าผิดตรงไหน
    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ ok: false, message: 'โหมดไม่ถูกต้อง' })
    }
    if (!VALID_EXAM_TYPES.includes(examType)) {
      return res.status(400).json({ ok: false, message: 'ประเภทข้อสอบไม่ถูกต้อง' })
    }
    if (!subjectCode || typeof subjectCode !== 'string') {
      return res.status(400).json({ ok: false, message: 'ไม่พบรหัสวิชา' })
    }
    if (!(difficulty in DIFFICULTY_RANK)) {
      return res.status(400).json({ ok: false, message: 'ระดับความยากไม่ถูกต้อง' })
    }
    if (!Number.isInteger(total) || total < 1) {
      return res.status(400).json({ ok: false, message: 'จำนวนข้อไม่ถูกต้อง' })
    }
    if (!Number.isInteger(score) || score < 0 || score > total) {
      return res.status(400).json({ ok: false, message: 'คะแนนไม่ถูกต้อง' })
    }

    const result = await Result.create({
      user: req.userId,
      mode,
      examType,
      subjectCode: subjectCode.trim(),
      subjectName: subjectName || '',
      difficulty,
      score,
      total,
      timeSpentSec: Number.isFinite(timeSpentSec) ? Math.max(0, Math.round(timeSpentSec)) : 0,
    })

    res.status(201).json({ ok: true, result })
  } catch (err) {
    next(err)
  }
}

// =============================================================================
// GET /api/status/me — ค่าพลังรายวิชา + การตั้งค่าแกน
// =============================================================================
export async function getMyStatus(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('displayName radarAxes dungeonClears')
    if (!user) {
      return res.status(404).json({ ok: false, message: 'ไม่พบผู้ใช้' })
    }

    // ดึงเฉพาะผลโหมดจำกัดเวลา (กฎข้อ 1) — โหมดดันเจี้ยนถูกตัดออกตั้งแต่ตรงนี้
    const results = await Result.find({ user: req.userId, mode: 'timed' })
      .select('subjectCode subjectName difficulty score total createdAt')
      .lean()

    res.json({
      ok: true,
      displayName: user.displayName,
      radarAxes: user.radarAxes,
      stats: summarizeBySubject(results),
      totalRuns: results.length,
      dungeonClears: user.dungeonClears || 0,
    })
  } catch (err) {
    next(err)
  }
}

// =============================================================================
// POST /api/status/dungeon-clear — เพิ่มจำนวนการเคลียร์ดันเจี้ยน +1
// =============================================================================
// เรียกทุกครั้งที่ผู้เล่นชนะดันเจี้ยน (ฆ่ามังกร/บอสประจำด่านสำเร็จ)
// ใช้ $inc เพื่อบวกแบบอะตอมมิก (กันแข่งกันเขียนถ้ายิงพร้อมกัน)
export async function recordDungeonClear(req, res, next) {
  try {
    const { clears } = req.body || {}

    // ถ้า client ส่ง "ยอดรวมล่าสุด" มา -> ใช้ $max (ตั้งเป็นค่าที่มากกว่าเสมอ)
    //   idempotent: ยิงซ้ำด้วยยอดเดิมก็ไม่เพิ่ม -> กันนับซ้ำเวลา retry
    //   และถ้าเครื่อง client นับล้ำหน้า (เพราะ backend เคยพลาด) ก็ตามให้ทัน -> กันนับหาย
    // ถ้าไม่ส่งมา (ของเก่า) -> +1 แบบเดิม
    const update = Number.isFinite(clears) && clears >= 0
      ? { $max: { dungeonClears: Math.floor(clears) } }
      : { $inc: { dungeonClears: 1 } }

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('dungeonClears')

    if (!user) {
      return res.status(404).json({ ok: false, message: 'ไม่พบผู้ใช้' })
    }

    res.json({ ok: true, dungeonClears: user.dungeonClears })
  } catch (err) {
    next(err)
  }
}

// =============================================================================
// PUT /api/status/axes — บันทึกการตั้งค่าแกน (6 ช่อง)
// =============================================================================
export async function updateAxes(req, res, next) {
  try {
    const { radarAxes } = req.body || {}

    if (!Array.isArray(radarAxes) || radarAxes.length !== 6) {
      return res.status(400).json({ ok: false, message: 'กราฟเรดาร์ต้องมี 6 แกนพอดี' })
    }

    // แปลงค่าว่าง/null ให้เป็นสตริงว่าง เพื่อให้ schema แบบ [String] รับได้
    // (แกนที่ยังไม่เลือกวิชา = สตริงว่าง ฝั่งเว็บจะแปลงกลับเป็น null เอง)
    const cleaned = radarAxes.map((code) => (typeof code === 'string' ? code.trim() : ''))

    const user = await User.findByIdAndUpdate(
      req.userId,
      { radarAxes: cleaned },
      { new: true, runValidators: true }
    ).select('radarAxes')

    if (!user) {
      return res.status(404).json({ ok: false, message: 'ไม่พบผู้ใช้' })
    }

    res.json({ ok: true, radarAxes: user.radarAxes })
  } catch (err) {
    next(err)
  }
}

// =============================================================================
// ตัวช่วย: ยุบผลหลายครั้ง -> ค่าพลัง 1 ค่าต่อ 1 วิชา (ตามกฎข้อ 2 และ 3)
// =============================================================================
// รับ:  อาร์เรย์ Result (กรองมาแล้วว่าเป็นโหมด timed)
// คืน:  { 'TGAT2': { difficulty, percent, score, total, attempts }, ... }
//
// แยกออกมาเป็นฟังก์ชันเดี่ยวเพราะเป็น "กฎธุรกิจ" ที่อาจต้องแก้ในอนาคต
// และทดสอบง่ายกว่าถ้าไม่ผูกกับ req/res
export function summarizeBySubject(results) {
  const stats = {}

  for (const r of results) {
    const rank = DIFFICULTY_RANK[r.difficulty]
    if (!rank || !r.total) continue // ข้อมูลเพี้ยน -> ข้ามไป ไม่ให้ทำทั้งก้อนพัง

    const percent = Math.round((r.score / r.total) * 100)
    const current = stats[r.subjectCode]

    // ยังไม่เคยมีวิชานี้ -> ใช้ค่านี้ไปก่อน
    if (!current) {
      stats[r.subjectCode] = {
        subjectName: r.subjectName || '',
        difficulty: r.difficulty,
        difficultyRank: rank,
        percent,
        score: r.score,
        total: r.total,
        attempts: 1,
      }
      continue
    }

    current.attempts += 1

    // กฎข้อ 2: ระดับยากกว่าชนะเสมอ แม้เปอร์เซ็นต์จะต่ำกว่าก็ตาม
    if (rank > current.difficultyRank) {
      Object.assign(current, {
        difficulty: r.difficulty,
        difficultyRank: rank,
        percent,
        score: r.score,
        total: r.total,
      })
      continue
    }

    // กฎข้อ 3: ระดับเดียวกัน -> เก็บครั้งที่ทำได้ดีที่สุด
    if (rank === current.difficultyRank && percent > current.percent) {
      Object.assign(current, { percent, score: r.score, total: r.total })
    }

    // ระดับต่ำกว่า -> ไม่สนใจ (นับเป็น attempt แล้วเท่านั้น)
  }

  return stats
}
