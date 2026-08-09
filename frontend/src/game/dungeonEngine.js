// src/game/dungeonEngine.js
// -----------------------------------------------------------------------------
// "สมองกล" ของโหมดดันเจี้ยน — เก็บเฉพาะ LOGIC ไม่มีส่วนหน้าตา (UI) เลย
//
// ทำไมแยกไฟล์นี้ออกมา?
//   - อ่านง่าย: กติกาเกมทั้งหมดอยู่ที่เดียว ไม่ปนกับโค้ดวาดหน้าจอ
//   - แก้ง่าย: อยากปรับกติกา แก้แค่ไฟล์นี้ (ตัวเลขปรับที่ data/gameConfig.js)
//
// หลักการเขียน: ทุกฟังก์ชันเป็น "pure function"
//   = รับ state เดิมเข้าไป -> คืน state ใหม่ออกมา (ไม่แก้ของเดิมโดยตรง)
//   ซึ่งเข้ากับวิธีคิดของ React พอดี (setState ด้วยค่าใหม่ แล้วหน้าจอวาดใหม่เอง)
//
// -----------------------------------------------------------------------------
// โครงสร้างข้อมูลของ "การเล่น 1 ด่าน" (run) หน้าตาแบบนี้:
// {
//   mode: 'dungeon',
//   difficulty: 'ง่าย' | 'ปานกลาง' | 'ยาก',
//   player:   { hearts, maxHearts },
//   monsters: [ { index, kind, hearts, maxHearts, damage }, ... ]  // 3 ตัว
//   currentIndex: 0,          // กำลังสู้กับ monsters[currentIndex]
//   skills: { damageBoost:{unlocked, usesLeft, armed}, moodeng:{...}, fiftyFifty:{...} },
//   status: 'playing' | 'win' | 'lose',
//   stats:  { answered, correct },
//   lastEvent: {...}          // เหตุการณ์ล่าสุด ไว้ให้ UI เอาไปแสดงผล/เล่นอนิเมชัน
// }
// -----------------------------------------------------------------------------
import {
  PLAYER_MAX_HEARTS,
  DAMAGE_TO_PLAYER,
  MONSTER_HEARTS,
  BASE_PLAYER_DAMAGE,
  NORMAL_MONSTERS_PER_STAGE,
  SKILLS,
  SKILL_DAMAGE_BOOST,
  SKILL_MOODENG,
  SKILL_FIFTY_FIFTY,
  SKILL_UNLOCK_BY_DIFFICULTY,
  LEVEL_GAIN_ON_BOSS_KILL,
  MODE_DUNGEON,
} from '../data/gameConfig.js'

// =============================================================================
// สร้าง Monster ของด่าน
// =============================================================================
// สเปก: 1 ด่านมี Monster 3 ตัว = ตัวปกติ 2 ตัว + บอส 1 ตัว (บอสอยู่ท้ายสุดเสมอ)
function createMonsters(difficulty) {
  const hp = MONSTER_HEARTS[difficulty]
  const dmg = DAMAGE_TO_PLAYER[difficulty]
  const list = []

  // ตัวปกติ 2 ตัว
  for (let i = 0; i < NORMAL_MONSTERS_PER_STAGE; i++) {
    list.push({
      index: i,
      kind: 'normal',
      name: `Monster ${i + 1}`,
      hearts: hp.normal,
      maxHearts: hp.normal,
      damage: dmg.normal, // ตีผู้เล่นแรงเท่าไรเมื่อผู้เล่นตอบผิด
    })
  }

  // บอส 1 ตัว (ท้ายสุด) — หัวใจเยอะกว่า + ตีแรงกว่า
  list.push({
    index: NORMAL_MONSTERS_PER_STAGE,
    kind: 'boss',
    name: 'บอสประจำด่าน',
    hearts: hp.boss,
    maxHearts: hp.boss,
    damage: dmg.boss,
  })

  return list
}

// =============================================================================
// สร้างสถานะสกิลตอนเริ่มด่าน
// =============================================================================
// progress = ความก้าวหน้าถาวรของผู้เล่น (บอกว่าปลดล็อกสกิลไหนไว้แล้วบ้าง)
//   ตัวอย่าง: { level: 3, unlockedSkills: { damageBoost: true, moodeng: false, fiftyFifty: false } }
function createSkillState(progress) {
  const unlocked = progress?.unlockedSkills || {}
  const make = (id) => ({
    id,
    unlocked: Boolean(unlocked[id]),      // ปลดล็อกแล้วหรือยัง (มาจาก progress ถาวร)
    usesLeft: SKILLS[id].usesPerStage,    // เหลือใช้กี่ครั้งในด่านนี้ (สเปก: 1 ครั้ง/ด่าน)
    armed: false,                          // เฉพาะ damageBoost: "ติดอาวุธ" รอฟันครั้งถัดไป
  })
  return {
    [SKILL_DAMAGE_BOOST]: make(SKILL_DAMAGE_BOOST),
    [SKILL_MOODENG]: make(SKILL_MOODENG),
    [SKILL_FIFTY_FIFTY]: make(SKILL_FIFTY_FIFTY),
  }
}

// =============================================================================
// เริ่มด่านใหม่
// =============================================================================
export function createDungeonRun({ difficulty, progress }) {
  return {
    mode: MODE_DUNGEON,
    difficulty,
    player: { hearts: PLAYER_MAX_HEARTS, maxHearts: PLAYER_MAX_HEARTS },
    monsters: createMonsters(difficulty),
    currentIndex: 0,
    skills: createSkillState(progress),
    status: 'playing',
    stats: { answered: 0, correct: 0 },
    lastEvent: null,
  }
}

// ตัวช่วย: หยิบ Monster ตัวที่กำลังสู้อยู่
export function currentMonster(run) {
  return run.monsters[run.currentIndex] || null
}

// =============================================================================
// ตอบคำถาม 1 ข้อ (หัวใจของ logic ทั้งหมด)
// =============================================================================
// รับ: run เดิม + ตอบถูกไหม (isCorrect)
// คืน: run ใหม่ (ไม่แก้ของเดิม)
//
// กติกา:
//   ตอบถูก -> ผู้เล่นฟัน Monster (เสีย 1 หัวใจ, +1 ถ้าใช้สกิลเสริมดาเมจไว้)
//             ถ้า Monster ตาย -> ไปตัวถัดไป / ถ้าเป็นบอส -> ชนะทั้งด่าน
//   ตอบผิด -> Monster ตีกลับ (ดาเมจตามความยาก + เป็นบอสหรือไม่)
//             ถ้าดาเมจนี้ทำให้ผู้เล่นตาย และมีหมูเด้ง -> หมูเด้งตายแทน ผู้เล่นรอด
//             ถ้าไม่มีหมูเด้ง และหัวใจหมด -> แพ้
export function answerDungeonQuestion(run, isCorrect) {
  // ถ้าด่านจบไปแล้ว ไม่ต้องทำอะไร
  if (run.status !== 'playing') return run

  // ก็อป state ออกมาแก้ (ไม่แตะของเดิม)
  const next = {
    ...run,
    player: { ...run.player },
    monsters: run.monsters.map((m) => ({ ...m })),
    skills: {
      [SKILL_DAMAGE_BOOST]: { ...run.skills[SKILL_DAMAGE_BOOST] },
      [SKILL_MOODENG]: { ...run.skills[SKILL_MOODENG] },
      [SKILL_FIFTY_FIFTY]: { ...run.skills[SKILL_FIFTY_FIFTY] },
    },
    stats: { ...run.stats },
  }

  next.stats.answered += 1
  const monster = next.monsters[next.currentIndex]

  // ---------------------------------------------------------------- ตอบถูก
  if (isCorrect) {
    next.stats.correct += 1

    // คำนวณดาเมจ: พื้นฐาน 1 หัวใจ + โบนัสถ้าเปิดสกิลเสริมดาเมจไว้
    let damage = BASE_PLAYER_DAMAGE
    const boost = next.skills[SKILL_DAMAGE_BOOST]
    let boostUsed = false
    if (boost.armed) {
      damage += SKILLS[SKILL_DAMAGE_BOOST].bonusDamage
      boost.armed = false // ใช้แล้วหมดฤทธิ์ (ติดอาวุธได้ครั้งเดียว)
      boostUsed = true
    }

    monster.hearts = Math.max(0, monster.hearts - damage)

    next.lastEvent = {
      type: 'playerAttack',   // ผู้เล่นฟัน Monster
      damage,
      boostUsed,
      monsterKind: monster.kind,
      monsterDied: monster.hearts === 0,
    }

    // Monster ตายไหม?
    if (monster.hearts === 0) {
      if (monster.kind === 'boss') {
        // ฆ่าบอส = ชนะทั้งด่าน
        next.status = 'win'
      } else {
        // ตัวปกติตาย -> ไปสู้ตัวถัดไป
        next.currentIndex += 1
      }
    }

    return next
  }

  // ---------------------------------------------------------------- ตอบผิด
  const incoming = monster.damage // ดาเมจที่ Monster ตัวนี้ตีใส่ผู้เล่น
  const moodeng = next.skills[SKILL_MOODENG]

  // เงื่อนไขหมูเด้ง (passive): "ถ้าโดนตีครั้งนี้แล้วจะตายแน่นอน"
  //   = ดาเมจที่จะโดน >= หัวใจที่เหลืออยู่
  const wouldDie = incoming >= next.player.hearts
  const moodengCanSave = moodeng.unlocked && moodeng.usesLeft > 0 && wouldDie

  if (moodengCanSave) {
    // หมูเด้งกระโดดรับแทน -> ผู้เล่นไม่เสียหัวใจเลย และหมูเด้งตาย (ใช้ได้ครั้งเดียว/ด่าน)
    moodeng.usesLeft -= 1
    next.lastEvent = {
      type: 'moodengSacrifice',
      blockedDamage: incoming,
      monsterKind: monster.kind,
    }
    return next
  }

  // ไม่มีหมูเด้งช่วย -> เสียหัวใจตามปกติ
  next.player.hearts = Math.max(0, next.player.hearts - incoming)
  next.lastEvent = {
    type: 'monsterAttack', // Monster ตีผู้เล่น
    damage: incoming,
    monsterKind: monster.kind,
    playerDied: next.player.hearts === 0,
  }

  // หัวใจหมด = แพ้
  if (next.player.hearts === 0) {
    next.status = 'lose'
  }

  return next
}

// =============================================================================
// ใช้สกิล (เฉพาะสกิลแบบกดใช้เอง)
// =============================================================================
// รับ: run, id ของสกิล, และ question (จำเป็นเฉพาะสกิลตัดตัวเลือก)
// คืน: { run: runใหม่, hiddenChoices: [index ของตัวเลือกที่ถูกตัด] }
//
// หมายเหตุ: หมูเด้งเป็น passive -> กดใช้เองไม่ได้ (ฟังก์ชันนี้จะปฏิเสธ)
export function useDungeonSkill(run, skillId, question) {
  const def = SKILLS[skillId]
  const state = run.skills[skillId]

  // ตรวจเงื่อนไขก่อนใช้: ต้องมีจริง / ปลดล็อกแล้ว / ยังเหลือครั้ง / ด่านยังไม่จบ / ไม่ใช่ passive
  if (!def || !state) return { run, hiddenChoices: [] }
  if (def.type === 'passive') return { run, hiddenChoices: [] }
  if (!state.unlocked || state.usesLeft <= 0 || run.status !== 'playing') {
    return { run, hiddenChoices: [] }
  }

  const next = {
    ...run,
    skills: { ...run.skills, [skillId]: { ...state } },
  }
  next.skills[skillId].usesLeft -= 1

  // ---- สกิล 1: เสริมดาเมจ ----
  if (skillId === SKILL_DAMAGE_BOOST) {
    next.skills[skillId].armed = true // ติดอาวุธไว้ รอฟันครั้งถัดไป
    next.lastEvent = { type: 'skillUsed', skillId }
    return { run: next, hiddenChoices: [] }
  }

  // ---- สกิล 3: ตัดตัวเลือก (ตัดตัวที่ผิดออก 2 ข้อ) ----
  if (skillId === SKILL_FIFTY_FIFTY) {
    const hiddenChoices = pickWrongChoices(question, def.removeCount)
    next.lastEvent = { type: 'skillUsed', skillId, hiddenChoices }
    return { run: next, hiddenChoices }
  }

  return { run: next, hiddenChoices: [] }
}

// ตัวช่วย: สุ่มเลือก index ของ "ตัวเลือกที่ผิด" ออกมา count ตัว
// (ใช้กับสกิลตัดตัวเลือก — จะไม่ตัดข้อที่ถูกออกแน่นอน)
function pickWrongChoices(question, count) {
  if (!question) return []
  // หา index ของตัวเลือกที่ผิดทั้งหมด (ทุกตัวยกเว้น question.correct)
  const wrongIndexes = question.choices
    .map((_, i) => i)
    .filter((i) => i !== question.correct)

  // สลับลำดับแบบสุ่ม แล้วหยิบมา count ตัว
  for (let i = wrongIndexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[wrongIndexes[i], wrongIndexes[j]] = [wrongIndexes[j], wrongIndexes[i]]
  }
  return wrongIndexes.slice(0, count)
}

// =============================================================================
// คำนวณรางวัลตอนจบด่าน
// =============================================================================
// สเปก: ฆ่าบอสสำเร็จ = ได้เลเวล + ปลดล็อกสกิลตามระดับความยากที่ชนะ
// คืน: { levelGain, unlockedSkill } (ถ้าแพ้จะได้ 0 และ null)
export function computeDungeonRewards(run) {
  if (run.status !== 'win') {
    return { levelGain: 0, unlockedSkill: null }
  }
  return {
    levelGain: LEVEL_GAIN_ON_BOSS_KILL,
    unlockedSkill: SKILL_UNLOCK_BY_DIFFICULTY[run.difficulty] || null,
  }
}

// =============================================================================
// รวมรางวัลเข้ากับความก้าวหน้าถาวรของผู้เล่น
// =============================================================================
// TODO (อนาคต): แทนที่จะคืนค่าเฉย ๆ ให้ส่งไปบันทึกที่ backend
//   เช่น POST /api/progress  แล้วเก็บลง MongoDB (collection ของ User)
export function applyRewardsToProgress(progress, rewards) {
  const next = {
    ...progress,
    unlockedSkills: { ...(progress.unlockedSkills || {}) },
    clearedBosses: { ...(progress.clearedBosses || {}) },
  }
  next.level = (progress.level || 1) + rewards.levelGain
  if (rewards.unlockedSkill) {
    next.unlockedSkills[rewards.unlockedSkill] = true
  }
  return next
}
