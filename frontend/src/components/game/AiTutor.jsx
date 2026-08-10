// src/components/game/AiTutor.jsx
// -----------------------------------------------------------------------------
// "จอมปราชญ์" — ครู AI ที่โผล่ใต้เฉลย (เฉพาะโหมดดันเจี้ยน = โหมดฝึก)
//
// การทำงาน:
//   • เริ่มแบบ "พับ" — โชว์แค่ปุ่ม "ถามครู AI" (ไม่เรียก AI จนกว่าจะกด = ประหยัดโควตา)
//   • กดครั้งแรก -> ขอให้ AI อธิบายเฉลยข้อนี้ให้ (ต่อยอดจากเฉลยเดิม ไม่ทิ้งของเก่า)
//   • ถามต่อได้เรื่อย ๆ ทั้งปุ่มลัดและพิมพ์เอง (คุยเป็นแชท)
//   • ถ้า AI ล่ม/ยังไม่ตั้ง key -> โชว์ข้อความบอกให้ดูเฉลยด้านบน (ไม่พังทั้งหน้า)
//
// props:
//   question = ข้อมูลโจทย์ข้อปัจจุบัน (subject/question/choices/correct/formula/explanation)
//   selected = index ที่ผู้เล่นเลือก (เอาไว้บอก AI ว่านักเรียนตอบผิดข้อไหน)
// -----------------------------------------------------------------------------
import { useState, useRef, useEffect } from 'react'
import { tutorApi } from '../../lib/api.js'
import { IconBrain, IconSparkle, IconArrowRight } from '../icons/index.jsx'

// คำถามลัด กดง่าย ไม่ต้องพิมพ์เอง (เดโมลื่นบนมือถือ)
const QUICK_ASKS = ['อธิบายง่ายกว่านี้', 'ขอตัวอย่างอีกข้อ', 'ทำไมข้อที่หนูตอบถึงผิด']

// แปลง **ตัวหนา** เป็นตัวหนาจริง (AI ชอบตอบมาเป็นมาร์กดาวน์)
// ปลอดภัย: ใช้ React element ไม่ใช่ dangerouslySetInnerHTML จึงไม่มีช่องโหว่ XSS
function renderRich(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-heading text-white">{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  )
}

export default function AiTutor({ question, selected }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // { role: 'user' | 'model', text }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  // เลื่อนแชทลงล่างสุดทุกครั้งที่มีข้อความ/สถานะใหม่
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, error])

  // ข้อมูลโจทย์ที่ส่งให้ AI ยึดเป็น "ความจริง" (กัน AI มั่วคำตอบ)
  function buildContext() {
    return {
      subject: question.subject,
      question: question.question,
      choices: question.choices,
      correctIndex: question.correct,
      correctText: question.choices?.[question.correct],
      userAnswerText: selected != null ? question.choices?.[selected] : null,
      formula: question.formula,
      explanation: question.explanation,
    }
  }

  // ส่งคำถามไปหาครู AI — ถ้า text ว่าง = เปิดบทสนทนา (ขอคำอธิบายแรก)
  async function ask(text) {
    const base = text ? [...messages, { role: 'user', text }] : messages
    if (text) setMessages(base)
    setInput('')
    setError(null)
    setLoading(true)
    try {
      const { reply } = await tutorApi.ask(buildContext(), base)
      setMessages([...base, { role: 'model', text: reply }])
    } catch (err) {
      setError(err.message || 'ครู AI ไม่ว่างตอนนี้ ลองดูเฉลยด้านบนก่อนนะ')
    } finally {
      setLoading(false)
    }
  }

  // กดปุ่มเปิดครั้งแรก -> กาง + ขอคำอธิบายแรกทันที
  function handleOpen() {
    setOpen(true)
    if (messages.length === 0 && !loading) ask()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const text = input.trim()
    if (text && !loading) ask(text)
  }

  // ---- ยังพับอยู่: โชว์แค่ปุ่มเรียก ----
  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-arcane/40 bg-arcane/5 px-4 py-3 font-heading text-sm text-arcane2 transition-colors hover:bg-arcane/15"
      >
        <IconSparkle className="h-4 w-4" />
        ยังไม่เข้าใจ? ถามครู AI
      </button>
    )
  }

  // ---- กางแล้ว: กล่องแชทจอมปราชญ์ ----
  return (
    <div className="mt-3 rounded-xl border border-arcane/40 bg-arcane/5 p-3">
      {/* หัวกล่อง: ตัวละครครู */}
      <div className="flex items-center gap-2 border-b border-arcane/20 pb-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-arcane/20">
          <IconBrain className="h-5 w-5 text-arcane2" />
        </span>
        <div className="leading-tight">
          <p className="font-heading text-sm text-ink">จอมปราชญ์ (ครู AI)</p>
          <p className="text-[11px] text-muted">ถามได้เรื่อย ๆ จนกว่าจะเข้าใจ</p>
        </div>
      </div>

      {/* บทสนทนา */}
      <div ref={listRef} className="max-h-72 space-y-2 overflow-y-auto py-3">
        {messages.map((m, i) =>
          m.role === 'model' ? (
            <div key={i} className="flex justify-start">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-elevated px-3 py-2 text-sm leading-relaxed text-ink">
                {renderRich(m.text)}
              </p>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-arcane/25 px-3 py-2 text-sm leading-relaxed text-ink">
                {m.text}
              </p>
            </div>
          )
        )}

        {/* กำลังพิมพ์ */}
        {loading && (
          <div className="flex justify-start">
            <p className="rounded-2xl rounded-tl-sm bg-elevated px-3 py-2 text-sm text-muted">
              จอมปราชญ์กำลังคิด…
            </p>
          </div>
        )}

        {/* ผิดพลาด: กันเหนียว ไม่ให้จอขาว */}
        {error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs leading-relaxed text-danger">
            {error}
            <button
              type="button"
              onClick={() => ask()}
              className="ml-2 underline hover:text-ink"
            >
              ลองใหม่
            </button>
          </div>
        )}
      </div>

      {/* ปุ่มถามลัด */}
      <div className="flex flex-wrap gap-2 pb-2">
        {QUICK_ASKS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading}
            onClick={() => ask(q)}
            className="rounded-full border border-arcane/40 px-3 py-1 text-xs text-arcane2 transition-colors hover:bg-arcane/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ช่องพิมพ์ถามเอง */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ถามครู AI…"
          className="flex-1 rounded-lg border border-border bg-bg/60 px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-arcane focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="ส่งคำถาม"
          className="flex items-center justify-center rounded-lg border border-arcane/50 px-3 text-arcane2 transition-colors hover:bg-arcane/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
