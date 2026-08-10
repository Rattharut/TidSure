// src/lib/playerStats.js
// -----------------------------------------------------------------------------
// "คลังค่าพลังผู้เล่น" — ประตูเดียวที่หน้าเว็บใช้อ่าน/เขียนผลการเล่น
//
// ทำไมต้องมีไฟล์นี้:
//   ผู้เล่นมี 2 แบบ และเก็บข้อมูลคนละที่
//     • ล็อกอินแล้ว -> เก็บที่ MongoDB ผ่าน API (ข้ามเครื่องได้)
//     • ผู้เยี่ยมชม  -> เก็บที่ localStorage (อยู่แค่เครื่องนี้)
//   ถ้าปล่อยให้หน้า Status กับ ScoreSummary ตัดสินใจเองทั้งคู่ โค้ดจะซ้ำและหลุดง่าย
//   ไฟล์นี้จึงซ่อนความต่างไว้ หน้าเว็บแค่เรียก saveRun() / loadStatus() พอ
//
// *** กฎการคิดค่าพลัง (ต้องตรงกับ backend/src/controllers/statusController.js) ***
//   1) นับเฉพาะผลจากโหมดจำกัดเวลา
//   2) วิชาเดียวกันหลายระดับ -> ยึดระดับที่ยากที่สุด
//      เช่น ง่าย 10/15 กับ ยาก 7/15 -> ใช้ 7/15
//   3) ระดับเดียวกันซ้ำหลายครั้ง -> เอาครั้งที่ดีที่สุด
// -----------------------------------------------------------------------------
import { statusApi, getToken } from './api.js'
import { MODE_TIMED } from '../data/gameConfig.js'
import { DIFFICULTY_THEME } from '../data/difficultyTheme.js'

// คีย์ใน localStorage สำหรับผู้เล่นที่ยังไม่ล็อกอิน
const GUEST_RUNS_KEY = 'tidsure_guest_runs'
const GUEST_AXES_KEY = 'tidsure_guest_axes'
const GUEST_NAME_KEY = 'tidsure_guest_name'
const GUEST_CLEARS_KEY = 'tidsure_guest_dungeon_clears' // จำนวนเคลียร์ดันของผู้เยี่ยมชม

// ชื่อเริ่มต้นเมื่อผู้เล่นยังไม่ได้ตั้งชื่อเอง
export const DEFAULT_PLAYER_NAME = 'นักผจญภัย'

// ความยาวชื่อสูงสุด — ต้องตรงกับ DISPLAY_NAME_MAX ใน
// backend/src/controllers/authController.js
export const NAME_MAX_LENGTH = 30

// แกนเริ่มต้น 6 ช่อง (ใช้ทั้งกรณีผู้เยี่ยมชมและตอน backend ยังไม่ตอบ)
export const DEFAULT_AXES = [
  'A-Level 61', 'A-Level 64', 'A-Level 65', 'TGAT1', 'TGAT2', 'TPAT3',
]

// อันดับความยาก — ดึงจากไฟล์ธีมเพื่อไม่ให้มีตัวเลขซ้ำสองที่
const rankOf = (difficulty) => DIFFICULTY_THEME[difficulty]?.rank ?? 0

// ผู้เล่นล็อกอินอยู่ไหม (มี token = ล็อกอินแล้ว)
const isLoggedIn = () => Boolean(getToken())

// =============================================================================
// กฎการยุบผลหลายครั้ง -> ค่าพลัง 1 ค่าต่อ 1 วิชา
// =============================================================================
// รับ:  อาร์เรย์ผลการเล่น [{ subjectCode, subjectName, difficulty, score, total }]
// คืน:  { 'TGAT2': { difficulty, percent, score, total, attempts }, ... }
export function summarizeRuns(runs) {
  const stats = {}

  for (const r of runs) {
    const rank = rankOf(r.difficulty)
    if (!rank || !r.total) continue // ข้อมูลเพี้ยน -> ข้าม ไม่ให้ทำทั้งก้อนพัง

    const percent = Math.round((r.score / r.total) * 100)
    const current = stats[r.subjectCode]

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

    // กฎข้อ 2: ระดับยากกว่าชนะเสมอ แม้เปอร์เซ็นต์จะต่ำกว่า
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

    // กฎข้อ 3: ระดับเดียวกัน -> เก็บครั้งที่ดีที่สุด
    if (rank === current.difficultyRank && percent > current.percent) {
      Object.assign(current, { percent, score: r.score, total: r.total })
    }
  }

  return stats
}

// =============================================================================
// ตัวช่วยอ่าน/เขียน localStorage (โหมดผู้เยี่ยมชม)
// =============================================================================
// ห่อด้วย try/catch ทุกครั้ง เพราะ localStorage พังได้จริง
// (โหมดส่วนตัวของบางเบราว์เซอร์ หรือพื้นที่เต็ม)
function readGuestRuns() {
  try {
    const raw = localStorage.getItem(GUEST_RUNS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeGuestRuns(runs) {
  try {
    localStorage.setItem(GUEST_RUNS_KEY, JSON.stringify(runs))
    return true
  } catch {
    return false
  }
}

// =============================================================================
// บันทึกผลการเล่น 1 ครั้ง
// =============================================================================
// รับก้อนข้อมูลจาก toStatusResult() ใน game/timedEngine.js
// คืน { saved, storage, message } เพื่อให้หน้าสรุปคะแนนบอกผู้เล่นได้ว่าเก็บที่ไหน
export async function saveRun(run) {
  // ด่านแรก: ผลที่ไม่ใช่โหมดจำกัดเวลา ห้ามเข้าระบบค่าพลังเด็ดขาด
  if (run?.source !== MODE_TIMED) {
    return { saved: false, storage: 'none', message: 'ผลนี้ไม่ถูกนำไปคิดค่าพลัง (ไม่ใช่โหมดจำกัดเวลา)' }
  }
  if (!run.subjectCode) {
    return { saved: false, storage: 'none', message: 'ไม่พบรหัสวิชา จึงบันทึกไม่ได้' }
  }

  const payload = {
    mode: MODE_TIMED,
    examType: run.examType,
    subjectCode: run.subjectCode,
    subjectName: run.subjectName || '',
    difficulty: run.difficulty,
    score: run.correct,
    total: run.total,
    timeSpentSec: run.timeSpentSec ?? 0,
  }

  // ---- ล็อกอินแล้ว: ส่งขึ้น backend ----
  if (isLoggedIn()) {
    try {
      await statusApi.saveResult(payload)
      return { saved: true, storage: 'server', message: 'บันทึกผลลงบัญชีของคุณแล้ว' }
    } catch (err) {
      // เน็ตหลุดหรือ backend ล่ม -> เก็บลงเครื่องไว้ก่อน ดีกว่าทำผลหาย
      writeGuestRuns([...readGuestRuns(), payload])
      return {
        saved: true,
        storage: 'local',
        message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ จึงเก็บผลไว้ในเครื่องนี้ก่อน',
      }
    }
  }

  // ---- ผู้เยี่ยมชม: เก็บลงเครื่อง ----
  const ok = writeGuestRuns([...readGuestRuns(), payload])
  return ok
    ? { saved: true, storage: 'local', message: 'เก็บผลไว้ในเครื่องนี้ (ล็อกอินเพื่อเก็บถาวร)' }
    : { saved: false, storage: 'none', message: 'บันทึกผลไม่สำเร็จ (เบราว์เซอร์ไม่ให้เก็บข้อมูล)' }
}

// =============================================================================
// จำนวนการเคลียร์ดันเจี้ยน (เลเวล + จำนวนมังกรที่สังหาร)
// =============================================================================
// ตัวนับในเครื่อง = "ตัวจริงที่นับทันที" ใช้ทั้ง guest และ login
// (login ใช้ backend เป็นที่จำถาวร แต่เครื่องนับก่อนเสมอ จะได้ไม่ช้า/ไม่หายถ้า backend งอแง)
function readClears() {
  try {
    const n = parseInt(localStorage.getItem(GUEST_CLEARS_KEY) || '0', 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}
function writeClears(n) {
  try {
    localStorage.setItem(GUEST_CLEARS_KEY, String(Math.max(0, Math.floor(n))))
  } catch {
    // เบราว์เซอร์ไม่ให้เก็บก็ปล่อยไป
  }
}

// ล้างตัวนับในเครื่อง — เรียกตอน logout กันยอดของคนเก่าติดไปโชว์ให้คนใหม่
export function resetDungeonClears() {
  try {
    localStorage.removeItem(GUEST_CLEARS_KEY)
  } catch {
    // ไม่เป็นไร
  }
}

// เรียกทุกครั้งที่ผู้เล่นชนะดันเจี้ยน -> เลเวล +1 + สังหารมังกร +1
// นับใน "เครื่องทันที" (ไม่มีวันช้า/หาย) แล้วถ้า login ค่อย sync ยอดล่าสุดขึ้น backend
export async function recordDungeonClear() {
  const next = readClears() + 1
  writeClears(next) // นับทันที ไม่ต้องรอเน็ต

  if (isLoggedIn()) {
    try {
      await statusApi.recordDungeonClear(next) // backend ใช้ $max กันนับซ้ำ/หาย
    } catch {
      // backend ยังไม่ตอบ (เช่น Render เพิ่งตื่น) ไม่เป็นไร
      // ค่าในเครื่องนับไว้แล้ว รอบหน้าที่โหลดหน้า Status จะ sync ขึ้นให้เอง
    }
  }
  return next
}

// =============================================================================
// โหลดค่าพลัง + การตั้งค่าแกน สำหรับหน้า Status
// =============================================================================
// คืน { stats, axes, totalRuns, dungeonClears, storage }
export async function loadStatus() {
  if (isLoggedIn()) {
    try {
      const data = await statusApi.getMyStatus()

      // reconcile ยอดเคลียร์ดัน: เอาค่าที่มากกว่าระหว่าง backend กับเครื่อง
      //   - ปกติ backend = ความจริง
      //   - แต่ถ้าเครื่องล้ำหน้า (เพิ่งชนะแต่ sync ไม่ทัน/พลาด) ใช้ค่าเครื่อง แล้วดันขึ้น backend
      const backendClears = data.dungeonClears ?? 0
      const localClears = readClears()
      const clears = Math.max(backendClears, localClears)
      writeClears(clears) // ให้เครื่องตรงกับความจริงล่าสุด
      if (localClears > backendClears) {
        statusApi.recordDungeonClear(clears).catch(() => {}) // ตามให้ backend ทัน (best-effort)
      }

      return {
        stats: data.stats || {},
        // แกนที่เป็นสตริงว่างจาก backend -> แปลงกลับเป็น null (= ยังไม่เลือกวิชา)
        axes: normalizeAxes(data.radarAxes),
        totalRuns: data.totalRuns ?? 0,
        dungeonClears: clears,
        storage: 'server',
      }
    } catch (err) {
      // ต่อ backend ไม่ได้ -> ตกมาใช้ข้อมูลในเครื่อง เว็บจะได้ไม่ค้างเป็นหน้าขาว
      return { ...loadGuestStatus(), storage: 'local', error: err.message }
    }
  }

  return { ...loadGuestStatus(), storage: 'local' }
}

function loadGuestStatus() {
  const runs = readGuestRuns()
  let axes = DEFAULT_AXES
  try {
    const raw = localStorage.getItem(GUEST_AXES_KEY)
    if (raw) axes = JSON.parse(raw)
  } catch {
    // ใช้ค่าเริ่มต้นต่อไป
  }
  return {
    stats: summarizeRuns(runs),
    axes: normalizeAxes(axes),
    totalRuns: runs.length,
    dungeonClears: readClears(),
  }
}

// =============================================================================
// บันทึกการตั้งค่าแกน (6 ช่อง)
// =============================================================================
export async function saveAxes(axes) {
  // แกนที่ยังไม่เลือกวิชา (null) -> ส่งเป็นสตริงว่าง เพราะ schema ฝั่ง backend เป็น [String]
  const payload = axes.map((code) => code || '')

  if (isLoggedIn()) {
    try {
      await statusApi.updateAxes(payload)
      return { saved: true, storage: 'server' }
    } catch {
      return { saved: false, storage: 'none' }
    }
  }

  try {
    localStorage.setItem(GUEST_AXES_KEY, JSON.stringify(payload))
    return { saved: true, storage: 'local' }
  } catch {
    return { saved: false, storage: 'none' }
  }
}

// =============================================================================
// ชื่อผู้เล่นของ "ผู้เยี่ยมชม" (คนที่ยังไม่ล็อกอิน)
// =============================================================================
// คนที่ล็อกอินแล้วไม่ใช้สองฟังก์ชันนี้ — ชื่อเก็บที่ user.displayName ใน MongoDB
// และแก้ผ่าน updateDisplayName() ใน AuthContext แทน
export function getGuestName() {
  try {
    return localStorage.getItem(GUEST_NAME_KEY) || DEFAULT_PLAYER_NAME
  } catch {
    return DEFAULT_PLAYER_NAME
  }
}

export function saveGuestName(name) {
  const clean = (name || '').trim().slice(0, NAME_MAX_LENGTH)
  if (!clean) return { saved: false, message: 'ชื่อผู้เล่นห้ามเว้นว่าง' }
  try {
    localStorage.setItem(GUEST_NAME_KEY, clean)
    return { saved: true, name: clean }
  } catch {
    return { saved: false, message: 'บันทึกชื่อไม่สำเร็จ (เบราว์เซอร์ไม่ให้เก็บข้อมูล)' }
  }
}

// ทำให้แกนมี 6 ช่องเสมอ และช่องว่างเป็น null
// กันกรณีข้อมูลเก่าในเครื่องมีไม่ครบ 6 ช่อง แล้วกราฟวาดเพี้ยน
function normalizeAxes(axes) {
  const arr = Array.isArray(axes) ? axes : []
  return Array.from({ length: 6 }, (_, i) => arr[i] || null)
}
