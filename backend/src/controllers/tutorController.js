// src/controllers/tutorController.js
// -----------------------------------------------------------------------------
// "จอมปราชญ์" — ครู AI ประจำโหมดดันเจี้ยน
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

// รุ่นที่จะลองใช้ตามลำดับ — บางบัญชี/บางโปรเจกต์ไม่มีโควตาฟรีของบางรุ่น
// จึงลองไล่ไปเรื่อย ๆ จนเจอรุ่นที่ตอบได้ (รุ่นแรกที่ตั้งใน env จะถูกลองก่อน)
//
// ชื่อที่ลงท้ายด้วย -latest คือชื่อถาวรที่ Google ชี้ไปยังรุ่นล่าสุดให้เอง
// จึงไม่พังเวลา Google ออกเวอร์ชันใหม่ (ต่างจากชื่อที่ระบุเลขเวอร์ชันตายตัว
// อย่าง gemini-2.0-flash ซึ่งตรวจเมื่อ 2026-08-26 แล้วพบว่าตอบ 404 = เลิกให้บริการแล้ว)
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,  // ถ้าตั้ง env ไว้ ลองอันนี้ก่อน
  'gemini-flash-latest',     // ทดสอบแล้วใช้ได้จริงกับ key ของเรา -> ลองก่อนเพื่อน
  'gemini-flash-lite-latest',
].filter(Boolean).filter((m, i, a) => a.indexOf(m) === i) // ตัดค่าซ้ำ

const geminiUrl = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

const CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง']

// ---- ตัวช่วยเรื่องการลองใหม่ (retry) ----

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// รุ่นที่ Google บอกว่า "ไม่มีรุ่นนี้แล้ว" (404) — จำไว้ไม่ต้องลองซ้ำอีกในรอบชีวิตของเซิร์ฟเวอร์
// (ทุกครั้งที่ยิงไปโดนรุ่นที่ไม่มีอยู่ = เสียเวลาเปล่า และทำให้ผู้ใช้รอนานขึ้น)
const deadModels = new Set()

// รุ่นที่โควตา "รายวัน" หมดไปแล้ว — พักไว้ชั่วคราวแล้วค่อยกลับมาลองใหม่
// (ยิงไปก็ได้ 429 เหมือนเดิม เสียเวลาผู้ใช้เปล่า ๆ) เก็บเป็นเวลาที่พักครบ
const quotaCooldown = new Map()
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000 // พัก 1 ชั่วโมงแล้วลองใหม่

const isCoolingDown = (model) => (quotaCooldown.get(model) ?? 0) > Date.now()

// เพดานเวลาต่อ 1 คำถาม — ช่วงที่ Gemini รุ่นฟรีคนใช้ล้น บางครั้งตอบช้าเป็นนาที
// ถ้าปล่อยไว้ผู้ใช้จะนั่งมองหน้าจอค้าง สู้ตัดจบแล้วบอกให้กดใหม่ดีกว่า
const ATTEMPT_TIMEOUT_MS = 30 * 1000  // ต่อการยิง 1 ครั้ง
const TOTAL_DEADLINE_MS = 50 * 1000   // รวมทุกรุ่นทุกครั้งที่ลอง

// ---- ตาข่ายกันตก: ถามรายชื่อรุ่นจาก Google เอง ----
// ใช้เมื่อรุ่นที่เราเขียนไว้ในโค้ดตาย 404 หมดทุกตัว (Google เปลี่ยนชื่อรุ่นอีกรอบ)
// จะได้ไม่ต้องรอคนมาแก้โค้ด — เว็บหาเองได้ว่าตอนนี้มีรุ่นอะไรให้ใช้บ้าง
// ถามครั้งเดียวแล้วจำไว้ (ไม่ยิงซ้ำทุก request)
let discovered = null

async function discoverModels(key) {
  if (discovered) return discovered
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    if (!r.ok) return (discovered = [])
    const data = await r.json()
    discovered = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      // เอาเฉพาะรุ่น flash (เร็วและอยู่ในโควตาฟรี) และเลี่ยงรุ่นทดลองที่ยังไม่นิ่ง
      .filter((n) => /flash/i.test(n) && !/exp|preview|thinking|vision|image|tts/i.test(n))
      .slice(0, 3)
    console.log('ค้นรุ่น Gemini ที่ใช้ได้เอง:', discovered.join(', ') || '(ไม่พบ)')
    return discovered
  } catch (err) {
    console.warn('ขอรายชื่อรุ่น Gemini ไม่สำเร็จ:', err.message)
    return (discovered = [])
  }
}

// โควตาฟรีของ Gemini จำกัด "จำนวนครั้งต่อนาที" ไว้ต่ำมาก
// พอถูกกดถี่ ๆ จะตอบ 429 ทันที ทั้งที่ key ยังใช้ได้ปกติ
// Google มักบอกมาด้วยว่าให้รอกี่วินาที -> ดึงตัวเลขนั้นออกมาใช้
function parseRetryDelay(detail) {
  const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(detail || '')
  if (m) return Math.min(Math.ceil(Number(m[1])), 60)
  return null
}

// นับว่าโควตาที่หมดเป็นแบบ "ต่อวัน" หรือแค่ "ต่อนาที"
// ต่อวัน = รอพรุ่งนี้  /  ต่อนาที = รอไม่กี่วินาทีก็กลับมาใช้ได้
function isDailyQuota(detail) {
  return /PerDay|per day|GenerateRequestsPerDay/i.test(detail || '')
}

// ---- สร้าง "คำสั่งระบบ" ที่กำหนดบุคลิกครู + ยัดเฉลยจริงเป็นความจริงอ้างอิง ----
// สำคัญ: ส่งเฉลย/วิธีทำที่เราเขียนไว้เข้าไปด้วย เพื่อให้ AI อธิบาย "ต่อยอด"
//        จากของจริง ไม่ใช่เดาเอง (กัน AI มั่วคำตอบผิด)
function buildSystemInstruction(ctx = {}) {
  const choiceLines = Array.isArray(ctx.choices)
    ? ctx.choices.map((c, i) => `${CHOICE_LABELS[i] ?? i + 1}. ${c}`).join('\n')
    : '-'

  return [
    'คุณคือ "จอมปราชญ์" ติวเตอร์ผู้ใจดีในเกม TidSure ที่ช่วยนักเรียนไทยเตรียมสอบเข้ามหาวิทยาลัย (TGAT/TPAT/A-Level)',
    'บุคลิก: เป็นกันเอง ให้กำลังใจ พูดไทยเข้าใจง่ายเหมือนพี่ติวให้น้อง',
    '',
    'กติกาสำคัญ:',
    '- อธิบายสั้น กระชับ 2-4 ประโยค เหมือนคุยแชท ไม่ร่ายยาวเป็นเรียงความ',
    '- ยึด "คำตอบที่ถูก" และ "วิธีทำ" ที่ให้ไว้เป็นความจริงหลัก ห้ามเปลี่ยนคำตอบที่ถูกเอง',
    '- ถ้านักเรียนถามนอกเรื่องเรียน ให้ดึงกลับมาที่โจทย์อย่างสุภาพ',
    '- อย่าเปิดเผยว่าตัวเองเป็นโมเดล AI — เป็น "จอมปราชญ์" ตลอด',
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
      generationConfig: {
        temperature: 0.7,
        // เพดานสูงพอให้ "ส่วนคิด" (thinking) ของรุ่น 2.5 + คำตอบจริงอยู่ครบ
        // ไม่โดนตัดกลางประโยค (รุ่น flash-latest ปิด thinking ไม่ได้ จึงต้องเผื่อที่)
        maxOutputTokens: 2048,
      },
    }

    // ลองไล่ทีละรุ่นจนกว่าจะมีรุ่นไหนตอบได้
    const tried = []            // ไว้เขียน log สรุปตอนจบ
    const statuses = []         // เก็บเฉพาะรหัสสถานะ ไว้ตัดสินใจว่าจะบอกผู้ใช้ว่าอะไร
    const codes = []            // สรุปสั้น ๆ "รุ่น:สถานะ" ส่งกลับไปให้ช่วยหาสาเหตุได้
    let retryAfter = null       // Google บอกให้รอกี่วินาที (ถ้าบอกมา)
    let sawEmptyReply = false   // Gemini ตอบ 200 แต่ข้อความว่าง (มักเกิดกับรุ่นที่มี thinking)
    let sawTimeout = false      // ยิงไปแล้วรอจนหมดเวลา (Gemini ช้าผิดปกติ)
    const triedModels = new Set()      // รุ่นที่ได้ลองจริงรอบนี้
    const dailyQuotaModels = new Set() // รุ่นที่โควตา "รายวัน" หมด

    const startedAt = Date.now()
    const outOfTime = () => Date.now() - startedAt > TOTAL_DEADLINE_MS

    // รายชื่อรุ่นที่จะลองรอบนี้
    //   - ตัดรุ่นที่ตาย 404 ทิ้ง
    //   - ตัดรุ่นที่โควตารายวันหมด (พักไว้ก่อน) ออกด้วย จะได้ไม่เสียเวลายิงไปโดน 429 ซ้ำ
    //   - ถ้าตัดจนไม่เหลือเลย ให้ไปถาม Google เอาเองว่าตอนนี้มีรุ่นอะไรใช้ได้บ้าง
    let candidates = MODEL_CANDIDATES.filter((m) => !deadModels.has(m) && !isCoolingDown(m))
    let discoveryDone = false
    if (candidates.length === 0) {
      // ไม่เหลือรุ่นเลย: ถ้าเป็นเพราะโควตาหมดชั่วคราว ให้ยอมลองรุ่นเดิมอีกที ดีกว่าไม่ทำอะไรเลย
      candidates = MODEL_CANDIDATES.filter((m) => !deadModels.has(m))
      if (candidates.length === 0) {
        candidates = await discoverModels(key)
        discoveryDone = true
      }
    }

    // ใช้ queue แทน for...of ธรรมดา เพราะระหว่างวนอาจมีการ "เติมรุ่นใหม่" เข้ามาท้ายแถว
    // (กรณีรุ่นที่เขียนไว้ตาย 404 หมดกลางคัน แล้วไปขอรายชื่อรุ่นจาก Google มาต่อ)
    const queue = [...candidates]

    for (let qi = 0; qi < queue.length; qi++) {
      const model = queue[qi]
      if (deadModels.has(model)) continue // รุ่นนี้เคยตอบ 404 มาแล้ว ข้ามไปเลย
      if (outOfTime()) break              // หมดเวลาแล้ว ไม่ต้องลองรุ่นถัดไป

      // รุ่นแรกคือรุ่นหลักที่รู้ว่าใช้ได้จริง จึงยอมลองซ้ำให้ถึง 3 ครั้ง
      // 503 (ฝั่ง Google คนใช้ล้น) เป็นอาการชั่วคราวที่เจอบ่อยมากในโควตาฟรี
      // ลองซ้ำอีกไม่กี่วินาทีมักผ่าน — ดีกว่าปล่อยให้ผู้ใช้เห็น error ทั้งที่ระบบปกติดี
      const maxAttempts = qi === 0 ? 3 : 1
      triedModels.add(model)

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let resp
        try {
          resp = await fetch(geminiUrl(model, key), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            // ถ้า Gemini ไม่ตอบภายในเวลาที่กำหนด ให้ยกเลิกแล้วไปลองทางอื่น
            signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
          })
        } catch (err) {
          // ส่วนใหญ่คือ TimeoutError (Gemini ช้าเกินรอ) หรือเน็ตสะดุด
          sawTimeout = true
          console.error(`Gemini (${model}) ไม่ตอบ:`, err.name)
          tried.push(`${model}#${attempt}: ${err.name}`)
          codes.push(`${model}:${err.name === 'TimeoutError' ? 'timeout' : 'neterr'}`)
          if (attempt < maxAttempts && !outOfTime()) continue
          break
        }

        if (resp.ok) {
          const data = await resp.json()
          const reply = data?.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || '')
            .join('')
            .trim()
          if (reply) return res.json({ ok: true, reply, model })

          // ตอบ 200 แต่ไม่มีข้อความ — สาเหตุที่พบบ่อย:
          //   MAX_TOKENS = โควตา token หมดไปกับ "ส่วนคิด" (thinking) ก่อนจะได้เขียนคำตอบ
          //   SAFETY     = ตัวกรองเนื้อหาบล็อก
          const reason = data?.candidates?.[0]?.finishReason || 'ไม่ทราบสาเหตุ'
          sawEmptyReply = true
          tried.push(`${model}#${attempt}: ตอบว่าง (finishReason=${reason})`)
          codes.push(`${model}:empty/${reason}`)

          // MAX_TOKENS = เพิ่มเพดาน token แล้วลองใหม่ทันที มีโอกาสได้คำตอบ
          if (reason === 'MAX_TOKENS' && attempt < maxAttempts) {
            payload.generationConfig.maxOutputTokens = 8192
            continue
          }
          break // รุ่นนี้ตอบว่าง ลองรุ่นถัดไป
        }

        const detail = await resp.text().catch(() => '')
        console.error(`Gemini (${model}) error:`, resp.status, detail)
        tried.push(`${model}#${attempt}: ${resp.status} ${detail.slice(0, 200)}`)
        statuses.push(resp.status)
        codes.push(`${model}:${resp.status}`)

        if (resp.status === 404) {
          // ไม่มีรุ่นนี้แล้ว (Google เลิกให้บริการ/พิมพ์ชื่อผิด) — จำไว้ ไม่ต้องลองอีก
          deadModels.add(model)
          break
        }

        // 500/503 = ฝั่ง Google ล่ม/คนใช้ล้น เป็นอาการชั่วคราว ลองซ้ำได้
        // รอเพิ่มขึ้นทีละขั้น (2 วิ แล้ว 4 วิ) ให้ฝั่งโน้นมีเวลาหายใจ
        if (resp.status >= 500 && attempt < maxAttempts && !outOfTime()) {
          await sleep(attempt * 2000)
          continue
        }

        if (resp.status === 429) {
          if (isDailyQuota(detail)) {
            // โควตารายวันหมด รอกี่วินาทีก็ไม่ช่วย -> พักรุ่นนี้ไว้ แล้วข้ามไปรุ่นถัดไปเลย
            dailyQuotaModels.add(model)
            quotaCooldown.set(model, Date.now() + QUOTA_COOLDOWN_MS)
            break
          }
          const wait = parseRetryDelay(detail) ?? 2
          retryAfter = Math.max(retryAfter ?? 0, wait)
          // รอเองให้เฉพาะกรณีที่ Google บอกว่ารอแป๊บเดียว (ไม่เกิน 5 วิ) และรอแค่รอบเดียว
          // ถ้าต้องรอนานกว่านั้น ตอบกลับไปเลยว่า "รอกี่วินาที" ดีกว่าให้ผู้ใช้นั่งค้างหน้าจอ
          if (attempt === 1 && maxAttempts > 1 && wait <= 5 && !outOfTime()) {
            await sleep(wait * 1000)
            continue
          }
          break
        }

        break // error อื่น (400 key ผิด / 403 ฯลฯ) ลองซ้ำไปก็เท่านั้น -> ไปรุ่นถัดไป
      }

      // มาถึงรุ่นสุดท้ายในแถวแล้วยังไม่ได้ และรุ่นที่มีทั้งหมด "ตาย 404" หมดจริง ๆ
      // -> ไปขอรายชื่อรุ่นปัจจุบันจาก Google มาต่อท้ายแถว แล้ววนต่อ
      //    (Google เปลี่ยนชื่อรุ่นเมื่อไหร่ เว็บก็ยังใช้งานได้เองโดยไม่ต้องรอแก้โค้ด)
      const isLast = qi === queue.length - 1
      if (isLast && !discoveryDone && queue.every((m) => deadModels.has(m))) {
        discoveryDone = true
        for (const m of await discoverModels(key)) {
          if (!queue.includes(m) && !deadModels.has(m)) queue.push(m)
        }
      }
    }

    // ลองครบทุกรุ่นแล้วยังไม่ได้ (รายละเอียดอยู่ใน log ของเซิร์ฟเวอร์)
    console.error('Gemini ใช้ไม่ได้ทุกรุ่น:', tried.join(' | '))

    // เลือกข้อความให้ตรงกับสาเหตุจริง — สำคัญมาก เพราะข้อความผิดทำให้เข้าใจว่า
    // "key หมดอายุ/เว็บพัง" ทั้งที่จริงแค่กดถี่เกินไปแล้วรอแป๊บเดียวก็ใช้ได้
    const hasQuota = statuses.includes(429)
    const badKey = statuses.length > 0 && statuses.every((s) => s === 400 || s === 403)
    const serverBusy = statuses.some((s) => s >= 500)
    // บอกว่า "รอพรุ่งนี้" ได้ก็ต่อเมื่อ *ทุกรุ่น* ที่ลองโควตารายวันหมดจริง ๆ
    // ถ้ามีรุ่นไหนแค่ 503 (ชั่วคราว) แปลว่ากดใหม่อีกทีอาจได้เลย ห้ามไล่ให้รอถึงพรุ่งนี้
    const allDailyQuota =
      triedModels.size > 0 && dailyQuotaModels.size === triedModels.size

    let message
    let status = 502
    if (badKey) {
      // key ผิด/ถูกเพิกถอน/ยังไม่เปิดใช้ API — อันนี้ผู้ดูแลต้องไปแก้ที่ Render
      message = 'ครู AI ยังไม่พร้อมใช้งาน (ผู้ดูแลต้องตรวจสอบ GEMINI_API_KEY)'
      status = 503
    } else if (allDailyQuota) {
      message = 'วันนี้โควตาครู AI เต็มแล้ว (รุ่นฟรีมีจำกัดต่อวัน) ลองใหม่พรุ่งนี้ หรือดูเฉลยด้านบนไปก่อนนะ'
      status = 429
    } else if (serverBusy || sawTimeout) {
      message = 'ระบบ AI ของ Google กำลังมีผู้ใช้หนาแน่น ลองกดใหม่อีกครั้งในสักครู่นะ'
      status = 503
    } else if (hasQuota) {
      const secs = retryAfter ?? 30
      message = `ตอนนี้มีคนถามครู AI พร้อมกันเยอะ รอสัก ${secs} วินาทีแล้วกดถามใหม่นะ (ระหว่างนี้ดูเฉลยด้านบนไปก่อนได้)`
      status = 429
    } else if (sawEmptyReply) {
      message = 'ครู AI คิดคำตอบไม่จบ ลองกดถามใหม่อีกครั้งนะ (หรือดูเฉลยด้านบนไปก่อนได้)'
    } else {
      message = 'ครู AI ไม่ว่างชั่วคราว ลองใหม่อีกครั้ง หรือดูเฉลยด้านบนก่อนนะ'
    }

    // ตอบกลับเองเลย ไม่ผ่าน errorHandler เพราะอยากแนบ codes ไปด้วย
    // codes = สรุปสั้น ๆ ว่ารุ่นไหนตอบสถานะอะไร (ไม่มีข้อมูลลับ ไม่มี API key)
    // มีไว้ให้ตรวจสาเหตุได้จากภายนอกโดยไม่ต้องเปิด log ของ Render
    if (retryAfter) res.set('Retry-After', String(retryAfter))
    return res.status(status).json({ ok: false, message, codes })
  } catch (err) {
    next(err) // ส่งต่อให้ errorHandler ตอบ JSON รูปแบบเดียวกับ API อื่น
  }
}
