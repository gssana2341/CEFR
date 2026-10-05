// คลังข้อสอบวัดระดับ CEFR (ใช้ที่ /placement) — ระดับละ 12 ข้อ ระบบสุ่มมาใช้ระดับละ 10 ข้อ
// รูปแบบ: { id, level: 'A1'|'A2'|'B1'|'B2', skill, q, c, a, e }
// แก้ไข/เพิ่มข้อแล้วรัน: npm run validate  (ต้องมีอย่างน้อย 10 ข้อต่อระดับ)
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.placement = [
  // ───── A1 ─────
  { id: 'A1-01', level: 'A1', skill: 'grammar', q: "My name ___ Anna.", c: ["am", "is", "are", "be"], a: 1, e: "my name เป็นเอกพจน์ ใช้ is" },
  { id: 'A1-02', level: 'A1', skill: 'grammar', q: "I ___ a student.", c: ["is", "are", "am", "be"], a: 2, e: "I ใช้คู่กับ am" },
  { id: 'A1-03', level: 'A1', skill: 'grammar', q: "There ___ two cats in the garden.", c: ["is", "are", "am", "be"], a: 1, e: "two cats เป็นพหูพจน์ → there are" },
  { id: 'A1-04', level: 'A1', skill: 'grammar', q: "She ___ coffee every morning.", c: ["drink", "drinks", "drinking", "is drink"], a: 1, e: "she + present simple ต้องเติม s → drinks" },
  { id: 'A1-05', level: 'A1', skill: 'grammar', q: "What time ___ it now?", c: ["is", "are", "does", "do"], a: 0, e: "ถามเวลาใช้ What time is it?" },
  { id: 'A1-06', level: 'A1', skill: 'grammar', q: "I eat ___ apple every day.", c: ["a", "an", "the", "some"], a: 1, e: "apple ขึ้นต้นด้วยเสียงสระ ใช้ an" },
  { id: 'A1-07', level: 'A1', skill: 'grammar', q: "They ___ from Canada.", c: ["is", "am", "are", "be"], a: 2, e: "they ใช้ are" },
  { id: 'A1-08', level: 'A1', skill: 'grammar', q: "___ you like pizza?", c: ["Are", "Do", "Does", "Is"], a: 1, e: "ถามด้วยกริยาแท้ (like) กับ you ใช้ Do" },
  { id: 'A1-09', level: 'A1', skill: 'vocabulary', q: "The opposite of \"hot\" is ___.", c: ["cold", "big", "new", "fast"], a: 0, e: "hot (ร้อน) ตรงข้ามกับ cold (เย็น/หนาว)" },
  { id: 'A1-10', level: 'A1', skill: 'grammar', q: "We have lunch ___ twelve o'clock.", c: ["in", "on", "at", "to"], a: 2, e: "เวลาที่เป็นจุด ใช้ at" },
  { id: 'A1-11', level: 'A1', skill: 'grammar', q: "Tom is my brother. ___ is fifteen years old.", c: ["She", "He", "It", "They"], a: 1, e: "Tom เป็นผู้ชาย ใช้ He" },
  { id: 'A1-12', level: 'A1', skill: 'vocabulary', q: "I brush my ___ every morning.", c: ["teeth", "tooths", "tooth", "toothes"], a: 0, e: "teeth เป็นพหูพจน์ไม่ปกติของ tooth" },

  // ───── A2 ─────
  { id: 'A2-01', level: 'A2', skill: 'grammar', q: "I ___ TV when you called me.", c: ["watch", "was watching", "am watching", "have watched"], a: 1, e: "กำลังทำอยู่ในอดีตแล้วถูกขัดจังหวะ ใช้ past continuous" },
  { id: 'A2-02', level: 'A2', skill: 'grammar', q: "My brother is ___ than me.", c: ["tall", "taller", "tallest", "more tall"], a: 1, e: "เปรียบเทียบสองคน ใช้ comparative: taller than" },
  { id: 'A2-03', level: 'A2', skill: 'grammar', q: "We ___ to the beach last summer.", c: ["go", "went", "gone", "goes"], a: 1, e: "last summer บอกอดีต → went" },
  { id: 'A2-04', level: 'A2', skill: 'grammar', q: "Look at the sky! It ___ rain.", c: ["will", "is going to", "is", "does"], a: 1, e: "คาดการณ์จากหลักฐานที่เห็น ใช้ be going to" },
  { id: 'A2-05', level: 'A2', skill: 'grammar', q: "We don't have ___ bread. Let's go to the shop.", c: ["some", "any", "a", "many"], a: 1, e: "ประโยคปฏิเสธใช้ any (bread นับไม่ได้)" },
  { id: 'A2-06', level: 'A2', skill: 'grammar', q: "You ___ wear a seat belt. It's the law.", c: ["must", "can", "might", "would"], a: 0, e: "กฎหมาย/ข้อบังคับ ใช้ must" },
  { id: 'A2-07', level: 'A2', skill: 'grammar', q: "How ___ does this jacket cost?", c: ["many", "much", "long", "often"], a: 1, e: "ถามราคาใช้ How much" },
  { id: 'A2-08', level: 'A2', skill: 'vocabulary', q: "I'd like to ___ a table for two at eight o'clock.", c: ["book", "borrow", "bring", "bake"], a: 0, e: "book a table = จองโต๊ะ" },
  { id: 'A2-09', level: 'A2', skill: 'grammar', q: "This is the ___ restaurant in town.", c: ["good", "better", "best", "well"], a: 2, e: "the + superlative ของ good คือ the best" },
  { id: 'A2-10', level: 'A2', skill: 'grammar', q: "If you are tired, you ___ go to bed early.", c: ["should", "must to", "can to", "are"], a: 0, e: "ให้คำแนะนำใช้ should + V1" },
  { id: 'A2-11', level: 'A2', skill: 'grammar', q: "She is very good ___ playing the piano.", c: ["in", "on", "at", "for"], a: 2, e: "good at = เก่งเรื่อง..." },
  { id: 'A2-12', level: 'A2', skill: 'grammar', q: "Did you ___ the new museum last weekend?", c: ["visit", "visited", "visiting", "visits"], a: 0, e: "หลัง did ใช้กริยาช่อง 1" },

  // ───── B1 ─────
  { id: 'B1-01', level: 'B1', skill: 'grammar', q: "I ___ in this city since 2015.", c: ["live", "lived", "have lived", "am living"], a: 2, e: "since + จุดเวลา ต่อเนื่องถึงปัจจุบัน ใช้ present perfect" },
  { id: 'B1-02', level: 'B1', skill: 'grammar', q: "If I ___ more time, I would learn Spanish.", c: ["have", "had", "will have", "would have"], a: 1, e: "second conditional: if + past simple, would + V1" },
  { id: 'B1-03', level: 'B1', skill: 'grammar', q: "This cake ___ by my grandmother.", c: ["made", "was made", "has made", "is making"], a: 1, e: "ประโยค passive ในอดีต: was + V3" },
  { id: 'B1-04', level: 'B1', skill: 'grammar', q: "The woman ___ lives next door is a pilot.", c: ["which", "who", "whose", "where"], a: 1, e: "ขยายคนที่เป็นประธาน ใช้ who" },
  { id: 'B1-05', level: 'B1', skill: 'grammar', q: "She suggested ___ to the cinema.", c: ["to go", "go", "going", "went"], a: 2, e: "suggest ตามด้วย -ing" },
  { id: 'B1-06', level: 'B1', skill: 'grammar', q: "I'm not used to ___ up so early.", c: ["get", "getting", "got", "be getting"], a: 1, e: "be used to + V-ing (to เป็นบุพบท)" },
  { id: 'B1-07', level: 'B1', skill: 'grammar', q: "He said he ___ call me later.", c: ["will", "would", "is going", "shall"], a: 1, e: "reported speech: will เลื่อนเป็น would" },
  { id: 'B1-08', level: 'B1', skill: 'grammar', q: "By the time we arrived, the film ___.", c: ["already started", "had already started", "has already started", "was already starting"], a: 1, e: "เหตุการณ์ที่เกิดก่อนอีกเหตุการณ์ในอดีต ใช้ past perfect" },
  { id: 'B1-09', level: 'B1', skill: 'vocabulary', q: "The company decided to ___ the meeting because the manager was ill.", c: ["postpone", "prepare", "promise", "provide"], a: 0, e: "postpone = เลื่อนออกไป" },
  { id: 'B1-10', level: 'B1', skill: 'grammar', q: "I'd rather ___ at home tonight.", c: ["staying", "to stay", "stay", "stayed"], a: 2, e: "would rather + V1 (ไม่มี to)" },
  { id: 'B1-11', level: 'B1', skill: 'grammar', q: "She asked me where ___.", c: ["did I live", "I lived", "do I live", "I do live"], a: 1, e: "คำถามที่ถูกเล่าต่อ (reported question) ใช้ลำดับคำแบบประโยคบอกเล่า" },
  { id: 'B1-12', level: 'B1', skill: 'grammar', q: "I look forward to ___ from you soon.", c: ["hear", "hearing", "heard", "be hearing"], a: 1, e: "look forward to + V-ing (to เป็นบุพบท)" },

  // ───── B2 ─────
  { id: 'B2-01', level: 'B2', skill: 'grammar', q: "If I ___ harder, I would have passed the exam.", c: ["studied", "had studied", "would study", "study"], a: 1, e: "third conditional: if + past perfect, would have + V3" },
  { id: 'B2-02', level: 'B2', skill: 'grammar', q: "By next year, she ___ here for ten years.", c: ["works", "will work", "will have worked", "has worked"], a: 2, e: "ระยะเวลาที่สะสมถึงจุดหนึ่งในอนาคต ใช้ future perfect" },
  { id: 'B2-03', level: 'B2', skill: 'grammar', q: "I wish I ___ more time to travel.", c: ["have", "had", "would have", "will have"], a: 1, e: "wish + past simple = เสียดายสิ่งที่ไม่เป็นจริงในปัจจุบัน" },
  { id: 'B2-04', level: 'B2', skill: 'grammar', q: "Not only ___ late, but he also forgot the documents.", c: ["he arrived", "did he arrive", "he did arrive", "arrived he"], a: 1, e: "Not only ขึ้นต้นประโยคต้องสลับประธาน-กริยาช่วย (inversion)" },
  { id: 'B2-05', level: 'B2', skill: 'grammar', q: "The report ___ by the time the manager arrived.", c: ["finished", "had been finished", "has finished", "was finishing"], a: 1, e: "past perfect passive: had been + V3" },
  { id: 'B2-06', level: 'B2', skill: 'grammar', q: "She denied ___ the money.", c: ["to take", "taking", "take", "to have take"], a: 1, e: "deny ตามด้วย -ing" },
  { id: 'B2-07', level: 'B2', skill: 'vocabulary', q: "The company has decided to cut ___ on advertising.", c: ["back", "off", "in", "through"], a: 0, e: "cut back on = ลด (ค่าใช้จ่าย)" },
  { id: 'B2-08', level: 'B2', skill: 'vocabulary', q: "Prices have ___ sharply since last year.", c: ["raised", "risen", "rose", "arisen"], a: 1, e: "rise (ไม่มีกรรม) ช่อง 3 = risen ส่วน raise ต้องมีกรรม" },
  { id: 'B2-09', level: 'B2', skill: 'grammar', q: "I'd rather you ___ smoke in here.", c: ["don't", "didn't", "won't", "not"], a: 1, e: "would rather + ประธานอื่น + past simple" },
  { id: 'B2-10', level: 'B2', skill: 'grammar', q: "She is said ___ the richest woman in the country.", c: ["being", "to be", "be", "to being"], a: 1, e: "is said + to-infinitive (โครงสร้าง passive ของ say)" },
  { id: 'B2-11', level: 'B2', skill: 'grammar', q: "Despite ___ hard, he failed the test.", c: ["of working", "working", "he worked", "to work"], a: 1, e: "despite + V-ing / noun" },
  { id: 'B2-12', level: 'B2', skill: 'grammar', q: "The more you practise, ___ you become.", c: ["the better", "better", "the best", "best"], a: 0, e: "the + comparative … the + comparative" },
];
