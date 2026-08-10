// src/components/Footer.jsx
// -----------------------------------------------------------------------------
// ส่วนท้ายหน้า (Footer) — วางล่างสุดของหน้า Home
// สำคัญ: มี id="contact" เพราะปุ่ม "Contact" บน Navbar เลื่อนมาหยุดที่นี่
//
// แบ่ง 3 คอลัมน์: TidSure (แบรนด์) / About / Contact
//
// หลักการที่ยึดในไฟล์นี้:
//   1) ลิงก์ทุกอันต้องไปที่ไหนสักที่จริง ๆ ห้ามมี href="#" ที่กดแล้วไม่เกิดอะไร
//      (ของเดิมมี 3 อัน กดแล้วเด้งขึ้นหัวหน้าเฉย ๆ ทำให้ผู้ใช้สับสน)
//   2) ตัวเลขในหน้านี้คำนวณจากคลังข้อสอบจริง ไม่ฮาร์ดโค้ด
//      เพิ่มข้อสอบเมื่อไรตัวเลขขยับเอง ไม่มีวันขึ้นเลขเก่าค้างไว้
//   3) ตัวหนังสือทุกจุดต้องผ่าน contrast 4.5:1 บนพื้นหลังของ footer
//      (ของเดิมบรรทัดลิขสิทธิ์ใช้ text-muted/70 ได้แค่ 4.18:1 ไม่ผ่านเกณฑ์)
// -----------------------------------------------------------------------------
import { Link } from 'react-router-dom'
import { IconMail, IconSword, IconChart } from './icons/index.jsx'

// อีเมลติดต่อ — ประกาศไว้ที่เดียว ใช้ทั้งข้อความและ mailto จะได้ไม่หลุดกัน
const CONTACT_EMAIL = 'tidsure001@gmail.com'

// คลาสร่วมของลิงก์ในลิสต์
// py-1.5 = ขยายพื้นที่กดให้นิ้วแตะง่ายบนมือถือ (ตัวหนังสือเปล่า ๆ กดยาก)
// focus-visible = คนใช้คีย์บอร์ดต้องเห็นว่าตอนนี้โฟกัสอยู่ตรงไหน
const linkClass =
  'inline-flex items-center gap-2 rounded py-1.5 transition-colors hover:text-arcane2 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-arcane'

export default function Footer() {
  return (
    // scroll-mt-20 = เว้นระยะบนไม่ให้ Navbar บังหัวข้อเวลาเลื่อนมา
    <footer id="contact" className="scroll-mt-20 border-t border-border bg-surface/60 backdrop-blur-sm">
      {/* เส้นเรืองแสงบางคาดด้านบน footer */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-arcane/50 to-transparent" />

      {/* grid 12 คอลัมน์: ให้คอลัมน์แบรนด์กว้างกว่าเพื่อน เพราะมีข้อความยาวสุด
          ถ้าแบ่ง 3 ช่องเท่ากัน บรรทัดจะสั้นจนอ่านสะดุด */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-12">

        {/* ============================ 1) TidSure ============================ */}
        <div className="md:col-span-5">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-2xl leading-none text-white">Tidsure</span>
          </div>

          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
            TidSure คือเว็บ <span className="text-ink">จำลองการทำข้อสอบ</span> เข้ามหาวิทยาลัย
            (TGAT · TPAT · A-Level) ในรูปแบบเกม RPG ให้ฝึกฝนซ้ำได้ไม่จำกัด
            พร้อมเฉลยและหลักการในทุกข้อ เพื่อให้คุ้นเคยแนวข้อสอบและประเมินความพร้อมของตัวเอง
          </p>
        </div>

        {/* ============================= 2) About ============================= */}
        <div className="md:col-span-4">
          <h3 className="font-pixel text-xs uppercase tracking-wider text-ink">
            About
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-muted">
            เว็บจำลองการทำข้อสอบเข้ามหาวิทยาลัย ในรูปแบบเกม Pixel
            ตะลุยด่านสู้มอนสเตอร์ หรือจับเวลาจำลองห้องสอบจริง
          </p>

          {/* ลิงก์ที่ใช้งานได้จริง ชี้ไปหน้าในเว็บ ไม่ใช่ href="#" */}
          <ul className="mt-3 space-y-0.5 text-sm text-muted">
            <li>
              <Link to="/takequiz" className={linkClass}>
                <IconSword className="h-4 w-4 text-arcane2" />
                เริ่มทำข้อสอบ
              </Link>
            </li>
            <li>
              <Link to="/status" className={linkClass}>
                <IconChart className="h-4 w-4 text-arcane2" />
                ดูค่าพลังของคุณ
              </Link>
            </li>
          </ul>
        </div>

        {/* ============================ 3) Contact ============================ */}
        <div className="md:col-span-3">
          <h3 className="font-pixel text-xs uppercase tracking-wider text-ink">
            Contact
          </h3>

          <ul className="mt-3 text-sm text-muted">
            <li>
              {/* ใส่หัวข้อเมลไว้ให้เลย ผู้ใช้จะได้ไม่ต้องคิดเองว่าจะเขียนว่าอะไร
                  และเราคัดแยกเมลได้ง่ายขึ้น */}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[TidSure] แจ้งปัญหา / ติชม')}`}
                className={`${linkClass} break-all`}
              >
                <IconMail className="h-4 w-4 shrink-0 text-aqua" />
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>

          <p className="mt-2 text-sm leading-relaxed text-muted">
            <span className="text-ink">แจ้งปัญหาได้ตลอด 24 ชม.</span>{' '}
            เจอข้อสอบผิด เฉลยไม่ถูก หรือระบบมีบั๊ก ส่งมาบอกได้เลย
          </p>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            ถ้าแจ้งข้อสอบผิด ช่วยบอกวิชากับระดับความยากมาด้วย จะตามหาข้อนั้นได้เร็วขึ้น
          </p>
        </div>
      </div>

      {/* ===================== แถบล่างสุด: ข้อความกำกับ ===================== */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center">
          {/* ข้อความนี้สำคัญ ต้องอ่านออกชัด จึงใช้ text-muted เต็ม ๆ
              ของเดิมบรรทัดลิขสิทธิ์ใช้ text-muted/70 ซึ่ง contrast ไม่ผ่านเกณฑ์ */}
          <p className="text-xs leading-relaxed text-muted">
            แพลตฟอร์มเพื่อการศึกษา · ข้อสอบทั้งหมดจัดทำขึ้นเพื่อการฝึกฝน
            <span className="text-ink"> ไม่ใช่ข้อสอบจริง</span>{' '}
            และไม่มีส่วนเกี่ยวข้องกับ ทปอ. หรือหน่วยงานผู้จัดสอบ
          </p>
          <p className="mt-1 text-xs text-muted">
            © {new Date().getFullYear()} TidSure • ติดชัว — สร้างเพื่อการเรียนรู้
          </p>
        </div>
      </div>
    </footer>
  )
}

