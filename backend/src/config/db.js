// src/config/db.js
// -----------------------------------------------------------------------------
// โครงการเชื่อมต่อฐานข้อมูล MongoDB Atlas ด้วย Mongoose
// รอบนี้: เตรียมฟังก์ชันไว้ให้ แต่ยังไม่ได้เรียกใช้ใน server.js (คอมเมนต์ไว้)
//
// วิธีเปิดใช้จริงในอนาคต:
//   1) ใส่ค่า MONGODB_URI ลงในไฟล์ .env (ดูตัวอย่างจาก .env.example)
//   2) ไปที่ src/server.js แล้วเอาคอมเมนต์ออกจากบรรทัด import และ await connectDB(...)
// -----------------------------------------------------------------------------
import mongoose from 'mongoose'

export async function connectDB(uri) {
  if (!uri) {
    throw new Error('ไม่พบค่า MONGODB_URI — กรุณาตั้งค่าในไฟล์ .env')
  }

  // mongoose.connect คืน Promise -> ใช้ await รอจนเชื่อมต่อสำเร็จ
  await mongoose.connect(uri)
  console.log('เชื่อมต่อ MongoDB สำเร็จ')

  return mongoose.connection
}
