// src/components/Logo.jsx
// -----------------------------------------------------------------------------
// โลโก้ TidSure แบบใหม่ (ไม่ใช้รูปโล่แล้ว)
// แนวคิด: "คริสตัล/รูน" ทรงเจียระไนแบบเกม มีเครื่องหมายถูก (check) อยู่ข้างใน
//         สื่อความหมาย "ติดชัว = ตอบถูก / สอบผ่านแน่นอน"
// ใช้สีไล่เฉด ม่วง -> ฟ้า -> กุหลาบ ตามธีมเดิมที่ชอบ
//
// มี 2 ตัวให้ใช้:
//   <LogoMark />  = เฉพาะสัญลักษณ์ (ไว้ใช้ที่แคบ ๆ หรือทำ favicon)
//   <Logo />      = สัญลักษณ์ + ตัวอักษร "TidSure" (ใช้บน Navbar/Footer)
//
// ปรับขนาดผ่าน prop className เช่น <LogoMark className="h-8 w-8" />
// -----------------------------------------------------------------------------

// ---- เฉพาะสัญลักษณ์ (คริสตัล + เครื่องหมายถูก) ----
export function LogoMark({ className = 'h-8 w-8', title = 'TidSure' }) {
  // id ของ gradient ต้องไม่ซ้ำกันในหน้า (กันชนกันเวลามีโลโก้หลายจุด)
  const gid = 'tidsureLogoGrad'
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      <defs>
        {/* ไล่สีเดียวกับธีม: ม่วงอ่อน -> ฟ้า -> กุหลาบ */}
        <linearGradient id={gid} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>

      {/* ตัวคริสตัลทรงเจียระไน (rhombus + เหลี่ยมมุม) */}
      <path
        d="M16 2 L27 11 L16 30 L5 11 Z"
        stroke={`url(#${gid})`}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={`url(#${gid})`}
        fillOpacity="0.12"
      />
      {/* เส้นเหลี่ยมเจียระไน (facets) ให้ดูเป็นอัญมณี */}
      <path d="M5 11 H27 M16 2 V30 M11 11 L16 20 L21 11" stroke={`url(#${gid})`} strokeWidth="1" strokeLinejoin="round" opacity="0.55" />

      {/* เครื่องหมายถูกตรงกลาง (สื่อ 'ถูกต้อง/ติดชัว') */}
      <path
        d="M11.5 15.5 L15 19 L21 11.5"
        stroke={`url(#${gid})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---- โลโก้เต็ม: สัญลักษณ์ + ตัวอักษร ----
export function Logo({ markClass = 'h-8 w-8', textClass = 'text-xl' }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark className={`${markClass} transition-transform group-hover:scale-110`} />
      {/* "Tid" สีปกติ + "Sure" ไล่สี ให้ชื่อมีจุดเด่น */}
      <span className={`font-game font-bold tracking-wide ${textClass}`}>
        <span className="text-ink">Tid</span>
        <span className="text-gradient">Sure</span>
      </span>
    </span>
  )
}

export default Logo
