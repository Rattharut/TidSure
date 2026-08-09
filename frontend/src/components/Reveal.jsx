// src/components/Reveal.jsx
// -----------------------------------------------------------------------------
// <Reveal> — คอมโพเนนต์ห่อเนื้อหาให้ "ค่อย ๆ โผล่ขึ้นมา" เมื่อเลื่อนมาถึง
// ใช้ง่าย: เอาเนื้อหาที่อยากให้มี effect มาครอบด้วย <Reveal> ... </Reveal>
//   ตัวอย่าง: <Reveal delay={150}><div className="card">...</div></Reveal>
//
// เบื้องหลังทำงานยังไง (ความรู้ React):
//   • useRef  = อ้างถึง element จริงบนหน้าจอ (เหมือนจับ DOM node ไว้)
//   • useState= จำว่า "โผล่แล้วหรือยัง" (shown)
//   • useEffect + IntersectionObserver = เบราว์เซอร์คอยดูว่า element เลื่อนเข้ามาในจอไหม
//       พอเข้ามาเห็น -> ตั้ง shown = true -> เพิ่มคลาส .reveal-in (นิยามใน index.css)
//
// รองรับ prefers-reduced-motion อยู่แล้วผ่าน CSS (.reveal ใน index.css)
// -----------------------------------------------------------------------------
import { useRef, useState, useEffect } from 'react'

export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // สร้าง observer คอยเช็คว่า element โผล่เข้ามาในจอ (อย่างน้อย 15%) หรือยัง
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            observer.unobserve(entry.target) // โผล่ครั้งเดียวพอ เลิกเฝ้าดู
          }
        })
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    // cleanup: เลิกเฝ้าดูเมื่อคอมโพเนนต์ถูกถอดออก (กัน memory leak)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      // 'reveal' = สถานะซ่อน, พอ shown เป็น true ค่อยเติม 'reveal-in' ให้โผล่
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
      // delay = หน่วงเวลาก่อนเริ่ม effect (มีหน่วยเป็น ms) ใช้ทำ stagger ทีละชิ้น
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
