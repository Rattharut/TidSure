// src/pages/modes/TimedMode.jsx
// -----------------------------------------------------------------------------
// หน้าจอเล่น "โหมดจำกัดเวลา (จำลองห้องสอบ)" — เชื่อม game/timedEngine.js เข้ากับหน้าตา
//
// จุดต่างจากดันเจี้ยนที่ต้องระวัง:
//   • ไม่มี <SkillBar /> เด็ดขาด (สเปกห้ามมีสกิลในโหมดนี้)
//   • ผู้เล่นมีหัวใจสีทอง 1 ดวง + อมตะ -> ตอบผิดไม่เสียหัวใจ
//   • บอสมังกรตัวเดียว ไม่มี Monster อื่น
//   • แพ้/ชนะตัดสินที่เวลา: ทำครบทันเวลา = ชนะ / หมดเวลา = แพ้
//   • ไม่เฉลยระหว่างทำ (เหมือนห้องสอบจริง) -> showExplanation={false}
//
// การนับเวลา (ความรู้ React):
//   ใช้ useEffect + setInterval เดินนาฬิกาทุก 1 วินาที
//   และต้อง clearInterval ใน cleanup ทุกครั้ง ไม่งั้นนาฬิกาจะเดินซ้อนกันหลายตัว
// -----------------------------------------------------------------------------
import { useState, useEffect } from 'react'
import BattleStage from '../../components/game/BattleStage.jsx'
import HeartBar from '../../components/game/HeartBar.jsx'
import QuestionPanel from '../../components/game/QuestionPanel.jsx'
import ScoreSummary from './ScoreSummary.jsx'
import { NoQuestions } from './DungeonMode.jsx'
import { getQuestions } from '../../data/questions/index.js'
import { formatTime, TIMED_QUESTIONS_PER_STAGE } from '../../data/gameConfig.js'
import { createTimedRun, answerTimedQuestion, tickTimedRun } from '../../game/timedEngine.js'
import { IconDragon, IconArrowLeft } from '../../components/icons/index.jsx'

export default function TimedMode({ choices, onExit }) {
  // ---- ดึงชุดข้อสอบตามเงื่อนไข (ขอไม่เกินจำนวนข้อต่อด่าน) ----
  // useState(() => ...) = สุ่มครั้งเดียวตอนเข้าด่าน ไม่สุ่มใหม่ทุกครั้งที่วาดหน้าจอ
  const [pool] = useState(() =>
    getQuestions({
      examType: choices.examType,
      subjectCode: choices.subject?.code,
      difficulty: choices.difficulty,
      count: TIMED_QUESTIONS_PER_STAGE,
    })
  )

  // จำนวนข้อของด่านนี้ = เท่าที่มีจริงในคลัง (อาจน้อยกว่า 20 ถ้าข้อสอบยังไม่ครบ)
  // ส่งเข้า engine เพื่อให้หัวใจบอสและคะแนนเต็มคิดจากจำนวนจริง
  const [run, setRun] = useState(() =>
    createTimedRun({ difficulty: choices.difficulty, totalQuestions: pool.length })
  )
  const [selected, setSelected] = useState(null)

  // ---- นาฬิกานับถอยหลัง ----
  useEffect(() => {
    // ถ้าด่านจบแล้ว ไม่ต้องเดินเวลาต่อ
    if (run.status !== 'playing') return

    const timer = setInterval(() => {
      setRun((prev) => tickTimedRun(prev, 1)) // ลดเวลาทีละ 1 วินาที
    }, 1000)

    // cleanup: หยุดนาฬิกาเมื่อออกจากหน้า หรือเมื่อ effect ทำงานรอบใหม่
    return () => clearInterval(timer)
  }, [run.status])

  // โจทย์ปัจจุบัน — โหมดนี้ทำครบทุกข้อแล้วจบ จึงไม่ต้องวนซ้ำ
  const question = pool[run.questionIndex] ?? null

  function handleAnswer(i) {
    if (selected !== null) return
    setSelected(i)
  }

  // ในโหมดนี้กด "ข้อถัดไป" ถึงจะนับข้อ (เพื่อให้ผู้เล่นเห็นว่าเลือกอะไรไปก่อน)
  function handleNext() {
    const isCorrect = selected === question.correct
    setRun((prev) => answerTimedQuestion(prev, isCorrect))
    setSelected(null)
  }

  // =========================================================================
  // ยังไม่มีข้อสอบสำหรับเงื่อนไขนี้
  // =========================================================================
  if (pool.length === 0) {
    return <NoQuestions choices={choices} onExit={onExit} />
  }

  // =========================================================================
  // จบด่าน -> ตัดไปหน้าสรุปคะแนน (ตามสเปก)
  // =========================================================================
  if (run.status !== 'playing') {
    return <ScoreSummary run={run} choices={choices} onExit={onExit} />
  }

  // เวลาน้อยกว่า 60 วินาที -> เตือนด้วยสีแดง
  const lowTime = run.timeLeft <= 60

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* แถบบน: เหลือแค่ปุ่มออกจากห้องสอบ
          ป้ายบอกเงื่อนไขที่เลือก (โหมด/ประเภทข้อสอบ/วิชา/ระดับ) ถูกถอดออก
          ให้เหมือนกับโหมดดันเจี้ยน ผู้เล่นจะได้โฟกัสที่โจทย์กับนาฬิกาอย่างเดียว */}
      <div className="mb-4 flex justify-end">
        <button onClick={onExit} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <IconArrowLeft className="h-4 w-4" /> ออกจากห้องสอบ
        </button>
      </div>

      {/* ---- นาฬิกา + ความคืบหน้า ---- */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <span className="font-heading text-sm text-muted">เวลาที่เหลือ</span>
          {/* tabular-nums = ตัวเลขความกว้างเท่ากัน นาฬิกาจะไม่กระตุกตอนเลขเปลี่ยน */}
          <span className={`font-game text-2xl tabular-nums ${lowTime ? 'text-danger' : 'text-ink'}`}>
            {formatTime(run.timeLeft)}
          </span>
        </div>
        {/* แถบเวลา */}
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${lowTime ? 'bg-danger' : 'bg-gradient-to-r from-gold to-rose'}`}
            style={{ width: `${(run.timeLeft / run.totalTime) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          ทำไปแล้ว {run.questionIndex} / {run.totalQuestions} ข้อ — ทำครบก่อนหมดเวลาเพื่อสังหารมังกร
        </p>
      </div>

      {/* ฉากต่อสู้กับมังกร */}
      <BattleStage
        difficulty={choices.difficulty}
        enemyLabel="บอสมังกร"
        EnemyIcon={IconDragon}
        enemyTone="rose"
        effect={describeSwing(run.lastEvent)}
        // questionIndex เปลี่ยนทุกข้อ = ทุกครั้งที่เกิดการปะทะใหม่ -> ข้อความเด้งใหม่
        effectKey={run.questionIndex}
        heroSlot={
          // หัวใจสีทอง 1 ดวง + ป้ายบอกว่าอมตะ (หัวใจไม่ลด มีไว้โชว์)
          <div className="flex flex-col items-center gap-1">
            <HeartBar current={run.player.hearts} max={run.player.maxHearts} tone="gold" srLabel="ผู้เล่น" />
            <span className="chip text-[10px] text-gold">อมตะ</span>
          </div>
        }
        enemySlot={
          // มังกรก็อมตะเหมือนกัน หัวใจไม่ลด
          <div className="flex flex-col items-center gap-1">
            <HeartBar current={run.boss.hearts} max={run.boss.maxHearts} tone="danger" srLabel="มังกร" />
            <span className="chip text-[10px] text-danger">อมตะ</span>
          </div>
        }
      />

      {/* โจทย์ — ไม่บอกถูก/ผิดเลยระหว่างทำ (จำลองห้องสอบจริง) */}
      <div className="mt-4">
        <QuestionPanel
          question={question}
          selected={selected}
          onAnswer={handleAnswer}
          onNext={handleNext}
          showFeedback={false}
          questionNumber={run.questionIndex + 1}
          totalQuestions={run.totalQuestions}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// แปลงเหตุการณ์สุ่มปะทะ -> ข้อความบนฉาก
// สำคัญ: ข้อความพวกนี้ต้อง "ไม่ใบ้" ว่าตอบถูกหรือผิด เพราะการสุ่มไม่ผูกกับคำตอบ
// (อนาคตเปลี่ยนเป็นอนิเมชัน pixel art แทนข้อความได้)
// ---------------------------------------------------------------------------
function describeSwing(e) {
  if (!e) return null
  switch (e.type) {
    case 'playerSwing':
      return 'คุณพุ่งเข้าฟันมังกร'
    case 'bossSwing':
      return 'มังกรฟาดหางใส่คุณ'
    case 'finishingBlow':
      return 'ดาบสุดท้าย!'
    case 'timeUp':
      return 'หมดเวลา!'
    default:
      return null
  }
}
