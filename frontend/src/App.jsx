// src/App.jsx
// -----------------------------------------------------------------------------
// ศูนย์กลางของ "ระบบหลายหน้า" (routing) ทั้งเว็บ
// แนวคิด: react-router จะดู URL ปัจจุบัน แล้วเลือกวาดคอมโพเนนต์หน้าให้ตรงกัน
//
// โครงสร้าง route:
//   <Layout>            = โครงร่วมทุกหน้า (มี Navbar อยู่บนสุดเสมอ)
//     "/"          -> Home       (หน้าแรก: hero + แนะนำเว็บ + footer)
//     "/takequiz"  -> TakeQuiz   (เลือกโหมด/ประเภท/ความยาก แล้วเข้าทำข้อสอบ)
//     "/status"    -> Status     (กราฟเรดาร์ความสามารถผู้เล่น)
//     "/account"   -> Account    (เข้าสู่ระบบ / โหมด guest)
//     "*"          -> NotFound   (กันหลงเข้า URL ที่ไม่มีจริง)
//
// -----------------------------------------------------------------------------
// *** ทำไมบางหน้าใช้ lazy() ***
// -----------------------------------------------------------------------------
// คลังข้อสอบมีขนาดราว 1.4 MB และมีแค่ 3 หน้าที่ใช้จริง (TakeQuiz / Status / หน้าเล่น)
// ถ้า import แบบปกติทั้งหมด ผู้ใช้ที่แค่เปิดหน้าแรกก็ต้องโหลดข้อสอบทุกข้อไปด้วย
// ทั้งที่หน้าแรกไม่ได้ใช้เลยสักข้อ — เปลืองเน็ตมากโดยเฉพาะคนเปิดจากมือถือ
//
// lazy() ทำให้ vite แยกโค้ดหน้าพวกนั้นออกเป็นไฟล์ต่างหาก
// แล้วค่อยโหลดตอนผู้ใช้กดเข้าหน้านั้นจริง ๆ
//
// Home / Account / Register ไม่ได้แตะคลังข้อสอบ จึง import ตรง ๆ ได้
// (หน้าเบาอยู่แล้ว แยกไฟล์ไปก็ไม่ได้อะไร มีแต่เพิ่มการรอ)
//
// การเพิ่มหน้าใหม่ในอนาคต: สร้างไฟล์ใน src/pages/ แล้วมาเพิ่ม <Route> ที่นี่
// ถ้าหน้านั้นใช้คลังข้อสอบ ให้ใช้ lazy() ด้วย
// -----------------------------------------------------------------------------
import { Suspense, lazy } from 'react'
import { Routes, Route, Link } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Account from './pages/Account.jsx'
import Register from './pages/Register.jsx'

// หน้าที่ดึงคลังข้อสอบเข้ามา -> แยกไฟล์ โหลดเมื่อเข้าใช้จริง
const TakeQuiz = lazy(() => import('./pages/TakeQuiz.jsx'))
const Status = lazy(() => import('./pages/Status.jsx'))

// หน้าเผื่อกรณีเข้ามาผิด URL (404)
function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-game text-5xl text-arcane">404</h1>
      <p className="mt-4 text-muted">ไม่พบหน้าที่คุณกำลังหา</p>
      <Link to="/" className="btn-primary mt-8">กลับหน้าแรก</Link>
    </div>
  )
}

// สิ่งที่แสดงระหว่างรอโหลดไฟล์หน้าที่แยกไว้
//
// ใช้โครงหน้าจาง ๆ (skeleton) แทนคำว่า "กำลังโหลด..." เฉย ๆ
// เพราะมันจองพื้นที่ไว้ล่วงหน้า พอเนื้อหาจริงมาถึงหน้าจะไม่กระตุกเลื่อน
//
// role="status" + aria-live="polite" = บอกโปรแกรมอ่านหน้าจอว่ากำลังโหลด
// โดยไม่แย่งโฟกัสไปจากสิ่งที่ผู้ใช้กำลังทำ
// animate-pulse ถูกปิดอัตโนมัติเมื่อผู้ใช้เปิด prefers-reduced-motion (ตั้งไว้ใน index.css)
function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14" role="status" aria-live="polite">
      <span className="sr-only">กำลังโหลดหน้า</span>
      <div className="animate-pulse space-y-4">
        <div className="mx-auto h-8 w-56 rounded-lg bg-elevated" />
        <div className="mx-auto h-4 w-72 rounded bg-elevated/70" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-28 rounded-xl bg-elevated" />
          <div className="h-28 rounded-xl bg-elevated" />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* ทุก route ด้านในจะถูกห่อด้วย <Layout> (Navbar โผล่ทุกหน้า) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/takequiz"
          element={<Suspense fallback={<PageSkeleton />}><TakeQuiz /></Suspense>}
        />
        <Route
          path="/status"
          element={<Suspense fallback={<PageSkeleton />}><Status /></Suspense>}
        />
        <Route path="/account" element={<Account />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
