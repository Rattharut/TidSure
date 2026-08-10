// src/models/User.js
// -----------------------------------------------------------------------------
// โครง schema ของ "ผู้ใช้" (User) — รอบนี้เป็นโครงเปล่า
// TODO (ในอนาคต): เพิ่มการเข้ารหัสรหัสผ่าน (เช่น bcrypt) ก่อนบันทึกจริง
//                 อย่าเก็บรหัสผ่านแบบข้อความล้วนเด็ดขาด
// -----------------------------------------------------------------------------
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // เก็บ "รหัสผ่านที่ผ่านการ hash แล้ว" เท่านั้น (ไม่ใช่รหัสผ่านจริง)
    passwordHash: { type: String, required: true },

    // ชื่อที่ใช้แสดง (ชื่อผู้เล่นในเกม)
    displayName: { type: String, default: 'นักผจญภัย' },

    // การตั้งค่าแกนกราฟเรดาร์หน้า Status — 6 ช่องพอดี
    // เก็บเป็น "รหัสวิชา" (เช่น 'TGAT2') หรือ null ถ้าแกนนั้นยังไม่ได้เลือกวิชา
    //
    // ทำไมเก็บที่นี่: ผู้เล่นแต่ละคนโฟกัสวิชาต่างกัน การตั้งค่าจึงเป็นของรายบุคคล
    //
    // ทำไม "ไม่" เก็บค่าพลังไว้ที่นี่: ค่าพลังคำนวณสด ๆ จาก collection Result ทุกครั้ง
    // ถ้าเก็บซ้ำไว้สองที่ วันหนึ่งข้อมูลจะไม่ตรงกัน (เช่น ลบ Result แล้วลืมอัปเดตตรงนี้)
    radarAxes: {
      type: [String],
      default: () => ['A-Level 61', 'A-Level 64', 'A-Level 65', 'TGAT1', 'TGAT2', 'TPAT3'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 6,
        message: 'กราฟเรดาร์ต้องมี 6 แกนพอดี',
      },
    },

    // สกิลที่ผู้เล่นปลดล็อกแล้ว (โหมดดันเจี้ยน) — เก็บเป็น id ของสกิล
    // เช่น ['damageBoost', 'moodeng'] = ปลดล็อกสองสกิลแรกแล้ว
    //
    // ปลดล็อกเมื่อฆ่าบอสของแต่ละระดับความยากสำเร็จ:
    //   บอสง่าย -> damageBoost, บอสปานกลาง -> moodeng, บอสยาก -> fiftyFifty
    //
    // เก็บเป็น array ของ id (ไม่ใช่ map) เพราะปลดล็อกแล้วปลดตลอด ไม่มีการล็อกคืน
    // และกันซ้ำด้วย $addToSet ตอนบันทึก
    unlockedSkills: {
      type: [String],
      default: () => [],
    },

    // จำนวนครั้งที่ "เคลียร์ดันเจี้ยนสำเร็จ" (ฆ่าบอส/มังกรประจำด่านได้)
    // ใช้คำนวณ 2 อย่างบนหน้า Status:
    //   เลเวล = dungeonClears + 1 (เริ่มเลเวล 1 แล้ว +1 ทุกครั้งที่เคลียร์ดัน)
    //   จำนวนมังกรที่สังหาร = dungeonClears
    // นับทุกครั้งที่ชนะ แม้เล่นระดับเดิมซ้ำ (ต่างจาก unlockedSkills ที่ปลดครั้งเดียว)
    dungeonClears: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
