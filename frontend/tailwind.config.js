/** @type {import('tailwindcss').Config} */
// -----------------------------------------------------------------------------
// tailwind.config.js — ศูนย์รวม "โทเคนดีไซน์" ของทั้งเว็บ (ธีมเกม RPG นีออน)
// แก้สี/ฟอนต์/แอนิเมชัน ได้ที่ไฟล์นี้ที่เดียว แล้วมีผลทั้งเว็บ
//
// พาเลตต์อ้างอิงจากตัวช่วยดีไซน์ (UI/UX Pro Max): ม่วงนีออน + แดงกุหลาบ บนพื้นเข้ม
// ฟอนต์ไทยยังใช้ Sarabun/Kanit เพื่อการอ่านที่ดี (Orbitron ใช้เฉพาะคำอังกฤษสไตล์เกม)
// -----------------------------------------------------------------------------
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ---- ระบบสี (semantic tokens) — ตั้งชื่อตามหน้าที่ ----------------------
      colors: {
        bg:        '#0a0a18', // พื้นหลังลึกสุด
        surface:   '#12121f', // พื้นการ์ด/กล่อง
        elevated:  '#1b1b30', // พื้นที่ยกสูงกว่า (เช่น การ์ดที่ hover / dropdown)
        border:    '#2a2a45', // เส้นขอบ/เส้นแบ่งปกติ

        arcane:    '#1d4ed8', // สีหลัก — navy blue
        arcane2:   '#3b82f6', // ฟ้าอ่อน (ใช้ตอน hover / ไฮไลต์)
        rose:      '#f43f5e', // สีเน้นปุ่มสำคัญ (CTA) — แดงกุหลาบ
        aqua:      '#22d3ee', // ฟ้าไซเบอร์ (ข้อมูล/ตัวรอง)
        gold:      '#fbbf24', // ทอง (XP / เลเวล / รางวัล)

        ink:       '#e8ebf7', // ข้อความหลัก
        muted:     '#98a1c0', // ข้อความรอง/คำอธิบาย

        success:   '#34d399',
        danger:    '#f87171',
      },

      // ---- ฟอนต์ (ผูกกับที่โหลดใน index.html) --------------------------------
      fontFamily: {
        game:    ['Orbitron', 'sans-serif'], // คำอังกฤษสไตล์เกม เช่น "TidSure"
        heading: ['Kanit', 'sans-serif'],    // หัวข้อภาษาไทย
        body:    ['Sarabun', 'sans-serif'],  // เนื้อความภาษาไทย
        sans:    ['Sarabun', 'sans-serif'],  // ฟอนต์ดีฟอลต์ของทั้งเว็บ
        // ฟอนต์ pixel สำหรับ HUD ในเกม (คำว่า HP และตัวเลขหัวใจ)
        // ข้อจำกัด: ไม่มีตัวอักษรไทย และตัวกว้างมาก
        // ใช้เฉพาะข้อความอังกฤษ/ตัวเลขสั้น ๆ เท่านั้น ห้ามเอาไปใช้กับประโยคยาว
        pixel:   ['"Press Start 2P"', 'monospace'],
      },

      // ---- เงาเรืองแสง (glow) -----------------------------------------------
      boxShadow: {
        glow:       '0 0 24px -2px rgba(29, 78, 216, 0.45)',
        'glow-lg':  '0 0 48px -4px rgba(29, 78, 216, 0.55)',
        'glow-rose':'0 0 24px -2px rgba(244, 63, 94, 0.45)',
        'glow-aqua':'0 0 24px -2px rgba(34, 211, 238, 0.40)',
      },

      // ---- รัศมีพื้นหลังไล่สี (ใช้กับ class bg-radial-glow) -------------------
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
      },

      // ---- คีย์เฟรมของแอนิเมชัน (ใช้เป็น class animate-xxx) -------------------
      keyframes: {
        // ลอยขึ้น-ลงเบา ๆ (ใช้กับไอคอน/องค์ประกอบตกแต่ง)
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        // เรืองแสงเต้นเป็นจังหวะ
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        // โผล่จากด้านล่างพร้อมจางเข้า (ใช้กับ scroll reveal)
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // จางเข้าเฉย ๆ
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // แสงกวาด (ใช้ทำ shimmer/สเกเลตัน หรือเส้นแสงวิ่ง)
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // ดาวกะพริบ (พื้นหลัง)
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%':      { opacity: '0.9' },
        },
        // หมุนช้า ๆ (วงเวทหลัง hero)
        spinSlow: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        float:      'float 6s ease-in-out infinite',
        'pulse-glow':'pulseGlow 3s ease-in-out infinite',
        'fade-up':  'fadeUp 0.6s ease-out both',
        'fade-in':  'fadeIn 0.6s ease-out both',
        shimmer:    'shimmer 2.5s linear infinite',
        twinkle:    'twinkle 4s ease-in-out infinite',
        'spin-slow':'spinSlow 40s linear infinite',
      },
    },
  },
  plugins: [],
}
