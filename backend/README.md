# TidSure — Backend (โครงเริ่มต้น)

ส่วน API ของ TidSure ด้วย **Node.js + Express + MongoDB (Mongoose)**
รอบนี้เป็น **โครงเปล่า** — มีเส้นทางและไฟล์ครบ แต่ยังไม่เขียน logic จริง (ทุก controller ตอบ `501 Not Implemented`)

## การติดตั้งและรัน

```powershell
cd backend
npm install
Copy-Item .env.example .env   # แล้วแก้ค่าใน .env ให้เป็นของจริง
npm run dev                   # รันโหมดพัฒนา (nodemon)
```

ทดสอบว่าเซิร์ฟเวอร์ทำงาน: เปิด http://localhost:5000/api/health

## โครงสร้างโฟลเดอร์

```
backend/
├── .env.example          # ตัวอย่างตัวแปรแวดล้อม (ก็อปเป็น .env)
└── src/
    ├── server.js         # จุดเริ่มเซิร์ฟเวอร์ + ผูก middleware/routes
    ├── config/db.js      # ฟังก์ชันเชื่อมต่อ MongoDB (ยังคอมเมนต์ไว้ใน server.js)
    ├── models/           # โครงสร้างข้อมูล (schema)
    │   ├── Question.js   # ข้อสอบ — field ตรงกับ mock ฝั่ง frontend
    │   ├── User.js       # ผู้ใช้
    │   └── Result.js     # ผลการทำข้อสอบ (ไว้คำนวณกราฟเรดาร์)
    ├── routes/           # นิยามเส้นทาง URL ของ API
    ├── controllers/      # ตรรกะที่ทำงานจริงของแต่ละเส้นทาง (ตอนนี้ placeholder)
    └── middleware/       # ตัวคั่นกลาง เช่น จัดการ error
```

## ลำดับการต่อ logic จริง (แนะนำ)

1. เปิดใช้การเชื่อมต่อฐานข้อมูลใน `src/server.js` (เอาคอมเมนต์ออกจาก `connectDB`)
2. ทำ `quizController` ก่อน (ดึงข้อสอบจาก `Question`) เพราะเชื่อมกับหน้า TakeQuiz โดยตรง
3. ทำระบบ auth (`authController`) — อย่าลืม hash รหัสผ่านด้วย bcrypt
4. ทำ `statusController` (สรุปผลจาก `Result` เป็นค่าพลังรายวิชา)
