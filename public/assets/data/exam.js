// ตั้งค่าโหมดสอบจำลอง (ที่ /exam)
//   durationMin = เวลาสอบทั้งหมด (นาที)
//   parts       = ส่วนของข้อสอบ เรียงตามลำดับที่ปรากฏ
//     type 'mcq'   : สุ่ม count ข้อจากชุดข้อมูล source (grammar / conversations / extra)  → 1 คะแนนต่อข้อ
//     type 'cloze' : สุ่ม count บทความจาก source 'cloze'                                  → 1 คะแนนต่อช่องว่าง
//
// เพิ่ม Part 4 (Listening) ทีหลัง: ดูหัวข้อ "เพิ่ม Part 4" ใน README.md
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.exam = {
  durationMin: 60,
  parts: [
    { id: 'grammar', title: 'Part 1 · Grammar', type: 'mcq', source: 'grammar', count: 30 },
    { id: 'conversations', title: 'Part 2 · Conversations', type: 'mcq', source: 'conversations', count: 20 },
    { id: 'cloze', title: 'Part 3 · Cloze Test', type: 'cloze', source: 'cloze', count: 3 },
    // { id: 'listening', title: 'Part 4 · Listening', type: 'listening', ... }   ← เพิ่มที่นี่ภายหลัง
  ],
};
