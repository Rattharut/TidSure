// src/pages/QuizRunner.jsx
// -----------------------------------------------------------------------------
// "ตัวแยกทาง" ระหว่าง 2 โหมด — รับค่าที่เลือกจากหน้า TakeQuiz แล้วส่งไปหน้าโหมดที่ถูกต้อง
//
// choices ที่รับเข้ามา = { mode, examType, subject, difficulty }
//   mode === 'dungeon' -> <DungeonMode />  (มีสกิล, 5 หัวใจ, Monster 2 + บอส 1)
//   mode === 'timed'   -> <TimedMode />    (ไม่มีสกิล, หัวใจทอง 1 ดวงอมตะ, บอสมังกร)
//
// ไฟล์นี้ตั้งใจให้บางที่สุด: หน้าที่เดียวคือเลือกว่าจะเรนเดอร์โหมดไหน
// -----------------------------------------------------------------------------
import DungeonMode from './modes/DungeonMode.jsx'
import TimedMode from './modes/TimedMode.jsx'
import { MODE_DUNGEON, MODE_TIMED } from '../data/gameConfig.js'

export default function QuizRunner({ choices, onExit }) {
  if (choices.mode === MODE_DUNGEON) {
    return <DungeonMode choices={choices} onExit={onExit} />
  }

  if (choices.mode === MODE_TIMED) {
    return <TimedMode choices={choices} onExit={onExit} />
  }

  // กันเหนียว: ถ้า mode เพี้ยน (ไม่ควรเกิด) ให้กลับไปเลือกใหม่
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-muted">ไม่พบโหมดที่เลือก</p>
      <button onClick={onExit} className="btn-primary mt-6">กลับไปเลือกใหม่</button>
    </div>
  )
}
