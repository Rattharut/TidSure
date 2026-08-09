// src/pages/modes/ScoreSummary.jsx
// -----------------------------------------------------------------------------
// หน้าสรุปคะแนนของ "โหมดจำกัดเวลา" (ตัดมาที่นี่ทันทีเมื่อจบด่าน)
//
// สเปก:
//   • แสดงคะแนนที่ได้เทียบคะแนนเต็ม เช่น "67/80 คะแนน"
//   • ทำครบทุกข้อทันเวลา -> ผู้เล่นฆ่าบอสมังกร (ชนะ)
//   • หมดเวลาก่อน       -> บอสฆ่าผู้เล่น (แพ้)
//
// สำคัญ: ผลจากหน้านี้คือ "ข้อมูลชุดเดียว" ที่มีสิทธิ์ไปอัปเดตค่าพลังในหน้า Status
//        (โหมดดันเจี้ยนห้ามนำมาคิด เพราะมีสกิลช่วย)
// -----------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import SpritePlaceholder from '../../components/game/SpritePlaceholder.jsx'
import { computeTimedScore, toStatusResult } from '../../game/timedEngine.js'
import { saveRun } from '../../lib/playerStats.js'
import { getDifficultyTheme } from '../../data/difficultyTheme.js'
import { IconDragon, IconTrophy, IconChart } from '../../components/icons/index.jsx'

export default function ScoreSummary({ run, choices, onExit }) {
  const win = run.status === 'win'
  const { score, maxScore, percent, text } = computeTimedScore(run)

  // สีประจำระดับความยากที่เพิ่งเล่น — ให้ตรงกับสีบนกราฟหน้า Status
  const theme = getDifficultyTheme(choices.difficulty)

  // ---- บันทึกผลอัตโนมัติเมื่อเปิดหน้านี้ ----
  // state: 'saving' | 'saved' | 'failed'
  const [save, setSave] = useState({ state: 'saving', message: 'กำลังบันทึกผล...' })

  // กัน React StrictMode ยิงซ้ำสองรอบตอน dev (จะได้ไม่บันทึกผลซ้ำ)
  const savedOnce = useRef(false)

  useEffect(() => {
    if (savedOnce.current) return
    savedOnce.current = true

    saveRun(toStatusResult(run, choices.subject, choices.examType))
      .then((res) => setSave({ state: res.saved ? 'saved' : 'failed', message: res.message }))
      .catch(() => setSave({ state: 'failed', message: 'บันทึกผลไม่สำเร็จ' }))
    // ตั้งใจให้รันครั้งเดียวตอน mount — ผลของด่านที่จบแล้วไม่เปลี่ยนอีก
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="card text-center">
        <SpritePlaceholder
          label={win ? 'ภาพสังหารมังกร' : 'ภาพมังกรจู่โจมผู้เล่น'}
          note="(pixel art)"
          Icon={win ? IconTrophy : IconDragon}
          tone={win ? 'arcane' : 'rose'}
          className="mx-auto h-28 w-28"
        />

        <h1 className={`mt-4 font-game text-3xl ${win ? 'text-gradient' : 'text-danger'}`}>
          {win ? 'DRAGON SLAIN' : 'TIME UP'}
        </h1>
        <p className="mt-2 text-muted">
          {win
            ? 'คุณทำข้อสอบครบทันเวลา และปลิดชีพมังกรได้สำเร็จ'
            : 'หมดเวลาก่อนทำครบ มังกรจึงเป็นฝ่ายชนะ'}
        </p>

        {/* ---- คะแนน (ตัวเลขใหญ่ อ่านง่าย) ---- */}
        <div className="mt-8">
          <p className="font-game text-5xl tabular-nums text-ink">
            {score}
            <span className="text-2xl text-muted">/{maxScore}</span>
          </p>
          <p className="mt-1 font-heading text-muted">{text}</p>

          {/* แถบเปอร์เซ็นต์ */}
          <div className="mx-auto mt-4 h-2.5 max-w-sm overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-gradient-to-r from-arcane to-aqua transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">{percent}% ของคะแนนเต็ม</p>
        </div>

        {/* ---- รายละเอียด ---- */}
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          <span className="chip">ตอบถูก {run.stats.correct} ข้อ</span>
          <span className="chip">ทำไป {run.stats.answered} / {run.totalQuestions} ข้อ</span>
          {/* ป้ายระดับความยากใช้สีเดียวกับที่จะไปโผล่บนกราฟเรดาร์ */}
          <span className={`chip border ${theme.ringClass} ${theme.textClass}`}>
            ระดับ{choices.difficulty}
          </span>
        </div>

        {/* ---- ผลนี้ถูกนำไปคิดค่าพลังในหน้า Status ---- */}
        <div className="mt-6 rounded-xl border border-aqua/40 bg-aqua/5 p-4 text-left">
          <p className="flex items-center gap-2 font-heading text-aqua">
            <IconChart className="h-4 w-4" />
            ผลนี้ถูกนำไปคิดค่าพลังในหน้า Status
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            เพราะมาจากโหมดจำกัดเวลา (ไม่มีสกิลช่วย) ค่าจึงสะท้อนความสามารถจริง —
            วิชา <span className="text-ink">{choices.subject?.code}</span> ของคุณจะแสดงเป็น
            <span className={theme.textClass}> สีระดับ{choices.difficulty}</span> บนกราฟ
          </p>

          {/* สถานะการบันทึก */}
          <p
            className={`mt-3 text-xs ${
              save.state === 'saved' ? 'text-aqua' : save.state === 'failed' ? 'text-danger' : 'text-muted'
            }`}
          >
            {save.state === 'saving' && '• '}
            {save.message}
          </p>

          {/* เตือนเรื่องกฎ "ยึดระดับยากสุด" เฉพาะตอนบันทึกสำเร็จ */}
          {save.state === 'saved' && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              หมายเหตุ: ถ้าเคยเล่นวิชานี้ในระดับที่ยากกว่ามาแล้ว กราฟจะยังคงแสดงผลของระดับนั้น
              เพราะค่าพลังยึดตามระดับที่ยากที่สุดที่เคยทำได้
            </p>
          )}
        </div>

        <button onClick={onExit} className="btn-primary mt-6">
          กลับไปเลือกด่านใหม่
        </button>
      </div>
    </div>
  )
}
