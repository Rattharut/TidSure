// src/pages/Home.jsx
// -----------------------------------------------------------------------------
// หน้าแรก (Home) — ธีมเกม RPG แบ่งเป็น:
//   1) Hero เต็มจอ  : "Welcome to TidSure" + คำคม + วงเวทหมุนด้านหลัง + ปุ่มเริ่ม
//   2) กระดานเควส   : การ์ด 3 ประเภทข้อสอบ (TGAT/TPAT/A-Level) พร้อมจำนวนวิชาย่อย
//   3) วิธีเล่น      : 3 ขั้นตอนสั้น ๆ
//   4) Footer        : ส่วนท้าย (จุดหมายของปุ่ม Contact)
//
// ใช้ <Reveal> ห่อองค์ประกอบเพื่อให้ค่อย ๆ โผล่ตอนเลื่อนถึง (ดู components/Reveal.jsx)
// -----------------------------------------------------------------------------
import { Link } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import Reveal from '../components/Reveal.jsx'
import { EXAMS } from '../data/examStructure.js'
import {
  IconArrowRight, IconBrain, IconTarget, IconTrophy,
} from '../components/icons/index.jsx'

export default function Home() {
  return (
    <>
      {/* ================= 1) HERO ================= */}
      <section className="relative flex min-h-[calc(100svh-64px)] items-center justify-center overflow-hidden px-4">

        {/* ภาพพื้นหลัง hero — มุมมองนักผจญภัยเตรียมตัวก่อนออกเดินทาง
            scrim ไล่สีเข้มขึ้นจากบนลงล่าง กันตัวหนังสือทับภาพสว่างจนอ่านไม่ออก */}
        <img
          src="/images/hero-section-1.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-75"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/35 via-bg/25 to-bg" />

        {/* เนื้อหา hero */}
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* หัวข้อ hero เป็นภาพ pixel-art (คง <h1> + alt ไว้เพื่อ SEO/screen reader)
              ปรับขนาดตามจอ: เด่นบนเดสก์ท็อป แต่ไม่ล้นบนมือถือ */}
          <h1 className="animate-fade-up">
            <img
              src="/images/hero-title.png"
              alt="Quest Begins"
              loading="eager"
              decoding="async"
              className="mx-auto w-72 max-w-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)] sm:w-96 lg:w-[34rem]"
            />
          </h1>

          <blockquote className="mx-auto mt-6 max-w-xl animate-fade-up text-center font-body text-lg leading-relaxed text-muted [text-wrap:balance]" style={{ animationDelay: '120ms' }}>
            ในทุกคำถามจะมีคนอยู่ 2 แบบเสมอ หนึ่งคือคนที่ชนะ และสองคือคนที่ได้เรียนรู้
          </blockquote>

          <div className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '240ms' }}>
            <Link to="/takequiz" className="btn-cta !px-5 !py-3 text-lg">
              เริ่มออกผจญภัย
            </Link>
          </div>
        </div>

        {/* ไล่สีจางที่ขอบล่าง เชื่อมเข้ากับ section ถัดไป */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-bg" />
      </section>

      {/* ================= 2) กระดานเควส (ประเภทข้อสอบ) ================= */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-ink">เลือกสายที่จะฝึกฝน</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              แต่ละสนามสอบมีวิชาย่อยให้ตะลุยครบ เก็บเลเวลทีละวิชาจนพร้อมลุยของจริง
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {EXAMS.map((exam, i) => (
            <Reveal key={exam.id} delay={i * 120}>
              <Link to="/takequiz" className="card-interactive group flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-lg text-arcane2">{exam.name}</span>
                  <span className="chip text-xs text-muted">{exam.subjects.length} วิชา</span>
                </div>
                <p className="mt-2 font-heading text-ink">{exam.full}</p>
                <p className="mt-1 text-sm text-muted">{exam.tagline}</p>

                {/* แสดงวิชาย่อย 3 อันแรก + จำนวนที่เหลือ */}
                <ul className="mt-4 space-y-1.5 text-sm text-muted">
                  {exam.subjects.slice(0, 3).map((s) => (
                    <li key={s.code} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-arcane" />
                      {s.name}
                    </li>
                  ))}
                  {exam.subjects.length > 3 && (
                    <li className="text-arcane2">+ อีก {exam.subjects.length - 3} วิชา</li>
                  )}
                </ul>

                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm text-arcane2 opacity-0 transition-opacity group-hover:opacity-100">
                  เริ่มฝึกสายนี้ <IconArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 3) วิธีเล่น ================= */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Reveal>
          <h2 className="text-center text-3xl font-semibold text-ink">เส้นทางของนักผจญภัย</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { Icon: IconTarget, title: 'เลือกด่าน', desc: 'เลือกโหมด ประเภทข้อสอบ วิชาย่อย และระดับความยากที่อยากฝึก' },
            { Icon: IconBrain,  title: 'ตะลุยข้อสอบ', desc: 'ทำโจทย์ทีละข้อ พร้อมเฉลยและหลักการที่ใช้ เพื่อเรียนรู้จริง' },
            { Icon: IconTrophy, title: 'เก็บค่าพลัง', desc: 'สะสมผลการฝึกเป็นค่าพลังรายวิชา ดูพัฒนาการผ่านกราฟเรดาร์' },
          ].map((step, i) => (
            <Reveal key={step.title} delay={i * 120}>
              <div className="card h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-arcane/40 bg-arcane/10">
                  <step.Icon className="h-6 w-6 text-arcane2" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">
                  <span className="mr-2 font-game text-arcane/70">{String(i + 1).padStart(2, '0')}</span>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 4) FOOTER ================= */}
      <Footer />

      {/* มาสคอต Moodeng ลอยติดมุมขวาล่าง — fixed = อยู่กับที่ตามจอตอนเลื่อน
          pointer-events-none กันไม่ให้บังการกดปุ่ม/ลิงก์ที่อยู่ข้างใต้ */}
      <img
        src="/images/moodeng-hi.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed bottom-4 right-4 z-30 h-20 w-20 object-contain drop-shadow-lg sm:h-28 sm:w-28"
      />
    </>
  )
}
