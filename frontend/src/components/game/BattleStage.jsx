// src/components/game/BattleStage.jsx
// -----------------------------------------------------------------------------
// ฉากต่อสู้ — กรอบภาพที่มี: พื้นหลัง + ตัวละครเอก (ซ้าย) + ศัตรู (ขวา)
// รอบนี้ทุกอย่างเป็น PLACEHOLDER รอใส่ pixel art จริงทีหลัง
//
// สเปก: "ภาพพื้นหลังเปลี่ยนตามระดับความยาก" -> ใช้ตาราง BACKGROUND_BY_DIFFICULTY
//        เมื่อมีภาพจริงแล้วให้เปลี่ยน div พื้นหลังเป็น <img>/CSS background ได้เลย
//
// props:
//   difficulty  = 'ง่าย' | 'ปานกลาง' | 'ยาก'  -> เลือกพื้นหลัง
//   enemyLabel  = ชื่อศัตรูที่จะโชว์ในกล่อง placeholder
//   EnemyIcon   = ไอคอนศัตรู
//   enemyTone   = โทนสีกรอบศัตรู ('rose' สำหรับบอส / 'muted' สำหรับตัวปกติ)
//   heroSlot    = เนื้อหาใต้ตัวเอก (เช่น แถบหัวใจผู้เล่น)
//   enemySlot   = เนื้อหาใต้ศัตรู (เช่น แถบหัวใจศัตรู)
//   effect      = ข้อความเอฟเฟกต์กลางจอ (เช่น "ฟันโดน!" / "โดนตี!")
//   enemySprite = ชื่อสไปรต์ของศัตรู (เช่น 'slime')
//                 ถ้าไม่ส่งมา หรือส่ง null -> ใช้กล่อง placeholder เหมือนเดิม
//                 ทำแบบนี้เพื่อให้ค่อย ๆ ใส่ pixel art ทีละตัวได้
//                 ตัวที่ยังไม่มีภาพก็ยังเล่นได้ปกติ ไม่ต้องรอครบทุกตัว
// -----------------------------------------------------------------------------
import { useState, useEffect } from 'react'
import SpritePlaceholder from './SpritePlaceholder.jsx'
import MonsterSprite from './MonsterSprite.jsx'
import { getStageScale } from '../../data/sprites.js'

// พื้นหลังของแต่ละระดับความยาก (ตอนนี้เป็นแค่ไล่สี + ข้อความบอกตำแหน่ง)
// TODO: เปลี่ยนเป็นภาพ pixel art จริง เช่น /assets/bg-easy.png
const BACKGROUND_BY_DIFFICULTY = {
  'ง่าย': {
    name: 'ทุ่งหญ้าเริ่มต้น',
    className: 'from-emerald-900/30 via-surface to-bg',
  },
  'ปานกลาง': {
    name: 'ถ้ำมืด',
    className: 'from-blue-900/40 via-surface to-bg',
  },
  'ยาก': {
    // แสงสีทราย/ทะเลทราย เข้ากับมอนด่านยาก (แมงป่อง หนอนทราย)
    name: 'ทะเลทราย',
    className: 'from-amber-800/40 via-surface to-bg',
  },
}

// ความสูงคงที่ของกล่องตัวละครทั้งสองฝั่ง (px)
// ต้องมากกว่าหรือเท่ากับ stageHeight ของมอนที่สูงสุด (ตอนนี้ออร์ค 138)
// ประกาศที่เดียวเพื่อให้ทุกกล่องเท่ากันเสมอ ตัวละครจะได้ยืนระดับเดียวกัน
// และแถบ HP ใต้ตัวอยู่แนวเดียวกัน
const CHAR_BOX_H = 144

export default function BattleStage({
  difficulty,
  enemyLabel,
  EnemyIcon,
  enemyTone = 'muted',
  heroSlot,
  enemySlot,
  effect,
  // effectKey = ค่าที่เปลี่ยนทุกครั้งที่มีเอฟเฟกต์ใหม่ (เช่น จำนวนครั้งที่ตอบ)
  // ใช้เป็น React key ให้ข้อความ remount ทุกครั้ง -> animation เด้ง+จางเล่นใหม่เสมอ
  // แม้ข้อความจะซ้ำของเดิม (เช่น "โดนตี -2" สองข้อติด) ก็ยังเด้งใหม่ให้เห็น
  effectKey,
  enemySprite = null,
  // ชื่อสไปรต์ "เพื่อนคู่ใจ" ที่ยืนข้างผู้เล่น (เช่น 'moodeng')
  // null = ไม่มีเพื่อน (ยังไม่ปลดล็อก หรือเป็นโหมดที่ไม่มีสกิล)
  companion = null,
  // ตัวคูณขนาดฮีโร่ (1 = ขนาดปกติ) — ใช้ย่อฮีโร่เฉพาะบางโหมด
  // เช่นโหมดจำกัดเวลาที่สู้กับมังกรตัวยักษ์ ย่อฮีโร่ลงให้ดูเหมือน "คนตัวเล็กสู้มังกร"
  // โหมดดันเจี้ยนไม่ส่งค่านี้ -> ฮีโร่ขนาดเท่าเดิม (สมส่วนกับมอนปกติ)
  heroScale = 1,
}) {
  const bg = BACKGROUND_BY_DIFFICULTY[difficulty] || BACKGROUND_BY_DIFFICULTY['ปานกลาง']

  // ---- คุมการโชว์ข้อความเอฟเฟกต์ให้หายเองด้วย timer (ไม่พึ่ง CSS animation อย่างเดียว) ----
  // ทำไมต้องใช้ JS timer: ผู้ใช้ที่เปิด "ลดการเคลื่อนไหว" จะโดน base rule บังคับให้
  // animation จบทันที ถ้าพึ่ง CSS อย่างเดียว ข้อความจะกระโดดไป opacity 0 เลย = ไม่ทันเห็น
  // timer ทำงานเหมือนกันทุกกรณี จึงเป็นตัวคุมจริง ส่วน CSS เป็นแค่ลูกเล่นตอนเด้ง/จาง
  const [showEffect, setShowEffect] = useState(false)
  useEffect(() => {
    if (!effect) return
    setShowEffect(true)
    const t = setTimeout(() => setShowEffect(false), 1600) // โชว์ 1.6 วิ แล้วซ่อน
    return () => clearTimeout(t) // เอฟเฟกต์ใหม่มาก่อนครบเวลา -> ล้าง timer เก่า
    // ผูกกับ effectKey ด้วย เพื่อให้เอฟเฟกต์ซ้ำ (เช่นโดนตี -2 สองข้อติด) รีเซ็ตเวลาใหม่
  }, [effectKey, effect])

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b ${bg.className}`}>
      {/* เส้นพื้น (ให้รู้สึกว่าตัวละครยืนอยู่บนพื้น) */}
      <div className="absolute inset-x-0 bottom-16 h-px bg-border/60" />

      {/* พื้นที่ต่อสู้: ตัวเอกซ้าย vs ศัตรูขวา */}
      <div className="relative flex items-end justify-between gap-4 px-4 pb-6 pt-14 sm:px-8">
        {/* ---- ตัวละครเอก (ซ้าย) ---- */}
        {/* ใช้กล่องสูง CHAR_BOX_H เท่ากับฝั่งศัตรู เพื่อให้ทั้งสองฝ่ายยืนระดับเดียวกัน
            ถ้าสูงไม่เท่ากัน แถบ HP ใต้ตัวจะไม่อยู่แนวเดียวกัน ดูเอียง */}
        <div className="flex flex-col items-center gap-2">
          {/* relative = ให้หมูเด้งวางแบบ absolute อ้างอิงกล่องนี้ได้ */}
          <div className="relative flex items-end justify-center" style={{ height: CHAR_BOX_H }}>
            {/* ฮีโร่ท่ารบ — สไปรต์ pixel art จริง (แทนกล่อง placeholder เดิม)
                ขนาดคุมด้วย stageHeight เหมือนมอน เพื่อให้ยืนสมส่วนกัน */}
            <MonsterSprite name="hero" scale={getStageScale('hero') * heroScale} />
            {/* ให้โปรแกรมอ่านหน้าจอรู้ว่านี่คือฝ่ายผู้เล่น (สไปรต์ตั้ง aria-hidden) */}
            <span className="sr-only">ตัวละครเอก นักผจญภัย</span>

            {/* ---- หมูเด้ง (เพื่อนคู่ใจ) ----
                วางเยื้องมาข้างหน้าฮีโร่ (ฝั่งขวา = ทางที่หันไปหาศัตรู) และล่างสุด
                ตัวเล็กกว่าฮีโร่ครึ่งหนึ่ง ให้ดูเป็นตัวช่วยตัวน้อยที่ยืนอารักขาอยู่หน้า
                -right-2 ดันออกมาข้างหน้านิดหน่อย, z-10 ให้อยู่หน้าฮีโร่ */}
            {companion && (
              <div className="absolute bottom-0 -right-2 z-10">
                <MonsterSprite name={companion} scale={getStageScale(companion)} />
                <span className="sr-only">หมูเด้งพร้อมช่วย</span>
              </div>
            )}
          </div>
          {heroSlot}
        </div>

        {/* ---- เอฟเฟกต์กลางจอ (เด้งขึ้นแล้วหายเองใน 1.6 วิ) ---- */}
        {/* showEffect (จาก timer) เป็นตัวคุมว่าซ่อนเมื่อไร ทำงานทุกกรณีรวมโหมดลดการเคลื่อนไหว
            key = effectKey -> เอฟเฟกต์ใหม่สร้าง span ใหม่ ให้ลูกเล่นเด้งเล่นตั้งแต่ต้นเสมอ */}
        {effect && showEffect && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
            <span
              key={effectKey ?? effect}
              className="effect-pop rounded-lg border border-border bg-bg/90 px-4 py-2 font-game text-sm text-ink"
            >
              {effect}
            </span>
          </div>
        )}

        {/* ---- ศัตรู (ขวา) ---- */}
        <div className="flex flex-col items-center gap-2">
          {enemySprite ? (
            // กล่อง CHAR_BOX_H กำหนดความสูงคงที่ เพื่อให้ตอนสลับมอนแต่ละตัว
            // (หรือสลับไปตัวที่ยังเป็น placeholder) ความสูงของฉากไม่กระโดด
            <div className="flex items-end justify-center" style={{ height: CHAR_BOX_H }}>
              {/* ขนาดคุมด้วย stageHeight ใน sprites.js ไม่ใช่ scale ตายตัว
                  ทำให้มอนแต่ละตัวมีสัดส่วนถูกต้องเทียบกันเอง
                  (ก็อบลินยืนสองขาจึงสูงกว่าสไลม์ที่เป็นก้อนกลม) */}
              <MonsterSprite name={enemySprite} scale={getStageScale(enemySprite)} />
              {/* ชื่อศัตรูไม่แสดงบนจอแล้ว เพราะดูจากภาพก็รู้ว่าเป็นตัวอะไร
                  แต่ยังต้องมีไว้ให้โปรแกรมอ่านหน้าจอ ไม่งั้นคนที่มองไม่เห็น
                  จะไม่รู้เลยว่ากำลังสู้อยู่กับอะไร */}
              <span className="sr-only">{enemyLabel}</span>
            </div>
          ) : (
            // ตัวที่ยังไม่มีสไปรต์ ก็ต้องอยู่ในกล่องสูงเท่ากัน
            // ไม่งั้นพอสู้ตัวที่ 1 (มีสไปรต์) แล้วไปตัวที่ 3 (ยังไม่มี) ฉากจะกระโดด
            <div className="flex items-end justify-center" style={{ height: CHAR_BOX_H }}>
              <SpritePlaceholder
                label={enemyLabel}
                note="(pixel art)"
                Icon={EnemyIcon}
                tone={enemyTone}
                className="h-24 w-20"
              />
            </div>
          )}
          {enemySlot}
        </div>
      </div>
    </div>
  )
}
