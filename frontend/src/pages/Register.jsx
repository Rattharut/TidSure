// src/pages/Register.jsx
// -----------------------------------------------------------------------------
// หน้าสมัครสมาชิก (/register) — ต่อกับ backend จริง
//
// ฟิลด์: ชื่อผู้เล่น (ไม่บังคับ) + อีเมล + รหัสผ่าน + ยืนยันรหัสผ่าน
// สมัครสำเร็จ = backend ออก token ให้เลย -> ล็อกอินอัตโนมัติ -> พาไปหน้า Status
//
// การตรวจข้อมูล (validation) ทำ 2 ชั้น:
//   ชั้นที่ 1 (หน้านี้): เช็คง่าย ๆ ก่อนส่ง เช่น รหัสผ่านตรงกันไหม / ยาวพอไหม
//                        -> ผู้ใช้รู้ผลทันที ไม่ต้องรอเซิร์ฟเวอร์
//   ชั้นที่ 2 (backend): เช็คซ้ำเสมอ เพราะฝั่งเว็บถูกข้ามได้ (ห้ามไว้ใจฝั่งเว็บอย่างเดียว)
// -----------------------------------------------------------------------------
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { IconUser, IconArrowLeft } from '../components/icons/index.jsx'

// ต้องตรงกับ MIN_PASSWORD_LENGTH ฝั่ง backend
const MIN_PASSWORD_LENGTH = 8

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // ---- ตรวจชั้นที่ 1 (ฝั่งเว็บ) ----
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`)
      return
    }
    if (password !== confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    // ---- ส่งไปสมัครจริง ----
    setSubmitting(true)
    try {
      await register(email, password, displayName)
      navigate('/status') // สมัครเสร็จ = ล็อกอินให้เลย -> ไปหน้าสถานะ
    } catch (err) {
      setError(err.message) // เช่น "อีเมลนี้ถูกใช้สมัครไปแล้ว"
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-md items-center px-4 py-14">
      <div className="w-full animate-fade-up">
        <div className="text-center">
          <img
            src="/images/moodeng-hi.png"
            alt="Moodeng ทักทาย"
            className="mx-auto h-28 w-28 object-contain"
          />
          <h1 className="mt-4 text-2xl font-semibold text-ink">สมัครสมาชิก</h1>
          <p className="mt-1 text-sm text-muted">สร้างบัญชีเพื่อเก็บเลเวลและค่าพลังของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
          {error && (
            <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          {/* ชื่อผู้เล่น (ไม่บังคับ) */}
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm text-ink">
              ชื่อผู้เล่น <span className="text-muted">(ไม่บังคับ)</span>
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="นักผจญภัย"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-ink placeholder:text-muted/60 transition-colors focus:border-arcane focus:outline-none focus:ring-2 focus:ring-arcane/40"
            />
          </div>

          {/* อีเมล */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-ink">
              อีเมล <span className="text-rose">*</span>
            </label>
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

          {/* รหัสผ่าน */}
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-ink">
              รหัสผ่าน <span className="text-rose">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
            {/* helper text อยู่ถาวร ไม่ใช่แค่ placeholder */}
            <p className="mt-1 text-xs text-muted">อย่างน้อย {MIN_PASSWORD_LENGTH} ตัวอักษร</p>
          </div>

          {/* ยืนยันรหัสผ่าน */}
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm text-ink">
              ยืนยันรหัสผ่าน <span className="text-rose">*</span>
            </label>
            <input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-ink placeholder:text-muted/60 transition-colors focus:border-arcane focus:outline-none focus:ring-2 focus:ring-arcane/40"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            <IconUser className="h-5 w-5" />
            {submitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/account" className="inline-flex items-center gap-1 text-arcane2 hover:underline">
            <IconArrowLeft className="h-3 w-3" /> กลับไปเข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  )
}
