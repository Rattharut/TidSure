# TidSure (ติดชัว)

เว็บฝึกทำข้อสอบเข้ามหาวิทยาลัยไทยในรูปแบบ **เกม RPG ผจญภัย** — ผู้เล่นคือนักผจญภัยที่ฝึกวิชาเพื่อไปพิชิตสนามสอบ (TGAT / TPAT / A-Level)

> **สถานะรอบนี้:** วางโครงโปรเจกต์ให้สะอาดและต่อยอดง่าย (ยังไม่ลงลึกงานตกแต่ง UX/UI — จะทำในรอบถัดไป)

---

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React + Vite + Tailwind CSS + React Router |
| Backend (โครงเปล่า) | Node.js + Express + MongoDB (Mongoose) |

---

## โครงสร้างโปรเจกต์ (แยก frontend / backend ชัดเจน)

```
tidsure/
├── README.md              # ไฟล์นี้
├── frontend/              # ✅ ส่วนหน้าเว็บ (ใช้งานได้จริงในรอบนี้)
│   ├── index.html         # HTML ตั้งต้น + โหลดฟอนต์ (Orbitron/Kanit/Sarabun)
│   ├── package.json       # รายชื่อ dependency + คำสั่ง (dev/build)
│   ├── vite.config.js     # ตั้งค่า Vite (dev server, พอร์ต, proxy เผื่ออนาคต)
│   ├── tailwind.config.js # ⭐ ศูนย์รวมโทเคนดีไซน์ (สี/ฟอนต์/เงาเรืองแสง) — แก้ธีมที่นี่
│   ├── postcss.config.js  # เชื่อม Tailwind + autoprefixer เข้ากับ Vite
│   └── src/
│       ├── main.jsx       # จุดเริ่ม React + เปิดใช้ระบบ routing
│       ├── App.jsx        # ⭐ ประกาศ route ทุกหน้า (เพิ่มหน้าใหม่ที่นี่)
│       ├── index.css      # Tailwind + สไตล์พื้นฐาน + คลาสปุ่ม (.btn-primary ฯลฯ)
│       ├── components/     # ชิ้นส่วนที่ใช้ซ้ำหลายหน้า
│       │   ├── Layout.jsx  #   โครงร่วม: Navbar + พื้นที่เนื้อหา (<Outlet/>)
│       │   ├── Navbar.jsx  #   แถบเมนูบนสุด (Contact เลื่อนลง footer)
│       │   ├── Footer.jsx  #   ส่วนท้าย 3 คอลัมน์ (มี id="contact")
│       │   └── icons/index.jsx #  ไอคอน SVG ทั้งหมด (แทน emoji)
│       ├── pages/          # แต่ละหน้าเว็บ
│       │   ├── Home.jsx       # hero เต็มจอ + section แนะนำ + footer
│       │   ├── TakeQuiz.jsx   # เลือก 3 ขั้น (โหมด/ประเภท/ความยาก)
│       │   ├── QuizRunner.jsx # หน้าทำข้อสอบ (placeholder + ตัวอย่างข้อสอบ)
│       │   ├── Status.jsx     # กราฟเรดาร์ค่าพลังผู้เล่น (SVG placeholder)
│       │   └── Account.jsx    # ฟอร์ม login + ปุ่ม guest (placeholder)
│       └── data/
│           └── mockQuestions.js # ⭐ ข้อสอบตัวอย่าง 4 ข้อ (โครงสร้างมาตรฐาน)
└── backend/               # 🚧 โครง API (ยังไม่เขียน logic จริง)
    └── ... (ดูรายละเอียดใน backend/README.md)
```

⭐ = ไฟล์ที่คุณจะแก้บ่อยตอนต่อยอด

---

## วิธีรันดูเว็บ (ทำแค่ frontend ก็เห็นหน้าเว็บได้แล้ว)

```powershell
cd frontend
npm install     # ติดตั้ง dependency (ทำครั้งแรกครั้งเดียว)
npm run dev     # เปิด dev server แล้วเข้า http://localhost:5173
```

คำสั่งอื่น ๆ ของ frontend:
- `npm run build` — สร้างไฟล์สำหรับ deploy จริง (โฟลเดอร์ `dist/`)
- `npm run preview` — ลองเปิดผลลัพธ์ที่ build แล้ว

การรัน backend (ยังเป็นโครงเปล่า ไม่จำเป็นต่อการดูหน้าเว็บ):
```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev     # http://localhost:5000/api/health
```

---

## เส้นทางหน้าเว็บ (routes)

| URL | หน้า | สถานะ |
|-----|------|-------|
| `/` | Home (hero + แนะนำ + footer) | ✅ ใช้ได้ |
| `/takequiz` | เลือกเงื่อนไข 3 ขั้น แล้วเข้าทำข้อสอบ | ✅ โครง (ตัวข้อสอบเป็น placeholder) |
| `/status` | กราฟเรดาร์ค่าพลังผู้เล่น | ✅ โครง (ข้อมูลตัวอย่าง) |
| `/account` | เข้าสู่ระบบ / guest | ✅ โครง (ยังไม่ต่อ backend) |
| Contact | ปุ่มบน Navbar เลื่อนลง footer ของหน้า Home | ✅ ใช้ได้ |

---

## แนวธีม (กรอบตั้งต้น — รายละเอียดจะสั่งต่อในรอบหน้า)

- โทนหน้าจอเกม: พื้นหลังเข้ม (`bg`/`surface`) ตัดด้วยสีเรืองแสง ม่วงเวท (`arcane`) + ฟ้า (`aqua`) + ทอง (`gold`)
- ฟอนต์: **Sarabun** เนื้อความไทย, **Kanit** หัวข้อไทย, **Orbitron** คำอังกฤษสไตล์เกม (เช่น "TidSure")
- ไม่มี emoji — ใช้ไอคอน SVG ใน `components/icons/` ทั้งหมด
- ปรับสี/ฟอนต์ทั้งเว็บได้ที่ไฟล์เดียว: `frontend/tailwind.config.js`

---

## ขั้นต่อไปที่แนะนำ

1. **รันดูก่อน:** `cd frontend && npm install && npm run dev` แล้วกดดูทุกหน้าให้เห็นภาพรวม
2. **ลองแก้ธีม:** เปลี่ยนค่าสีใน `tailwind.config.js` ดูว่ากระทบทั้งเว็บอย่างไร (ฝึกความเข้าใจโครงสร้าง)
3. **สั่งออกแบบ UX/UI รอบถัดไป:** บอกได้เลยว่าอยากเน้นหน้าไหนก่อน (แนะนำเริ่มจาก Home hero + TakeQuiz)
4. **เตรียมข้อสอบจริง:** เพิ่ม object ลงใน `frontend/src/data/mockQuestions.js` ตามรูปแบบเดิม
5. **เมื่อพร้อมต่อ backend:** ทำตามลำดับใน `backend/README.md` (เริ่มจากเปิด `connectDB` แล้วทำ quizController)
```

**หมายเหตุจากผู้ช่วย:** โปรเจกต์ถูกสร้างไว้ที่ `C:\Users\Lenovo\projects\tidsure` เพราะไดรฟ์ `E:\` เขียนไฟล์ไม่ได้ (สิทธิ์ถูกล็อกที่ root)
