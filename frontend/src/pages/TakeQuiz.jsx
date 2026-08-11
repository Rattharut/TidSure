// src/pages/TakeQuiz.jsx
// -----------------------------------------------------------------------------
// หน้า TakeQuiz — ตัวช่วยเลือกก่อนตะลุยข้อสอบ 4 ขั้นตอน (wizard)
//   ขั้น 1: โหมด        -> "ไม่จำกัดเวลา" หรือ "จำกัดเวลา (จำลองห้องสอบ)"
//   ขั้น 2: ประเภทข้อสอบ -> TGAT / TPAT / A-Level
//   ขั้น 3: วิชาย่อย     -> วิชาของประเภทที่เลือก (ดึงจาก data/examStructure.js)
//   ขั้น 4: ความยาก      -> ง่าย / ปานกลาง / ยาก
//   จากนั้น -> เข้าหน้าทำข้อสอบ (QuizRunner)
//
// แนวคิด React:
//   • step    : อยู่ขั้นไหน (1–4) หรือ 'run'
//   • choices : เก็บสิ่งที่เลือกทั้งหมด { mode, examType, subject, difficulty }
//   • เลือกในแต่ละขั้น = อัปเดต choices แล้วไปขั้นถัดไป
// -----------------------------------------------------------------------------
import { useState } from 'react'
import QuizRunner from './QuizRunner.jsx'
import { EXAMS, getExam, LOCKED_SUBJECTS } from '../data/examStructure.js'
import { countQuestions } from '../data/questions/index.js'
import { MODE_DUNGEON, MODE_TIMED } from '../data/gameConfig.js'
import {
  IconClock, IconSword, IconArrowRight, IconArrowLeft,
} from '../components/icons/index.jsx'

// ตัวเลือกคงที่ของขั้นโหมด/ความยาก
// หมายเหตุ: value ต้องตรงกับค่าใน data/gameConfig.js (MODE_DUNGEON / MODE_TIMED)
// เพราะ QuizRunner ใช้ค่านี้ตัดสินใจว่าจะเปิดหน้าโหมดไหน
// ---- ภาพพื้นหลังของการ์ดโหมด ----
// วางไฟล์ไว้ที่ frontend/public/images/ แล้วอ้างด้วย path ขึ้นต้นด้วย /
//
// ทำไมใช้ public/ ไม่ใช่ src/assets/:
//   ถ้า import จาก src/assets แล้วไฟล์หาย -> build พังทันที
//   แต่ public/ ถ้าไฟล์หาย -> แค่ไม่มีภาพขึ้น การ์ดยังใช้งานได้ปกติ
//   เว็บจึงไม่พังเพราะไฟล์ภาพหายไปไฟล์เดียว
const MODES = [
  {
    value: MODE_DUNGEON,
    label: 'โหมดดันเจี้ยน',
    desc: 'ตะลุยด่านสู้ Monster และบอส มีสกิลช่วย ฝึกได้ไม่จำกัดเวลา',
    Icon: IconSword,
    bg: '/images/background-dungeon.png',
    bgAlt: 'ประตูดันเจี้ยนหินโบราณมีคบไฟสองข้าง',
  },
  {
    value: MODE_TIMED,
    label: 'โหมดจำกัดเวลา',
    desc: 'จำลองห้องสอบจริง สู้บอสมังกรด้วยการทำข้อสอบให้ทันเวลา ไม่มีสกิลช่วย',
    Icon: IconClock,
    bg: '/images/background-dragon.png',
    bgAlt: 'มังกรหมอบอยู่ในป่าลึกที่มีแสงลอดผ่านต้นไม้',
  },
]
const DIFFICULTIES = [
  {
    value: 'ง่าย', label: 'ง่าย', desc: 'อุ่นเครื่อง ปูพื้นฐาน', tone: 'text-success',
    bg: '/images/difficulty-easy.png',
  },
  {
    value: 'ปานกลาง', label: 'ปานกลาง', desc: 'ระดับมาตรฐานของสนามสอบ', tone: 'text-gold',
    bg: '/images/difficulty-medium.png',
  },
  {
    value: 'ยาก', label: 'ยาก', desc: 'ท้าทายสำหรับสายบุกด่านยาก', tone: 'text-rose',
    bg: '/images/difficulty-hard.png',
  },
]

const STEP_LABELS = ['โหมด', 'ประเภท', 'วิชา', 'ความยาก']

export default function TakeQuiz() {
  const [step, setStep] = useState(1)
  const [choices, setChoices] = useState({ mode: null, examType: null, subject: null, difficulty: null })

  const update = (patch) => setChoices((prev) => ({ ...prev, ...patch }))

  // เข้าสู่โหมดทำข้อสอบ -> ส่ง choices ให้ QuizRunner
  if (step === 'run') {
    return <QuizRunner choices={choices} onExit={() => { setChoices({ mode: null, examType: null, subject: null, difficulty: null }); setStep(1) }} />
  }

  // วิชาย่อยของประเภทที่เลือก (ใช้ในขั้น 3)
  const currentExam = getExam(choices.examType)

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <StepIndicator step={step} />

      {/* key={step} = สั่งให้ React วาดใหม่ทุกครั้งที่เปลี่ยนขั้น จึงเล่นแอนิเมชัน fade ซ้ำได้ */}
      <div key={step} className="mt-8 animate-fade-up">
        {step === 1 && (
          <StepCards
            title="เลือกโหมดการฝึก"
            // ส่ง bg ไปด้วย เพื่อให้การ์ดโหมดมีภาพพื้นหลัง (ขั้นอื่นไม่มี ก็จะไม่แสดงภาพ)
            items={MODES.map((m) => ({
              key: m.value, label: m.label, desc: m.desc, Icon: m.Icon,
              bg: m.bg, bgAlt: m.bgAlt,
            }))}
            onPick={(v) => { update({ mode: v }); setStep(2) }}
            cols={2}
          />
        )}

        {step === 2 && (
          <StepCards
            title="เลือกประเภทข้อสอบ"
            items={EXAMS.map((e) => ({
              key: e.id,
              label: e.name,
              badge: `${e.subjects.length} วิชา`,
              desc: e.full,
              game: true,
            }))}
            onPick={(v) => { update({ examType: v, subject: null }); setStep(3) }}
            onBack={() => setStep(1)}
            cols={3}
          />
        )}

        {step === 3 && currentExam && (
          <StepCards
            title={`เลือกวิชาของ ${currentExam.name}`}
            subtitle={currentExam.full}
            // นับข้อสอบของแต่ละวิชาไว้โชว์ตั้งแต่ตอนนี้
            // (ก่อนหน้านี้ผู้เล่นต้องเลือกจนครบ 4 ขั้นถึงจะรู้ว่าวิชานั้นไม่มีข้อสอบ)
            items={currentExam.subjects.map((s) => {
              const total = countQuestions({ examType: currentExam.id, subjectCode: s.code })
              const lockedReason = LOCKED_SUBJECTS[s.code]
              return {
                key: s.code,
                label: s.name,
                badge: s.code,
                // ลำดับความสำคัญของข้อความ: ล็อกถาวร > ยังไม่มีข้อสอบ > จำนวนที่มี
                desc: lockedReason || (total > 0 ? `มีข้อสอบ ${total} ข้อ` : 'ยังไม่มีข้อสอบ'),
                disabled: Boolean(lockedReason) || total === 0, // ล็อกไว้ หรือไม่มีข้อสอบ = กดไม่ได้
              }
            })}
            onPick={(code) => {
              const subj = currentExam.subjects.find((s) => s.code === code)
              update({ subject: subj })
              setStep(4)
            }}
            onBack={() => setStep(2)}
            cols={2}
            compact
          />
        )}

        {step === 4 && (
          <StepCards
            title="เลือกระดับความยาก"
            items={DIFFICULTIES.map((d) => ({
              key: d.value, label: d.label, desc: d.desc, tone: d.tone,
              // พื้นหลังการ์ด = ภาพบอสประจำด่าน "ของโหมดดันเจี้ยน" เท่านั้น
              // โหมดจำกัดเวลาบอสเป็นมังกรเสมอ (ไม่แยกตามความยาก) จึงไม่โชว์พื้นหลังบอสดันเจี้ยน
              bg: choices.mode === MODE_DUNGEON ? d.bg : null,
            }))}
            onPick={(v) => { update({ difficulty: v }); setStep('run') }}
            onBack={() => setStep(3)}
            cols={3}
            lastStep
          />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StepIndicator — จุด 1-2-3-4 บอกความคืบหน้า + เส้นเรืองแสงเชื่อม
// ---------------------------------------------------------------------------
function StepIndicator({ step }) {
  return (
    <div className="mt-8 flex items-center justify-center">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const active = step === n
        const done = typeof step === 'number' ? step > n : true
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <span
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full border font-heading text-sm transition-all',
                  active ? 'border-arcane bg-arcane text-white shadow-glow'
                  : done ? 'border-arcane/60 text-arcane2'
                  : 'border-border text-muted',
                ].join(' ')}
              >
                {n}
              </span>
              <span className={`mt-1 text-xs ${active ? 'text-ink' : 'text-muted'}`}>{label}</span>
            </div>
            {n < STEP_LABELS.length && (
              <span className={`mx-1 mb-5 h-px w-6 sm:w-12 ${done ? 'bg-arcane/60' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// StepCards — การ์ดตัวเลือกของแต่ละขั้น (ใช้ซ้ำได้ทุกขั้น)
//   props:
//     title/subtitle = หัวข้อ
//     items = [{ key, label, desc?, badge?, Icon?, tone?, game? }]
//     onPick(key) = เรียกเมื่อเลือก
//     onBack? = ปุ่มย้อนกลับ
//     cols = จำนวนคอลัมน์บนจอใหญ่ (2 หรือ 3)
//     compact = การ์ดเล็กลง (ใช้กับรายการวิชาที่มีเยอะ)
//     lastStep = เปลี่ยนข้อความปุ่มเป็น "เริ่มทำข้อสอบ"
// ---------------------------------------------------------------------------
function StepCards({ title, subtitle, items, onPick, onBack, cols = 3, compact = false, lastStep = false }) {
  const gridCols = cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>

      <div className={`mt-6 grid grid-cols-1 gap-4 ${gridCols}`}>
        {items.map(({ key, label, desc, badge, Icon, tone, game, disabled, bg, bgAlt }) => (
          <button
            key={key}
            disabled={disabled}
            onClick={() => onPick(key)}
            // การ์ดที่กดไม่ได้: จางลง + เคอร์เซอร์ห้าม + ไม่มีเอฟเฟกต์ hover
            // relative + overflow-hidden = ให้ภาพพื้นหลังอยู่ในกรอบมนของการ์ด ไม่ล้นออกมุม
            // การ์ดที่มีภาพต้องสูงพอให้เห็นภาพ ไม่งั้นภาพโดนบีบจนดูไม่ออกว่าเป็นอะไร
            // ใช้ flex-col + justify-end ดันเนื้อหาลงล่าง เปิดพื้นที่ด้านบนให้ภาพได้โชว์
            className={`relative overflow-hidden ${bg ? 'flex min-h-[190px] flex-col justify-end' : ''} ${
              disabled
                ? `card cursor-not-allowed text-left opacity-40 ${compact ? 'p-4' : ''}`
                : `card-interactive group text-left focus:outline-none focus:ring-2 focus:ring-arcane ${compact ? 'p-4' : ''}`
            }`}
          >
            {/* ---- ภาพพื้นหลัง (ถ้าการ์ดนี้มี) ---- */}
            {bg && (
              <>
                {/* object-right = ยึดขอบขวาของภาพเป็นหลักเวลาถูกครอบตัด
                    เพราะตัวเอกของภาพทั้งสอง (มังกร / ประตูดันเจี้ยน) อยู่ชิดขวา
                    ถ้าใช้ค่าเริ่มต้น (กึ่งกลาง) ตัวเอกจะโดนตัดหายไป

                    loading="lazy" + decoding="async" = ไม่ให้ภาพใหญ่ถ่วงการโหลดหน้าแรก
                    alt="" + aria-hidden = ภาพประกอบล้วน ไม่ใช่ข้อมูล
                    ชื่อโหมดที่เป็นตัวหนังสือสื่อความหมายครบอยู่แล้ว
                    ถ้าใส่ alt ซ้ำ โปรแกรมอ่านหน้าจอจะอ่านซ้ำสองรอบ */}
                {/* opacity-80 เป็นค่า "ปกติ" ที่ทุกคนเห็น รวมถึงมือถือที่ไม่มี hover
                    (ของเดิมตั้ง 45% ทำให้มือถือเห็นภาพมืดตลอด เพราะ hover ใช้ไม่ได้)
                    ตรวจแล้วว่าตรงที่ตัวหนังสืออยู่ (ครึ่งล่างซ้าย) ภาพมืด 8-16% อยู่แล้ว
                    ดึงสว่างได้โดยตัวหนังสือยังอ่านออก */}
                <img
                  src={bg}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                />

                {/* ชั้นบังภาพ: กันตัวหนังสือทับพื้นภาพสว่างจนอ่านไม่ออก
                    ทำให้เบากว่าเดิมมาก เพราะภาพตรงที่ตัวหนังสืออยู่มืดพออยู่แล้ว
                    scrim หนัก ๆ มีแต่ทำให้ภาพจมมืดโดยไม่จำเป็น */}
                {/* ชั้นล่าง: เข้มเฉพาะขอบล่างสุด (ที่ตัวหนังสือ) แล้วจางเร็ว ปล่อยกลาง-บนโชว์ภาพ */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-surface/35 to-transparent"
                />
                {/* ชั้นบน: หนุนตัวหนังสือฝั่งซ้ายเบา ๆ ส่วนฝั่งขวา (ตัวเอกภาพ) โปร่งสนิท */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-surface/55 via-surface/10 to-transparent"
                />
              </>
            )}

            {/* เนื้อหาการ์ด — relative เพื่อให้ลอยเหนือภาพและชั้นบัง
                การ์ดที่มีภาพใส่ drop-shadow ให้ตัวหนังสือ เป็นตัวประกันว่าอ่านออก
                แม้ scrim จะเบาลง (เงาเข้มบาง ๆ ทำให้ตัวอักษรเด้งจากพื้นหลังทุกกรณี) */}
            <div className={`relative flex items-center justify-between gap-2 ${bg ? '[text-shadow:0_1px_4px_rgba(0,0,0,0.9)]' : ''}`}>
              <div className="flex items-center gap-3">
                {Icon && <Icon className="h-6 w-6 text-arcane2" />}
                <span className={`${game ? 'font-pixel text-sm text-arcane2' : `font-heading ${compact ? 'text-base' : 'text-lg'}`} ${tone || 'text-ink'}`}>
                  {label}
                </span>
              </div>
              {badge && <span className="chip shrink-0 text-xs text-muted">{badge}</span>}
            </div>

            {desc && (
              // การ์ดที่มี bg (โหมดดันเจี้ยน/จำกัดเวลา) ล็อกไว้ 2 บรรทัดเท่ากันเสมอ
              // กันไม่ให้คำอธิบายยาว-สั้นต่างกันจนหัวข้อ/ปุ่ม "เลือก" อยู่คนละระดับ
              <p className={`relative text-sm ${disabled ? 'text-danger' : 'text-muted'} ${compact ? 'mt-1' : 'mt-2'} ${bg ? 'line-clamp-2 min-h-[2.5rem] text-ink/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]' : ''}`}>
                {desc}
              </p>
            )}

            {!disabled && (
              // ตัวชี้นำว่ากดได้: การ์ดที่มีภาพต้องเห็นตลอด (มือถือไม่มี hover)
              // ส่วนการ์ดปกติยังใช้ hover เหมือนเดิมได้ เพราะไม่ได้แข่งกับพื้นหลังภาพ
              <span className={`relative mt-3 inline-flex items-center gap-1 text-sm text-arcane2 transition-opacity ${bg ? 'opacity-90 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]' : 'opacity-0 group-hover:opacity-100'}`}>
                {lastStep ? 'เริ่มทำข้อสอบ' : 'เลือก'} <IconArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        ))}
      </div>

      {onBack && (
        <div className="mt-6 text-center">
          <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
            <IconArrowLeft className="h-4 w-4" /> ย้อนกลับ
          </button>
        </div>
      )}
    </div>
  )
}
