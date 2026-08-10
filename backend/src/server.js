// src/server.js
// -----------------------------------------------------------------------------
// จุดเริ่มต้นของเซิร์ฟเวอร์ (Express) — รอบนี้เป็น "โครง" ยังไม่ต่อ logic จริง
// หน้าที่ของไฟล์นี้:
//   1) โหลดค่าจาก .env (เช่น PORT, MONGODB_URI)
//   2) ตั้งค่า middleware พื้นฐาน (cors, express.json)
//   3) ผูกเส้นทาง (routes) ของแต่ละกลุ่ม API ไว้ใต้ /api/...
//   4) เชื่อมต่อฐานข้อมูล (ตอนนี้คอมเมนต์ไว้ก่อน) แล้วเริ่มฟังพอร์ต
//
// การรัน:  npm run dev   (โหมดพัฒนา ใช้ nodemon รีสตาร์ทให้อัตโนมัติเมื่อแก้โค้ด)
//          npm start     (โหมดปกติ)
// -----------------------------------------------------------------------------
import 'dotenv/config' // โหลดค่าใน .env เข้ามาที่ process.env ทันทีที่ไฟล์ถูกเรียก
import express from 'express'
import cors from 'cors'

import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import statusRoutes from './routes/statusRoutes.js'
import tutorRoutes from './routes/tutorRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 5000

// ---- Middleware พื้นฐาน ------------------------------------------------------
// cors: อนุญาตให้เฉพาะเว็บหน้าบ้านที่เราไว้ใจเรียก API นี้ได้
//
// CLIENT_ORIGIN ตั้งได้หลายอันคั่นด้วยจุลภาค เช่น:
//   http://localhost:5173,https://tidsure.vercel.app
// เผื่อไว้ให้ทดสอบจากเครื่อง (localhost) กับเว็บจริง (Vercel) ใช้ backend ตัวเดียวกันได้
//
// ค่าเริ่มต้น = localhost:5173 (ตอนพัฒนา) ถ้าไม่ได้ตั้ง env
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    // ไม่มี origin (เช่นเรียกจาก Postman / health check ของ Render) -> อนุญาต
    // หรือ origin อยู่ในรายชื่อที่ไว้ใจ -> อนุญาต
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    // origin แปลกปลอม -> ปฏิเสธ (กันเว็บอื่นแอบเรียก API เรา)
    return callback(new Error('ไม่อนุญาตให้ origin นี้เรียก API'))
  },
}))
// express.json: อ่าน body ที่เป็น JSON จาก request ให้อัตโนมัติ (req.body)
app.use(express.json())

// ---- เส้นทางตรวจสุขภาพเซิร์ฟเวอร์ (health check) -----------------------------
// ลองเปิด http://localhost:5000/api/health เพื่อเช็คว่าเซิร์ฟเวอร์ทำงานไหม
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'TidSure API กำลังทำงาน (โครงเริ่มต้น)' })
})

// ---- ผูกกลุ่ม routes ต่าง ๆ --------------------------------------------------
app.use('/api/auth', authRoutes)     // สมัคร/เข้าสู่ระบบ
app.use('/api/quiz', quizRoutes)     // ดึงข้อสอบ/ส่งคำตอบ
app.use('/api/status', statusRoutes) // ค่าพลังผู้เล่น (กราฟเรดาร์)
app.use('/api/tutor', tutorRoutes)   // ครู AI "จอมปราชญ์" (อธิบายข้อผิด)

// ---- ตัวจัดการ error รวม (ต้องอยู่ท้ายสุด หลังทุก route) ----------------------
app.use(errorHandler)

// ---- เริ่มเซิร์ฟเวอร์ --------------------------------------------------------
async function start() {
  try {
    await connectDB(process.env.MONGODB_URI) // เชื่อมต่อ MongoDB Atlas ก่อนเริ่มรับ request
    app.listen(PORT, () => {
      console.log(`TidSure API พร้อมทำงานที่ http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('เริ่มเซิร์ฟเวอร์ไม่สำเร็จ:', err)
    process.exit(1)
  }
}

start()
