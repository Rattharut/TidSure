// src/components/game/MonsterSprite.jsx
// -----------------------------------------------------------------------------
// MonsterSprite — แสดง Monster แบบ pixel art พร้อม idle animation
//
// ตัวนี้เป็น "คอมโพเนนต์กลาง" ของมอนสเตอร์ทุกตัว ไม่ได้ผูกกับสไลม์
// อยากเพิ่มมอนตัวใหม่ -> ไปเพิ่มสเปกใน data/sprites.js แล้วส่งชื่อเข้ามาทาง prop
// ไม่ต้องแก้ไฟล์นี้เลย
//
// -----------------------------------------------------------------------------
// เทคนิคที่ใช้: sprite sheet + steps()
// -----------------------------------------------------------------------------
// ไฟล์สไลม์เป็นภาพเดียวยาว 1140px ที่มี 5 เฟรมเรียงกันแนวนอน (เฟรมละ 228px)
//
//   [เฟรม1][เฟรม2][เฟรม3][เฟรม4][เฟรม5]
//    0px    228    456    684    912     (1140)
//
// เราทำกล่องกว้าง 228px แล้วเลื่อน background-position ไปทางซ้ายทีละ 228px
// ก็จะเห็นทีละเฟรม เหมือนเปิดหน้าต่างส่องดูภาพยาว ๆ
//
// *** ทำไมต้อง steps(5) ไม่ใช่ ease หรือ linear ***
//   animation ปกติจะไล่ค่าแบบต่อเนื่อง เช่นเลื่อนไป -114px (ครึ่งเฟรม)
//   ผลคือเห็นเฟรม 1 กับ 2 ครึ่ง ๆ ติดกัน ภาพจะดูเบลอและขาด
//   steps(5) บังคับให้กระโดดเป็นขั้น ๆ 5 ขั้น ไม่มีค่าระหว่างกลาง
//   จึงเห็นเฟรมเต็ม ๆ ทีละเฟรมแบบอนิเมชันจริง
//
// *** ทำไมเลื่อนถึง -5 เฟรม ไม่ใช่ -4 ***
//   steps(5) แบ่งช่วง 0% -> 100% เป็น 5 ขั้น
//   ถ้าปลายทางเป็น -4 เฟรม แต่ละขั้นจะเลื่อน 4/5 เฟรม = ไม่ลงตัว ภาพเพี้ยน
//   ต้องให้ปลายทางเป็น -5 เฟรม แต่ละขั้นจึงเลื่อนพอดี 1 เฟรม
//   (ขั้นที่ 5 จะวนกลับไปเฟรม 1 พอดี เพราะ background-repeat)
// -----------------------------------------------------------------------------
import { SPRITES } from '../../data/sprites.js'

// prop `name` = ชื่อสไปรต์ใน data/sprites.js — ใช้ได้ทั้งฝ่ายมอนและฝ่ายผู้เล่น
// (คอมโพเนนต์นี้แค่วาดสไปรต์ ไม่สนว่าเป็นตัวอะไร ชื่อ MonsterSprite เป็นชื่อเดิม
//  ตั้งแต่ตอนมีแต่มอน ตอนนี้ฮีโร่ก็ใช้ตัวเดียวกัน)
export default function MonsterSprite({
  name = 'slime',          // ชื่อสไปรต์ใน data/sprites.js
  state = 'idle',          // 'idle' | 'hit' | 'die'
  scale = 1,               // ย่อ/ขยาย (1 = ขนาดจริงของสไปรต์)
  flip = false,            // true = กลับด้านซ้ายขวา
  className = '',
}) {
  const spec = SPRITES[name]

  // ถ้าเรียกชื่อสไปรต์ที่ไม่มีในทะเบียน อย่าให้จอขาว — ไม่วาดอะไรเลย
  // (พังเงียบ ๆ ดีกว่าทำทั้งหน้าล่ม)
  if (!spec) {
    if (import.meta.env.DEV) console.warn(`MonsterSprite: ไม่รู้จักสไปรต์ชื่อ "${name}"`)
    return null
  }

  const anim = spec.idle
  const w = anim.frameWidth
  const h = anim.frameHeight

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: w * scale,
        height: h * scale,
      }}
      // สไปรต์เป็นภาพประกอบ ไม่ใช่ข้อมูล — ชื่อมอนมีเป็นตัวหนังสืออยู่ข้าง ๆ แล้ว
      // ถ้าใส่ label ซ้ำ โปรแกรมอ่านหน้าจอจะอ่านสองรอบ
      aria-hidden="true"
    >
      {/* ---- เงาใต้ตัว ---- */}
      {/* วางไว้ก่อนสไปรต์ในลำดับ DOM = อยู่ข้างล่าง ไม่ต้องใช้ z-index
          เงาช่วยมากในการทำให้ตัวละครดู "มีน้ำหนัก" และนั่งอยู่บนพื้นจริง
          ถ้าไม่มีเงา ตัวจะดูเหมือนลอยอยู่กลางอากาศ

          ยกเว้นมอนบางตัว (เช่น หนอน) ที่วาดฐานติดมากับสไปรต์อยู่แล้ว (กองทราย)
          พวกนี้ตั้ง shadow: null ใน sprites.js -> ข้ามการวาดเงา ไม่งั้นจะเห็นเงาซ้อนกองทราย */}
      {spec.shadow && (
        <div
          className="sprite-shadow absolute left-1/2 bottom-0 -translate-x-1/2 rounded-[50%]"
          style={{
            width: spec.shadow.width * scale,
            height: spec.shadow.height * scale,
            animationDuration: `${anim.duration}s`,
            // ความแรงที่เงาขยายตอนตัวยุบ — ต่างกันตามชนิดมอน (ดู sprites.js)
            '--shadow-punch': spec.shadowPunch ?? 1.08,
          }}
        />
      )}

      {/* ---- ตัวสไปรต์ ---- */}
      <div
        className={`sprite-frame absolute inset-0 ${state === 'hit' ? 'sprite-hit' : ''}`}
        style={{
          backgroundImage: `url(${anim.src})`,
          // ยืดภาพทั้งแผ่นตาม scale ที่ขอ (กว้าง = เฟรมเดียว x จำนวนเฟรม)
          backgroundSize: `${w * anim.frames * scale}px ${h * scale}px`,
          // ตัวแปรนี้ส่งให้ keyframes ใน index.css ใช้คำนวณระยะเลื่อน
          '--sprite-travel': `${-w * anim.frames * scale}px`,
          '--sprite-steps': anim.frames,
          animationDuration: `${anim.duration}s`,
          animationTimingFunction: `steps(${anim.frames})`,
          // ขยายภาพ pixel art ต้องใช้ pixelated ไม่งั้นเบราว์เซอร์จะเกลี่ยขอบให้เบลอ
          imageRendering: 'pixelated',
          // scale ต้องอิงจากก้น ไม่ใช่กลางตัว ไม่งั้นตอนย่อ/ขยายตัวจะลอยขึ้นจากพื้น
          transformOrigin: 'bottom center',
          transform: flip ? 'scaleX(-1)' : undefined,
        }}
      />
    </div>
  )
}
