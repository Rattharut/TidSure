// src/pages/Account.jsx
// -----------------------------------------------------------------------------
// หน้า Account / Login — ต่อกับ backend จริงแล้ว (อีเมล + รหัสผ่าน + JWT)
//
// 2 สถานะของหน้านี้:
//   • ยังไม่ล็อกอิน -> แสดงฟอร์มเข้าสู่ระบบ + ปุ่ม guest + ลิงก์ไปสมัครสมาชิก
//   • ล็อกอินแล้ว   -> แสดงข้อมูลบัญชี + ปุ่มออกจากระบบ
//
// แนวคิด React ที่ใช้:
//   • useState เก็บค่าที่พิมพ์ (controlled input) + สถานะ loading/error
//   • useAuth() ดึงฟังก์ชัน login/logout จากที่เก็บกลาง (context/AuthContext.jsx)
//   • async/await เรียก API แล้วรอผล -> ถ้า error ให้โชว์ข้อความ
// -----------------------------------------------------------------------------
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { LogoMark } from '../components/Logo.jsx'
import { IconUser, IconArrowRight, IconCheck } from '../components/icons/index.jsx'

export default function Account() {
  const { user, loading: authLoading, login, logout } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')       // ข้อความ error จาก backend
  const [submitting, setSubmitting] = useState(false) // กำลังส่งข้อมูลอยู่ไหม

  // ---- กดเข้าสู่ระบบ ----
  async function handleSubmit(e) {
    e.preventDefault()      // กันหน้ารีโหลด
    setError('')
    setSubmitting(true)     // ปิดปุ่มกันกดซ้ำ

    try {
      await login(email, password)
      navigate('/status')   // ล็อกอินสำเร็จ -> ไปหน้าสถานะผู้เล่น
    } catch (err) {
      setError(err.message) // เช่น "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
    } finally {
      setSubmitting(false)
    }
  }

  // ---- กำลังเช็ค token เดิมอยู่ (ตอนเพิ่งเปิดเว็บ) ----
  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-md items-center justify-center px-4">
        <p className="text-muted">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
      </div>
    )
  }

  // =========================================================================
  // ล็อกอินอยู่แล้ว -> แสดงข้อมูลบัญชี
  // =========================================================================
  if (user) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-md items-center px-4 py-14">
        <div className="w-full animate-fade-up">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-arcane/40 bg-arcane/10 ring-glow">
              <LogoMark className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-ink">บัญชีของคุณ</h1>
          </div>

          <div className="card mt-8 space-y-3">
            <div className="flex items-center gap-2 text-success">
              <IconCheck className="h-5 w-5" />
              <span className="font-heading text-sm">เข้าสู่ระบบอยู่</span>
            </div>
            <div className="rounded-xl border border-border bg-bg/60 p-3 text-sm">
              <p className="text-muted">ชื่อผู้เล่น: <span className="text-ink">{user.displayName}</span></p>
              <p className="mt-1 text-muted">อีเมล: <span className="text-ink">{user.email}</span></p>
            </div>

            <Link to="/status" className="btn-primary w-full">
              ดูสถานะผู้เล่น
              <IconArrowRight className="h-4 w-4" />
            </Link>

            {/* ปุ่มออกจากระบบ แยกออกมาให้ชัด ไม่ปนกับปุ่มหลัก */}
            <button onClick={logout} className="w-full rounded-xl border border-danger/40 px-5 py-3 font-heading text-danger transition-colors hover:bg-danger/10">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // ยังไม่ล็อกอิน -> ฟอร์มเข้าสู่ระบบ
  // =========================================================================
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-md items-center px-4 py-14">
      <div className="w-full -translate-y-8 animate-fade-up">
        <div className="text-center">
          <img
            src="/images/moodeng-hi.png"
            alt="Moodeng ทักทาย"
            className="mx-auto h-28 w-28 object-contain"
          />
          <h1 className="mt-4 text-2xl font-semibold text-ink">เข้าสู่ระบบ</h1>
          <p className="mt-1 text-sm text-muted">เข้าสู่บัญชีเพื่อบันทึกความก้าวหน้าของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
          {/* กล่องแสดง error รวม (เช่น อีเมล/รหัสผ่านไม่ถูกต้อง)
              role="alert" = ให้ screen reader อ่านทันทีที่ error โผล่ */}
          {error && (
            <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-ink">อีเมล</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-ink placeholder:text-muted/60 transition-colors focus:border-arcane focus:outline-none focus:ring-2 focus:ring-arcane/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-ink">รหัสผ่าน</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 pr-16 text-ink placeholder:text-muted/60 transition-colors focus:border-arcane focus:outline-none focus:ring-2 focus:ring-arcane/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted transition-colors hover:text-arcane2"
              >
                {showPassword ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
          </div>

          {/* ปุ่มหลัก: ปิดตัวเองระหว่างส่งข้อมูล กันกดซ้ำ */}
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            <IconUser className="h-5 w-5" />
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-arcane2 hover:underline">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  )
}
