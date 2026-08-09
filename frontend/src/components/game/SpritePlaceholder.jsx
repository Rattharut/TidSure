// src/components/game/SpritePlaceholder.jsx
// -----------------------------------------------------------------------------
// กล่อง PLACEHOLDER แทนตำแหน่งภาพ / pixel art (รอบนี้ยังไม่ทำภาพจริง)
//
// ใช้แทนที่: ตัวละครเอก, Monster, บอสมังกร, ภาพพื้นหลังแต่ละระดับความยาก
// เมื่อมีภาพจริงแล้ว ให้เปลี่ยนมาใส่ <img src="..."> หรือ <canvas> แทนกล่องนี้ได้เลย
//
// props:
//   label   = ข้อความบอกว่าตรงนี้จะเป็นภาพอะไร
//   note    = ข้อความเสริม (เช่น ขนาดที่แนะนำ)
//   Icon    = ไอคอน SVG ที่จะโชว์กลางกล่อง (ไม่ใส่ก็ได้)
//   tone    = โทนสีขอบ: 'arcane' | 'rose' | 'aqua' | 'muted'
//   className = ปรับขนาด/สัดส่วนกล่องจากภายนอก
// -----------------------------------------------------------------------------

const TONES = {
  arcane: 'border-arcane/50 text-arcane2 bg-arcane/5',
  rose:   'border-rose/50 text-rose bg-rose/5',
  aqua:   'border-aqua/50 text-aqua bg-aqua/5',
  muted:  'border-border text-muted bg-surface/40',
}

export default function SpritePlaceholder({
  label,
  note,
  Icon,
  tone = 'muted',
  className = 'h-32 w-32',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-2 text-center ${TONES[tone]} ${className}`}
      // aria-label ช่วยให้ screen reader รู้ว่าตรงนี้คืออะไร (ตอนนี้ยังเป็นภาพ placeholder)
      role="img"
      aria-label={`ตำแหน่งภาพ: ${label}`}
    >
      {Icon && <Icon className="h-8 w-8 opacity-80" />}
      <span className="font-heading text-xs leading-tight">{label}</span>
      {note && <span className="text-[10px] leading-tight opacity-70">{note}</span>}
    </div>
  )
}
