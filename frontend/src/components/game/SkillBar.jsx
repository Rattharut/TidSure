// src/components/game/SkillBar.jsx
// -----------------------------------------------------------------------------
// แถบสกิล — ใช้ได้เฉพาะ "โหมดดันเจี้ยน" เท่านั้น
// (โหมดจำกัดเวลาห้ามมีสกิลเด็ดขาด จึงไม่เรียกคอมโพเนนต์นี้ในโหมดนั้น)
//
// สถานะที่เป็นไปได้ของแต่ละสกิล:
//   • ยังไม่ปลดล็อก  -> ปุ่มจาง กดไม่ได้ พร้อมบอกว่าปลดล็อกยังไง
//   • ปลดล็อกแล้ว     -> กดใช้ได้ (เหลือ 1 ครั้ง/ด่าน)
//   • ใช้ไปแล้ว       -> ปุ่มจาง กดไม่ได้
//   • passive (หมูเด้ง) -> ไม่มีปุ่มกด ทำงานอัตโนมัติ
//
// พับเก็บได้:
//   การ์ดสกิล 3 ใบกินพื้นที่มากจนดันโจทย์ตกจอ จึงพับเก็บได้
//   ตอนพับจะเหลือแถวเดียวที่ยังเห็นไอคอนและสถานะครบ ผู้เล่นจึงไม่หลุดบริบท
//   จำค่าที่ผู้เล่นเลือกไว้ใน localStorage ด้วย จะได้ไม่ต้องพับใหม่ทุกด่าน
//
// props:
//   skills   = run.skills จาก dungeonEngine
//   onUse(id)= เรียกเมื่อกดใช้สกิล
//   disabled = ปิดการใช้ชั่วคราว (เช่น ตอบข้อนี้ไปแล้ว)
// -----------------------------------------------------------------------------
import { useState } from 'react'
import {
  SKILLS, SKILL_DAMAGE_BOOST, SKILL_MOODENG, SKILL_FIFTY_FIFTY,
} from '../../data/gameConfig.js'
import { IconBolt, IconPig, IconScissors, IconChevronDown } from '../icons/index.jsx'

// จับคู่สกิล -> ไอคอน
const SKILL_ICONS = {
  [SKILL_DAMAGE_BOOST]: IconBolt,
  [SKILL_MOODENG]: IconPig,
  [SKILL_FIFTY_FIFTY]: IconScissors,
}

const ORDER = [SKILL_DAMAGE_BOOST, SKILL_MOODENG, SKILL_FIFTY_FIFTY]

// คีย์จำสถานะพับ/กางใน localStorage
const OPEN_KEY = 'tidsure_skillbar_open'

// อ่านค่าที่จำไว้ — ค่าเริ่มต้นคือ "พับ" ให้ผู้เล่นกดกางออกเอง (โจทย์ไม่โดนดันตกจอ)
// หัวแถบที่พับอยู่ยังโชว์ไอคอนสกิล + จำนวนที่พร้อมใช้ ผู้เล่นจึงยังรู้ว่ามีสกิลให้กาง
// ถ้าผู้เล่นเคยกดกางไว้ ('true') ก็จำค่านั้น ไม่บังคับพับซ้ำทุกด่าน
function readOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === 'true'
  } catch {
    return false
  }
}

export default function SkillBar({ skills, onUse, disabled = false }) {
  const [open, setOpen] = useState(readOpen)

  function toggle() {
    const next = !open
    setOpen(next)
    try {
      localStorage.setItem(OPEN_KEY, String(next))
    } catch {
      // เบราว์เซอร์ไม่ให้เก็บก็ไม่เป็นไร แค่ไม่จำข้ามด่าน
    }
  }

  // นับสกิลที่พร้อมใช้ ไว้โชว์ตอนพับ ผู้เล่นจะได้รู้ว่ายังมีของให้ใช้อยู่
  const readyCount = ORDER.filter(
    (id) => skills[id].unlocked && skills[id].usesLeft > 0
  ).length

  return (
    <div className="card">
      {/* ---- หัวแถบ: กดทั้งแถวเพื่อพับ/กาง (พื้นที่กดใหญ่ กดง่ายบนมือถือ) ---- */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="skill-list"
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2">
          <h3 className="font-heading text-sm text-ink">สกิล</h3>
          {/* ตอนพับ: บอกจำนวนที่ใช้ได้ / ตอนกาง: บอกกติกา */}
          <span className="text-xs text-muted">
            {open
              ? 'ใช้ได้ 1 ครั้งต่อด่าน'
              : readyCount > 0
                ? `พร้อมใช้ ${readyCount} สกิล`
                : 'ไม่มีสกิลที่ใช้ได้'}
          </span>
        </span>

        <span className="flex items-center gap-2">
          {/* ตอนพับ: โชว์ไอคอนสกิลย่อ ๆ ให้ยังเห็นสถานะโดยไม่ต้องกาง */}
          {!open && (
            <span className="flex items-center gap-1.5">
              {ORDER.map((id) => {
                const Icon = SKILL_ICONS[id]
                const s = skills[id]
                const ready = s.unlocked && s.usesLeft > 0
                return (
                  <Icon
                    key={id}
                    className={`h-4 w-4 ${ready ? 'text-arcane2' : 'text-muted opacity-40'}`}
                  />
                )
              })}
            </span>
          )}
          <span className="text-xs text-muted">{open ? 'พับเก็บ' : 'กางออก'}</span>
          <IconChevronDown
            className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          />
        </span>
      </button>

      {/* ---- รายการสกิล (ซ่อนตอนพับ) ---- */}
      {open && (
        <div id="skill-list" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ORDER.map((id) => {
            const def = SKILLS[id]
            const state = skills[id]
            const Icon = SKILL_ICONS[id]
            const isPassive = def.type === 'passive'
            const used = state.usesLeft <= 0
            const canUse = state.unlocked && !used && !disabled && !isPassive

            return (
              <div
                key={id}
                className={`rounded-xl border p-3 transition-all ${
                  !state.unlocked || used
                    ? 'border-border opacity-50'
                    : 'border-arcane/40 bg-arcane/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${state.unlocked && !used ? 'text-arcane2' : 'text-muted'}`} />
                  <span className="font-heading text-sm text-ink">{def.name}</span>
                  {isPassive && <span className="chip ml-auto text-[10px] text-aqua">อัตโนมัติ</span>}
                </div>

                <p className="mt-1 text-xs leading-relaxed text-muted">{def.desc}</p>

                {/* ---- ส่วนล่างของการ์ด: ปุ่ม / สถานะ ---- */}
                {!state.unlocked ? (
                  <p className="mt-2 text-[11px] text-gold">
                    ปลดล็อกโดยฆ่าบอสระดับ {def.unlockedBy}
                  </p>
                ) : isPassive ? (
                  // สกิล passive ไม่มีปุ่ม และคำอธิบายด้านบนบอกครบแล้ว
                  // จึงแสดงข้อความเพิ่มเฉพาะตอนใช้ไปแล้วเท่านั้น ไม่พูดซ้ำ
                  used && (
                    <p className="mt-2 text-[11px] text-muted">
                      หมูเด้งสละชีพไปแล้วในด่านนี้
                    </p>
                  )
                ) : (
                  <button
                    type="button"
                    disabled={!canUse}
                    onClick={() => onUse(id)}
                    className="mt-2 w-full rounded-lg border border-arcane/50 px-3 py-2 font-heading text-xs text-arcane2 transition-colors hover:bg-arcane/15 disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
                  >
                    {used ? 'ใช้ไปแล้ว' : state.armed ? 'พร้อมฟัน (ติดอาวุธแล้ว)' : 'ใช้สกิล'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
