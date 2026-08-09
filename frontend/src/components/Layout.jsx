// src/components/Layout.jsx
// -----------------------------------------------------------------------------
// "โครงร่วม" ของทุกหน้า = พื้นหลังบรรยากาศเกม + Navbar (บนสุด) + เนื้อหาของหน้า
//
// <Outlet /> = ตำแหน่งที่ react-router เอา "หน้า" ปัจจุบันมาวางแทน
// (Footer อยู่เฉพาะท้ายหน้า Home ตามโจทย์ จึงไม่ได้อยู่ในนี้)
// -----------------------------------------------------------------------------
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'

export default function Layout() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* พื้นหลังตกแต่ง (อยู่หลังสุด, กดทะลุไม่ได้) — fixed ให้ติดจอตอนเลื่อน */}
      <BackgroundFX />

      <Navbar />
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BackgroundFX — ชั้นตกแต่งพื้นหลัง: เส้นกริดจาง ๆ + จุดดาวกะพริบ
// ทำด้วย CSS/SVG ล้วน ไม่กระทบประสิทธิภาพมาก และเคารพ prefers-reduced-motion (ผ่าน index.css)
// ---------------------------------------------------------------------------
function BackgroundFX() {
  // ตำแหน่งดาว (กระจายแบบคงที่ เพื่อไม่ให้ขยับทุกครั้งที่ re-render)
  const stars = [
    { top: '12%', left: '18%', d: '0s' },
    { top: '22%', left: '78%', d: '0.6s' },
    { top: '38%', left: '42%', d: '1.2s' },
    { top: '55%', left: '88%', d: '0.3s' },
    { top: '64%', left: '12%', d: '1.8s' },
    { top: '78%', left: '60%', d: '0.9s' },
    { top: '85%', left: '30%', d: '1.5s' },
    { top: '30%', left: '6%', d: '2.1s' },
  ]

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* เส้นกริดจาง ๆ (สร้างด้วย linear-gradient ซ้อนกันแนวตั้ง/นอน) */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(29,78,216,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(29,78,216,0.25) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(circle at 50% 20%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 20%, black, transparent 75%)',
        }}
      />

      {/* ดาวกะพริบ */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-arcane2 animate-twinkle"
          style={{ top: s.top, left: s.left, animationDelay: s.d }}
        />
      ))}
    </div>
  )
}
