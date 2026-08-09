// src/data/examStructure.js
// -----------------------------------------------------------------------------
// โครงสร้างประเภทข้อสอบ TCAS และ "วิชาย่อย" ของแต่ละประเภท (เก็บครบ)
// ใช้ในหน้า TakeQuiz: เลือกประเภท -> เลือกวิชาย่อย -> เลือกความยาก
//
// รูปแบบข้อมูล:
//   { id, name, full, tagline, subjects: [ { code, name } ] }
//     id      = คีย์ใช้อ้างอิงในโค้ด (ตรงกับ examType ใน mock/backend: 'TGAT' | 'TPAT' | 'A-Level')
//     name    = ชื่อย่อที่โชว์ตัวใหญ่
//     full    = ชื่อเต็มภาษาไทย
//     subjects= รายการวิชาย่อย (code = รหัสวิชา, name = ชื่อวิชา)
//
// วิธีเพิ่ม/แก้วิชา: แก้ในอาร์เรย์ subjects ของประเภทนั้นได้เลย
// (อ้างอิงโครงสอบ TCAS — ปรับตามประกาศ ทปอ. ล่าสุดได้ตามต้องการ)
// -----------------------------------------------------------------------------

export const EXAMS = [
  {
    id: 'TGAT',
    name: 'TGAT',
    full: 'ความถนัดทั่วไป',
    tagline: 'ทักษะพื้นฐานที่ทุกคณะต้องใช้',
    subjects: [
      { code: 'TGAT1', name: 'การสื่อสารภาษาอังกฤษ' },
      { code: 'TGAT2', name: 'การคิดอย่างมีเหตุผล' },
      { code: 'TGAT3', name: 'สมรรถนะการทำงานในอนาคต' },
    ],
  },
  {
    id: 'TPAT',
    name: 'TPAT',
    full: 'ความถนัดเฉพาะด้าน / วิชาชีพ',
    tagline: 'วัดแววเฉพาะสายอาชีพ',
    subjects: [
      { code: 'TPAT1', name: 'วิชาเฉพาะ กสพท (แพทย์)' },
      { code: 'TPAT2', name: 'ความถนัดศิลปกรรมศาสตร์' },
      { code: 'TPAT3', name: 'ความถนัดวิทยาศาสตร์ เทคโนโลยี วิศวกรรมศาสตร์' },
      { code: 'TPAT4', name: 'ความถนัดสถาปัตยกรรม' },
      { code: 'TPAT5', name: 'ความถนัดครุศาสตร์-ศึกษาศาสตร์' },
    ],
  },
  {
    id: 'A-Level',
    name: 'A-Level',
    full: 'ความรู้เชิงวิชาการ (Applied Knowledge Level)',
    tagline: 'วัดความรู้ตามหลักสูตรแต่ละวิชา',
    subjects: [
      { code: 'A-Level 61', name: 'คณิตศาสตร์ประยุกต์ 1' },
      { code: 'A-Level 62', name: 'คณิตศาสตร์ประยุกต์ 2' },
      { code: 'A-Level 63', name: 'วิทยาศาสตร์ประยุกต์' },
      { code: 'A-Level 64', name: 'ฟิสิกส์' },
      { code: 'A-Level 65', name: 'เคมี' },
      { code: 'A-Level 66', name: 'ชีววิทยา' },
      { code: 'A-Level 70', name: 'สังคมศึกษา' },
      { code: 'A-Level 81', name: 'ภาษาไทย' },
      { code: 'A-Level 82', name: 'ภาษาอังกฤษ' },
      { code: 'A-Level 83', name: 'ภาษาฝรั่งเศส' },
      { code: 'A-Level 84', name: 'ภาษาเยอรมัน' },
      { code: 'A-Level 85', name: 'ภาษาญี่ปุ่น' },
      { code: 'A-Level 86', name: 'ภาษาเกาหลี' },
      { code: 'A-Level 87', name: 'ภาษาจีน' },
      { code: 'A-Level 88', name: 'ภาษาบาลี' },
      { code: 'A-Level 89', name: 'ภาษาสเปน' },
    ],
  },
]

// ตัวช่วย: หาประเภทข้อสอบจาก id (เช่น getExam('TGAT'))
export function getExam(id) {
  return EXAMS.find((e) => e.id === id) || null
}

// รายชื่อวิชาย่อย "ทั้งหมด" รวมทุกประเภท (แบนเป็นลิสต์เดียว)
// ใช้ในหน้า Status ตอนให้ผู้เล่นเลือกวิชาประจำแต่ละแกนของกราฟเรดาร์
// แต่ละตัวจะมี examId ติดมาด้วย เพื่อรู้ว่าวิชานี้อยู่ใต้ TGAT/TPAT/A-Level
export const ALL_SUBJECTS = EXAMS.flatMap((exam) =>
  exam.subjects.map((s) => ({ ...s, examId: exam.id, examName: exam.name }))
)

// ตัวช่วย: หาวิชาจากรหัส (เช่น getSubjectByCode('A-Level 61'))
export function getSubjectByCode(code) {
  return ALL_SUBJECTS.find((s) => s.code === code) || null
}

// =============================================================================
// วิชาที่ "ล็อกถาวร" — ไม่ใช่แค่ยังไม่มีข้อสอบ แต่ทำเป็นข้อความล้วนไม่ได้
// =============================================================================
// TPAT2 (ศิลปกรรมศาสตร์) และ TPAT4 (สถาปัตยกรรมศาสตร์) ต้องดูภาพประกอบ
// เช่น วิเคราะห์องค์ประกอบศิลป์ มองรูปทรง 3 มิติ อ่านแบบแปลน
// ถ้าจะเปิดจริงต้องเพิ่มระบบรูปภาพใน question schema ก่อน
//
// เก็บไว้ที่นี่เพราะใช้หลายหน้า (TakeQuiz กันไม่ให้กดเล่น / Status กันไม่ให้เลือกเป็นแกน)
export const LOCKED_SUBJECTS = {
  TPAT2: 'ยังไม่เปิด — ข้อสอบต้องใช้ภาพประกอบ',
  TPAT4: 'ยังไม่เปิด — ข้อสอบต้องใช้ภาพประกอบ',
}

// ชื่อเต็มที่ใช้แสดงในลิสต์ตัวเลือก = ประเภทข้อสอบ + ชื่อวิชา
// เช่น 'A-Level 64 ฟิสิกส์'  /  'TGAT1 การสื่อสารภาษาอังกฤษ'
export function getSubjectFullLabel(code) {
  const s = getSubjectByCode(code)
  return s ? `${s.code} ${s.name}` : ''
}

export default EXAMS
