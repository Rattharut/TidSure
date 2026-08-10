// src/context/AuthContext.jsx
// -----------------------------------------------------------------------------
// "ที่เก็บสถานะล็อกอินกลาง" ของทั้งเว็บ
//
// ปัญหาที่แก้: ข้อมูลผู้ใช้ต้องใช้หลายที่ (Navbar, หน้า Account, หน้า Status)
//   ถ้าส่งผ่าน props ทีละชั้นจะยุ่งมาก -> ใช้ Context แทน = ประกาศครั้งเดียวใช้ได้ทั้งเว็บ
//
// วิธีใช้ในหน้าอื่น:
//   import { useAuth } from '../context/AuthContext.jsx'
//   const { user, login, logout } = useAuth()
//
// ค่าที่ให้ใช้:
//   user      = ข้อมูลผู้ใช้ที่ล็อกอินอยู่ (null = ยังไม่ล็อกอิน)
//   loading   = กำลังเช็ค token เดิมอยู่ไหม (ตอนเปิดเว็บครั้งแรก)
//   login()   / register() / logout()
//   isGuest   = เข้าแบบผู้เยี่ยมชม (ไม่ล็อกอินแต่เล่นได้)
// -----------------------------------------------------------------------------
import { createContext, useContext, useState, useEffect } from 'react'
import { authApi, getToken, setToken, clearToken } from '../lib/api.js'
import { syncFromUser, resetProgress } from '../lib/progress.js'
import { resetDungeonClears } from '../lib/playerStats.js'

// สร้างกล่อง Context
const AuthContext = createContext(null)

// Hook สั้น ๆ ให้หน้าอื่นเรียกใช้ง่าย
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องอยู่ภายใน <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true = กำลังเช็ค token เดิม
  const [isGuest, setIsGuest] = useState(false)

  // ---- ตอนเปิดเว็บครั้งแรก: ถ้ามี token เก่าอยู่ ลองเอาไปเช็คว่ายังใช้ได้ไหม ----
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    // มี token -> ยิงไปถาม backend ว่าเราเป็นใคร
    authApi.me()
      .then((data) => {
        setUser(data.user)
        syncFromUser(data.user)   // เอาสกิลที่ปลดล็อกจาก backend มาใส่ cache
      })
      .catch(() => {
        // token หมดอายุ/ปลอม -> ล้างทิ้ง
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // ---- เข้าสู่ระบบ ----
  async function login(email, password) {
    const data = await authApi.login(email, password)
    setToken(data.token)   // เก็บบัตรผ่านไว้ใน localStorage
    setUser(data.user)
    syncFromUser(data.user) // โหลดสกิลที่เคยปลดล็อกไว้ของบัญชีนี้
    setIsGuest(false)
    return data.user
  }

  // ---- สมัครสมาชิก (สมัครเสร็จ = ล็อกอินให้เลย) ----
  async function register(email, password, displayName) {
    const data = await authApi.register(email, password, displayName)
    setToken(data.token)
    setUser(data.user)
    syncFromUser(data.user) // บัญชีใหม่ยังไม่มีสกิลอะไร -> cache ว่าง
    setIsGuest(false)
    return data.user
  }

  // ---- เปลี่ยนชื่อที่ใช้แสดง ----
  // อัปเดต state ที่นี่ด้วย เพื่อให้ทุกหน้าที่อ่าน user.displayName เปลี่ยนตามทันที
  // (Navbar / หน้า Account / หน้า Status ใช้ค่าเดียวกันหมด)
  async function updateDisplayName(displayName) {
    const data = await authApi.updateName(displayName)
    setUser(data.user)
    return data.user
  }

  // ---- ออกจากระบบ ----
  function logout() {
    clearToken()
    setUser(null)
    setIsGuest(false)
    resetProgress()        // ล้างสกิลออกจาก cache — คนถัดไปที่ใช้เครื่องนี้ต้องเริ่มใหม่
    resetDungeonClears()   // ล้างยอดเลเวล/มังกรในเครื่อง กันติดไปหาคนใหม่
  }

  // ---- เข้าแบบผู้เยี่ยมชม (ไม่บันทึกความก้าวหน้า) ----
  function continueAsGuest() {
    setIsGuest(true)
  }

  // value = ของทั้งหมดที่ส่งให้ลูก ๆ ใช้
  const value = {
    user, loading, isGuest,
    login, register, logout, continueAsGuest, updateDisplayName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
