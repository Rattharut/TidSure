// src/pages/Status.jsx
// -----------------------------------------------------------------------------
// หน้า Status — กราฟเรดาร์ค่าพลัง 6 แกน (ผู้เล่นกำหนดวิชาเองได้)
//
// สเปกสำคัญของหน้านี้:
//   1) กราฟมี 6 แกน "พอดี" (ไม่มากไม่น้อยกว่านี้)
//   2) ผู้เล่นเลือกเองได้ว่าแต่ละแกนคือวิชาอะไร เพราะเป้าหมายแต่ละคนต่างกัน
//   3) *** ค่าพลังมาจาก "โหมดจำกัดเวลา" เท่านั้น ***
//      ผลจากโหมดดันเจี้ยนห้ามนำมาคิด เพราะมีสกิลช่วย ค่าจึงไม่สะท้อนความสามารถจริง
//   4) แต่ละแกนถูกระบายสีตามระดับความยากที่ใช้คิดค่านั้น
//        ง่าย -> เหลือง-ขาว | ปานกลาง -> น้ำเงิน-ฟ้า | ยาก -> แดง-ดำ
//   5) เล่นวิชาเดิมหลายระดับ -> ยึดระดับที่ยากที่สุด
//      เช่น ง่าย 10/15 กับ ยาก 7/15 -> กราฟแสดง 7/15 พร้อมสีของระดับยาก
//
// ข้อมูลทั้งหมดมาจาก lib/playerStats.js ซึ่งจัดการให้แล้วว่าจะดึงจาก
// backend (ถ้าล็อกอิน) หรือ localStorage (ผู้เยี่ยมชม)
// -----------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import Reveal from '../components/Reveal.jsx'
import { EXAMS, getSubjectByCode, LOCKED_SUBJECTS } from '../data/examStructure.js'
import { countQuestions } from '../data/questions/index.js'
import {
  loadStatus, saveAxes, DEFAULT_AXES,
  getGuestName, saveGuestName, DEFAULT_PLAYER_NAME, NAME_MAX_LENGTH,
} from '../lib/playerStats.js'
import {
  getDifficultyTheme, barStyle, dotStyle, DIFFICULTY_ORDER, DIFFICULTY_THEME, EMPTY_THEME,
} from '../data/difficultyTheme.js'
import { useAuth } from '../context/AuthContext.jsx'
import { IconChart, IconClock, IconPencil } from '../components/icons/index.jsx'

// จำนวนแกนของกราฟ — ล็อกไว้ที่ 6 ตามสเปก
const AXIS_COUNT = 6

// =============================================================================
// ตัวเลือกวิชาสำหรับตั้งค่าแกน — เฉพาะวิชาที่ "เล่นโหมดจับเวลาได้จริง"
// =============================================================================
// ทำไมต้องกรอง: ค่าพลังมาจากโหมดจับเวลาเท่านั้น
// วิชาที่ยังไม่มีข้อสอบหรือถูกล็อก (TPAT2/TPAT4) จึงไม่มีทางมีค่าพลังได้เลย
// ถ้าปล่อยให้เลือก ผู้เล่นจะเสียแกนไปเปล่า ๆ กับวิชาที่ขึ้น 0 ตลอดกาล
//
// คำนวณครั้งเดียวตอนโหลดไฟล์ เพราะคลังข้อสอบเป็นข้อมูลคงที่ ไม่เปลี่ยนระหว่างใช้งาน
const SELECTABLE_EXAMS = EXAMS.map((exam) => ({
  ...exam,
  subjects: exam.subjects.filter(
    (s) => !LOCKED_SUBJECTS[s.code] && countQuestions({ subjectCode: s.code }) > 0
  ),
})).filter((exam) => exam.subjects.length > 0)

export default function Status() {
  const { user } = useAuth()

  const [axes, setAxes] = useState(DEFAULT_AXES)
  const [stats, setStats] = useState({})
  const [totalRuns, setTotalRuns] = useState(0)
  const [storage, setStorage] = useState('local')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  // ---- โหลดข้อมูลตอนเปิดหน้า (และโหลดใหม่เมื่อสลับบัญชี) ----
  useEffect(() => {
    let alive = true // กันการ setState หลังผู้ใช้ออกจากหน้าไปแล้ว

    setLoading(true)
    loadStatus()
      .then((data) => {
        if (!alive) return
        setAxes(data.axes)
        setStats(data.stats)
        setTotalRuns(data.totalRuns)
        setStorage(data.storage)
      })
      .finally(() => alive && setLoading(false))

    return () => { alive = false }
  }, [user?.id ?? user?._id])

  // ---- แปลง "การตั้งค่าแกน" -> "ข้อมูลที่กราฟใช้วาด" ----
  const axisData = axes.map((subjectCode, i) => {
    const subject = getSubjectByCode(subjectCode)
    const stat = subjectCode ? stats[subjectCode] : null

    return {
      id: `axis-${i}`,
      // ป้ายบนกราฟใช้ "รหัสวิชา" เพราะสั้น และแยกแกนออกจากกันได้
      // (บนกราฟไม่มีที่พอใส่ชื่อเต็ม จึงต้องคงเลขไว้ ไม่งั้น A-Level จะซ้ำกันหลายแกน)
      label: subject?.code ?? `แกน ${i + 1}`,
      // ในลิสต์แสดงแค่ "ประเภทข้อสอบ" (TGAT / TPAT / A-Level) ไม่เอาเลขรหัสวิชา
      // เพราะมีชื่อวิชาเต็มอยู่ข้าง ๆ อยู่แล้ว เลขจึงรกเปล่า ๆ
      examLabel: subject?.examId ?? '—',
      fullName: subject?.name ?? 'ยังไม่ได้เลือกวิชา',
      subjectCode,
      // วิชาที่ยังไม่เคยเล่นโหมดจำกัดเวลา -> ค่าพลัง 0 และใช้ธีมสีเทา
      value: stat?.percent ?? 0,
      difficulty: stat?.difficulty ?? null,
      score: stat?.score ?? 0,
      total: stat?.total ?? 0,
      attempts: stat?.attempts ?? 0,
      theme: stat ? getDifficultyTheme(stat.difficulty) : EMPTY_THEME,
    }
  })

  // ---- ผู้เล่นเปลี่ยนวิชาของแกนที่ i ----
  async function handleChangeAxis(index, subjectCode) {
    const next = axes.map((code, i) => (i === index ? (subjectCode || null) : code))
    setAxes(next)          // อัปเดตหน้าจอทันที ไม่ต้องรอเซิร์ฟเวอร์
    await saveAxes(next)   // แล้วค่อยบันทึกเบื้องหลัง
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-semibold text-ink">
          <IconChart className="h-8 w-8 text-arcane2" />
          สถานะผู้เล่น
        </h1>
        <p className="mt-2 text-muted">ค่าพลังของคุณในวิชาที่คุณเลือกโฟกัส</p>
      </div>

      {/* ================= การ์ดโปรไฟล์ ================= */}
      <Reveal>
        <div className="card mt-10 flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-arcane/40 bg-arcane/10 ring-glow">
            <img src="/images/icon-main-status.png" alt="ตราผู้เล่น" className="h-full w-full object-cover" />
          </div>

          <div className="w-full flex-1">
            <PlayerName />
            <p className="mt-1 text-sm text-muted">
              ทำข้อสอบโหมดจำกัดเวลาไปแล้ว <span className="text-ink">{totalRuns}</span> ครั้ง
            </p>

            {/* บอกตรง ๆ ว่าข้อมูลเก็บที่ไหน ผู้เล่นจะได้ไม่งงว่าทำไมย้ายเครื่องแล้วหาย */}
            {storage === 'local' && (
              <p className="mt-2 text-xs text-gold">
                {user
                  ? 'ขณะนี้เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กำลังแสดงข้อมูลที่เก็บไว้ในเครื่องนี้'
                  : 'ยังไม่ได้เข้าสู่ระบบ — ผลถูกเก็บไว้ในเครื่องนี้เท่านั้น เข้าสู่ระบบเพื่อเก็บถาวร'}
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {/* ================= กฎการคิดค่าพลัง ================= */}
      <Reveal>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs leading-relaxed text-muted">
          <IconClock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>
            ค่าพลังคิดจาก <span className="text-ink">โหมดจำกัดเวลา</span> เท่านั้น
            (โหมดดันเจี้ยนมีสกิลช่วย จึงไม่นำมาคิด) ถ้าเล่นวิชาเดิมหลายระดับ
            จะ<span className="text-ink">ยึดระดับที่ยากที่สุด</span>ที่เคยทำ
            เช่น ง่าย 10/15 กับ ยาก 7/15 จะแสดงผลของระดับยากคือ 7/15
            และถ้าเล่นระดับเดิมซ้ำหลายครั้ง จะยึด
            <span className="text-ink">คะแนนสูงสุดที่เคยทำได้</span>
          </span>
        </p>
      </Reveal>

      <div className="mt-6 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        {/* ================= กราฟเรดาร์ 6 แกน ================= */}
        <Reveal>
          <div className="card flex h-full flex-col items-center justify-center">
            {loading ? (
              <p className="py-24 text-sm text-muted">กำลังโหลดค่าพลัง...</p>
            ) : (
              <>
                <RadarChart axisData={axisData} />
                <DifficultyLegend />

                {/* ผู้เล่นใหม่ที่ยังไม่มีผลเลย กราฟจะยุบเป็นจุดเดียวตรงกลาง
                    ถ้าไม่บอกอะไรเลยจะดูเหมือนเว็บพัง จึงต้องมีข้อความอธิบาย */}
                {axisData.every((a) => a.value === 0) && (
                  <p className="mt-3 max-w-xs text-center text-xs leading-relaxed text-muted">
                    ยังไม่มีค่าพลัง — ลองเล่น
                    <span className="text-ink"> โหมดจำกัดเวลา </span>
                    สักวิชา แล้วกลับมาดูกราฟอีกครั้ง
                  </p>
                )}
              </>
            )}
          </div>
        </Reveal>

        {/* ================= รายการแกน + ปุ่มตั้งค่า ================= */}
        <Reveal delay={120}>
          <div className="card h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">แกนความสามารถ ({AXIS_COUNT} แกน)</h2>
              <button
                onClick={() => setEditing((v) => !v)}
                className="rounded-lg border border-border px-3 py-1.5 font-heading text-xs text-ink transition-colors hover:border-arcane hover:text-arcane2"
              >
                {editing ? 'เสร็จสิ้น' : 'ตั้งค่าแกน'}
              </button>
            </div>

            {/* บอกเหตุผลที่ลิสต์ไม่ครบทุกวิชา ผู้เล่นจะได้ไม่หาแล้วไม่เจอ */}
            {editing && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                แสดงเฉพาะวิชาที่เล่นโหมดจำกัดเวลาได้ เพราะค่าพลังคิดจากโหมดนั้นอย่างเดียว
                (วิชาที่ยังไม่มีข้อสอบ และ TPAT2 / TPAT4 ที่ยังไม่เปิด จึงไม่อยู่ในลิสต์)
              </p>
            )}

            <ul id="axis-list" className="mt-4 space-y-3">
              {axisData.map((a, i) => (
                <li key={a.id}>
                  {editing ? (
                    /* ---- โหมดตั้งค่า: เลือกวิชาของแกนนี้ ---- */
                    <div>
                      <label htmlFor={`axis-${i}`} className="mb-1 block text-xs text-muted">
                        แกนที่ {i + 1}
                      </label>
                      <select
                        id={`axis-${i}`}
                        value={a.subjectCode ?? ''}
                        onChange={(e) => handleChangeAxis(i, e.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-arcane focus:outline-none focus:ring-2 focus:ring-arcane/40"
                      >
                        <option value="">— ยังไม่เลือก —</option>
                        {/* จัดกลุ่มตามประเภทข้อสอบ ให้หาง่าย
                            ข้อความในตัวเลือก = ประเภทข้อสอบ + ชื่อวิชา เช่น "A-Level 64 ฟิสิกส์" */}
                        {SELECTABLE_EXAMS.map((exam) => (
                          <optgroup key={exam.id} label={exam.name}>
                            {exam.subjects.map((subj) => (
                              <option key={subj.code} value={subj.code}>
                                {subj.code} {subj.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  ) : (
                    /* ---- โหมดแสดงผล: ชื่อวิชา + ค่าพลัง + แถบสีตามระดับ ---- */
                    <div>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0">
                          {/* ประเภทข้อสอบ = สีขาว (ไม่ใช้สีม่วง) และไม่แสดงเลขรหัสวิชา */}
                          <span className="font-heading text-ink">{a.examLabel}</span>
                          <span className="ml-2 text-muted">{a.fullName}</span>
                        </span>
                        <span className="shrink-0 font-heading tabular-nums text-ink">{a.value}</span>
                      </div>

                      {/* หลอดคะแนน: พื้นสี + ขอบเรืองแสง เหมือนก้านแกนบนกราฟ
                          ไม่ใส่ overflow-hidden ที่กรอบนอก ไม่งั้นแสงเรืองจะโดนตัดหาย
                          motion-reduce: ปิดอนิเมชันให้ผู้ที่ตั้งค่าลดการเคลื่อนไหวในระบบ */}
                      <div className="mt-1.5 h-2.5 w-full rounded-full bg-bg">
                        <div
                          className="h-full rounded-full transition-all duration-500 motion-reduce:transition-none"
                          style={{ width: `${a.value}%`, ...barStyle(a.theme) }}
                        />
                      </div>

                      {a.difficulty ? (
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
                          <span className={a.theme.textClass}>ระดับ{a.difficulty}</span>
                          <span>{a.score}/{a.total} ข้อ</span>
                          {a.attempts > 1 && <span>· เล่นไป {a.attempts} ครั้ง</span>}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-muted">
                          ยังไม่มีผลจากโหมดจำกัดเวลาในวิชานี้
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PlayerName — ชื่อผู้เล่นที่แก้ไขได้
// ---------------------------------------------------------------------------
// ชื่อเก็บคนละที่ตามสถานะผู้เล่น:
//   ล็อกอินแล้ว -> user.displayName ใน MongoDB (แก้ผ่าน updateDisplayName)
//   ผู้เยี่ยมชม  -> localStorage (แก้ผ่าน saveGuestName)
// คอมโพเนนต์นี้ซ่อนความต่างไว้ ผู้ใช้เห็นเป็นการแก้ชื่อเหมือนกันทั้งสองแบบ
function PlayerName() {
  const { user, updateDisplayName } = useAuth()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // ชื่อที่แสดงอยู่ตอนนี้ (ผู้เยี่ยมชมอ่านจากเครื่อง)
  const [guestName, setGuestName] = useState(() => getGuestName())
  const currentName = user ? (user.displayName || DEFAULT_PLAYER_NAME) : guestName

  // โฟกัสช่องกรอกทันทีที่เข้าโหมดแก้ไข ผู้ใช้จะได้พิมพ์ได้เลยไม่ต้องคลิกซ้ำ
  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEdit() {
    setDraft(currentName)
    setError('')
    setEditing(true)
  }

  async function save() {
    const name = draft.trim()
    if (!name) return setError('ชื่อผู้เล่นห้ามเว้นว่าง')
    if (name === currentName) return setEditing(false) // ไม่เปลี่ยน = ไม่ต้องยิง API

    setSaving(true)
    setError('')
    try {
      if (user) {
        await updateDisplayName(name)
      } else {
        const res = saveGuestName(name)
        if (!res.saved) throw new Error(res.message)
        setGuestName(res.name)
      }
      setEditing(false)
    } catch (err) {
      setError(err.message || 'บันทึกชื่อไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-heading text-xl text-ink">{currentName}</p>
        <button
          onClick={startEdit}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-arcane hover:text-arcane2"
        >
          <IconPencil className="h-3.5 w-3.5" />
          ตั้งชื่อ
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="player-name" className="sr-only">ชื่อผู้เล่น</label>
        <input
          id="player-name"
          ref={inputRef}
          value={draft}
          maxLength={NAME_MAX_LENGTH}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          // Enter = บันทึก, Esc = ยกเลิก (คนพิมพ์เร็วจะได้ไม่ต้องละมือไปคลิก)
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-48 rounded-lg border border-border bg-bg px-3 py-1.5 font-heading text-lg text-ink focus:border-arcane focus:outline-none focus:ring-2 focus:ring-arcane/40 disabled:opacity-50"
        />
        <button onClick={save} disabled={saving} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50">
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          ยกเลิก
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}

      {/* บอกล่วงหน้าว่าชื่อจะหายถ้าเปลี่ยนเครื่อง จะได้ไม่เข้าใจผิดทีหลัง */}
      {!user && (
        <p className="mt-1.5 text-xs text-muted">
          ชื่อนี้เก็บไว้ในเครื่องนี้เท่านั้น เข้าสู่ระบบเพื่อให้ชื่อติดตัวไปทุกเครื่อง
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// คำอธิบายสี (legend) — บอกว่าสีไหนคือระดับไหน
// ---------------------------------------------------------------------------
function DifficultyLegend() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted">
      {/* เรียงจากง่ายไปยาก — ใช้จุดสีกลม พร้อมขอบและแสงเรืองแบบเดียวกับเส้นในกราฟ */}
      {DIFFICULTY_ORDER.map((d) => {
        const t = DIFFICULTY_THEME[d]
        return (
          <span key={d} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={dotStyle(t)} />
            {t.label}
          </span>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// RadarChart — กราฟเรดาร์ SVG ล้วน (ไม่ใช้ไลบรารีภายนอก)
//
// หลักการวาด: กระจาย 6 แกนเป็นวงกลม (มุมห่างเท่ากัน) แล้วลากจุดตามค่า 0–100
//
// จุดที่ต่างจากกราฟเรดาร์ทั่วไป:
//   แต่ละแกนมี "ระดับความยาก" ของตัวเอง จึงมีสีต่างกันได้ในกราฟเดียว
//   เราจึงระบายสีที่ ก้านแกน + จุดยอด ตามระดับของแกนนั้น
//   ส่วนพื้นที่รูปหลายเหลี่ยมใช้สีกลาง เพราะมันคาบเกี่ยวหลายแกน
//   ถ้าไประบายตามแกนใดแกนหนึ่งจะสื่อความหมายผิด
// ---------------------------------------------------------------------------
// ความหนาของเส้นทุกเส้นในกราฟ (ก้านแกน + ขอบหกเหลี่ยม)
// ประกาศไว้ที่เดียวเพื่อให้ทุกเส้นเท่ากันเสมอ ไม่ต้องไล่แก้ทีละจุด
const STROKE = 2

function RadarChart({ axisData }) {
  const size = 300
  const center = size / 2
  const radius = size / 2 - 52
  const n = axisData.length

  // แปลง (ลำดับแกน, สัดส่วน 0–1) -> พิกัด x,y  (เริ่มที่ด้านบนแล้ววนตามเข็ม)
  const point = (i, ratio) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return [center + radius * ratio * Math.cos(angle), center + radius * ratio * Math.sin(angle)]
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]
  const dataPoints = axisData.map((a, i) => point(i, a.value / 100))
  const dataPolygon = dataPoints.map((p) => p.join(',')).join(' ')

  // สรุปเป็นข้อความให้โปรแกรมอ่านหน้าจอ (คนตาบอดต้องเข้าถึงข้อมูลเดียวกันได้)
  const summary = axisData
    .map((a) => `${a.label} ${a.value} คะแนน${a.difficulty ? ` ระดับ${a.difficulty}` : ' ยังไม่มีข้อมูล'}`)
    .join(', ')

  return (
    // aria-describedby ชี้ไปที่ลิสต์ฝั่งขวา ซึ่งเป็นข้อมูลชุดเดียวกันในรูปแบบข้อความ
    // (กราฟเรดาร์อ่านค่าเป๊ะ ๆ ยาก จึงต้องมีทางเลือกที่เป็นตัวเลขคู่กันเสมอ)
    <svg
      viewBox={`0 0 ${size} ${size}`} className="h-72 w-72"
      role="img"
      aria-label={`กราฟเรดาร์ค่าพลัง 6 แกน: ${summary}`}
      aria-describedby="axis-list"
    >
      <defs>
        {/* ---- แสงเรืองของขอบ แยกฟิลเตอร์ตามแกน เพราะสีขอบแต่ละระดับไม่เหมือนกัน ---- */}
        {axisData.map((a, i) => (
          <filter key={`gl-${a.id}`} id={`glow-${i}`} x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.6" floodColor={a.theme.edge} floodOpacity="0.85" />
          </filter>
        ))}

        {/* ---- ไล่เฉดของเส้นรอบรูป: สีวิชานี้ -> สีวิชาถัดไป ---- */}
        {/* ใช้ solid (สีประจำวิชา) ไม่ใช่ edge (สีเรืองแสง)
            เพราะ edge ของระดับง่ายกับปานกลางเป็นสีขาวทั้งคู่ ถ้าใช้ edge
            เส้นช่วงนั้นจะกลายเป็นขาวล้วน มองไม่ออกว่าคาบเกี่ยววิชาไหนบ้าง

            วาง stop 4 จุดแทน 2 จุด: ค้างสีเดิมไว้ถึง 18% แล้วค่อยเปลี่ยน
            จบที่ 82% เป็นสีวิชาถัดไป
            ผลคือ "สีเกาะอยู่ที่มุมของแต่ละวิชาชัดเจน แล้วไปผสมกันตรงกลางเส้น"
            ถ้าไล่ตั้งแต่ 0-100% สีจะเริ่มเพี้ยนทันทีที่ออกจากมุม
            ทำให้อ่านไม่ออกว่ามุมนั้นคือระดับอะไร */}
        {axisData.map((a, i) => {
          const next = (i + 1) % n
          const [x1, y1] = dataPoints[i]
          const [x2, y2] = dataPoints[next]
          const from = a.theme.solid
          const to = axisData[next].theme.solid
          return (
            <linearGradient
              key={`eg-${a.id}`} id={`edgeGrad-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={x1} y1={y1} x2={x2} y2={y2}
            >
              <stop offset="0%" stopColor={from} />
              <stop offset="18%" stopColor={from} />
              <stop offset="82%" stopColor={to} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          )
        })}

        {/* พื้นที่ภายใน — สีขาวจาง ๆ ไม่ผูกกับระดับความยากใด
            (พื้นที่นี้คาบเกี่ยวทั้ง 6 แกน ถ้าระบายตามแกนใดแกนหนึ่งจะสื่อความหมายผิด) */}
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
        </radialGradient>
      </defs>

      {/* วงกริดพื้นหลัง */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={axisData.map((_, i) => point(i, level).join(',')).join(' ')}
          fill="none" stroke="#2a2a45" strokeWidth="1"
        />
      ))}

      {/* ป้ายชื่อวิชาประจำแกน
          หมายเหตุ: ไม่มีเส้นลากจากจุดศูนย์กลางออกมาแล้ว ทั้งเส้นไกด์จาง ๆ
          และก้านแกนสี ถูกถอดออกตามที่ผู้ใช้ต้องการ เหลือแค่กริดหกเหลี่ยม
          กับเส้นรอบรูปที่ไล่เฉดสีระหว่างวิชา */}
      {axisData.map((a, i) => {
        const [lx, ly] = point(i, 1.22)
        return (
          // ใช้ theme.text ไม่ใช่ theme.solid — ตัวหนังสือต้องผ่าน contrast 4.5:1
          // ซึ่งสีแดงเข้มของระดับยากไม่ผ่าน (ดูคำอธิบายใน difficultyTheme.js)
          <text
            key={`label-${a.id}`}
            x={lx} y={ly}
            fill={a.difficulty ? a.theme.text : '#98a1c0'}
            fontSize="9" textAnchor="middle" dominantBaseline="middle"
          >
            {a.label}
          </text>
        )
      })}

      {/* พื้นที่ค่าพลัง — ไม่มีเส้นขอบตรงนี้ เดี๋ยววาดแยกทีละด้านเพื่อให้ไล่เฉดได้ */}
      <polygon points={dataPolygon} fill="url(#radarFill)" />

      {/* เส้นรอบรูป 6 ด้าน วาดทีละเส้น แต่ละเส้นไล่เฉดจากสีวิชาหนึ่งไปอีกวิชาหนึ่ง
          ตอนนี้เส้นรอบรูปเป็นตัวเดียวที่แบกสีของทุกระดับไว้ (เพราะไม่มีก้านแกนแล้ว)
          จึงย้ายฟิลเตอร์แสงเรืองมาไว้ที่นี่ เพื่อรักษาลุคนีออนของธีมเกม */}
      {axisData.map((a, i) => {
        const next = (i + 1) % n
        const [x1, y1] = dataPoints[i]
        const [x2, y2] = dataPoints[next]
        return (
          <line
            key={`edge-${a.id}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={`url(#edgeGrad-${i})`} strokeWidth={STROKE} strokeLinecap="round"
            filter={`url(#glow-${i})`}
          />
        )
      })}
    </svg>
  )
}
