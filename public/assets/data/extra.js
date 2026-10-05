// ข้อสอบฝึกเพิ่มเติม (ที่ /extra) — ข้อใหม่นอกเหนือจากหนังสือ แบ่งตามหัวข้อ
// รูปแบบ: { n, level, topic, q, c, a, e }
// แก้ไข/เพิ่มข้อแล้วรัน: npm run validate
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.extra = [
  // ───── Phrasal verbs ─────
  { n: 1, level: 'A2', topic: 'Phrasal verbs', q: "I'm so tired. I couldn't ___ this morning.", c: ["get up", "get on", "get off", "get in"], a: 0, e: "get up = ลุกจากเตียง" },
  { n: 2, level: 'A2', topic: 'Phrasal verbs', q: "Can you ___ the TV? It's too loud.", c: ["turn down", "turn up", "turn into", "turn on"], a: 0, e: "turn down = ลดเสียง (turn up = เพิ่มเสียง)" },
  { n: 3, level: 'B1', topic: 'Phrasal verbs', q: "We ran ___ milk, so I went to the shop.", c: ["out of", "away from", "off of", "up with"], a: 0, e: "run out of = ของหมดเกลี้ยง" },
  { n: 4, level: 'A2', topic: 'Phrasal verbs', q: "I'm looking ___ my keys. Have you seen them?", c: ["at", "for", "after", "up"], a: 1, e: "look for = มองหา (look at = มองดู, look after = ดูแล)" },
  { n: 5, level: 'B1', topic: 'Phrasal verbs', q: "She takes ___ her mother. They both have curly hair.", c: ["after", "over", "up", "off"], a: 0, e: "take after = หน้าตา/นิสัยเหมือน (ญาติผู้ใหญ่)" },
  { n: 6, level: 'A2', topic: 'Phrasal verbs', q: "The plane ___ at 9:00 and landed at 11:30.", c: ["took off", "took out", "took on", "took in"], a: 0, e: "take off = (เครื่องบิน) ขึ้นบิน" },
  { n: 7, level: 'A2', topic: 'Phrasal verbs', q: "Please ___ your shoes before you come in.", c: ["take off", "give up", "look after", "turn off"], a: 0, e: "take off = ถอด (รองเท้า เสื้อผ้า)" },
  { n: 8, level: 'B1', topic: 'Phrasal verbs', q: "He gave ___ smoking last year, and he feels much better.", c: ["up", "off", "out", "away"], a: 0, e: "give up + V-ing = เลิกทำ" },

  // ───── Collocations & vocabulary ─────
  { n: 9, level: 'A2', topic: 'Collocations', q: "Could you do me a ___?", c: ["favour", "kindly", "helper", "gift"], a: 0, e: "do someone a favour = ช่วยเหลือใครสักอย่าง" },
  { n: 10, level: 'A2', topic: 'Collocations', q: "Everyone ___ mistakes sometimes.", c: ["makes", "does", "has", "takes"], a: 0, e: "make a mistake = ทำผิดพลาด" },
  { n: 11, level: 'A2', topic: 'Collocations', q: "It was a long journey, so we ___ a break halfway.", c: ["took", "did", "made", "put"], a: 0, e: "take a break = พักสักครู่" },
  { n: 12, level: 'B1', topic: 'Collocations', q: "You should ___ attention to the teacher.", c: ["pay", "do", "make", "put"], a: 0, e: "pay attention to = ใส่ใจ/ตั้งใจฟัง" },
  { n: 13, level: 'A2', topic: 'Collocations', q: "I'd like to ___ a photo of you.", c: ["take", "do", "make", "draw"], a: 0, e: "take a photo = ถ่ายรูป" },
  { n: 14, level: 'B1', topic: 'Collocations', q: "He ___ a lot of weight after the illness.", c: ["lost", "missed", "left", "failed"], a: 0, e: "lose weight = น้ำหนักลด" },
  { n: 15, level: 'B1', topic: 'Vocabulary', q: "I need to ___ some money from the cash machine.", c: ["withdraw", "deposit", "lend", "owe"], a: 0, e: "withdraw = ถอนเงิน (deposit = ฝากเงิน)" },
  { n: 16, level: 'A2', topic: 'Vocabulary', q: "Could you ___ me your pen? I forgot mine.", c: ["lend", "borrow", "owe", "rent"], a: 0, e: "lend someone something = ให้ยืม (borrow = ไปยืมมา)" },

  // ───── Prepositions ─────
  { n: 17, level: 'A2', topic: 'Prepositions', q: "She is afraid ___ spiders.", c: ["of", "from", "at", "with"], a: 0, e: "afraid of = กลัว..." },
  { n: 18, level: 'A2', topic: 'Prepositions', q: "I'm interested ___ learning Japanese.", c: ["in", "on", "at", "about"], a: 0, e: "interested in = สนใจ..." },
  { n: 19, level: 'B1', topic: 'Prepositions', q: "He is married ___ a doctor.", c: ["with", "to", "by", "at"], a: 1, e: "married to = แต่งงานกับ..." },
  { n: 20, level: 'A2', topic: 'Prepositions', q: "We arrived ___ the airport at six.", c: ["to", "at", "in", "on"], a: 1, e: "arrive at + สถานที่เฉพาะ (arrive in + เมือง/ประเทศ)" },
  { n: 21, level: 'B1', topic: 'Prepositions', q: "She apologised ___ being late.", c: ["for", "of", "about", "to"], a: 0, e: "apologise for = ขอโทษสำหรับ..." },
  { n: 22, level: 'B1', topic: 'Prepositions', q: "I depend ___ my parents for money.", c: ["on", "of", "from", "at"], a: 0, e: "depend on = พึ่งพา" },
  { n: 23, level: 'A2', topic: 'Prepositions', q: "This bag belongs ___ my sister.", c: ["for", "to", "of", "with"], a: 1, e: "belong to = เป็นของ..." },
  { n: 24, level: 'A2', topic: 'Prepositions', q: "I agree ___ you completely.", c: ["with", "to", "on", "for"], a: 0, e: "agree with + คน/ความเห็น" },
  { n: 25, level: 'A2', topic: 'Prepositions', q: "What's the matter ___ him? He looks sad.", c: ["with", "for", "to", "at"], a: 0, e: "What's the matter with …? = … เป็นอะไรไป" },
  { n: 26, level: 'B1', topic: 'Prepositions', q: "He's very proud ___ his daughter.", c: ["of", "for", "at", "with"], a: 0, e: "proud of = ภูมิใจใน..." },

  // ───── Word forms ─────
  { n: 27, level: 'B1', topic: 'Word forms', q: "She is a very ___ singer. Everyone loves her voice.", c: ["talent", "talented", "talently", "talents"], a: 1, e: "ขยายนาม (singer) ต้องเป็นคุณศัพท์ → talented" },
  { n: 28, level: 'B1', topic: 'Word forms', q: "He answered all the questions ___.", c: ["correct", "correctly", "correction", "corrected"], a: 1, e: "ขยายกริยา (answered) ต้องเป็นกริยาวิเศษณ์ → correctly" },
  { n: 29, level: 'B1', topic: 'Word forms', q: "The ___ of the new bridge took two years.", c: ["construct", "construction", "constructive", "constructed"], a: 1, e: "หลัง the เป็นนามประธาน → construction" },
  { n: 30, level: 'B1', topic: 'Word forms', q: "I was ___ when I heard the good news.", c: ["delight", "delighted", "delighting", "delightfully"], a: 1, e: "บอกความรู้สึกของคน ใช้ -ed → delighted" },
  { n: 31, level: 'A2', topic: 'Word forms', q: "It is ___ to drive without a licence.", c: ["legal", "illegal", "unlegal", "nonlegal"], a: 1, e: "ผิดกฎหมาย = illegal (ใช้ prefix il-)" },
  { n: 32, level: 'A2', topic: 'Word forms', q: "She spoke so ___ that nobody could hear her.", c: ["quiet", "quietly", "quietness", "quieter"], a: 1, e: "ขยายกริยา spoke → quietly" },
  { n: 33, level: 'A2', topic: 'Word forms', q: "The film was so ___ that I fell asleep.", c: ["boring", "bored", "bore", "bores"], a: 0, e: "สิ่งที่ทำให้รู้สึกเบื่อ ใช้ -ing → boring" },
  { n: 34, level: 'A2', topic: 'Word forms', q: "I was very ___ in the history lesson.", c: ["interesting", "interested", "interest", "interests"], a: 1, e: "ความรู้สึกของคน ใช้ -ed → interested" },

  // ───── Everyday English ─────
  { n: 35, level: 'A2', topic: 'Everyday English', q: "A: Would you like some more tea?\nB: ___", c: ["Yes, please. Just a little.", "Yes, I'm very well.", "No, I don't have.", "Yes, I would not."], a: 0, e: "ตอบรับคำเสนอด้วย Yes, please." },
  { n: 36, level: 'A2', topic: 'Everyday English', q: "A: Excuse me, how do I get to the station?\nB: ___", c: ["Go straight and turn left at the bank.", "I'm fine, thank you.", "It takes two hours to eat.", "Yes, I like trains."], a: 0, e: "ถามทาง ต้องตอบด้วยการบอกทาง" },
  { n: 37, level: 'A1', topic: 'Everyday English', q: "A: I'm sorry I'm late.\nB: ___", c: ["That's okay. Please sit down.", "You're welcome.", "Nice to meet you.", "Happy birthday!"], a: 0, e: "ตอบคำขอโทษ: That's okay. / No problem." },
  { n: 38, level: 'A1', topic: 'Everyday English', q: "A: Thanks for your help.\nB: ___", c: ["You're welcome.", "I'm sorry.", "Excuse me.", "Good luck."], a: 0, e: "ตอบคำขอบคุณ: You're welcome." },
  { n: 39, level: 'A2', topic: 'Everyday English', q: "A: Can I speak to Mr. Brown, please?\nB: ___", c: ["I'm afraid he's out at the moment.", "He's a nice man.", "Yes, you speak well.", "I'm Brown, thanks."], a: 0, e: "ตอบสายโทรศัพท์ว่าไม่อยู่: I'm afraid he's out." },
  { n: 40, level: 'A2', topic: 'Everyday English', q: "A: What do you do for a living?\nB: ___", c: ["I work in a bank.", "I'm watching TV.", "I do it every day.", "Very well, thanks."], a: 0, e: "What do you do (for a living)? = ถามอาชีพ" },
  { n: 41, level: 'B1', topic: 'Everyday English', q: "A: Why don't we go for a walk?\nB: ___", c: ["Good idea. Let me get my coat.", "Because I walk.", "No, I don't do.", "It's a long walk, thanks."], a: 0, e: "Why don't we …? = ชวน/เสนอ ตอบรับด้วย Good idea." },
  { n: 42, level: 'B1', topic: 'Everyday English', q: "A: How long have you been learning English?\nB: ___", c: ["For about three years.", "Since three years.", "Three years ago I learn.", "At three years."], a: 0, e: "How long + present perfect ตอบด้วย for + ช่วงเวลา (since ใช้กับจุดเวลา)" },

  // ───── Common mistakes ─────
  { n: 43, level: 'A2', topic: 'Common mistakes', q: "I have been living here ___ five years.", c: ["for", "since", "from", "during"], a: 0, e: "for + ช่วงเวลา (five years) / since + จุดเวลา (2019)" },
  { n: 44, level: 'A2', topic: 'Common mistakes', q: "She ___ me yesterday to say hello.", c: ["call", "calls", "called", "has called"], a: 2, e: "yesterday เป็นเวลาที่จบแล้ว ใช้ past simple → called" },
  { n: 45, level: 'A2', topic: 'Common mistakes', q: "My teacher gives us a lot of ___.", c: ["homeworks", "homework", "a homework", "homework's"], a: 1, e: "homework เป็นนามนับไม่ได้ ไม่เติม s" },
  { n: 46, level: 'A2', topic: 'Common mistakes', q: "I don't have ___ money with me.", c: ["some", "any", "a few", "many"], a: 1, e: "ประโยคปฏิเสธใช้ any (money นับไม่ได้ จึงไม่ใช้ a few / many)" },
  { n: 47, level: 'A2', topic: 'Common mistakes', q: "The news ___ very surprising.", c: ["are", "were", "is", "be"], a: 2, e: "news เป็นนามนับไม่ได้ ใช้กริยาเอกพจน์ → is" },
  { n: 48, level: 'B1', topic: 'Common mistakes', q: "He told me ___ he was tired.", c: ["that", "to", "for", "what"], a: 0, e: "tell + คน + that + ประโยค (reported speech)" },
];
