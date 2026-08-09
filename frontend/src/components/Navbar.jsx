// src/components/Navbar.jsx
// -----------------------------------------------------------------------------
// แถบเมนูบนสุด (ติดทุกหน้า) — จัดเป็น 3 ส่วน:
//   [ส่วนที่ 1] โลโก้ (ซ้าย)
//   [ส่วนที่ 2] เมนูกลาง: Home · Contact · Status · TakeQuiz (จัดกึ่งกลางแถบ)
//   [ส่วนที่ 3] ปุ่ม Login (ขวา)
//
// เทคนิคจัด "เมนูกลาง" ให้อยู่กึ่งกลางแถบจริง ๆ ไม่ว่าซ้าย/ขวาจะกว้างแค่ไหน:
//   ใช้ absolute + left-1/2 + -translate-x-1/2 บนกล่องเมนูกลาง
//   (ตัวแถบ nav ต้องเป็น relative)
//
// จุดสำคัญ (logic):
//  • NavLink ไฮไลต์เมนูของหน้าปัจจุบันอัตโนมัติ
//  • "Contact" เลื่อนไป footer (id="contact") ของหน้า Home ไม่ใช่เปลี่ยนหน้า
//  • เมนูมือถือใช้ state `open` สลับเปิด/ปิด
//
// *** ทำไม breakpoint ใช้ lg (1024px) ไม่ใช่ md (768px) ***
//   เมนูกลางใช้ฟอนต์ pixel (Press Start 2P) ซึ่งกว้างกว่าฟอนต์ทั่วไปมาก
//   เมนู 4 อันรวมกันกว้าง ~554px แต่ iPad แนวตั้ง (768px) เหลือที่ตรงกลางแค่ ~386px
//   เมนูกลางเป็น absolute overlay จึงไปทับโลโก้และปุ่ม Login (บั๊กที่เจอบน iPad)
//   -> เปลี่ยนให้จอ < 1024px (มือถือ + iPad แนวตั้ง) ใช้เมนู hamburger แทน
//      เหลือเมนูเต็มเฉพาะ iPad แนวนอน + เดสก์ท็อป (1024px ขึ้นไป) ที่มีที่พอ
// -----------------------------------------------------------------------------
import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { IconHome, IconMail, IconChart, IconSword, IconUser, IconMenu, IconClose, IconHeartPixel } from './icons/index.jsx'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  // ดึงสถานะล็อกอินจากที่เก็บกลาง -> ใช้ตัดสินใจว่าปุ่มขวาจะโชว์อะไร
  const { user } = useAuth()

  // เลื่อนไป footer (Contact)
  function goToContact() {
    setOpen(false)
    const scrollToFooter = () => {
      const el = document.getElementById('contact')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
    if (location.pathname === '/') scrollToFooter()
    else { navigate('/'); setTimeout(scrollToFooter, 100) }
  }

  // เมนูกลาง (Contact แทรกเป็นปุ่มพิเศษ ตามตำแหน่งที่โจทย์กำหนด)
  const centerLinks = [
    { to: '/',         label: 'Home',     Icon: IconHome },
    { contact: true,   label: 'Contact',  Icon: IconMail },
    { to: '/status',   label: 'Status',   Icon: IconChart },
    { to: '/takequiz', label: 'TakeQuiz', Icon: IconSword },
  ]

  // สไตล์ลิงก์เมนูกลาง (มีขีดเรืองแสงใต้เมนู active)
  // min-h-[44px] = พื้นที่แตะขั้นต่ำ เพราะ iPad แนวนอนก็ใช้เมนูนี้ด้วย (เป็น touch)
  const deskLink = () =>
    'group relative flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 font-pixel text-xs text-white'

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/70 backdrop-blur-md">
      {/* relative = ไว้ให้เมนูกลางอ้างอิงจัดกึ่งกลาง */}
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3">

        {/* ---- ส่วนที่ 1: โลโก้ (ซ้าย) ---- */}
        <NavLink to="/" className="group flex items-center gap-1" onClick={() => setOpen(false)}>
          <span className="font-pixel text-2xl leading-none text-white">Tidsure</span>
          <IconHeartPixel
            className="h-10 w-10 animate-pulse-glow text-rose"
            style={{ filter: 'drop-shadow(2px 2px 0 #3a2405)' }}
          />
        </NavLink>

        {/* ---- ส่วนที่ 2: เมนูกลาง (จัดกึ่งกลางแถบ) — แสดงเฉพาะจอ lg ขึ้นไป ---- */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {centerLinks.map((item) =>
            item.contact ? (
              // ปุ่ม Contact (เลื่อนลง footer)
              <button
                key="contact"
                onClick={goToContact}
                className="group relative flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 font-pixel text-xs text-white"
              >
                <item.Icon className="h-5 w-5" />
                {item.label}
                <span className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-arcane opacity-0 transition-all group-hover:opacity-100" />
              </button>
            ) : (
              <NavLink key={item.to} to={item.to} className={deskLink} end={item.to === '/'}>
                {({ isActive }) => (
                  <>
                    <item.Icon className="h-5 w-5" />
                    {item.label}
                    <span
                      className={[
                        'absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-arcane transition-all',
                        isActive ? 'opacity-100 shadow-glow' : 'opacity-0 group-hover:opacity-100',
                      ].join(' ')}
                    />
                  </>
                )}
              </NavLink>
            )
          )}
        </div>

        {/* ---- ส่วนที่ 3: ปุ่ม Login / ชื่อผู้เล่น (ขวา) — แสดงเฉพาะจอ lg ขึ้นไป ---- */}
        {/* ล็อกอินอยู่ -> โชว์ชื่อผู้เล่น (กดไปหน้าบัญชี) / ยังไม่ล็อกอิน -> โชว์ปุ่ม Login
            max-w + truncate = กันชื่อผู้เล่นยาว ๆ ดันเมนูจนล้น */}
        <div className="hidden lg:block">
          <NavLink to="/account" className="btn-cta max-w-[200px] !px-4 !py-2 text-sm">
            <IconUser className="h-4 w-4 shrink-0" />
            <span className="truncate">{user ? user.displayName : 'Login'}</span>
          </NavLink>
        </div>

        {/* ---- ปุ่ม hamburger (จอเล็ก + iPad แนวตั้ง) ---- */}
        {/* min-h/min-w 44px = พื้นที่แตะขั้นต่ำตามมาตรฐาน touch (Apple HIG / Material)
            ปุ่มไอคอนเดี่ยว ๆ ถ้าเล็กกว่านี้จะกดพลาดง่ายบนแท็บเล็ต/มือถือ */}
        <button
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink transition-colors hover:text-arcane2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
          aria-expanded={open}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </nav>

      {/* ---- เมนูแบบ dropdown (จอเล็ก + iPad แนวตั้ง) ---- */}
      {open && (
        <div className="animate-fade-in border-t border-border bg-surface/95 px-4 py-2 backdrop-blur lg:hidden">
          {centerLinks.map((item) =>
            item.contact ? (
              <button
                key="contact-m"
                onClick={goToContact}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-pixel text-xs text-white"
              >
                <item.Icon className="h-5 w-5" />
                {item.label}
              </button>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-3 font-pixel text-xs text-white',
                    isActive ? 'bg-elevated' : '',
                  ].join(' ')
                }
              >
                <item.Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            )
          )}

          {/* Login / ชื่อผู้เล่น แยกไว้ล่างสุด (มีเส้นคั่น) */}
          <div className="my-2 h-px bg-border" />
          <NavLink
            to="/account"
            onClick={() => setOpen(false)}
            className="btn-cta w-full !px-5 !py-2.5 text-sm"
          >
            <IconUser className="h-5 w-5" />
            {user ? user.displayName : 'Login'}
          </NavLink>
        </div>
      )}
    </header>
  )
}
