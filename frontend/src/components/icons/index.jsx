// src/components/icons/index.jsx
// -----------------------------------------------------------------------------
// รวมไอคอนแบบ SVG ทั้งหมดไว้ที่เดียว (ตามกติกา: ห้ามใช้ emoji ในหน้าเว็บ)
//
// ทำไมทำเป็นคอมโพเนนต์ React:
//   - ใช้ซ้ำง่าย เรียก <IconHome /> ได้ทุกที่
//   - ปรับสี/ขนาดผ่าน props ได้ เช่น <IconHome className="w-6 h-6 text-arcane" />
//   - ใช้ stroke="currentColor" หมายความว่าไอคอนจะ "รับสีจากตัวอักษร" อัตโนมัติ
//     (กำหนดสีด้วยคลาส text-... ได้เลย เหมือนข้อความ)
//
// ชุดไอคอนนี้วาดสไตล์เส้น (outline) หนา 1.5–2px ให้สม่ำเสมอทั้งชุด
// อยากเพิ่มไอคอนใหม่: ก็อป <svg> ตัวใดตัวหนึ่งมาแก้ path ได้เลย
// -----------------------------------------------------------------------------

// props ร่วมของทุกไอคอน: รับ className มากำหนดขนาด/สี, ที่เหลือส่งต่อให้ <svg>
function base(props) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: props.className || 'w-6 h-6',
    'aria-hidden': true, // ไอคอนตกแต่ง: ซ่อนจาก screen reader (ให้ข้อความข้าง ๆ สื่อความหมายแทน)
    ...props,
  }
}

// หน้าแรก (บ้าน)
export function IconHome(props) {
  return (
    <svg {...base(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

// หัวใจแบบ pixel art (ใช้กับแถบ HP ในเกม)
// -----------------------------------------------------------------------------
// วาดด้วย <rect> ล้วน ไม่มีเส้นโค้งเลย เพื่อให้ได้ขอบหยักแบบเกม 8-bit จริง ๆ
// (IconHeart ตัวปกติใช้เส้นโค้ง เหมาะกับ UI ทั่วไป แต่ดูไม่เข้ากับฉากต่อสู้)
//
// กริด 11x10 หน่วย แต่ละ rect = 1 พิกเซลใหญ่
// shapeRendering="crispEdges" = ห้ามเบราว์เซอร์เกลี่ยขอบให้เนียน
//                               ถ้าไม่ใส่ ขอบจะเบลอตอนขยาย หมดความเป็น pixel art
//
// หมายเหตุ: ไม่มีโหมด "โครงร่าง" เพราะการ stroke ทีละ rect จะเกิดเส้นซ้อนกันข้างใน
// หัวใจที่เสียไปแล้วให้คุมด้วย "สี" จากภายนอกแทน (เช่น ส่ง className ที่เป็นสีเทาเข้ามา)
// วิธีนี้ได้ผลลัพธ์สะอาดกว่าและเป็นแบบเดียวกับเกม 8-bit จริง
export function IconHeartPixel({ className = 'w-4 h-4', ...props }) {
  // แต่ละแถวคือ [x เริ่ม, ความกว้าง] ของช่วงที่ทึบ
  const rows = [
    [[2, 2], [7, 2]],           // แถว 0: ยอดหัวใจสองก้อน
    [[1, 4], [6, 4]],           // แถว 1
    [[0, 11]],                  // แถว 2: กว้างสุด
    [[0, 11]],                  // แถว 3
    [[1, 9]],                   // แถว 4: เริ่มสอบเข้า
    [[2, 7]],                   // แถว 5
    [[3, 5]],                   // แถว 6
    [[4, 3]],                   // แถว 7
    [[5, 1]],                   // แถว 8: ปลายแหลม
  ]

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 11 9"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {rows.map((spans, y) =>
        spans.map(([x, w], i) => (
          <rect key={`${y}-${i}`} x={x} y={y} width={w} height="1" fill="currentColor" />
        ))
      )}
    </svg>
  )
}

// ลูกศรลง (ใช้กับปุ่มพับ/กางแถบสกิล — หมุน -90 องศาเมื่อพับอยู่)
export function IconChevronDown(props) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

// แก้ไข (ดินสอ) — ใช้กับปุ่มตั้งชื่อผู้เล่นในหน้า Status
export function IconPencil(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

// ติดต่อ (ซองจดหมาย)
export function IconMail(props) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

// สถานะ/สถิติ (กราฟแท่ง)
export function IconChart(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M21 20H3" />
    </svg>
  )
}

// ทำข้อสอบ (ดาบ = ธีมผจญภัย RPG)
export function IconSword(props) {
  return (
    <svg {...base(props)}>
      <path d="M14.5 4H20v5.5L9.5 20 4 20v-5.5L14.5 4Z" />
      <path d="m14 6 4 4" />
      <path d="m8 14 2 2" />
    </svg>
  )
}

// บัญชี/ผู้ใช้
export function IconUser(props) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

// เมนู (hamburger) สำหรับจอมือถือ
export function IconMenu(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}

// ปิด (กากบาท)
export function IconClose(props) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

// นาฬิกา (ใช้กับโหมดจำกัดเวลา)
export function IconClock(props) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

// อินฟินิตี้ (ใช้กับโหมดไม่จำกัดเวลา)
export function IconInfinity(props) {
  return (
    <svg {...base(props)}>
      <path d="M6.5 8.5a3.5 3.5 0 1 0 0 7c2 0 3.5-2 5.5-3.5 2-1.5 3.5-3.5 5.5-3.5a3.5 3.5 0 1 1 0 7c-2 0-3.5-2-5.5-3.5" />
    </svg>
  )
}

// โล่ (ใช้เป็นโลโก้/สัญลักษณ์ประกอบธีมเกม)
export function IconShield(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

// ลูกศรขวา (ใช้กับปุ่ม "ถัดไป")
export function IconArrowRight(props) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

// ลูกศรซ้าย (ใช้กับปุ่ม "ย้อนกลับ" แทนอักขระ ←)
export function IconArrowLeft(props) {
  return (
    <svg {...base(props)}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  )
}

// สายฟ้า (พลัง/XP)
export function IconBolt(props) {
  return (
    <svg {...base(props)}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  )
}

// ดาว (ระดับ/คะแนน)
export function IconStar(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.8 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  )
}

// ถ้วยรางวัล (ความสำเร็จ)
export function IconTrophy(props) {
  return (
    <svg {...base(props)}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5v1a3 3 0 0 0 3 3" />
      <path d="M16 5h3v1a3 3 0 0 1-3 3" />
      <path d="M10 13.5V16h4v-2.5" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  )
}

// เปลวไฟ (สตรีค/ความต่อเนื่อง)
export function IconFlame(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-.6-.2-1-.4-1.4 2 1 3.4 3 3.4 5.4a5 5 0 0 1-10 0C7 15 9 12 12 3Z" />
    </svg>
  )
}

// สมอง (การคิด/ตรรกะ)
export function IconBrain(props) {
  return (
    <svg {...base(props)}>
      <path d="M9 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 9c0 1 .5 1.7 1 2-.5.5-1 1.2-1 2.2A2.8 2.8 0 0 0 8 16h1V4Z" />
      <path d="M15 4a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 9c0 1-.5 1.7-1 2 .5.5 1 1.2 1 2.2A2.8 2.8 0 0 1 16 16h-1V4Z" />
      <path d="M12 4v16" />
    </svg>
  )
}

// เป้า (เป้าหมาย/ความแม่นยำ)
export function IconTarget(props) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  )
}

// ประกาย (เน้นความพิเศษ)
export function IconSparkle(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
    </svg>
  )
}

// เครื่องหมายถูก (ผ่าน/สำเร็จ)
export function IconCheck(props) {
  return (
    <svg {...base(props)}>
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  )
}

// หัวใจ — ใช้แสดงพลังชีวิต
// ส่ง prop filled={true} เพื่อให้เป็นหัวใจเต็ม (เติมสี), ไม่ส่ง = หัวใจว่าง (โครงร่าง)
export function IconHeart({ filled = false, ...props }) {
  const p = base(props)
  return (
    <svg {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20s-7-4.6-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.4 12 20 12 20Z" />
    </svg>
  )
}

// หมู (สกิลหมูเด้ง)
export function IconPig(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 13a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2Z" />
      <ellipse cx="12" cy="13" rx="3" ry="2.2" />
      <path d="M11.2 13h.01M12.8 13h.01" />
      <path d="M7 7 6 4l3 1.5M17 7l1-3-3 1.5" />
    </svg>
  )
}

// กรรไกร (สกิลตัดตัวเลือก)
export function IconScissors(props) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8 7.5 20 18M20 6 8 16.5" />
    </svg>
  )
}

// มังกร (บอสของโหมดจำกัดเวลา)
export function IconDragon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 16c2-6 6-9 11-9l3-2v3l2 2-3 1c0 4-3 7-7 7H6l1-2H4Z" />
      <path d="M13 10h.01" />
      <path d="M7 18c-1.5 1-3 1.2-4 1" />
    </svg>
  )
}

// หัวกะโหลก (แพ้/ตาย)
export function IconSkull(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.3 4 2.5 5V18h9v-3c1.2-1 2.5-2.5 2.5-5a7 7 0 0 0-7-7Z" />
      <circle cx="9.5" cy="11" r="1.3" />
      <circle cx="14.5" cy="11" r="1.3" />
      <path d="M10 21v-3M14 21v-3" />
    </svg>
  )
}
