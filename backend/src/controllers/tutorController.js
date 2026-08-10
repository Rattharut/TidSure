// src/controllers/tutorController.js
// -----------------------------------------------------------------------------
// "เซียนเวท" — ครู AI ประจำโหมดดันเจี้ยน
//
// หน้าที่: รับบริบทของโจทย์ (คำถาม/ตัวเลือก/เฉลย/วิธีทำ) + บทสนทนาที่ผ่านมา
//          แล้วส่งต่อให้ Google Gemini ช่วยอธิบายเป็นภาษาคน ตอบกลับเป็นข้อความ
//
// ทำไม key ต้องอยู่ที่นี่ (หลังบ้าน) ไม่ใช่หน้าบ้าน:
//   ถ้าใส่ GEMINI_API_KEY ไว้ในโค้ดเว็บ (frontend) ใครเปิดหน้าเว็บก็ดู key ได้
//   แล้วเอาไปใช้จนโควตาเราหมด — จึงให้เว็บเรียก endpoint นี้ แล้ว "หลังบ้าน"
//   ค่อยถือ key ไปคุยกับ Gemini แทน (key ไม่เคยหลุดออกไปฝั่งผู้ใช้)
//
// ไม่ต้องลง library เพิ่ม: Node 20+ มี fetch ให้ในตัวอยู่แล้ว
// -----------------------------------------------------------------------------

// รุ่นที่ใช้ — flash = เร็ว + อยู่ในโควตาฟรี (ตั้ง GEMINI_MODEL ใน env เพื่อเปลี่ยนได้)
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

const geminiUrl = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

const CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง']

// ---- สร้าง "คำสั่งระบบ" ที่กำหนดบุคลิกครู + ยัดเฉลยจริงเป็นความจริงอ้างอิง ----
// สำคัญ: ส่งเฉลย/วิธีทำที่เราเขียนไว้เข้าไปด้วย เพื่อให้ AI อธิบาย "ต่อยอด"
//        จากของจริง ไม่ใช่เดาเอง (กัน AI มั่วคำตอบผิด)
function buildSystemInstruction(ctx = {}) {
  const choiceLines = Array.isArray(ctx.choices)
    ? ctx.choices.map((c, i) => `${CHOICE_LABELS[i] ?? i + 1}. ${c}`).join('\n')
    : '-'

  return [
    'คุณคือ "เซียนเวท" ติวเตอร์ผู้ใจดีในเกม TidSure ที่ช่วยนักเรียนไทยเตรียมสอบเข้ามหาวิทยาลัย (TGAT/TPAT/A-Level)',
    'บุคลิก: เป็นกันเอง ให้กำลังใจ พูดไทยเข้าใจง่ายเหมือนพี่ติวให้น้อง',
    '',
    'กติกาสำคัญ:',
    '- อธิบายสั้น กระชับ 2-4 ประโยค เหมือนคุยแชท ไม่ร่ายยาวเป็นเรียงความ',
    '- ยึด "คำตอบที่ถูก" และ "วิธีทำ" ที่ให้ไว้เป็นความจริงหลัก ห้ามเปลี่ยนคำตอบที่ถูกเอง',
    '- ถ้านักเรียนถามนอกเรื่องเรียน ให้ดึงกลับมาที่โจทย์อย่างสุภาพ',
    '- อย่าเปิดเผยว่าตัวเองเป็นโมเดล AI — เป็น "เซียนเวท" ตลอด',
    '- ตอบเป็นภาษาไทยเสมอ',
    '',
    'ข้อมูลของโจทย์ข้อนี้ (ใช้เป็นความจริงอ้างอิง ห้ามขัดกับข้อมูลนี้):',
    `วิชา: ${ctx.subject || '-'}`,
    `โจทย์: ${ctx.question || '-'}`,
    `ตัวเลือก:\n${choiceLines}`,
    `คำตอบที่ถูก: ข้อ ${CHOICE_LABELS[ctx.correctIndex] ?? '?'}${ctx.correctText ? ` (${ctx.correctText})` : ''}`,
    ctx.userAnswerText ? `นักเรียนตอบ: ${ctx.userAnswerText} (ซึ่งผิด)` : '',
    ctx.formula ? `หลักการ: ${ctx.formula}` : '',
    ctx.explanation ? `วิธีทำ: ${ctx.explanation}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

// POST /api/tutor
// body: { context: {...}, messages: [{ role: 'user' | 'model', text }] }
export async function askTutor(req, res, next) {
  try {
    const key = process.env.GEMINI_API_KEY
    if (!key) {
      const e = new Error('ครู AI ยังไม่พร้อมใช้งาน (ผู้ดูแลยังไม่ได้ตั้งค่า GEMINI_API_KEY)')
      e.status = 503
      throw e
    }

    const { context = {}, messages = [] } = req.body || {}

    // แปลงบทสนทนา -> รูปแบบที่ Gemini ต้องการ (กรองข้อความว่าง + จำกัดความยาวกันสแปม)
    const contents = (Array.isArray(messages) ? messages : [])
      .filter((m) => m && typeof m.text === 'string' && m.text.trim())
      .slice(-12) // เก็บแค่ 12 เทิร์นล่าสุดพอ ไม่ให้ยาวจนเปลืองโควตา
      .map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text.trim().slice(0, 2000) }],
      }))

    // Gemini บังคับว่าเทิร์นแรกต้องเป็น 'user' — ถ้าเริ่มด้วย model (หรือว่าง)
    // ให้ใส่คำถามเปิดของนักเรียนนำหน้า (กรณีเพิ่งกด "ถามครู AI" ครั้งแรก)
    if (!contents.length || contents[0].role !== 'user') {
      contents.unshift({
        role: 'user',
        parts: [{ text: 'ช่วยอธิบายหน่อยว่าทำไมคำตอบที่ถูกถึงเป็นข้อนี้ และที่หนูตอบผิดเพราะอะไร' }],
      })
    }

    const payload = {
      system_instruction: { parts: [{ text: buildSystemInstruction(context) }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
    }

    const resp = await fetch(geminiUrl(GEMINI_MODEL, key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '')
      console.error('Gemini ตอบ error:', resp.status, detail)
      const e = new Error('ครู AI ไม่ว่างชั่วคราว ลองใหม่อีกครั้ง หรือดูเฉลยด้านบนก่อนนะ')
      e.status = 502
      // DEBUG ชั่วคราว: แนบสถานะ+ข้อความจาก Google เพื่อหาสาเหตุ (จะเอาออกทีหลัง)
      e.debug = `gemini ${resp.status}: ${detail.slice(0, 300)}`
      throw e
    }

    const data = await resp.json()
    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim()

    if (!reply) {
      const e = new Error('ครู AI ตอบไม่ได้ในตอนนี้ ลองถามใหม่อีกครั้งนะ')
      e.status = 502
      throw e
    }

    res.json({ ok: true, reply })
  } catch (err) {
    next(err) // ส่งต่อให้ errorHandler ตอบ JSON รูปแบบเดียวกับ API อื่น
  }
}
