// src/lib/progress.js
// -----------------------------------------------------------------------------
// "ความก้าวหน้าของผู้เล่น" — ตอนนี้เก็บแค่ "สกิลที่ปลดล็อกแล้ว"
//
// สกิลปลดล็อกเมื่อฆ่าบอสของแต่ละระดับความยากสำเร็จ:
//   บอสง่าย -> เสริมดาเมจ | บอสปานกลาง -> หมูเด้ง | บอสยาก -> ตัดตัวเลือก
//
// -----------------------------------------------------------------------------
// *** ผู้เล่น 2 แบบ เก็บคนละที่ (ตามที่ผู้ใช้กำหนด) ***
// -----------------------------------------------------------------------------
//   ล็อกอินแล้ว  -> เก็บที่ MongoDB ผ่าน API — จำถาวร ข้ามเครื่อง ข้ามการรีเว็บ
//
//   ผู้เยี่ยมชม   -> เก็บใน "หน่วยความจำ" ของหน้าเว็บเท่านั้น (ตัวแปร cache ด้านล่าง)
//                   *** ไม่เก็บลง localStorage โดยตั้งใจ ***
//                   ปลดล็อกแล้วใช้ได้ระหว่างเล่น (ข้ามด่าน ข้ามหน้าได้)
//                   แต่พอรีเฟรช/ปิดเปิดเว็บใหม่ -> cache หาย -> สกิลกลับไปล็อก
//                   ถ้าอยากให้จำถาวร ต้องล็อกอิน
//
// ทำไม guest ต้องเป็น in-memory ไม่ใช่ localStorage:
//   ถ้าใช้ localStorage มันจะจำข้ามการรีเว็บ ซึ่งขัดกับสเปกที่ว่า
//   "ไม่ล็อกอิน = รีเว็บแล้วสกิลล็อกเหมือนเดิม"
// -----------------------------------------------------------------------------
import { getToken, authApi } from './api.js'
import {
  SKILL_DAMAGE_BOOST, SKILL_MOODENG, SKILL_FIFTY_FIFTY,
  SKILL_UNLOCK_BY_DIFFICULTY,
} from '../data/gameConfig.js'

// รายการสกิลทั้งหมด (ไว้สร้าง map ที่มีครบทุกคีย์)
const ALL_SKILL_IDS = [SKILL_DAMAGE_BOOST, SKILL_MOODENG, SKILL_FIFTY_FIFTY]

// แปลง array ของ id ที่ปลดล็อก -> map { id: true/false } ครบทุกสกิล
// (dungeonEngine อยากได้รูปแบบ map เพื่อเช็ค unlocked ทีละตัว)
function toMap(unlockedIds = []) {
  const map = {}
  for (const id of ALL_SKILL_IDS) map[id] = unlockedIds.includes(id)
  return map
}

// -----------------------------------------------------------------------------
// cache ในหน่วยความจำ (module-level) — อยู่รอดข้ามด่าน/ข้ามหน้า แต่หายเมื่อรีเฟรช
// -----------------------------------------------------------------------------
// เก็บเป็น Set ของ id ที่ปลดล็อก เริ่มต้น "ว่าง" = ทุกสกิลล็อก
// ใช้ทั้งสองแบบผู้เล่น:
//   guest -> นี่คือที่เก็บจริงที่เดียว
//   login -> เป็นสำเนาจาก backend ที่โหลดมาตอนล็อกอิน (ดู syncFromUser)
let unlockedCache = new Set()

const isLoggedIn = () => Boolean(getToken())

// =============================================================================
// อ่านสกิลที่ปลดล็อก (sync) — dungeonEngine ใช้ตอนสร้างด่าน
// =============================================================================
// คืน { unlockedSkills: { damageBoost: bool, moodeng: bool, fiftyFifty: bool } }
// รูปแบบนี้ตรงกับที่ createDungeonRun(progress) ต้องการ
export function getProgress() {
  return { unlockedSkills: toMap([...unlockedCache]) }
}

// เช็คสกิลตัวเดียว (ใช้ตัดสินว่าหมูเด้งโผล่ข้างผู้เล่นไหม ฯลฯ)
export function isSkillUnlocked(skillId) {
  return unlockedCache.has(skillId)
}

// =============================================================================
// ตั้ง cache จากข้อมูลผู้ใช้ที่ล็อกอิน (เรียกจาก AuthContext)
// =============================================================================
// ตอนล็อกอิน/เปิดเว็บใหม่พร้อม token เดิม -> เอา unlockedSkills จาก backend มาใส่ cache
export function syncFromUser(user) {
  unlockedCache = new Set(user?.unlockedSkills || [])
}

// ล้าง cache — เรียกตอน logout หรือเริ่มเป็นผู้เยี่ยมชม
// (guest เริ่มต้นต้องล็อกทุกสกิลเสมอ)
export function resetProgress() {
  unlockedCache = new Set()
}

// =============================================================================
// บันทึกการชนะบอส -> ปลดล็อกสกิลของระดับนั้น
// =============================================================================
// เรียกเมื่อผู้เล่นชนะด่านดันเจี้ยน (ฆ่าบอสสำเร็จ)
//
// คืน { skillId, alreadyHad } เพื่อให้หน้าจบด่านรู้ว่าเพิ่งปลดล็อกใหม่ หรือมีอยู่แล้ว
export async function recordBossWin(difficulty) {
  const skillId = SKILL_UNLOCK_BY_DIFFICULTY[difficulty]
  if (!skillId) return { skillId: null, alreadyHad: false }

  const alreadyHad = unlockedCache.has(skillId)

  // ปลดล็อกใน cache ทันที (ทั้ง guest และ login) เพื่อให้ด่านถัดไปใช้ได้เลย
  unlockedCache.add(skillId)

  // ล็อกอินแล้ว -> ส่งขึ้น backend ให้จำถาวรด้วย
  // guest -> ไม่ทำอะไรต่อ อยู่แค่ใน cache (รีเว็บแล้วหาย ตามสเปก)
  if (isLoggedIn() && !alreadyHad) {
    try {
      await authApi.unlockSkill(skillId)
    } catch {
      // ต่อ backend ไม่ได้ก็ไม่เป็นไร cache ยังปลดล็อกให้เล่นต่อได้
      // รอบหน้าที่ชนะบอสตัวเดิมจะลองส่งใหม่เอง
    }
  }

  return { skillId, alreadyHad }
}
