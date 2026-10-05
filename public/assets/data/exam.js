// ตั้งค่าโหมดสอบจำลอง (ที่ /exam)
//
// profiles = รูปแบบการสอบที่ให้ผู้ใช้เลือก
//   oneWay   true  = ย้อนกลับข้อก่อนหน้าไม่ได้ ต้องตอบก่อนไปข้อถัดไป (แบบ EF SET)
//            false = ข้ามไปมา/ทำเครื่องหมายข้อได้
//   sections = ส่วนของข้อสอบ ทำเรียงตามลำดับ แต่ละส่วนมีนาฬิกาของตัวเอง (เวลาไม่ยกไปส่วนถัดไป)
//     minutes     เวลาของส่วนนั้น (นาที)
//     comingSoon  true = แสดงว่า "เร็วๆ นี้" และยังไม่นับรวมเวลา
//     parts       ชุดข้อสอบในส่วนนั้น
//       type 'mcq'   : สุ่ม count ข้อจาก source (grammar / conversations / extra)  → 1 คะแนนต่อข้อ
//       type 'cloze' : สุ่ม count บทความจาก 'cloze'                                 → 1 คะแนนต่อช่องว่าง
//
// อ้างอิง EF SET (efset.org): 50 นาที = Reading 25 + Listening 25, ไม่จำกัดเวลาต่อข้อ, ย้อนกลับไม่ได้
// เพิ่ม Part Listening ทีหลัง: ดูหัวข้อ "เพิ่ม Part 4" ใน README.md
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.exam = {
  profiles: [
    {
      id: 'efset',
      title: 'แบบ EF SET',
      tag: 'แนะนำ',
      oneWay: true,
      desc: 'จำลองกติกาของ EF SET: แยกเป็นส่วน ส่วนละ 25 นาที ย้อนกลับไม่ได้ ไม่มีเฉลยระหว่างทำ',
      sections: [
        {
          id: 'reading',
          title: 'Reading',
          minutes: 25,
          parts: [
            { id: 'grammar', title: 'Grammar', type: 'mcq', source: 'grammar', count: 20 },
            { id: 'conversations', title: 'Conversations', type: 'mcq', source: 'conversations', count: 15 },
            { id: 'cloze', title: 'Cloze Test', type: 'cloze', source: 'cloze', count: 2 },
          ],
        },
        { id: 'listening', title: 'Listening', minutes: 25, comingSoon: true, parts: [] },   // ← เพิ่มข้อสอบฟังที่นี่ภายหลัง
      ],
    },
    {
      id: 'flex',
      title: 'แบบยืดหยุ่น',
      oneWay: false,
      desc: 'ซ้อมแบบสบายๆ: ข้ามไปมาระหว่างข้อได้ ทำเครื่องหมายข้อที่อยากกลับมาดู และแก้คำตอบได้จนกว่าจะส่ง',
      sections: [
        {
          id: 'all',
          title: 'ทั้งชุด',
          minutes: 60,
          parts: [
            { id: 'grammar', title: 'Part 1 · Grammar', type: 'mcq', source: 'grammar', count: 30 },
            { id: 'conversations', title: 'Part 2 · Conversations', type: 'mcq', source: 'conversations', count: 20 },
            { id: 'cloze', title: 'Part 3 · Cloze Test', type: 'cloze', source: 'cloze', count: 3 },
          ],
        },
      ],
    },
  ],

  // ตารางเทียบคะแนน EF SET (0-100) กับ CEFR ตามหน้าทางการ https://www.efset.org/cefr/
  bands: [
    ['A1', 'Beginner', '1–30'],
    ['A2', 'Elementary', '31–40'],
    ['B1', 'Intermediate', '41–50'],
    ['B2', 'Upper intermediate', '51–60'],
    ['C1', 'Advanced', '61–70'],
    ['C2', 'Proficient', '71–100'],
  ],
};
