// 12 Tenses — ใช้กับการ์ด "สูตร tense" หลังตอบข้อสอบ และหน้า /tenses
// รูปแบบ: { id, group: past|present|future, kind: simple|continuous|perfect|perfectcont, en, th, short,
//           form: { aff, neg, q }, use: [...], signals: [...], tip, examples: [[อังกฤษ, ไทย], ...] }
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.tenses = [
  // ───────────── Present ─────────────
  {
    id: 'present-simple', group: 'present', kind: 'simple',
    en: 'Present Simple', th: 'ปัจจุบันกาลธรรมดา', short: 'V1 / V1+s',
    form: {
      aff: 'S + V1  (he / she / it + V1 + s / es)',
      neg: 'S + do / does + not + V1',
      q: 'Do / Does + S + V1 … ?',
    },
    use: [
      'ความจริงทั่วไป: Water boils at 100°C.',
      'กิจวัตรและนิสัย: I get up at six every day.',
      'ตารางเวลาที่แน่นอน: The train leaves at nine.',
    ],
    signals: ['always', 'usually', 'often', 'sometimes', 'never', 'every day', 'on Sundays', 'once a week'],
    tip: 'he / she / it ต้องเติม s หรือ es · พอมี do / does / doesn\'t แล้ว กริยาหลักกลับเป็น V1 ไม่เติม s',
    examples: [
      ['She works in a bank.', 'เธอทำงานในธนาคาร'],
      ['I don\'t drink coffee.', 'ฉันไม่ดื่มกาแฟ'],
    ],
  },
  {
    id: 'present-continuous', group: 'present', kind: 'continuous',
    en: 'Present Continuous', th: 'ปัจจุบันกาลต่อเนื่อง', short: 'am/is/are + V-ing',
    form: {
      aff: 'S + am / is / are + V-ing',
      neg: 'S + am / is / are + not + V-ing',
      q: 'Am / Is / Are + S + V-ing … ?',
    },
    use: [
      'กำลังเกิดขึ้นตอนที่พูด: She is studying now.',
      'ชั่วคราวในช่วงนี้: I am staying with my uncle this week.',
      'แผนนัดหมายในอนาคตอันใกล้: We are meeting Anna tonight.',
    ],
    signals: ['now', 'right now', 'at the moment', 'today', 'this week', 'these days', 'currently', 'Look!', 'Listen!'],
    tip: 'กริยาบอกสภาวะ (know, like, want, need, understand) ไม่ใช้รูป -ing',
    examples: [
      ['Look! It is raining.', 'ดูสิ ฝนกำลังตก'],
      ['They are not playing football.', 'พวกเขาไม่ได้กำลังเล่นฟุตบอล'],
    ],
  },
  {
    id: 'present-perfect', group: 'present', kind: 'perfect',
    en: 'Present Perfect', th: 'ปัจจุบันกาลสมบูรณ์', short: 'have/has + V3',
    form: {
      aff: 'S + have / has + V3',
      neg: 'S + have / has + not + V3',
      q: 'Have / Has + S + V3 … ?',
    },
    use: [
      'ประสบการณ์ (เคย / ไม่เคย): Have you ever been to Japan?',
      'เพิ่งเกิด หรือผลที่ยังเห็นตอนนี้: I have just finished.',
      'ต่อเนื่องจนถึงปัจจุบัน (for / since): I have lived here since 2018.',
      'ห้ามใช้กับเวลาที่จบไปแล้วและระบุชัด (yesterday, last week, ago) → ใช้ past simple',
    ],
    signals: ['ever', 'never', 'already', 'yet', 'just', 'recently', 'so far', 'for + ช่วงเวลา', 'since + จุดเวลา', 'how long', 'this week'],
    tip: 'for = ช่วงเวลา (for two years) · since = จุดเริ่มต้น (since 2018) · been = ไปแล้วกลับมา · gone = ไปแล้วยังไม่กลับ',
    examples: [
      ['I have lived here for five years.', 'ฉันอยู่ที่นี่มาห้าปีแล้ว'],
      ['She hasn\'t called me yet.', 'เธอยังไม่โทรหาฉันเลย'],
    ],
  },
  {
    id: 'present-perfect-continuous', group: 'present', kind: 'perfectcont',
    en: 'Present Perfect Continuous', th: 'ปัจจุบันกาลสมบูรณ์ต่อเนื่อง', short: 'have/has been + V-ing',
    form: {
      aff: 'S + have / has + been + V-ing',
      neg: 'S + have / has + not + been + V-ing',
      q: 'Have / Has + S + been + V-ing … ?',
    },
    use: [
      'เน้น "ระยะเวลา" ที่ทำต่อเนื่องมาจนถึงตอนนี้: I have been waiting for two hours.',
      'เพิ่งหยุดและยังเห็นผล: She is tired. She has been running.',
    ],
    signals: ['for', 'since', 'all day', 'all morning', 'lately', 'recently', 'how long'],
    tip: 'เน้นผลสำเร็จ/จำนวน → present perfect (I have written three emails.) · เน้นระยะเวลา → continuous',
    examples: [
      ['It has been raining since morning.', 'ฝนตกมาตั้งแต่เช้า'],
      ['How long have you been learning English?', 'คุณเรียนภาษาอังกฤษมานานแค่ไหนแล้ว'],
    ],
  },

  // ───────────── Past ─────────────
  {
    id: 'past-simple', group: 'past', kind: 'simple',
    en: 'Past Simple', th: 'อดีตกาลธรรมดา', short: 'V2',
    form: {
      aff: 'S + V2  (to be: was / were)',
      neg: 'S + did + not + V1',
      q: 'Did + S + V1 … ?',
    },
    use: [
      'เหตุการณ์ที่เกิดและจบไปแล้ว ในเวลาที่ระบุหรือรู้กัน: I saw a film last night.',
      'เล่าเรื่องในอดีตเรียงตามลำดับ',
      'นิสัยหรือสภาพในอดีต: When I was a child, I lived in Chiang Mai.',
    ],
    signals: ['yesterday', 'last night / week / year', 'ago', 'in 2020', 'when I was a child', 'then', 'the other day'],
    tip: 'พอมี did / didn\'t แล้ว กริยากลับเป็น V1 (✗ didn\'t went → ✓ didn\'t go) · กริยาไม่ปกติต้องจำช่อง 2',
    examples: [
      ['She went to Phuket last month.', 'เดือนที่แล้วเธอไปภูเก็ต'],
      ['Did you finish your homework?', 'คุณทำการบ้านเสร็จหรือยัง'],
    ],
  },
  {
    id: 'past-continuous', group: 'past', kind: 'continuous',
    en: 'Past Continuous', th: 'อดีตกาลต่อเนื่อง', short: 'was/were + V-ing',
    form: {
      aff: 'S + was / were + V-ing',
      neg: 'S + was / were + not + V-ing',
      q: 'Was / Were + S + V-ing … ?',
    },
    use: [
      'กำลังทำอยู่ ณ เวลาหนึ่งในอดีต: At eight last night, I was watching TV.',
      'กำลังทำอยู่แล้วถูกขัดจังหวะด้วยอีกเหตุการณ์ (past simple): I was cooking when he called.',
      'สองเหตุการณ์เกิดพร้อมกัน (while): While she was cooking, he was cleaning.',
    ],
    signals: ['while', 'when', 'as', 'at that time', 'at 8 o\'clock last night', 'all day yesterday'],
    tip: 'เหตุการณ์ที่ "ยาวกว่า/เกิดอยู่ก่อน" ใช้ past continuous · เหตุการณ์ที่ "สั้น/มาขัด" ใช้ past simple',
    examples: [
      ['I was watching TV when you called.', 'ฉันกำลังดูทีวีตอนที่คุณโทรมา'],
      ['They were playing football at five.', 'ตอนห้าโมงพวกเขากำลังเล่นฟุตบอลอยู่'],
    ],
  },
  {
    id: 'past-perfect', group: 'past', kind: 'perfect',
    en: 'Past Perfect', th: 'อดีตกาลสมบูรณ์', short: 'had + V3',
    form: {
      aff: 'S + had + V3',
      neg: 'S + had + not + V3',
      q: 'Had + S + V3 … ?',
    },
    use: [
      'เหตุการณ์ที่เกิด "ก่อน" อีกเหตุการณ์หนึ่งในอดีต (ใช้คู่กับ past simple): When I arrived, the film had already started.',
      'ในประโยคเล่าต่อ (reported speech): She said she had never seen snow.',
    ],
    signals: ['before', 'after', 'by the time', 'when', 'already', 'just', 'until', 'never … before'],
    tip: 'มีสองเหตุการณ์ในอดีต: ตัวที่เกิดก่อน = had + V3, ตัวที่เกิดหลัง = V2',
    examples: [
      ['I realized that I had left my keys at home.', 'ฉันนึกขึ้นได้ว่าลืมกุญแจไว้ที่บ้าน'],
      ['By the time we arrived, the shop had closed.', 'ตอนที่เราไปถึง ร้านปิดไปแล้ว'],
    ],
  },
  {
    id: 'past-perfect-continuous', group: 'past', kind: 'perfectcont',
    en: 'Past Perfect Continuous', th: 'อดีตกาลสมบูรณ์ต่อเนื่อง', short: 'had been + V-ing',
    form: {
      aff: 'S + had + been + V-ing',
      neg: 'S + had + not + been + V-ing',
      q: 'Had + S + been + V-ing … ?',
    },
    use: [
      'เน้นระยะเวลาที่ทำต่อเนื่องมาจนถึงจุดหนึ่งในอดีต: They had been waiting for an hour when the bus came.',
      'บอกสาเหตุของสภาพในอดีต: He was tired because he had been working all night.',
    ],
    signals: ['for', 'since', 'all day', 'how long', 'before', 'by the time'],
    tip: 'เหมือน present perfect continuous แต่ "ถอยหลัง" ไปเป็นอดีต',
    examples: [
      ['She had been crying, so her eyes were red.', 'เธอร้องไห้มา ตาจึงแดง'],
      ['I had been studying for three hours before I took a break.', 'ฉันอ่านหนังสือมาสามชั่วโมงก่อนจะพัก'],
    ],
  },

  // ───────────── Future ─────────────
  {
    id: 'future-simple', group: 'future', kind: 'simple',
    en: 'Future Simple', th: 'อนาคตกาลธรรมดา', short: 'will + V1',
    form: {
      aff: 'S + will + V1   |   S + am / is / are + going to + V1',
      neg: 'S + will not (won\'t) + V1',
      q: 'Will + S + V1 … ?',
    },
    use: [
      'will = ตัดสินใจทันที คำสัญญา ข้อเสนอ หรือคาดการณ์ (มัก think / probably): I\'ll help you.',
      'be going to = แผนที่ตั้งใจไว้ก่อนแล้ว หรือคาดการณ์จากหลักฐานตรงหน้า: Look at those clouds! It is going to rain.',
    ],
    signals: ['tomorrow', 'next week / month', 'soon', 'tonight', 'in two days', 'I think', 'probably', 'perhaps'],
    tip: 'หลัง if / when / before / after / as soon as / until ที่พูดถึงอนาคต ให้ใช้ present simple ไม่ใช้ will',
    examples: [
      ['I will call you tomorrow.', 'พรุ่งนี้ฉันจะโทรหา'],
      ['We are going to buy a new car.', 'เราตั้งใจจะซื้อรถคันใหม่'],
    ],
  },
  {
    id: 'future-continuous', group: 'future', kind: 'continuous',
    en: 'Future Continuous', th: 'อนาคตกาลต่อเนื่อง', short: 'will be + V-ing',
    form: {
      aff: 'S + will + be + V-ing',
      neg: 'S + will not (won\'t) + be + V-ing',
      q: 'Will + S + be + V-ing … ?',
    },
    use: [
      'จะกำลังทำอยู่ ณ เวลาหนึ่งในอนาคต: This time tomorrow, I will be flying to Phuket.',
      'บอกว่ามีกิจกรรมอยู่ตอนนั้น (เลี่ยงรบกวน): Don\'t call at seven. We will be having dinner.',
    ],
    signals: ['this time tomorrow', 'this time next week', 'at 8 pm tomorrow', 'when you arrive', 'at noon on Friday'],
    tip: 'ถ้าเป็นเหตุการณ์ที่เสร็จสิ้นก่อนเวลานั้น ให้ใช้ future perfect แทน',
    examples: [
      ['At nine tomorrow, I will be sitting in the exam room.', 'เก้าโมงพรุ่งนี้ ฉันจะกำลังนั่งอยู่ในห้องสอบ'],
      ['Mary will be waiting for you at the station.', 'แมรี่จะรออยู่ที่สถานี'],
    ],
  },
  {
    id: 'future-perfect', group: 'future', kind: 'perfect',
    en: 'Future Perfect', th: 'อนาคตกาลสมบูรณ์', short: 'will have + V3',
    form: {
      aff: 'S + will + have + V3',
      neg: 'S + will not (won\'t) + have + V3',
      q: 'Will + S + have + V3 … ?',
    },
    use: [
      'จะ "เสร็จสิ้นแล้ว" ก่อนเวลาหนึ่งในอนาคต: I will have finished the report by Friday.',
      'นับระยะเวลาสะสมถึงจุดในอนาคต: By next year, she will have worked here for ten years.',
    ],
    signals: ['by tomorrow', 'by next year', 'by 2030', 'by the time + present simple', 'before + เวลาอนาคต'],
    tip: 'จำคำว่า by + เวลาอนาคต = ภายในเวลานั้น ต้องเสร็จแล้ว → will have + V3',
    examples: [
      ['By the time you arrive, I will have cooked dinner.', 'ตอนที่คุณมาถึง ฉันจะทำอาหารเย็นเสร็จแล้ว'],
      ['They will have left before we get there.', 'พวกเขาจะออกไปแล้วก่อนที่เราจะไปถึง'],
    ],
  },
  {
    id: 'future-perfect-continuous', group: 'future', kind: 'perfectcont',
    en: 'Future Perfect Continuous', th: 'อนาคตกาลสมบูรณ์ต่อเนื่อง', short: 'will have been + V-ing',
    form: {
      aff: 'S + will + have + been + V-ing',
      neg: 'S + will not (won\'t) + have + been + V-ing',
      q: 'Will + S + have + been + V-ing … ?',
    },
    use: [
      'เน้น "ระยะเวลาที่ทำต่อเนื่อง" จนถึงจุดหนึ่งในอนาคต: By June, I will have been studying English for five years.',
    ],
    signals: ['for + ระยะเวลา + by …', 'by next month …', 'when he retires …'],
    tip: 'ใช้น้อยมาก มักมี for + ระยะเวลา และ by / when บอกจุดในอนาคต',
    examples: [
      ['When he retires, he will have been teaching for 30 years.', 'ตอนเกษียณ เขาจะสอนมาครบ 30 ปี'],
      ['By 2030, we will have been living here for a decade.', 'ถึงปี 2030 เราจะอยู่ที่นี่มาครบสิบปี'],
    ],
  },
];
