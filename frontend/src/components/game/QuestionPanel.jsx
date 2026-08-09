// src/components/game/QuestionPanel.jsx
// -----------------------------------------------------------------------------
// แผงโจทย์ — แสดงคำถาม 1 ข้อ พร้อมตัวเลือก 4 ข้อ
//
// มี 2 โหมดการแสดงผลหลังผู้เล่นตอบ (คุมด้วย prop showFeedback):
//   showFeedback = true  (โหมดดันเจี้ยน = ฝึกซ้อม)
//       -> บอกทันทีว่าถูก/ผิด + ไฮไลต์ข้อที่ถูก + โชว์เฉลยและวิธีทำ
//   showFeedback = false (โหมดจำกัดเวลา = จำลองห้องสอบ)
//       -> ***ไม่บอกอะไรเลยว่าถูกหรือผิด*** แค่ไฮไลต์ข้อที่ผู้เล่นเลือกไว้
//          (เหมือนฝนคำตอบในห้องสอบจริง รู้ผลตอนจบทีเดียว)
//
// props:
//   question      ข้อมูลโจทย์ 1 ข้อ (โครงสร้างตาม data/questions/tgat.js)
//   hiddenChoices index ของตัวเลือกที่ถูก "สกิลตัดตัวเลือก" ตัดทิ้ง (เช่น [0,3])
//   selected      index ที่ผู้เล่นเลือก (null = ยังไม่ตอบ)
//   onAnswer(i)   เรียกเมื่อกดเลือกตัวเลือกที่ i
//   onNext()      เรียกเมื่อกด "ข้อถัดไป"
//   showFeedback  บอกถูก/ผิดหลังตอบไหม (ดีฟอลต์ true)
//   questionNumber / totalQuestions  เลขข้อ
// -----------------------------------------------------------------------------
import { IconCheck, IconClose, IconArrowRight } from '../icons/index.jsx'
import AiTutor from './AiTutor.jsx'

const CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง']

export default function QuestionPanel({
  question,
  hiddenChoices = [],
  selected = null,
  onAnswer,
  onNext,
  showFeedback = true,
  questionNumber,
  totalQuestions,
}) {
  const answered = selected !== null
  const isCorrect = answered && selected === question.correct

  return (
    <div className="card">
      {/* หัวข้อ: วิชา + เลขข้อ */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-aqua">{question.subject}</p>
        {questionNumber != null && (
          <span className="chip text-xs tabular-nums text-muted">
            ข้อ {questionNumber}{totalQuestions ? ` / ${totalQuestions}` : ''}
          </span>
        )}
      </div>

      {/* โจทย์ */}
      <h2 className="mt-3 text-lg font-semibold leading-relaxed text-ink">{question.question}</h2>

      {/* ตัวเลือก */}
      <ul className="mt-4 space-y-2">
        {question.choices.map((choice, i) => {
          const removed = hiddenChoices.includes(i)

          // ---- คำนวณสีของตัวเลือก ----
          let stateClass = 'border-border hover:border-arcane hover:bg-elevated'

          if (answered && showFeedback) {
            // โหมดฝึก: เฉลยเลยว่าข้อไหนถูก ข้อไหนที่เลือกแล้วผิด
            if (i === question.correct) stateClass = 'border-success bg-success/10'
            else if (i === selected) stateClass = 'border-danger bg-danger/10'
            else stateClass = 'border-border opacity-60'
          } else if (answered && !showFeedback) {
            // โหมดห้องสอบ: ไฮไลต์แค่ข้อที่เลือก ไม่ใบ้ว่าถูกหรือผิด
            stateClass = i === selected
              ? 'border-arcane bg-arcane/10'
              : 'border-border opacity-50'
          } else if (removed) {
            stateClass = 'border-border opacity-30 line-through'
          }

          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered || removed}
                onClick={() => onAnswer(i)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm text-ink transition-all disabled:cursor-not-allowed ${stateClass}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border font-heading text-arcane2">
                  {CHOICE_LABELS[i]}
                </span>
                <span className="flex-1">{choice}</span>

                {/* ไอคอนบอกผล — เฉพาะโหมดที่เฉลยได้เท่านั้น */}
                {answered && showFeedback && i === question.correct && (
                  <IconCheck className="h-5 w-5 shrink-0 text-success" />
                )}
                {answered && showFeedback && i === selected && i !== question.correct && (
                  <IconClose className="h-5 w-5 shrink-0 text-danger" />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {/* ---- ส่วนหลังตอบ ---- */}
      {answered && (
        <div className="mt-4 animate-fade-up">
          {showFeedback ? (
            // โหมดฝึก: บอกผล + เฉลย
            <>
              <p className={`font-heading ${isCorrect ? 'text-success' : 'text-danger'}`}>
                {isCorrect ? 'ตอบถูก' : 'ตอบผิด'}
              </p>
              <div className="mt-2 space-y-2 rounded-xl border border-border bg-bg/60 p-3 text-sm">
                {question.formula && (
                  <p className="text-muted">
                    <span className="font-heading text-gold">หลักการ: </span>
                    {question.formula}
                  </p>
                )}
                {question.explanation && (
                  <p className="text-muted">
                    <span className="font-heading text-aqua">วิธีทำ: </span>
                    {question.explanation}
                  </p>
                )}
              </div>

              {/* ครู AI "เซียนเวท" — ต่อยอดจากเฉลยด้านบน ถ้ายังไม่เข้าใจ
                  key={question.id} = รีเซ็ตบทสนทนาใหม่ทุกครั้งที่เปลี่ยนข้อ */}
              <AiTutor key={question.id} question={question} selected={selected} />
            </>
          ) : (
            // โหมดห้องสอบ: ไม่เฉลย บอกแค่ว่าบันทึกคำตอบแล้ว
            <p className="text-sm text-muted">
              บันทึกคำตอบข้อ <span className="font-heading text-arcane2">{CHOICE_LABELS[selected]}</span> แล้ว
              — จะรู้ผลทั้งหมดเมื่อจบด่าน
            </p>
          )}

          <button onClick={onNext} className="btn-primary mt-4 w-full sm:w-auto">
            ข้อถัดไป
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
