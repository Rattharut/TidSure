// src/main.jsx
// -----------------------------------------------------------------------------
// จุดเริ่มต้นของฝั่ง React ทั้งหมด (ไฟล์นี้ถูกเรียกจาก index.html)
// ลำดับการทำงาน:
//   1) หา <div id="root"> ใน index.html
//   2) สร้าง React root แล้ววาดคอมโพเนนต์ <App /> ลงไป
//   3) ห่อด้วย <BrowserRouter> เพื่อเปิดใช้ระบบ "หลายหน้า" (routing) ด้วย react-router
//   4) ห่อด้วย <StrictMode> เพื่อช่วยเตือน bug ระหว่างพัฒนา (ไม่มีผลตอน build จริง)
// -----------------------------------------------------------------------------
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css' // โหลด Tailwind + สไตล์พื้นฐานของทั้งเว็บ

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter ทำให้ URL เช่น /takequiz, /status ใช้งานได้แบบไม่รีโหลดหน้า */}
    <BrowserRouter>
      {/* AuthProvider ครอบทั้งแอป -> ทุกหน้าเรียก useAuth() เพื่อดูสถานะล็อกอินได้ */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
