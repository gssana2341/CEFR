// โครงระดับ C1–C2 (ยังไม่มีเนื้อหา) — แสดงในแท็บเรียนเป็นรายการ "เร็วๆ นี้" และในแผนที่ระดับของหน้าแรก
// เมื่อเขียนบทเรียนจริงแล้ว: ย้ายหัวข้อไปที่ content/lessons.js (level: 'C1' / 'C2') แล้วลบออกจากรายการนี้
// ข้อมูลนี้เปิดเผยได้ (มีแค่ชื่อหัวข้อ ไม่มีเนื้อหา) · แก้แล้วรัน npm run validate
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.roadmap = {
  levels: [
    {
      id: 'C1', name: 'C1', thai: 'ขั้นสูง',
      lessons: [
        ['Inversion', 'ประโยคกลับโครงสร้างเพื่อเน้น'],
        ['Mixed and inverted conditionals', 'เงื่อนไขผสมและแบบกลับโครงสร้าง'],
        ['Advanced passives', 'ประโยค passive ขั้นสูง'],
        ['Cleft sentences', 'ประโยคเน้นแบบ It is … that / What … is'],
        ['Participle clauses', 'อนุประโยคที่ใช้ V-ing / V3'],
        ['Subjunctive and unreal past', 'subjunctive และอดีตที่ไม่จริง'],
        ['Nominalisation', 'เปลี่ยนกริยาเป็นนามเพื่อความเป็นทางการ'],
        ['Hedging and advanced modality', 'การพูดเลี่ยงและ modal ขั้นสูง'],
        ['Discourse markers and cohesion', 'คำเชื่อมความและความต่อเนื่อง'],
        ['Advanced collocations', 'คำที่มักใช้คู่กันระดับสูง'],
        ['Register: formal and informal', 'ระดับภาษาทางการ/ไม่ทางการ'],
        ['Reduced clauses', 'อนุประโยคแบบย่อ'],
      ],
      practice: 'ชุดฝึกไวยากรณ์และสำนวนขั้นสูง',
    },
    {
      id: 'C2', name: 'C2', thai: 'เชี่ยวชาญ',
      lessons: [
        ['Stylistic inversion and fronting', 'การกลับโครงสร้างเชิงสไตล์'],
        ['Ellipsis and substitution', 'การละและการแทนที่คำ'],
        ['Idioms and nuance', 'สำนวนและความหมายแฝง'],
        ['Academic writing features', 'ลักษณะภาษาเขียนเชิงวิชาการ'],
        ['Complex noun phrases', 'วลีนามซับซ้อน'],
        ['Paragraph-level cohesion', 'ความเชื่อมโยงระดับย่อหน้า'],
        ['Irony, understatement and tone', 'การประชด การพูดลดทอน และน้ำเสียง'],
        ['Near-native error analysis', 'วิเคราะห์ข้อผิดพลาดระดับใกล้เจ้าของภาษา'],
      ],
      practice: 'ชุดฝึกระดับ C2',
    },
  ],
};
