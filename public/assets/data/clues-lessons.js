// Sentence mark-up annotations for the lesson exercises: lesson id → exercise index → annotation.
// Format and how to add more: see the header of assets/js/markup.js and the README.
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.clues = window.CEFR_DATA.clues || {};
window.CEFR_DATA.clues.lessons = {
  "to-be": {
    0: { lesson: "to-be", links: [["My brother", "is", "he → is"]], tags: [["is", "he/she/it → is"]], tip: "My brother = he (เอกพจน์) → is · I → am · you/we/they → are" },
    1: { lesson: "to-be", links: [["They", "are", "They → are"]], tags: [["are", "they/we/you → are"]], tip: "They / We / You → are" },
    2: { lesson: "to-be", links: [["you", "Are", "you → are"]], tags: [["Are", "Are + you ...?"]], tip: "คำถามกับ you → Are you...? (ตอบ Yes, I am.)" },
    3: { tense: "present-simple", links: [["Which sentence is correct?", null, "like เป็นกริยาแท้ → ไม่ต้องมี is/are"]], tip: "like เป็นกริยาทั่วไป จึงไม่ต้องเติม is/are · she + likes (เติม s)" },
  },
  "articles": {
    0: { lesson: "articles", links: [["umbrella", "an", "เสียงสระ → an"]], tags: [["an", "an + สระ"]], tip: "umbrella ขึ้นต้นด้วยเสียงสระ (อัม-) → an" },
    1: { lesson: "articles", links: [["I saw", "a", "พูดถึงครั้งแรก → a"], ["was great", "the", "พูดซ้ำ (รู้แล้ว) → the"]], tags: [["the", "ระบุแล้ว"]], tip: "ครั้งแรก → a / an · พูดถึงสิ่งเดิมซ้ำ → the" },
    2: { lesson: "articles", links: [["I like", "(no article)", "พูดกว้าง ๆ → ไม่ใส่ article"]], tags: [["(no article)", "นามนับไม่ได้"]], tip: "music นับไม่ได้ + พูดกว้าง ๆ (ชอบดนตรีทั่วไป) → ไม่ใส่ a/the" },
    3: { lesson: "articles", links: [["university", "a", "เสียง /ยู/ = พยัญชนะ → a"]], tags: [["a", "a + เสียงพยัญชนะ"]], tip: "university ขึ้นต้นด้วยเสียง \"ยู\" (พยัญชนะ) → a university (ดูที่เสียง ไม่ใช่ตัวอักษร)" },
  },
  "present-simple": {
    0: { tense: "present-simple", lesson: "present-simple", links: [["She", "goes", "she → เติม -es"]], tags: [["goes", "go + es"]], tip: "she/he/it → V + s/es (go → goes) · by bus = กิจวัตร" },
    1: { tense: "present-simple", lesson: "present-simple", links: [["doesn't", "drink", "หลัง doesn't → V1"]], tags: [["drink", "V1 (ไม่เติม s)"]], tip: "หลัง do/does/did + not → ใช้ V1 เสมอ (doesn't drink)" },
    2: { tense: "present-simple", lesson: "present-simple", links: [["parents", "Do", "parents = they → Do"]], tags: [["Do", "Do + S + V1"]], tip: "คำถาม present simple: Do (I/you/we/they) · Does (he/she/it)" },
    3: { tense: "present-simple", lesson: "present-simple", links: [["Tom", "is never", "adverb ความถี่ตามหลัง be"]], tags: [["is never", "be + never"]], tip: "adverb ความถี่ (never, always) → อยู่หลัง be แต่อยู่หน้ากริยาทั่วไป" },
  },
  "prepositions-in-on-at": {
    0: { lesson: "prepositions-in-on-at", links: [["3 o'clock", "at", "เวลาเป๊ะ → at"]], tags: [["at", "at + เวลา"]], tip: "at + เวลาเป๊ะ (at 3 o'clock)" },
    1: { lesson: "prepositions-in-on-at", links: [["March", "in", "เดือน → in"]], tags: [["in", "in + เดือน/ปี"]], tip: "in + เดือน/ปี/ฤดู (in March, in 2020)" },
    2: { lesson: "prepositions-in-on-at", links: [["table", "on", "บนพื้นผิว → on"]], tags: [["on", "on + พื้นผิว"]], tip: "on the table = วางบนพื้นผิวของโต๊ะ" },
    3: { lesson: "prepositions-in-on-at", links: [["Monday morning", "on", "วัน + ช่วงเวลา → on"]], tags: [["on", "on + วัน"]], tip: "on + วัน (on Monday morning) · วัน + ช่วงเวลา ใช้ on" },
  },
  "past-simple": {
    0: { tense: "past-simple", lesson: "past-simple", links: [["last night", "saw", "last night → อดีต"]], tags: [["saw", "see → saw (V2)"]], tip: "last night = อดีต → V2 (see → saw)" },
    1: { tense: "past-simple", lesson: "past-simple", links: [["didn't", "go", "หลัง didn't → V1"]], tags: [["go", "V1 (ไม่ใช่ went)"]], tip: "หลัง did/didn't ใช้ V1 เสมอ (ไม่ใช้ went)" },
    2: { tense: "past-simple", lesson: "past-simple", links: [["yesterday", "Did", "yesterday → อดีต"]], tags: [["Did", "Did + S + V1"]], tip: "yesterday → past simple → Did you + V1...?" },
    3: { tense: "past-simple", lesson: "past-simple", links: [["after the trip", "was", "อดีต → was"]], tags: [["was", "be อดีต"]], tip: "He (เอกพจน์) + อดีต → was" },
  },
  "present-continuous": {
    0: { tense: "present-continuous", lesson: "present-continuous", links: [["Be quiet!", "is sleeping", "ตอนนี้ → กำลังทำอยู่"]], tags: [["is sleeping", "is + V-ing"]], tip: "Be quiet! = เหตุการณ์เกิดขึ้นตอนนี้ → is/are + V-ing" },
    1: { tense: "present-simple", lesson: "present-continuous", links: [["what you mean", "understand", "state verb ไม่ใช้ -ing"]], tags: [["understand", "state verb"]], tip: "understand / know / like เป็น state verb (กริยาแสดงสภาวะ) → ไม่ใช้ V-ing · ใช้ present simple" },
    2: { tense: "present-continuous", lesson: "present-continuous", links: [["now", "is taking", "now → ตอนนี้"]], tags: [["is taking", "is + V-ing"]], tip: "now / at the moment → present continuous (take → taking ตัด e)" },
    3: { lesson: "present-continuous", links: [["usually", "drinks", "ประจำ → present simple"], ["today", "is drinking", "วันนี้ (ชั่วคราว) → -ing"]], tags: [["drinks", "V + s"], ["is drinking", "is + V-ing"]], tip: "usually = ประจำ → present simple · today (วันนี้เท่านั้น) → present continuous" },
  },
  "comparatives-superlatives": {
    0: { lesson: "comparatives-superlatives", links: [["than", "more interesting", "than → เปรียบเทียบ"]], tags: [["more interesting", "more + adj ยาว"]], tip: "adj ยาว (3 พยางค์ขึ้นไป) → more + adj + than (ไม่ใช้ -er)" },
    1: { lesson: "comparatives-superlatives", links: [["in our class", "smartest", "ในกลุ่ม → ที่สุด"]], tags: [["smartest", "smart + est"]], tip: "the + ...est (adj สั้น) + in + กลุ่ม = ที่สุดในกลุ่ม" },
    2: { lesson: "comparatives-superlatives", links: [["not", "as heavy as", "not as ... as"]], tags: [["as heavy as", "as + adj + as"]], tip: "not as + adj + as = ไม่...เท่า (yours is heavier = ของคุณหนักกว่า)" },
    3: { lesson: "comparatives-superlatives", links: [["of the year", "the hottest", "ที่สุดของปี"]], tags: [["the hottest", "hot → hottest"]], tip: "the + superlative (hot → the hottest · ซ้ำตัว t)" },
  },
  "quantifiers": {
    0: { lesson: "quantifiers", links: [["don't have", "any", "ปฏิเสธ → any"]], tags: [["any", "ปฏิเสธ → any"]], tip: "ปฏิเสธ (don't have) → any" },
    1: { lesson: "quantifiers", links: [["people", "many", "นับได้ → many"]], tags: [["many", "How many + นับได้"]], tip: "people นับได้ → How many (How much ใช้กับนามนับไม่ได้)" },
    2: { lesson: "quantifiers", links: [["advice", "some", "advice นับไม่ได้"]], tags: [["some", "some + นับไม่ได้"]], tip: "advice นับไม่ได้ → some (ไม่ใช้ a / many / few)" },
    3: { lesson: "quantifiers", links: [["just enough", "a little", "พอดี (ความหมายบวก)"]], tags: [["a little", "a little = มีนิดหน่อย"]], tip: "juice นับไม่ได้ + พอใช้ → a little (little = แทบไม่มี)" },
  },
  "future-forms": {
    0: { tense: "future-simple", lesson: "future-forms", links: [["The phone is ringing", "'ll get", "ตัดสินใจทันที → will"]], tags: [["'ll get", "will + V1"]], tip: "ตัดสินใจ \"ตอนนั้นเลย\" → will (I'll get it)" },
    1: { tense: "future-simple", lesson: "future-forms", links: [["Look at those black clouds", "is going to", "มีหลักฐานตอนนี้"]], tags: [["is going to", "be going to + V1"]], tip: "เห็นหลักฐานตอนนี้ (เมฆดำ) ว่าจะเกิด → be going to + V1" },
    2: { lesson: "future-forms", links: [["when", "get", "when → ใช้ present"]], tags: [["get", "present (ไม่ใช่ will)"]], tip: "หลัง when / if / before / after ในอนาคต → ใช้ present simple (ไม่ใช้ will)" },
    3: { tense: "future-simple", lesson: "future-forms", links: [["I've decided", "am going to buy", "ตัดสินใจไว้แล้ว → going to"]], tags: [["am going to buy", "be going to + V1"]], tip: "I've decided = ตัดสินใจไว้ก่อนแล้ว → be going to (will ใช้กับตัดสินใจทันที)" },
  },
  "modal-verbs": {
    0: { lesson: "modal-verbs", links: [["It's forbidden", "mustn't", "ห้าม → mustn't"]], tags: [["mustn't", "ห้ามทำ"]], tip: "forbidden = ห้าม → mustn't · don't have to = ไม่จำเป็น (ไม่ใช่ห้าม)" },
    1: { lesson: "modal-verbs", links: [["don't want to", "don't have to", "ไม่จำเป็น"]], tags: [["don't have to", "ไม่จำเป็น"]], tip: "don't have to = ไม่จำเป็นต้อง (จะไปหรือไม่ก็ได้) · mustn't = ห้าม" },
    2: { lesson: "modal-verbs", links: [["three languages", "can", "ความสามารถ → can"]], tags: [["can", "can + V1"]], tip: "ความสามารถ → can + V1 (ไม่เติม s, ไม่ใส่ to)" },
    3: { lesson: "modal-verbs", links: [["terrible headache", "should", "ปวดหัว → ควรไปหาหมอ"]], tags: [["should", "ควร (แนะนำ)"]], tip: "ให้คำแนะนำ → should + V1 (ไม่ใส่ to)" },
  },
  "present-perfect": {
    0: { tense: "present-perfect", lesson: "present-perfect", links: [["since 2018", "have lived", "since → ตั้งแต่อดีตถึงตอนนี้"]], tags: [["have lived", "have + V3"]], tip: "since + จุดเวลา (2018) → present perfect (ยังอยู่ถึงตอนนี้)" },
    1: { tense: "present-perfect", lesson: "present-perfect", links: [["ever", "Have", "ever → ประสบการณ์"]], tags: [["Have", "Have + S + V3"]], tip: "Have you ever + V3? = เคย...ไหม (ประสบการณ์ในชีวิต)" },
    2: { tense: "past-simple", lesson: "present-perfect", links: [["in 2019", "went", "ปีที่ระบุชัด → past simple"]], tags: [["went", "V2"]], tip: "เวลาที่ระบุชัดเจน (in 2019) → past simple (ไม่ใช้ present perfect)" },
    3: { tense: "present-perfect", lesson: "present-perfect", links: [["haven't finished", "yet", "ปฏิเสธ + yet"]], tags: [["yet", "yet = ยัง"]], tip: "ปฏิเสธ / คำถาม + yet = ยังไม่ (haven't finished ... yet) · already ใช้ในประโยคบอกเล่า" },
  },
  "conditionals": {
    0: { lesson: "conditionals", links: [["will cancel", "rains", "if + present, will + V1"]], tags: [["rains", "if + present"]], tip: "Conditional 1 (เป็นไปได้จริง): If + present simple, will + V1 (ไม่ใช้ will ในอนุประโยค if)" },
    1: { lesson: "conditionals", links: [["would buy", "were", "if + V2 (were), would + V1"]], tags: [["were", "if I were"]], tip: "Conditional 2 (สมมติ): If + V2, would + V1 · be → were ทุกบุรุษ" },
    2: { lesson: "conditionals", links: [["heat", "boils", "ความจริงทั่วไป"]], tags: [["boils", "zero conditional"]], tip: "Zero conditional (ความจริงทั่วไป): If + present, present" },
    3: { lesson: "conditionals", links: [["if I had time", "would go", "if + V2 → would"]], tags: [["would go", "would + V1"]], tip: "Conditional 2: if I had (V2) → ... would go (สถานการณ์สมมติ, ตอนนี้ไม่ว่าง)" },
  },
  "passive-voice": {
    0: { lesson: "passive-voice", links: [["in 1990", "was built", "อดีต + ถูกสร้าง"]], tags: [["was built", "was + V3"]], tip: "สะพาน \"ถูกสร้าง\" (ไม่ได้สร้างเอง) + อดีต (1990) → was + V3" },
    1: { lesson: "passive-voice", links: [["English", "is spoken", "ภาษาถูกพูด"]], tags: [["is spoken", "is + V3"]], tip: "English ถูกพูด (ปัจจุบัน) → is/are + V3 (speak → spoken)" },
    2: { lesson: "passive-voice", links: [["tomorrow", "will be delivered", "อนาคต + ถูกส่ง"]], tags: [["will be delivered", "will be + V3"]], tip: "อนาคต passive → will be + V3" },
    3: { lesson: "passive-voice", links: [["yesterday", "was stolen", "อดีต + ถูกขโมย"]], tags: [["was stolen", "was + V3"]], tip: "โทรศัพท์ \"ถูกขโมย\" + อดีต → was + V3 (steal → stolen)" },
  },
  "relative-clauses": {
    0: { lesson: "relative-clauses", links: [["woman", "who", "คน → who"]], tags: [["who", "who = คน"]], tip: "อ้างถึงคน (เป็นประธาน) → who · สิ่งของ → which" },
    1: { lesson: "relative-clauses", links: [["restaurant", "where", "สถานที่ → where"]], tags: [["where", "where = สถานที่"]], tip: "อ้างถึงสถานที่ → where (the restaurant where we had dinner)" },
    2: { lesson: "relative-clauses", links: [["boy", "whose", "ของเด็กชาย → whose"]], tags: [["whose", "whose + นาม"]], tip: "ความเป็นเจ้าของ → whose + นาม (whose bike = จักรยานของเขา)" },
    3: { lesson: "relative-clauses", links: [["book", "that", "สิ่งของ → that/which"]], tags: [["that", "that = สิ่งของ"]], tip: "สิ่งของ → that / which (who ใช้กับคน)" },
  },
  "gerund-infinitive": {
    0: { lesson: "gerund-infinitive", links: [["enjoys", "listening", "enjoy + V-ing"]], tags: [["listening", "V-ing"]], tip: "enjoy + V-ing (ไม่ใช้ to V)" },
    1: { lesson: "gerund-infinitive", links: [["decided", "to buy", "decide + to V"]], tags: [["to buy", "to + V1"]], tip: "decide + to + V1 (เช่นเดียวกับ want, plan, hope)" },
    2: { lesson: "gerund-infinitive", links: [["for", "helping", "หลังบุพบท → V-ing"]], tags: [["helping", "V-ing"]], tip: "หลังบุพบท (for) → V-ing เสมอ" },
    3: { lesson: "gerund-infinitive", links: [["looking forward to", "seeing", "to = บุพบท → V-ing"]], tags: [["seeing", "V-ing"]], tip: "look forward to + V-ing (to ตรงนี้เป็นบุพบท ไม่ใช่ to-infinitive)" },
  },
};
