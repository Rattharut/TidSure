// src/middleware/errorHandler.js
// -----------------------------------------------------------------------------
// ตัวจัดการ error รวมของทั้ง API
// Express รู้ว่าฟังก์ชันนี้คือ error handler เพราะรับ 4 พารามิเตอร์ (err, req, res, next)
// เวลา controller โยน error หรือเรียก next(err) จะวิ่งมาจบที่นี่ แล้วตอบ JSON กลับไปอย่างเป็นระเบียบ
// -----------------------------------------------------------------------------
export function errorHandler(err, req, res, next) {
  console.error('เกิดข้อผิดพลาด:', err)

  const status = err.status || 500
  res.status(status).json({
    ok: false,
    message: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    ...(err.debug ? { debug: err.debug } : {}), // DEBUG ชั่วคราว จะเอาออกทีหลัง
  })
}
