// src/lib/api.js
// -----------------------------------------------------------------------------
// ตัวช่วยเรียก API ฝั่ง backend — รวมไว้ที่เดียว จะได้ไม่ต้องเขียน fetch ซ้ำ ๆ ทุกหน้า
//
// สิ่งที่ไฟล์นี้จัดการให้อัตโนมัติ:
//   1) ใส่ header Content-Type: application/json
//   2) แนบ token (ถ้ามี) ในรูปแบบ Authorization: Bearer <token>
//   3) แปลงผลลัพธ์เป็น object ให้เลย
//   4) ถ้า backend ตอบ error -> โยน Error พร้อมข้อความภาษาไทยจาก backend
//
// หมายเหตุ: เราเรียก '/api/...' แบบสั้นได้เพราะตั้ง proxy ไว้ใน vite.config.js
// -----------------------------------------------------------------------------

// คีย์ที่ใช้เก็บ token ใน localStorage (ที่เก็บข้อมูลถาวรของเบราว์เซอร์)
const TOKEN_KEY = 'tidsure_token'

// -----------------------------------------------------------------------------
// ที่อยู่ของ backend
// -----------------------------------------------------------------------------
//   ตอนพัฒนา (บนเครื่อง): ค่าว่าง -> เรียก '/api/...' แบบ relative -> vite proxy ส่งต่อให้ localhost:5000
//   ตอนขึ้นจริง (production): ตั้ง VITE_API_URL = URL ของ backend บน Render
//       เช่น https://tidsure-api.onrender.com
//       แล้ว fetch จะกลายเป็น https://tidsure-api.onrender.com/api/...
//
// ตั้งค่าที่ไหน: ตอน deploy บน Vercel -> Settings -> Environment Variables -> VITE_API_URL
// สำคัญ: ชื่อต้องขึ้นต้น VITE_ เท่านั้น ไม่งั้น vite จะไม่ส่งค่านี้เข้าโค้ดฝั่งเว็บ
//        และห้ามมี / ปิดท้าย (เดี๋ยวจะได้ // ซ้อน)
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// ---- จัดการ token ใน localStorage ----
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// ---- ฟังก์ชันกลางสำหรับเรียก API ----
// path   = เส้นทาง เช่น '/api/auth/login'
// options= { method, body } (body ส่งเป็น object ธรรมดา เดี๋ยวแปลงเป็น JSON ให้)
async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  // ถ้ามี token ให้แนบไปด้วย (เส้นทางที่ต้องล็อกอินจะใช้ค่านี้)
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    // API_BASE ว่าง (dev) -> path เดิม (proxy) / มีค่า (production) -> เติม URL backend เต็มข้างหน้า
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    // ต่อเซิร์ฟเวอร์ไม่ติดเลย (เช่น ลืมเปิด backend)
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจสอบว่าเปิด backend อยู่หรือไม่')
  }

  // อ่านผลเป็น JSON (เผื่อ backend ตอบไม่ใช่ JSON ก็ไม่ให้พัง)
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  // backend ตอบสถานะ error (4xx / 5xx)
  if (!res.ok) {
    throw new Error(data?.message || `เกิดข้อผิดพลาด (${res.status})`)
  }

  return data
}

// =============================================================================
// เส้นทางเกี่ยวกับบัญชีผู้ใช้
// =============================================================================
export const authApi = {
  // สมัครสมาชิก -> คืน { token, user }
  register: (email, password, displayName) =>
    request('/api/auth/register', { method: 'POST', body: { email, password, displayName } }),

  // เข้าสู่ระบบ -> คืน { token, user }
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),

  // ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่ (ต้องมี token) -> คืน { user }
  me: () => request('/api/auth/me'),

  // แก้ชื่อที่ใช้แสดง -> คืน { user } ที่อัปเดตแล้ว
  updateName: (displayName) =>
    request('/api/auth/me', { method: 'PATCH', body: { displayName } }),

  // ปลดล็อกสกิล (หลังชนะบอส) -> คืน { user } ที่มี unlockedSkills อัปเดตแล้ว
  unlockSkill: (skillId) =>
    request('/api/auth/skills/unlock', { method: 'POST', body: { skillId } }),
}

// =============================================================================
// เส้นทางเกี่ยวกับสถานะผู้เล่น (ค่าพลัง + แกนกราฟเรดาร์)
// =============================================================================
// ทุกเส้นทางต้องล็อกอิน — request() แนบ token ให้อัตโนมัติอยู่แล้ว
//
// หมายเหตุ: อย่าเรียกจากหน้าเว็บโดยตรง ให้ผ่าน lib/playerStats.js แทน
//           เพราะไฟล์นั้นจัดการกรณีผู้เยี่ยมชม (ยังไม่ล็อกอิน) ให้ด้วย
export const statusApi = {
  // บันทึกผลการเล่น 1 ครั้ง
  saveResult: (result) => request('/api/status/result', { method: 'POST', body: result }),

  // ค่าพลังรายวิชา + การตั้งค่าแกน -> คืน { stats, radarAxes, totalRuns }
  getMyStatus: () => request('/api/status/me'),

  // บันทึกการตั้งค่าแกน (อาร์เรย์รหัสวิชา 6 ช่อง)
  updateAxes: (radarAxes) => request('/api/status/axes', { method: 'PUT', body: { radarAxes } }),
}

export default request
