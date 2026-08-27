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
//
// ⭐ ใส่ * ได้ด้วย เพื่อครอบคลุมลิงก์พรีวิวของ Vercel
//   ทุกครั้งที่ push ขึ้น GitHub, Vercel จะสร้าง URL พรีวิวใหม่ให้ เช่น
//     https://tid-sure-git-main-xxxx.vercel.app
//   ถ้าเผลอเปิดเว็บจากลิงก์พวกนี้ (กดจากหน้า dashboard ของ Vercel) แล้วไม่ได้อนุญาตไว้
//   เบราว์เซอร์จะบล็อกทุก request แล้วหน้าเว็บขึ้นว่า "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"
//   ทั้งที่ backend ทำงานปกติดี — ตั้งเป็น https://tid-sure-*.vercel.app จะครอบคลุมให้หมด
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// แปลงรายการข้างบนเป็นตัวตรวจ: ตัวไหนมี * ให้เทียบแบบ pattern ที่เหลือเทียบตรงตัว
// (escape อักขระพิเศษก่อน แล้วค่อยเปลี่ยน * เป็น "ตัวอะไรก็ได้ที่ไม่ใช่จุด/ทับ")
const originMatchers = allowedOrigins.map((o) => {
  if (!o.includes('*')) return (origin) => origin === o
  const re = new RegExp('^' + o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[^./]*') + '$')
  return (origin) => re.test(origin)
})

app.use(cors({
  origin(origin, callback) {
    // ไม่มี origin (เช่นเรียกจาก Postman / health check ของ Render) -> อนุญาต
    // หรือ origin ตรงกับรายชื่อที่ไว้ใจ -> อนุญาต
    if (!origin || originMatchers.some((match) => match(origin))) return callback(null, true)

    // origin แปลกปลอม -> ไม่ใส่ header CORS ให้ (เบราว์เซอร์จะบล็อกเอง)
    //
    // สำคัญ: ห้าม callback(new Error(...)) เพราะจะกลายเป็น HTTP 500
    // ซึ่งทำให้ดูเหมือน "เซิร์ฟเวอร์พัง" ทั้งที่จริงแค่ origin ไม่ได้รับอนุญาต
    // ตอบแบบนี้ปลอดภัยเท่ากัน (ไม่มี header = เบราว์เซอร์ไม่ยอมให้อ่านผล) แต่หาสาเหตุง่ายกว่ามาก
    console.warn('ปฏิเสธ origin ที่ไม่อยู่ในรายชื่อ:', origin, '| ที่อนุญาต:', allowedOrigins.join(', '))
    return callback(null, false)
  },
}))
// express.json: อ่าน body ที่เป็น JSON จาก request ให้อัตโนมัติ (req.body)
app.use(express.json())

// ---- เส้นทางตรวจสุขภาพเซิร์ฟเวอร์ (health check) -----------------------------
// ลองเปิด http://localhost:5000/api/health เพื่อเช็คว่าเซิร์ฟเวอร์ทำงานไหม
//
// commit = รหัสโค้ดเวอร์ชันที่กำลังรันอยู่ (Render ใส่ RENDER_GIT_COMMIT ให้เอง)
// มีไว้เช็คว่า "โค้ดที่เพิ่ง push ขึ้นไป deploy เสร็จหรือยัง" โดยไม่ต้องเปิดหน้า Render
const START_TIME = Date.now()

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'TidSure API กำลังทำงาน',
    commit: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7),
    uptimeSec: Math.round((Date.now() - START_TIME) / 1000),
  })
})

// ---- ผูกกลุ่ม routes ต่าง ๆ --------------------------------------------------
app.use('/api/auth', authRoutes)     // สมัคร/เข้าสู่ระบบ
app.use('/api/quiz', quizRoutes)     // ดึงข้อสอบ/ส่งคำตอบ
app.use('/api/status', statusRoutes) // ค่าพลังผู้เล่น (กราฟเรดาร์)
app.use('/api/tutor', tutorRoutes)   // ครู AI "จอมปราชญ์" (อธิบายข้อผิด)

// ---- ตัวจัดการ error รวม (ต้องอยู่ท้ายสุด หลังทุก route) ----------------------
app.use(errorHandler)

// ---- กันเซิร์ฟเวอร์หลับ (เฉพาะตอนรันบน Render) -------------------------------
// ปัญหา: Render แพลนฟรีจะ "ปิดเครื่อง" เองเมื่อไม่มีคนเรียกนาน 15 นาที
//        คนที่เข้าเว็บคนถัดไปจึงต้องรอเครื่องบูตใหม่ ~30 วินาที (เหมือนเว็บค้าง)
//        ตอนเดโมให้กรรมการดูแล้วค้าง 30 วินาที = เสียคะแนนฟรี ๆ
//
// วิธีแก้: ให้เซิร์ฟเวอร์ยิง /api/health หาตัวเองทุก 14 นาที Render จึงนับว่า
//        "ยังมีคนใช้อยู่" แล้วไม่ปิดเครื่อง
//
// ข้อควรรู้: แพลนฟรีของ Render ให้เวลารันฟรี 750 ชั่วโมง/เดือน
//        ถ้าไม่หลับเลยจะใช้ราว 720 ชม./เดือน (ยังไม่เกิน) แต่ถ้ามีบริการอื่น
//        ในบัญชีเดียวกันด้วยอาจเกินได้ -> ปิดฟีเจอร์นี้ได้โดยตั้ง KEEP_AWAKE=false
//
// RENDER_EXTERNAL_URL = Render ใส่ให้เองอัตโนมัติ (บนเครื่องเราจะไม่มีค่านี้
//        ฟีเจอร์นี้จึงไม่ทำงานตอนพัฒนา ซึ่งถูกต้องแล้ว)
const KEEP_AWAKE_MINUTES = 14

function startKeepAwake() {
  const url = process.env.RENDER_EXTERNAL_URL
  if (!url) return                                   // ไม่ได้รันบน Render -> ไม่ต้องทำ
  if (process.env.KEEP_AWAKE === 'false') {
    console.log('ปิดระบบกันเซิร์ฟเวอร์หลับไว้ (KEEP_AWAKE=false)')
    return
  }

  const target = `${url.replace(/\/$/, '')}/api/health`
  console.log(`เปิดระบบกันเซิร์ฟเวอร์หลับ: ยิง ${target} ทุก ${KEEP_AWAKE_MINUTES} นาที`)

  const timer = setInterval(async () => {
    try {
      const res = await fetch(target)
      if (!res.ok) console.warn('ping กันหลับได้สถานะ', res.status)
    } catch (err) {
      // ping ไม่สำเร็จไม่ใช่เรื่องคอขาดบาดตาย แค่บันทึกไว้ อย่าให้เซิร์ฟเวอร์ล้ม
      console.warn('ping กันหลับไม่สำเร็จ:', err.message)
    }
  }, KEEP_AWAKE_MINUTES * 60 * 1000)

  timer.unref?.() // อย่าให้ตัวจับเวลานี้ขวางการปิดเซิร์ฟเวอร์ตอน deploy รอบใหม่
}

// ---- เริ่มเซิร์ฟเวอร์ --------------------------------------------------------
async function start() {
  try {
    await connectDB(process.env.MONGODB_URI) // เชื่อมต่อ MongoDB Atlas ก่อนเริ่มรับ request
    app.listen(PORT, () => {
      console.log(`TidSure API พร้อมทำงานที่ http://localhost:${PORT}`)
      startKeepAwake()
    })
  } catch (err) {
    console.error('เริ่มเซิร์ฟเวอร์ไม่สำเร็จ:', err)
    process.exit(1)
  }
}

start()
