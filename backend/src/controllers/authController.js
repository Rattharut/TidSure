// src/controllers/authController.js
// -----------------------------------------------------------------------------
// ระบบล็อกอินแบบคลาสสิก: อีเมล + รหัสผ่าน + JWT
//
// 3 เส้นทางในไฟล์นี้:
//   register — สมัครสมาชิก
//   login    — เข้าสู่ระบบ
//   getMe    — ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่ (ต้องผ่าน middleware protect ก่อน)
//
// ***กฎความปลอดภัยที่ยึดในไฟล์นี้***
//   1) ไม่เก็บรหัสผ่านเป็นข้อความล้วนเด็ดขาด -> เก็บเฉพาะค่า hash (bcrypt)
//   2) ตอนล็อกอินผิด ไม่บอกว่า "อีเมลผิด" หรือ "รหัสผ่านผิด" แยกกัน
//      -> บอกรวม ๆ ว่า "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
//      (ถ้าบอกแยก คนร้ายจะรู้ว่าอีเมลไหนมีในระบบ = เดารหัสต่อได้ง่ายขึ้น)
//   3) ไม่ส่ง passwordHash กลับไปให้ฝั่งเว็บ
// -----------------------------------------------------------------------------
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { signToken } from '../utils/token.js'

// จำนวนรอบการเข้ารหัส bcrypt (ยิ่งสูงยิ่งปลอดภัยแต่ช้าลง; 10-12 คือค่ามาตรฐาน)
const SALT_ROUNDS = 10

// ความยาวรหัสผ่านขั้นต่ำ
const MIN_PASSWORD_LENGTH = 8

// ตัวช่วย: แปลง User จากฐานข้อมูล -> ข้อมูลที่ปลอดภัยพอจะส่งให้ฝั่งเว็บ
// (ตัด passwordHash ออกเสมอ)
function toPublicUser(user) {
  return {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    // สกิลที่ปลดล็อกแล้ว — ฝั่งเว็บใช้ตัดสินว่าสกิลไหนกดใช้ได้ในโหมดดันเจี้ยน
    unlockedSkills: user.unlockedSkills || [],
    // จำนวนเคลียร์ดัน (เลเวล/มังกร) — ฝั่งเว็บเอาไปตั้งตัวนับในเครื่องให้ตรงตั้งแต่ login
    // (ไม่งั้นเครื่องเริ่มที่ 0 แล้วชนะดันจะโดน $max ฝั่ง server กลืนจนกว่าจะไล่ทันเลขเดิม)
    dungeonClears: user.dungeonClears || 0,
  }
  // หมายเหตุ: เคยมี field "stats" ตรงนี้ แต่ถูกถอดออกแล้ว
  // เพราะค่าพลังรายวิชาไม่ได้เก็บที่ User อีกต่อไป — คำนวณสดจาก collection Result
  // และดึงผ่าน GET /api/status/me แทน (ดู statusController.js)
}

// =============================================================================
// POST /api/auth/register — สมัครสมาชิก
// =============================================================================
export async function register(req, res, next) {
  try {
    const { email, password, displayName } = req.body || {}

    // ---- 1) ตรวจข้อมูลที่ส่งมา ----
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' })
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`,
      })
    }

    // ---- 2) เช็คว่าอีเมลนี้มีคนใช้แล้วหรือยัง ----
    const normalizedEmail = String(email).toLowerCase().trim()
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return res.status(409).json({ ok: false, message: 'อีเมลนี้ถูกใช้สมัครไปแล้ว' })
    }

    // ---- 3) เข้ารหัสรหัสผ่าน (ห้ามเก็บรหัสจริง) ----
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // ---- 4) บันทึกผู้ใช้ใหม่ ----
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName?.trim() || 'นักผจญภัย',
    })

    // ---- 5) ออก token ให้เลย (สมัครเสร็จ = ล็อกอินอัตโนมัติ) ----
    const token = signToken(user._id)

    return res.status(201).json({
      ok: true,
      message: 'สมัครสมาชิกสำเร็จ',
      token,
      user: toPublicUser(user),
    })
  } catch (err) {
    next(err) // ส่งต่อให้ errorHandler จัดการ
  }
}

// =============================================================================
// POST /api/auth/login — เข้าสู่ระบบ
// =============================================================================
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })

    // ไม่เจอผู้ใช้ -> ตอบข้อความรวม ๆ (ไม่บอกว่าอีเมลไม่มีในระบบ)
    if (!user) {
      return res.status(401).json({ ok: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    }

    // เทียบรหัสผ่านที่กรอก กับค่า hash ที่เก็บไว้
    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      return res.status(401).json({ ok: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    }

    const token = signToken(user._id)

    return res.json({
      ok: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: toPublicUser(user),
    })
  } catch (err) {
    next(err)
  }
}

// =============================================================================
// GET /api/auth/me — ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
// =============================================================================
// ต้องผ่าน middleware protect ก่อน (จึงจะมี req.userId)
// ฝั่งเว็บใช้ตอนเปิดเว็บใหม่: มี token เก่าอยู่ -> ยิงมาเช็คว่ายังใช้ได้ไหม + เอาข้อมูลล่าสุด
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ ok: false, message: 'ไม่พบผู้ใช้' })
    }
    return res.json({ ok: true, user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}

// =============================================================================
// PATCH /api/auth/me — แก้ไขข้อมูลโปรไฟล์ของตัวเอง (ตอนนี้มีแค่ชื่อที่ใช้แสดง)
// =============================================================================
// ต้องผ่าน middleware protect ก่อน (จึงจะมี req.userId)
//
// ความปลอดภัย: แก้ได้เฉพาะ field ที่อนุญาตเท่านั้น
//   ห้ามรับทั้ง req.body ไปยัดใส่ update ตรง ๆ เด็ดขาด
//   ไม่งั้นผู้ใช้ยิง { passwordHash: "..." } มาก็เปลี่ยนรหัสผ่านคนอื่นได้
const DISPLAY_NAME_MAX = 30

export async function updateMe(req, res, next) {
  try {
    const { displayName } = req.body || {}

    if (typeof displayName !== 'string') {
      return res.status(400).json({ ok: false, message: 'กรุณาระบุชื่อผู้เล่น' })
    }

    const name = displayName.trim()

    if (!name) {
      return res.status(400).json({ ok: false, message: 'ชื่อผู้เล่นห้ามเว้นว่าง' })
    }
    if (name.length > DISPLAY_NAME_MAX) {
      return res.status(400).json({
        ok: false,
        message: `ชื่อผู้เล่นยาวได้ไม่เกิน ${DISPLAY_NAME_MAX} ตัวอักษร`,
      })
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { displayName: name },
      { new: true, runValidators: true }
    )

    if (!user) {
      return res.status(404).json({ ok: false, message: 'ไม่พบผู้ใช้' })
    }

    return res.json({ ok: true, user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}

// =============================================================================
// POST /api/auth/skills/unlock — ปลดล็อกสกิลจากการชนะบอส
// =============================================================================
// ต้องผ่าน middleware protect ก่อน (จึงจะมี req.userId)
//
// รับ: { skillId } — id ของสกิลที่จะปลดล็อก (เช่น 'damageBoost')
//
// ความปลอดภัย: รับเฉพาะ id ที่อยู่ใน allowlist เท่านั้น
//   ไม่งั้นผู้ใช้ยิงชื่อสกิลมั่ว ๆ เข้ามาสะสมใน array ได้ไม่จำกัด
//
// ใช้ $addToSet กันเพิ่มซ้ำ — ปลดล็อกสกิลเดิมกี่ครั้งก็มีแค่รายการเดียว
const VALID_SKILL_IDS = ['damageBoost', 'moodeng', 'fiftyFifty']

export async function unlockSkill(req, res, next) {
  try {
    const { skillId } = req.body || {}

    if (!VALID_SKILL_IDS.includes(skillId)) {
      return res.status(400).json({ ok: false, message: 'ไม่รู้จักสกิลนี้' })
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { unlockedSkills: skillId } },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ ok: false, message: 'ไม่พบผู้ใช้' })
    }

    return res.json({ ok: true, user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}
