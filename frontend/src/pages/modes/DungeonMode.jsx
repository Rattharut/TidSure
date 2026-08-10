// src/pages/modes/DungeonMode.jsx
// -----------------------------------------------------------------------------
// หน้าจอเล่น "โหมดดันเจี้ยน" — เชื่อม logic (game/dungeonEngine.js) เข้ากับหน้าตา
//
// ลำดับการทำงานในหน้านี้:
//   1) ตอนเปิดหน้า -> สร้างด่านใหม่ด้วย createDungeonRun()
//   2) ผู้เล่นกดตัวเลือก -> ส่งให้ answerDungeonQuestion() คำนวณผล -> ได้ run ใหม่ -> วาดหน้าจอใหม่
//   3) กด "ข้อถัดไป" -> เปลี่ยนโจทย์ ล้างสถานะการเลือก
//   4) run.status เป็น 'win' / 'lose' -> แสดงหน้าจบด่าน (พร้อมรางวัล)
//
// รอบนี้ภาพทั้งหมดเป็น PLACEHOLDER (ดู components/game/SpritePlaceholder.jsx)
// -----------------------------------------------------------------------------
import { useState, useEffect, useRef } from 'react'
import BattleStage from '../../components/game/BattleStage.jsx'
import HeartBar from '../../components/game/HeartBar.jsx'
import QuestionPanel from '../../components/game/QuestionPanel.jsx'
import SkillBar from '../../components/game/SkillBar.jsx'
import SpritePlaceholder from '../../components/game/SpritePlaceholder.jsx'
import { getQuestions } from '../../data/questions/index.js'
import { getProgress, recordBossWin } from '../../lib/progress.js'
import { recordDungeonClear } from '../../lib/playerStats.js'
import { SKILLS, SKILL_MOODENG } from '../../data/gameConfig.js'
import { SPRITES, resolveMonsterSprite } from '../../data/sprites.js'
import {
  createDungeonRun, answerDungeonQuestion, useDungeonSkill,
  currentMonster, computeDungeonRewards,
} from '../../game/dungeonEngine.js'
import {
  IconSkull, IconTrophy, IconArrowLeft, IconStar, IconBolt,
} from '../../components/icons/index.jsx'

export default function DungeonMode({ choices, onExit }) {
  // ---- สถานะของด่าน ----
  // useState(() => ...) = สร้างค่าเริ่มต้นครั้งเดียวตอนเปิดหน้า (ไม่สร้างใหม่ทุกครั้งที่วาด)
  // getProgress() = สกิลที่ผู้เล่นปลดล็อกไว้แล้ว (จาก cache — login มาจาก backend, guest ในหน่วยความจำ)
  const [run, setRun] = useState(() =>
    createDungeonRun({ difficulty: choices.difficulty, progress: getProgress() })
  )
  const [qIndex, setQIndex] = useState(0)        // ใช้โจทย์ข้อที่เท่าไรในคลัง
  const [selected, setSelected] = useState(null) // ผู้เล่นเลือกตัวเลือกไหน (null = ยังไม่ตอบ)
  const [hiddenChoices, setHiddenChoices] = useState([]) // ตัวเลือกที่ถูกสกิลตัดทิ้ง

  // ---- ดึงชุดข้อสอบตามเงื่อนไขที่เลือก (สลับลำดับให้แล้ว) ----
  // useState(() => ...) = ดึงครั้งเดียวตอนเข้าด่าน ไม่สุ่มใหม่ทุกครั้งที่หน้าจอวาด
  const [pool] = useState(() =>
    getQuestions({
      examType: choices.examType,
      subjectCode: choices.subject?.code,
      difficulty: choices.difficulty,
    })
  )

  // โหมดดันเจี้ยนสู้จนกว่า Monster จะตายครบ จำนวนข้อจึงไม่แน่นอน
  // ถ้าข้อสอบในคลังหมดก่อน ก็วนกลับมาใช้ซ้ำด้วย % (modulo) — ยอมรับได้เพราะเป็นโหมดฝึก
  const question = pool.length > 0 ? pool[qIndex % pool.length] : null
  const monster = currentMonster(run)

  // ---- ชนะด่าน (ฆ่าบอสสำเร็จ) -> ปลดล็อกสกิลของระดับนั้น ----
  // ทำใน effect ไม่ใช่ระหว่าง render เพราะ recordBossWin มี side effect (ยิง API / แก้ cache)
  // savedRef กันเรียกซ้ำ: React re-render หลายรอบ แต่ต้องบันทึกแค่ครั้งเดียวต่อการชนะ 1 ครั้ง
  const savedWinRef = useRef(false)
  useEffect(() => {
    if (run.status === 'win' && !savedWinRef.current) {
      savedWinRef.current = true
      recordBossWin(choices.difficulty)   // ปลดล็อกสกิลของระดับนั้น
      recordDungeonClear()                // เลเวล +1 + สังหารมังกร +1 (นับทุกครั้งที่ชนะ)
    }
  }, [run.status, choices.difficulty])

  // ---- ผู้เล่นกดตอบ ----
  function handleAnswer(i) {
    if (selected !== null) return // กันกดซ้ำ
    setSelected(i)
    const isCorrect = i === question.correct
    setRun((prev) => answerDungeonQuestion(prev, isCorrect))
  }

  // ---- กดข้อถัดไป ----
  function handleNext() {
    setSelected(null)
    setHiddenChoices([])
    setQIndex((n) => n + 1)
  }

  // ---- กดใช้สกิล ----
  function handleUseSkill(skillId) {
    const { run: nextRun, hiddenChoices: hidden } = useDungeonSkill(run, skillId, question)
    setRun(nextRun)
    if (hidden.length) setHiddenChoices(hidden)
  }

  // =========================================================================
  // ยังไม่มีข้อสอบสำหรับเงื่อนไขนี้ -> บอกผู้เล่นตรง ๆ แทนที่จะขึ้นหน้าว่าง
  // =========================================================================
  if (!question) {
    return <NoQuestions choices={choices} onExit={onExit} />
  }

  // =========================================================================
  // จบด่านแล้ว (ชนะ/แพ้) -> แสดงหน้าสรุป
  // =========================================================================
  if (run.status !== 'playing') {
    return <DungeonResult run={run} choices={choices} onExit={onExit} />
  }

  // =========================================================================
  // กำลังเล่นอยู่
  // =========================================================================

  // มอนตัวนี้มีสไปรต์ pixel art แล้วหรือยัง (ยังไม่มี = null -> ใช้ placeholder)
  const enemySprite = resolveMonsterSprite({
    difficulty: choices.difficulty,
    index: monster.index,
  })

  // ป้ายชื่อศัตรู (ใช้ให้โปรแกรมอ่านหน้าจอ — บนจอไม่แสดงแล้ว)
  // ถ้ามีสไปรต์ ใช้ชื่อจริงของมอน เช่น "ออร์ค" ไม่ใช่ "Monster 3" ทั้งที่เห็นเป็นออร์ค
  // บอสเติมคำว่า (บอส) กำกับ เพราะบนจอไม่มีข้อความบอกแล้ว
  const enemyLabel = enemySprite
    ? (monster.kind === 'boss' ? `${SPRITES[enemySprite].name} (บอส)` : SPRITES[enemySprite].name)
    : (monster.kind === 'boss' ? 'บอสประจำด่าน' : `Monster ${monster.index + 1}`)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* แถบบน: เหลือแค่ปุ่มออกจากด่าน
          ป้ายบอกเงื่อนไขที่เลือก (โหมด/ประเภทข้อสอบ/วิชา/ระดับ) และแถบศัตรูในด่าน
          ถูกถอดออกตามที่ผู้ใช้ต้องการ ให้ผู้เล่นโฟกัสที่ฉากต่อสู้กับโจทย์อย่างเดียว */}
      <div className="mb-4 flex justify-end">
        <button onClick={onExit} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <IconArrowLeft className="h-4 w-4" /> ออกจากด่าน
        </button>
      </div>

      {/* ฉากต่อสู้ */}
      <BattleStage
        difficulty={choices.difficulty}
        // null = ยังไม่มีสไปรต์ -> BattleStage จะใช้กล่อง placeholder แทนให้เอง
        enemySprite={enemySprite}
        enemyLabel={enemyLabel}
        EnemyIcon={IconSkull}
        enemyTone={monster.kind === 'boss' ? 'rose' : 'muted'}
        effect={describeEvent(run.lastEvent)}
        // stats.answered เพิ่มทุกครั้งที่ตอบ = ทุกครั้งที่เกิดการปะทะใหม่
        // ใช้เป็น key ให้ข้อความเด้งใหม่เสมอ แม้ผลจะซ้ำ (เช่นโดนตี -2 สองข้อติด)
        effectKey={run.stats.answered}
        // หมูเด้งยืนข้างผู้เล่นเมื่อปลดล็อกสกิลแล้ว และยังไม่ถูกใช้ไป (usesLeft > 0)
        // ถ้าใช้สละชีพไปแล้ว หมูเด้งก็หายจากฉาก (สื่อว่าไม่มีตัวช่วยเหลืออีก)
        companion={
          run.skills[SKILL_MOODENG]?.unlocked && run.skills[SKILL_MOODENG]?.usesLeft > 0
            ? 'moodeng' : null
        }
        heroSlot={<HeartBar current={run.player.hearts} max={run.player.maxHearts} tone="rose" srLabel="ผู้เล่น" />}
        enemySlot={
          <HeartBar
            current={monster.hearts}
            max={monster.maxHearts}
            tone="danger"
            srLabel={enemyLabel}
          />
        }
      />

      {/* แถบสกิล (มีเฉพาะโหมดนี้) */}
      <div className="mt-4">
        <SkillBar skills={run.skills} onUse={handleUseSkill} disabled={selected !== null} />
      </div>

      {/* โจทย์ */}
      <div className="mt-4">
        <QuestionPanel
          question={question}
          hiddenChoices={hiddenChoices}
          selected={selected}
          onAnswer={handleAnswer}
          onNext={handleNext}
          showExplanation           // ดันเจี้ยน = โหมดฝึก จึงเฉลยได้ทันที
          questionNumber={run.stats.answered + (selected === null ? 1 : 0)}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NoQuestions — แสดงเมื่อคลังยังไม่มีข้อสอบของวิชา/ระดับที่เลือก
// (empty state ที่บอกสาเหตุ + ทางออก ดีกว่าปล่อยให้หน้าจอว่างเปล่า)
// ---------------------------------------------------------------------------
export function NoQuestions({ choices, onExit }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="card">
        <h1 className="text-xl font-semibold text-ink">ยังไม่มีข้อสอบสำหรับด่านนี้</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          คลังข้อสอบยังไม่มีข้อของ{' '}
          <span className="text-ink">{choices.subject?.name ?? choices.examType}</span>{' '}
          ระดับ <span className="text-ink">{choices.difficulty}</span>
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          เพิ่มข้อสอบได้ที่ไฟล์ <code className="text-aqua">src/data/questions/</code>{' '}
          โดยใส่ <code className="text-aqua">subjectCode</code> และ{' '}
          <code className="text-aqua">difficulty</code> ให้ตรงกับที่เลือก
        </p>
        <button onClick={onExit} className="btn-primary mt-6">
          เลือกวิชาอื่น
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// แปลง "เหตุการณ์ล่าสุด" จาก engine -> ข้อความบนฉาก
// (อนาคตตรงนี้จะเปลี่ยนเป็นอนิเมชัน pixel art แทนข้อความ)
// ---------------------------------------------------------------------------
function describeEvent(e) {
  if (!e) return null
  switch (e.type) {
    case 'playerAttack':
      return e.boostUsed ? `ฟันเข้าเต็มแรง -${e.damage} หัวใจ` : `ฟันโดน -${e.damage} หัวใจ`
    case 'monsterAttack':
      return `โดนตี -${e.damage} หัวใจ`
    case 'moodengSacrifice':
      return 'หมูเด้งกระโดดรับแทน! คุณรอดตาย'
    case 'skillUsed':
      return `ใช้สกิล: ${SKILLS[e.skillId]?.name ?? ''}`
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// หน้าจบด่านของโหมดดันเจี้ยน
// ---------------------------------------------------------------------------
function DungeonResult({ run, choices, onExit }) {
  const win = run.status === 'win'
  // รางวัล: ฆ่าบอส = ได้เลเวล + ปลดล็อกสกิลตามระดับความยาก
  const rewards = computeDungeonRewards(run)
  const unlockedSkillDef = rewards.unlockedSkill ? SKILLS[rewards.unlockedSkill] : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="card text-center">
        <SpritePlaceholder
          label={win ? 'ภาพฉลองชัยชนะ' : 'ภาพผู้เล่นล้ม'}
          note="(pixel art)"
          Icon={win ? IconTrophy : IconSkull}
          tone={win ? 'arcane' : 'rose'}
          className="mx-auto h-28 w-28"
        />

        <h1 className={`mt-4 font-game text-3xl ${win ? 'text-gradient' : 'text-danger'}`}>
          {win ? 'VICTORY' : 'DEFEAT'}
        </h1>
        <p className="mt-2 text-muted">
          {win
            ? `คุณปราบบอสระดับ ${choices.difficulty} สำเร็จ`
            : 'หัวใจหมดก่อนปราบบอส ลองใหม่อีกครั้ง'}
        </p>

        {/* สรุปผลการตอบ */}
        <div className="mt-6 flex justify-center gap-3 text-sm">
          <span className="chip">ตอบถูก {run.stats.correct} ข้อ</span>
          <span className="chip">ตอบทั้งหมด {run.stats.answered} ข้อ</span>
        </div>

        {/* รางวัล (เฉพาะตอนชนะ) */}
        {win && (
          <div className="mt-6 space-y-2 rounded-xl border border-gold/40 bg-gold/5 p-4 text-left">
            <p className="font-heading text-gold">รางวัลที่ได้รับ</p>
            <p className="flex items-center gap-2 text-sm text-ink">
              <IconStar className="h-4 w-4 text-gold" />
              เลเวล +{rewards.levelGain}
            </p>
            {unlockedSkillDef && (
              <p className="flex items-center gap-2 text-sm text-ink">
                <IconBolt className="h-4 w-4 text-gold" />
                ปลดล็อกสกิล: {unlockedSkillDef.name}
              </p>
            )}
            {/* TODO: บันทึกรางวัลลง backend ด้วย applyRewardsToProgress() + POST /api/progress */}
            <p className="text-xs text-muted">
              * รอบนี้ยังไม่บันทึกถาวร (ยังไม่ต่อฐานข้อมูล)
            </p>
          </div>
        )}

        {/* หมายเหตุสำคัญตามสเปก */}
        <p className="mt-6 rounded-lg border border-border bg-bg/60 p-3 text-xs leading-relaxed text-muted">
          ผลจากโหมดดันเจี้ยนจะไม่ถูกนำไปคิดค่าพลังในหน้า Status
          เพราะโหมดนี้มีสกิลช่วย ค่าจึงไม่สะท้อนความสามารถจริง
          (ค่าพลังคิดจากโหมดจำกัดเวลาเท่านั้น)
        </p>

        <button onClick={onExit} className="btn-primary mt-6">
          กลับไปเลือกด่านใหม่
        </button>
      </div>
    </div>
  )
}
