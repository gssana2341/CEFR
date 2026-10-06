// บทเรียนไวยากรณ์ A1–B1
// รูปแบบ: { id, level, minutes, title, en, intro, sections: [{ title, body?, table?, examples?, note? }], exercises: [{ q, c, a, e }] }
//   body     = ย่อหน้า (ใช้ **ตัวหนา** ได้)
//   table    = { head: [...], rows: [[...]] }
//   examples = [[อังกฤษ, ไทย], ...]
//   note     = { kind: 'tip' | 'warn', text }
// แก้ไขแล้วรัน: npm run validate
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.lessons = [
  // ───────────────────────── A1 ─────────────────────────
  {
    id: 'to-be',
    level: 'A1',
    minutes: 5,
    title: 'กริยา to be',
    en: 'am / is / are',
    intro: 'to be แปลว่า "เป็น / อยู่ / คือ" ใช้บอกชื่อ อาชีพ อายุ สัญชาติ สถานที่ และความรู้สึก เป็นกริยาที่ใช้บ่อยที่สุดตัวหนึ่งในภาษาอังกฤษ',
    sections: [
      {
        title: 'รูปของ to be ในปัจจุบัน',
        table: {
          head: ['ประธาน', 'to be', 'รูปย่อ'],
          rows: [
            ['I', 'am', "I'm"],
            ['You / We / They', 'are', "you're / we're / they're"],
            ['He / She / It', 'is', "he's / she's / it's"],
          ],
        },
        examples: [
          ['I am a student.', 'ฉันเป็นนักเรียน'],
          ['She is from Thailand.', 'เธอมาจากประเทศไทย'],
          ['We are at home.', 'พวกเราอยู่ที่บ้าน'],
          ['It is cold today.', 'วันนี้อากาศหนาว'],
        ],
        note: { kind: 'warn', text: 'การบอกอายุใช้ **to be** ไม่ใช่ have: **I am 15** (ไม่ใช่ I have 15 years old)' },
      },
      {
        title: 'ปฏิเสธและถามคำถาม',
        body: [
          'ปฏิเสธ: เติม **not** หลัง to be เช่น is not = **isn\'t**, are not = **aren\'t** ส่วน am not ไม่มีรูปย่อ ให้ใช้ **I\'m not**',
          'ถามคำถาม: ย้าย to be ไปไว้หน้าประธาน เช่น **Are** you ready? / **Is** she a teacher?',
          'ตอบสั้น: Yes, I **am**. / No, I\'m **not**. (ตอบรับห้ามย่อ ✗ Yes, I\'m)',
        ],
        examples: [
          ['He is not (isn\'t) at work.', 'เขาไม่ได้อยู่ที่ทำงาน'],
          ['Are you hungry? — Yes, I am.', 'คุณหิวไหม — หิวครับ/ค่ะ'],
          ['Is this seat free? — No, it isn\'t.', 'ที่นั่งนี้ว่างไหม — ไม่ว่างครับ/ค่ะ'],
        ],
      },
      {
        title: 'ข้อควรระวัง',
        body: ['ประโยคหนึ่งประโยคมีกริยาหลักได้ตัวเดียว ถ้ามีกริยาอื่นอยู่แล้ว (eat, like, go ฯลฯ) **ห้ามใส่ is / am / are ซ้ำ**'],
        examples: [
          ['She likes pizza.', 'เธอชอบพิซซ่า (✗ She is like pizza)'],
          ['I eat rice every day.', 'ฉันกินข้าวทุกวัน (✗ I am eat rice)'],
        ],
      },
    ],
    exercises: [
      { q: 'My brother ___ a doctor.', c: ['am', 'is', 'are', 'be'], a: 1, e: 'my brother เป็นประธานเอกพจน์ (he) ใช้ is' },
      { q: 'They ___ not at school today.', c: ['is', 'am', 'are', 'be'], a: 2, e: 'they ใช้ are → They are not (aren\'t) at school.' },
      { q: 'A: ___ you from Japan?\nB: Yes, I am.', c: ['Is', 'Are', 'Am', 'Do'], a: 1, e: 'ถามด้วย to be ย้ายขึ้นหน้าประธาน you → Are you…?' },
      { q: 'Which sentence is correct?', c: ['She is like music.', 'She likes music.', 'She are likes music.', 'She likes is music.'], a: 1, e: 'like เป็นกริยาหลักอยู่แล้ว ไม่ต้องมี is — She likes music.' },
    ],
  },
  {
    id: 'articles',
    level: 'A1',
    minutes: 6,
    title: 'คำนำหน้านาม',
    en: 'a / an / the',
    intro: 'ภาษาไทยไม่มีคำนำหน้านาม แต่ภาษาอังกฤษต้องเลือกใช้ a, an, the หรือไม่ใช้เลย ขึ้นอยู่กับว่านามนั้น "เจาะจง" หรือไม่',
    sections: [
      {
        title: 'a กับ an',
        body: [
          'ใช้กับนามนับได้ที่เป็นเอกพจน์ และ "ยังไม่เจาะจง" (อันหนึ่ง / สักอัน)',
          'ดูที่ **เสียง** แรกของคำ ไม่ใช่ตัวอักษร: เสียงสระใช้ **an**, เสียงพยัญชนะใช้ **a**',
        ],
        table: {
          head: ['ใช้ a', 'ใช้ an'],
          rows: [
            ['a book, a car, a dog', 'an apple, an egg, an orange'],
            ['a university (เสียง "ยู")', 'an hour (h ไม่ออกเสียง)'],
            ['a European city', 'an umbrella'],
          ],
        },
      },
      {
        title: 'the',
        body: ['ใช้เมื่อ **ผู้พูดและผู้ฟังรู้ว่าหมายถึงอะไร** เช่น พูดถึงไปแล้ว มีอันเดียวในโลก หรือรู้จากสถานการณ์'],
        examples: [
          ['I saw a dog. The dog was very big.', 'ฉันเห็นสุนัขตัวหนึ่ง สุนัขตัวนั้นตัวใหญ่มาก'],
          ['The sun is hot.', 'ดวงอาทิตย์ร้อน (มีดวงเดียว)'],
          ['Please close the door.', 'ช่วยปิดประตูหน่อย (ประตูบานที่เรารู้กัน)'],
        ],
      },
      {
        title: 'ไม่ใช้คำนำหน้า',
        body: [
          'นามพหูพจน์หรือนามนับไม่ได้ที่พูดถึง **ทั่วไป**: I like music. / Dogs are friendly.',
          'ชื่อคน เมือง ประเทศ มื้ออาหาร และกิจวัตรบางอย่าง: She lives in Bangkok. / We have lunch at noon. / I go to school by bus.',
        ],
      },
    ],
    exercises: [
      { q: 'She has ___ umbrella in her bag.', c: ['a', 'an', 'the', '(no article)'], a: 1, e: 'umbrella ขึ้นต้นด้วยเสียงสระ จึงใช้ an' },
      { q: 'I saw ___ movie last night. ___ movie was great.', c: ['a / the', 'the / a', 'a / a', 'the / the'], a: 0, e: 'พูดถึงครั้งแรกใช้ a ครั้งต่อไปที่เจาะจงแล้วใช้ the' },
      { q: 'I like ___ music.', c: ['a', 'an', 'the', '(no article)'], a: 3, e: 'พูดถึงดนตรีโดยทั่วไป (นามนับไม่ได้) ไม่ใช้คำนำหน้า' },
      { q: 'My brother studies at ___ university in Bangkok.', c: ['a', 'an', 'the', '(no article)'], a: 0, e: 'university ขึ้นต้นด้วยเสียง "ยู" (พยัญชนะ) จึงใช้ a' },
    ],
  },
  {
    id: 'present-simple',
    level: 'A1',
    minutes: 7,
    title: 'ปัจจุบันกาลธรรมดา',
    en: 'Present simple',
    intro: 'ใช้พูดถึงความจริง กิจวัตร และสิ่งที่ทำเป็นประจำ เช่น "ฉันตื่นหกโมงทุกวัน" "ดวงอาทิตย์ขึ้นทางทิศตะวันออก"',
    sections: [
      {
        title: 'รูปประโยคบอกเล่า',
        body: ['I / you / we / they ใช้กริยาช่อง 1 ตามปกติ ส่วน **he / she / it เติม -s / -es**'],
        table: {
          head: ['กฎ', 'ตัวอย่าง'],
          rows: [
            ['ทั่วไป + s', 'work → works, play → plays'],
            ['ลงท้าย s, sh, ch, x, o + es', 'watch → watches, go → goes, do → does'],
            ['พยัญชนะ + y → ies', 'study → studies, fly → flies'],
            ['ไม่ปกติ', 'have → has'],
          ],
        },
        examples: [
          ['I get up at six.', 'ฉันตื่นตอนหกโมง'],
          ['She works in a bank.', 'เธอทำงานในธนาคาร'],
          ['He studies English every night.', 'เขาเรียนภาษาอังกฤษทุกคืน'],
        ],
      },
      {
        title: 'ปฏิเสธและคำถาม',
        body: [
          'ปฏิเสธ: **do not (don\'t)** / **does not (doesn\'t)** + กริยาช่อง 1',
          'คำถาม: **Do** + I/you/we/they …? / **Does** + he/she/it …? + กริยาช่อง 1',
          'สำคัญ: พอมี does / doesn\'t แล้ว กริยาหลัก **ไม่เติม s อีก**',
        ],
        examples: [
          ['She doesn\'t like coffee.', 'เธอไม่ชอบกาแฟ (✗ doesn\'t likes)'],
          ['Do you live in Chiang Mai?', 'คุณอยู่เชียงใหม่ใช่ไหม'],
          ['Does he speak French?', 'เขาพูดภาษาฝรั่งเศสได้ไหม'],
        ],
      },
      {
        title: 'คำบอกความถี่',
        body: [
          'always (ทุกครั้ง), usually (มักจะ), often (บ่อย), sometimes (บางครั้ง), never (ไม่เคย)',
          'วางไว้ **หน้ากริยาหลัก** แต่ **หลัง to be**',
        ],
        examples: [
          ['I usually walk to school.', 'ฉันมักเดินไปโรงเรียน'],
          ['She is always late.', 'เธอมาสายตลอด'],
        ],
      },
    ],
    exercises: [
      { q: 'She ___ to work by bus.', c: ['go', 'goes', 'going', 'is go'], a: 1, e: 'she เป็นเอกพจน์บุรุษที่ 3 กริยา go เติม es → goes' },
      { q: 'He doesn\'t ___ coffee.', c: ['drink', 'drinks', 'drinking', 'drank'], a: 0, e: 'หลัง doesn\'t ใช้กริยาช่อง 1 ไม่เติม s' },
      { q: '___ your parents live in Chiang Mai?', c: ['Do', 'Does', 'Is', 'Are'], a: 0, e: 'your parents เป็นพหูพจน์ (they) ใช้ Do' },
      { q: 'Tom ___ late for class.', c: ['is never', 'never is', 'never be', 'does never'], a: 0, e: 'คำบอกความถี่วางหลัง to be → is never' },
    ],
  },
  {
    id: 'prepositions-in-on-at',
    level: 'A1',
    minutes: 6,
    title: 'บุพบท in / on / at',
    en: 'Prepositions of time and place',
    intro: 'in, on, at ใช้ทั้งบอกเวลาและสถานที่ จำหลักง่ายๆ ว่า **at = จุด**, **on = พื้นผิว/วัน**, **in = พื้นที่/ช่วงเวลายาว**',
    sections: [
      {
        title: 'บอกเวลา',
        table: {
          head: ['บุพบท', 'ใช้กับ', 'ตัวอย่าง'],
          rows: [
            ['at', 'เวลาที่เป็นจุด', 'at 7 o\'clock, at noon, at night'],
            ['on', 'วัน / วันที่', 'on Monday, on 5 May, on my birthday'],
            ['in', 'เดือน ปี ฤดู ช่วงของวัน', 'in June, in 2024, in summer, in the morning'],
          ],
        },
        examples: [
          ['The class starts at nine.', 'คลาสเริ่มเก้าโมง'],
          ['We have a test on Friday.', 'เรามีสอบวันศุกร์'],
          ['I was born in 2005.', 'ฉันเกิดปี 2005'],
        ],
        note: { kind: 'tip', text: 'ช่วงของวันใช้ **in the morning / afternoon / evening** แต่ **at night**' },
      },
      {
        title: 'บอกสถานที่',
        table: {
          head: ['บุพบท', 'ใช้กับ', 'ตัวอย่าง'],
          rows: [
            ['at', 'จุด / ตำแหน่งเฉพาะ', 'at the bus stop, at home, at the door'],
            ['on', 'พื้นผิว / ชั้น', 'on the table, on the wall, on the second floor'],
            ['in', 'พื้นที่ปิด เมือง ประเทศ', 'in the room, in Bangkok, in Thailand'],
          ],
        },
        examples: [
          ['She is waiting at the bus stop.', 'เธอรออยู่ที่ป้ายรถเมล์'],
          ['Your phone is on the table.', 'โทรศัพท์คุณอยู่บนโต๊ะ'],
          ['They live in Phuket.', 'พวกเขาอยู่ที่ภูเก็ต'],
        ],
        note: { kind: 'tip', text: 'ยานพาหนะ: **on** the bus / train / plane แต่ **in** a car / taxi' },
      },
    ],
    exercises: [
      { q: 'The meeting is ___ 3 o\'clock.', c: ['in', 'on', 'at', 'by'], a: 2, e: 'เวลาที่เป็นจุด (3 โมง) ใช้ at' },
      { q: 'My birthday is ___ March.', c: ['in', 'on', 'at', 'to'], a: 0, e: 'เดือนใช้ in' },
      { q: 'The keys are ___ the table.', c: ['in', 'at', 'on', 'by'], a: 2, e: 'อยู่บนพื้นผิวของโต๊ะ ใช้ on' },
      { q: 'We arrived ___ Monday morning.', c: ['in', 'at', 'on', 'by'], a: 2, e: 'มีวันกำกับ (Monday morning) ใช้ on' },
    ],
  },

  {
    id: 'pronouns',
    level: 'A1',
    minutes: 6,
    title: 'สรรพนาม',
    en: 'I / me / my / mine',
    intro: 'คำแทนคนหรือสิ่งของ แต่ละคำมีหลายรูป ให้ดูว่าคำนั้นอยู่ตำแหน่งไหนของประโยค',
    sections: [
      {
        title: 'ตารางรูปทั้งหมด',
        table: {
          head: ['ประธาน', 'กรรม', 'my (+ นาม)', 'mine (ไม่มีนาม)', 'ตัวเอง'],
          rows: [
            ['I', 'me', 'my', 'mine', 'myself'],
            ['you', 'you', 'your', 'yours', 'yourself'],
            ['he', 'him', 'his', 'his', 'himself'],
            ['she', 'her', 'her', 'hers', 'herself'],
            ['it', 'it', 'its', '—', 'itself'],
            ['we', 'us', 'our', 'ours', 'ourselves'],
            ['they', 'them', 'their', 'theirs', 'themselves'],
          ],
        },
        note: { kind: 'tip', text: 'ประธาน = คนทำ (**I** like her) · กรรม = คนถูกทำ หรือตามหลังบุพบท (give it to **me**)' },
      },
      {
        title: 'my หรือ mine?',
        body: ['**my / your / his / her / our / their** ต้องมีนามตามหลัง ส่วน **mine / yours / hers / ours / theirs** ใช้เมื่อไม่มีนามตามหลัง'],
        examples: [
          ['This is my bag.', 'นี่คือกระเป๋าของฉัน'],
          ['This bag is mine.', 'กระเป๋าใบนี้เป็นของฉัน'],
          ['Is that her phone? — No, it\'s his.', 'นั่นโทรศัพท์เธอไหม — ไม่ใช่ ของเขา'],
        ],
        note: { kind: 'warn', text: 'ไม่พูดว่า ✗ It\'s my. ให้พูดว่า It\'s **mine**.' },
      },
      {
        title: 'ตัวเอง (-self)',
        body: ['ใช้เมื่อคนทำและคนถูกทำเป็นคนเดียวกัน หรือเน้นว่าทำเอง และ **by myself** = คนเดียว'],
        examples: [
          ['She hurt herself.', 'เธอทำตัวเองเจ็บ'],
          ['I made it myself.', 'ฉันทำเอง'],
          ['He lives by himself.', 'เขาอยู่คนเดียว'],
        ],
      },
    ],
    exercises: [
      { q: 'Peter gave the book to ___ yesterday.', c: ['I', 'my', 'mine', 'me'], a: 3, e: 'หลังบุพบท to ต้องใช้รูปกรรม me' },
      { q: 'Is this your pen? — No, it isn\'t ___.', c: ['my', 'me', 'mine', 'I'], a: 2, e: 'ไม่มีนามตามหลัง ใช้ mine' },
      { q: 'She hurt ___ when she fell.', c: ['her', 'herself', 'she', 'hers'], a: 1, e: 'คนทำและคนถูกทำคนเดียวกัน ใช้ herself' },
      { q: 'Whose bike is that? — It\'s ___. (เป็นของพวกเขา)', c: ['their', 'them', 'theirs', 'they'], a: 2, e: 'ไม่มีนามตามหลัง ใช้ theirs' },
    ],
  },
  {
    id: 'there-is-are',
    level: 'A1',
    minutes: 5,
    title: 'there is / there are',
    en: 'มี ... อยู่ที่ไหน',
    intro: 'ใช้บอกว่า "มีอะไรอยู่ตรงไหน" ดูที่นามหลัง there is/are ว่าเอกพจน์หรือพหูพจน์',
    sections: [
      {
        title: 'รูปประโยค',
        table: {
          head: ['', 'เอกพจน์ / นับไม่ได้', 'พหูพจน์'],
          rows: [
            ['บอกเล่า', 'There is a cat.', 'There are two cats.'],
            ['ปฏิเสธ', 'There isn\'t any milk.', 'There aren\'t any eggs.'],
            ['คำถาม', 'Is there a bank near here?', 'Are there any shops?'],
            ['ตอบสั้น', 'Yes, there is. / No, there isn\'t.', 'Yes, there are. / No, there aren\'t.'],
          ],
        },
        note: { kind: 'tip', text: 'บอกเล่าใช้ **some** · ปฏิเสธและคำถามใช้ **any**' },
      },
      {
        title: 'ตัวอย่าง',
        examples: [
          ['There is a book on the table.', 'มีหนังสืออยู่บนโต๊ะ'],
          ['There are three students in the room.', 'มีนักเรียนสามคนในห้อง'],
          ['Is there any water in the bottle?', 'มีน้ำในขวดไหม'],
        ],
        note: { kind: 'warn', text: 'ถ้ามีหลายอย่าง ให้ดูนามตัวแรก: There is a pen and two books.' },
      },
    ],
    exercises: [
      { q: 'There ___ a book on the table.', c: ['are', 'is', 'am', 'be'], a: 1, e: 'a book เป็นเอกพจน์ ใช้ there is' },
      { q: 'There ___ three students in the room.', c: ['is', 'are', 'be', 'has'], a: 1, e: 'three students เป็นพหูพจน์ ใช้ there are' },
      { q: '___ there any milk in the fridge?', c: ['Are', 'Is', 'Do', 'Does'], a: 1, e: 'milk นับไม่ได้ ใช้ Is there any...?' },
      { q: 'Are there any bananas? — Yes, there ___.', c: ['is', 'are', 'do', 'have'], a: 1, e: 'ตอบสั้นให้ตรงกับคำถาม Are there → Yes, there are.' },
    ],
  },
  {
    id: 'question-words',
    level: 'A1',
    minutes: 6,
    title: 'คำถาม What / Where / When ...',
    en: 'Question words',
    intro: 'คำที่ใช้ขึ้นต้นคำถามเพื่อถามข้อมูล ให้ดูก่อนว่าคำตอบเป็นอะไร (คน สถานที่ เวลา เหตุผล ฯลฯ) แล้วเลือกคำถามให้ตรง',
    sections: [
      {
        title: 'ถามอะไร ใช้คำไหน',
        table: {
          head: ['คำ', 'ถามเรื่อง', 'ตัวอย่าง'],
          rows: [
            ['What', 'สิ่งของ / อะไร', 'What do you do? (ทำอาชีพอะไร)'],
            ['Where', 'สถานที่', 'Where do you live?'],
            ['When', 'เวลา', 'When is your birthday?'],
            ['Who', 'คน', 'Who is that man?'],
            ['Whose', 'เจ้าของ', 'Whose bag is this?'],
            ['Which', 'เลือกจากตัวเลือก', 'Which colour do you like?'],
            ['Why', 'เหตุผล', 'Why are you late?'],
            ['How', 'วิธี / สภาพ', 'How did you get home?'],
          ],
        },
      },
      {
        title: 'How + คำอื่น',
        table: {
          head: ['คำถาม', 'ถามเรื่อง', 'คำตอบ'],
          rows: [
            ['How much', 'ราคา / ปริมาณ (นับไม่ได้)', '200 baht.'],
            ['How many', 'จำนวน (นับได้)', 'Three.'],
            ['How long', 'ระยะเวลา', 'Two hours.'],
            ['How often', 'ความถี่', 'Twice a week.'],
            ['How far', 'ระยะทาง', 'About 5 km.'],
          ],
        },
        note: { kind: 'tip', text: 'ลำดับคำ: **คำถาม + do/does/did + ประธาน + V1** เช่น Where **do you** live?' },
      },
    ],
    exercises: [
      { q: '___ do you live? — In Chiang Mai.', c: ['When', 'Where', 'Who', 'Why'], a: 1, e: 'คำตอบเป็นสถานที่ ถามด้วย Where' },
      { q: '___ bag is this? — It\'s mine.', c: ['Who', 'Which', 'Whose', 'What'], a: 2, e: 'ถามเจ้าของ ใช้ Whose' },
      { q: 'How ___ does it cost? — 200 baht.', c: ['many', 'much', 'long', 'often'], a: 1, e: 'ถามราคา ใช้ How much' },
      { q: 'How ___ do you go to the gym? — Twice a week.', c: ['far', 'much', 'often', 'old'], a: 2, e: 'ถามความถี่ ใช้ How often' },
    ],
  },
  // ───────────────────────── A2 ─────────────────────────
  {
    id: 'past-simple',
    level: 'A2',
    minutes: 8,
    title: 'อดีตกาลธรรมดา',
    en: 'Past simple',
    intro: 'ใช้เล่าเหตุการณ์ที่เกิดและจบไปแล้ว ในเวลาที่ชัดเจน เช่น yesterday, last week, two days ago, in 2020',
    sections: [
      {
        title: 'กริยาช่อง 2',
        body: ['กริยาปกติ (regular) เติม **-ed** ส่วนกริยาไม่ปกติ (irregular) ต้องจำเป็นคำๆ'],
        table: {
          head: ['กฎกริยาปกติ', 'ตัวอย่าง'],
          rows: [
            ['+ ed', 'work → worked'],
            ['ลงท้าย e + d', 'live → lived'],
            ['พยัญชนะ + y → ied', 'study → studied'],
            ['พยางค์เดียว สระ+พยัญชนะ ซ้ำตัวท้าย', 'stop → stopped, plan → planned'],
          ],
        },
        examples: [
          ['I went to Chiang Mai last month. (go → went)', 'เดือนที่แล้วฉันไปเชียงใหม่'],
          ['We saw a great film. (see → saw)', 'เราดูหนังเรื่องที่ยอดเยี่ยม'],
          ['She had breakfast and ate an egg. (have → had, eat → ate)', 'เธอกินอาหารเช้าและกินไข่หนึ่งฟอง'],
          ['He took the bus and came early. (take → took, come → came)', 'เขานั่งรถเมล์และมาถึงเร็ว'],
        ],
      },
      {
        title: 'ปฏิเสธและคำถาม',
        body: [
          'ปฏิเสธ: **did not (didn\'t)** + กริยาช่อง 1',
          'คำถาม: **Did** + ประธาน + กริยาช่อง 1 …?',
          'พอใช้ did แล้ว กริยากลับเป็นช่อง 1 เสมอ: ✗ I didn\'t went → ✓ I **didn\'t go**',
        ],
        examples: [
          ['I didn\'t see him yesterday.', 'เมื่อวานฉันไม่ได้เจอเขา'],
          ['Did you finish your homework?', 'คุณทำการบ้านเสร็จหรือยัง'],
        ],
      },
      {
        title: 'to be ในอดีต',
        body: ['I / he / she / it → **was**, you / we / they → **were** ปฏิเสธ wasn\'t / weren\'t ถามด้วย Was / Were ขึ้นต้น'],
        examples: [
          ['I was tired after the trip.', 'ฉันเหนื่อยหลังการเดินทาง'],
          ['Were they at the party?', 'พวกเขาอยู่ที่ปาร์ตี้ไหม'],
        ],
      },
    ],
    exercises: [
      { q: 'I ___ a great movie last night.', c: ['see', 'saw', 'seen', 'seeing'], a: 1, e: 'last night บอกอดีต see เป็นกริยาไม่ปกติ → saw' },
      { q: 'She didn\'t ___ to the party.', c: ['went', 'go', 'goes', 'going'], a: 1, e: 'หลัง didn\'t ใช้กริยาช่อง 1 → didn\'t go' },
      { q: '___ you finish your homework yesterday?', c: ['Did', 'Do', 'Were', 'Have'], a: 0, e: 'ถามเรื่องอดีตด้วยกริยาแท้ ใช้ Did + V1' },
      { q: 'He ___ very tired after the trip.', c: ['is', 'were', 'was', 'be'], a: 2, e: 'he ในอดีตใช้ was' },
    ],
  },
  {
    id: 'present-continuous',
    level: 'A2',
    minutes: 6,
    title: 'ปัจจุบันกาลต่อเนื่อง',
    en: 'Present continuous',
    intro: 'ใช้พูดถึงสิ่งที่ "กำลังทำอยู่" ตอนนี้ หรือเป็นการชั่วคราว ต่างจาก present simple ที่ใช้กับกิจวัตรประจำ',
    sections: [
      {
        title: 'รูปประโยค',
        body: [
          '**am / is / are + กริยา-ing**',
          'การสะกด: ตัด e แล้วเติม ing (make → making), พยัญชนะท้ายซ้ำถ้าพยางค์เดียวแบบ สระ+พยัญชนะ (run → running, sit → sitting)',
        ],
        examples: [
          ['I am studying now.', 'ตอนนี้ฉันกำลังเรียน'],
          ['Look! It is raining.', 'ดูสิ ฝนกำลังตก'],
          ['They are not playing football.', 'พวกเขาไม่ได้กำลังเล่นฟุตบอล'],
          ['Are you listening to me?', 'คุณกำลังฟังฉันอยู่ไหม'],
        ],
      },
      {
        title: 'ต่างจาก present simple อย่างไร',
        table: {
          head: ['Present simple', 'Present continuous'],
          rows: [
            ['นิสัย / กิจวัตร', 'กำลังทำตอนนี้'],
            ['He plays tennis on Sundays.', 'He is playing tennis now.'],
            ['She usually drinks coffee.', 'Today she is drinking tea.'],
          ],
        },
        note: { kind: 'tip', text: 'อนาคตที่นัดหมายไว้แล้วก็ใช้ได้: **I\'m meeting Anna at seven.**' },
      },
      {
        title: 'กริยาที่ไม่ใช้ -ing (stative verbs)',
        body: ['กริยาที่บอกสภาวะ ความรู้สึก ความคิด เช่น **know, like, love, want, need, understand, believe** ปกติไม่ใช้ในรูป continuous'],
        examples: [
          ['I understand what you mean.', 'ฉันเข้าใจที่คุณหมายถึง (✗ I am understanding)'],
          ['She wants a new phone.', 'เธออยากได้โทรศัพท์เครื่องใหม่ (✗ is wanting)'],
        ],
      },
    ],
    exercises: [
      { q: 'Be quiet! The baby ___.', c: ['sleeps', 'is sleeping', 'sleeping', 'sleep'], a: 1, e: 'กำลังหลับอยู่ตอนนี้ ใช้ is sleeping' },
      { q: 'I ___ what you mean.', c: ['am understanding', 'understand', 'understands', 'understanding'], a: 1, e: 'understand เป็น stative verb ไม่ใช้รูป -ing' },
      { q: 'Don\'t call her now. She ___ a shower.', c: ['takes', 'is taking', 'take', 'taking'], a: 1, e: 'now บอกว่ากำลังทำอยู่ → is taking' },
      { q: 'She usually ___ coffee, but today she ___ tea.', c: ['drinks / is drinking', 'is drinking / drinks', 'drink / drinking', 'drinks / drinks'], a: 0, e: 'usually = กิจวัตร (present simple), today ที่เปลี่ยนไป = present continuous' },
    ],
  },
  {
    id: 'comparatives-superlatives',
    level: 'A2',
    minutes: 7,
    title: 'การเปรียบเทียบ',
    en: 'Comparatives & superlatives',
    intro: 'เปรียบเทียบสองสิ่งใช้ **comparative (+ than)** เปรียบเทียบตั้งแต่สามสิ่งขึ้นไปใช้ **the + superlative**',
    sections: [
      {
        title: 'กฎการเติม',
        table: {
          head: ['ชนิดคำ', 'Comparative', 'Superlative'],
          rows: [
            ['พยางค์เดียว', 'tall → taller', 'the tallest'],
            ['ลงท้าย e', 'nice → nicer', 'the nicest'],
            ['สระ+พยัญชนะ (ซ้ำ)', 'big → bigger', 'the biggest'],
            ['พยัญชนะ+y → i', 'easy → easier', 'the easiest'],
            ['2 พยางค์ขึ้นไป', 'more expensive', 'the most expensive'],
            ['ไม่ปกติ', 'good → better', 'the best'],
            ['ไม่ปกติ', 'bad → worse', 'the worst'],
          ],
        },
        examples: [
          ['My bag is heavier than yours.', 'กระเป๋าฉันหนักกว่าของคุณ'],
          ['This is the most interesting book I have read.', 'นี่คือหนังสือที่น่าสนใจที่สุดที่ฉันเคยอ่าน'],
          ['She is the tallest in the class.', 'เธอสูงที่สุดในห้อง'],
        ],
        note: { kind: 'warn', text: 'ห้ามใช้ซ้อน: ✗ more taller, ✗ the most smartest → ✓ **taller**, ✓ **the smartest**' },
      },
      {
        title: 'as … as',
        body: ['**as + adj + as** = เท่ากับ / **not as + adj + as** = ไม่เท่า (น้อยกว่า)'],
        examples: [
          ['He is as tall as his father.', 'เขาสูงเท่าพ่อ'],
          ['This phone is not as expensive as that one.', 'โทรศัพท์เครื่องนี้ไม่แพงเท่าเครื่องนั้น'],
        ],
      },
    ],
    exercises: [
      { q: 'This book is ___ than that one.', c: ['interestinger', 'more interesting', 'most interesting', 'more interestinger'], a: 1, e: 'interesting มีหลายพยางค์ ใช้ more + adj + than' },
      { q: 'She is the ___ student in our class.', c: ['smartest', 'smarter', 'most smart', 'more smartest'], a: 0, e: 'smart พยางค์เดียว + the → the smartest' },
      { q: 'My bag is not ___ yours; yours is heavier.', c: ['as heavy as', 'heavier than', 'the heaviest', 'more heavy'], a: 0, e: 'not as … as = ไม่เท่ากับ (เบากว่า)' },
      { q: 'Today is ___ day of the year.', c: ['the hottest', 'hotter', 'more hot', 'the most hot'], a: 0, e: 'hot ซ้ำ t และใช้ superlative → the hottest' },
    ],
  },
  {
    id: 'quantifiers',
    level: 'A2',
    minutes: 7,
    title: 'ปริมาณ some / any / much / many',
    en: 'Quantifiers',
    intro: 'ต้องรู้ก่อนว่านามนั้น **นับได้ (countable)** หรือ **นับไม่ได้ (uncountable)** จึงจะเลือกคำบอกปริมาณได้ถูก',
    sections: [
      {
        title: 'นับได้ vs นับไม่ได้',
        body: [
          'นับได้: a book, two books, an apple, ten students',
          'นับไม่ได้: water, rice, money, information, advice, homework, news, furniture (ไม่มี -s และไม่ใช้ a / an)',
        ],
      },
      {
        title: 'some / any',
        body: [
          '**some** ใช้ในประโยคบอกเล่า และคำถามที่เป็นการเสนอหรือขอ',
          '**any** ใช้ในประโยคปฏิเสธและคำถามทั่วไป',
        ],
        examples: [
          ['I have some friends in Japan.', 'ฉันมีเพื่อนอยู่ที่ญี่ปุ่นบ้าง'],
          ['We don\'t have any milk.', 'เราไม่มีนมเลย'],
          ['Would you like some tea?', 'ดื่มชาสักหน่อยไหม'],
          ['Do you have any questions?', 'มีคำถามไหม'],
        ],
      },
      {
        title: 'many / much / a lot of',
        table: {
          head: ['คำ', 'ใช้กับ', 'ตัวอย่าง'],
          rows: [
            ['many', 'นับได้ (พหูพจน์)', 'How many people? / not many books'],
            ['much', 'นับไม่ได้', 'How much water? / not much time'],
            ['a lot of', 'ได้ทั้งสองแบบ (ใช้ในประโยคบอกเล่า)', 'a lot of friends / a lot of money'],
          ],
        },
      },
      {
        title: 'a few / few, a little / little',
        table: {
          head: ['คำ', 'ใช้กับ', 'ความหมาย'],
          rows: [
            ['a few', 'นับได้', 'มีอยู่บ้าง (พอใช้)'],
            ['few', 'นับได้', 'แทบไม่มี (ไม่พอ)'],
            ['a little', 'นับไม่ได้', 'มีอยู่บ้าง (พอใช้)'],
            ['little', 'นับไม่ได้', 'แทบไม่มี (ไม่พอ)'],
          ],
        },
        examples: [
          ['I have a few friends here.', 'ฉันมีเพื่อนอยู่ที่นี่สองสามคน'],
          ['There is a little juice left.', 'เหลือน้ำผลไม้นิดหน่อย'],
        ],
      },
    ],
    exercises: [
      { q: 'We don\'t have ___ milk.', c: ['some', 'any', 'many', 'a few'], a: 1, e: 'ประโยคปฏิเสธใช้ any (milk นับไม่ได้ จึงไม่ใช้ many / a few)' },
      { q: 'How ___ people are coming to the party?', c: ['much', 'many', 'a little', 'any'], a: 1, e: 'people นับได้ ถามจำนวนใช้ How many' },
      { q: 'She gave me ___ useful advice.', c: ['a', 'some', 'many', 'few'], a: 1, e: 'advice นับไม่ได้ ใช้ some ไม่ใช้ a / many / few' },
      { q: 'There is ___ juice in the fridge — just enough for one glass.', c: ['a few', 'a little', 'few', 'many'], a: 1, e: 'juice นับไม่ได้ และ "พอสำหรับหนึ่งแก้ว" ใช้ a little' },
    ],
  },
  {
    id: 'future-forms',
    level: 'A2',
    minutes: 7,
    title: 'การพูดถึงอนาคต',
    en: 'will / be going to',
    intro: 'ภาษาอังกฤษมีหลายวิธีพูดถึงอนาคต ที่ใช้บ่อยคือ **will** กับ **be going to** ซึ่งต่างกันที่ "ตัดสินใจเมื่อไหร่" และ "มีหลักฐานไหม"',
    sections: [
      {
        title: 'will',
        body: ['ใช้กับ **การตัดสินใจทันที** ณ ตอนพูด, คำสัญญา/ข้อเสนอ, และการคาดเดาที่ไม่มีหลักฐานชัด (มักมี think / probably)'],
        examples: [
          ['A: The phone is ringing. B: I\'ll get it.', 'โทรศัพท์ดัง — เดี๋ยวฉันรับให้'],
          ['I\'ll help you with your bags.', 'เดี๋ยวฉันช่วยถือกระเป๋า'],
          ['I think it will rain tomorrow.', 'ฉันคิดว่าพรุ่งนี้ฝนจะตก'],
        ],
      },
      {
        title: 'be going to',
        body: ['ใช้กับ **แผนที่ตัดสินใจไว้ก่อนแล้ว** และการคาดการณ์จาก **หลักฐานที่เห็นอยู่ตรงหน้า**'],
        examples: [
          ['I\'m going to study medicine.', 'ฉันตั้งใจจะเรียนแพทย์ (ตัดสินใจแล้ว)'],
          ['Look at those clouds! It\'s going to rain.', 'ดูเมฆนั่นสิ ฝนกำลังจะตก (เห็นหลักฐาน)'],
        ],
      },
      {
        title: 'กฎที่ต้องจำ',
        body: [
          'การนัดหมายที่จัดไว้แล้วใช้ present continuous ได้: **We\'re having dinner with Tom on Friday.**',
          'หลัง when, if, before, after, as soon as, until ที่พูดถึงอนาคต **ให้ใช้ present simple ไม่ใช้ will**',
        ],
        examples: [
          ['I\'ll call you when I get home.', 'ฉันจะโทรหาตอนถึงบ้าน (✗ when I will get)'],
          ['If it rains, we\'ll stay at home.', 'ถ้าฝนตก เราจะอยู่บ้าน'],
        ],
      },
    ],
    exercises: [
      { q: 'A: The phone is ringing.\nB: I ___ it.', c: ['get', 'am getting', '\'ll get', 'got'], a: 2, e: 'ตัดสินใจทันทีตอนพูด ใช้ will → I\'ll get it' },
      { q: 'Look at those black clouds! It ___ rain.', c: ['will', 'is going to', 'rains', 'is raining'], a: 1, e: 'มีหลักฐานที่เห็นอยู่ (เมฆดำ) ใช้ be going to' },
      { q: 'I\'ll call you when I ___ home.', c: ['will get', 'get', 'am getting', 'got'], a: 1, e: 'หลัง when ที่พูดถึงอนาคต ใช้ present simple' },
      { q: 'I\'ve decided. I ___ a new phone next month.', c: ['will buy', 'am going to buy', 'buy', 'bought'], a: 1, e: 'ตัดสินใจไว้ก่อนแล้ว (I\'ve decided) ใช้ be going to' },
    ],
  },
  {
    id: 'modal-verbs',
    level: 'A2',
    minutes: 8,
    title: 'กริยาช่วย can / should / must',
    en: 'Modal verbs',
    intro: 'Modal verbs เติมความหมาย เช่น ความสามารถ คำแนะนำ ข้อบังคับ ความเป็นไปได้ ให้กริยาหลัก',
    sections: [
      {
        title: 'กฎรูปแบบ',
        body: ['**modal + กริยาช่อง 1** เสมอ ไม่ใส่ to ไม่เติม s ไม่เติม ing: He **can swim**. (✗ He cans swims / ✗ He can to swim)'],
      },
      {
        title: 'ความหมายที่ใช้บ่อย',
        table: {
          head: ['Modal', 'ความหมาย', 'ตัวอย่าง'],
          rows: [
            ['can / can\'t', 'ความสามารถ / อนุญาต', 'She can speak three languages.'],
            ['could', 'ขอร้องสุภาพ / อดีตของ can', 'Could you open the window?'],
            ['should', 'ควร (คำแนะนำ)', 'You should see a doctor.'],
            ['must', 'ต้อง (ข้อบังคับ) / สรุปว่าคงจะ', 'You must wear a seat belt.'],
            ['mustn\'t', 'ห้าม', 'You mustn\'t smoke here.'],
            ['have to', 'จำเป็นต้อง (กฎ/สถานการณ์บังคับ)', 'I have to get up early on Monday.'],
            ['don\'t have to', 'ไม่จำเป็นต้อง', 'You don\'t have to come.'],
            ['may / might', 'อาจจะ', 'It might rain this evening.'],
          ],
        },
        note: { kind: 'warn', text: '**mustn\'t** = ห้ามทำ แต่ **don\'t have to** = ไม่จำเป็นต้องทำ (จะทำก็ได้) สองคำนี้ความหมายต่างกันมาก' },
      },
    ],
    exercises: [
      { q: 'You ___ park here. It\'s forbidden.', c: ['don\'t have to', 'mustn\'t', 'shouldn\'t to', 'can'], a: 1, e: 'ห้ามทำ ใช้ mustn\'t' },
      { q: 'You ___ come with me if you don\'t want to.', c: ['mustn\'t', 'don\'t have to', 'can\'t', 'shouldn\'t'], a: 1, e: 'ไม่จำเป็นต้องมา (ไม่ได้ห้าม) ใช้ don\'t have to' },
      { q: 'She ___ speak three languages.', c: ['can', 'cans', 'can to', 'is can'], a: 0, e: 'modal ไม่เติม s และตามด้วยกริยาช่อง 1 → can speak' },
      { q: 'I have a terrible headache.\nYou ___ see a doctor.', c: ['should', 'must to', 'should to', 'have'], a: 0, e: 'ให้คำแนะนำใช้ should + V1' },
    ],
  },

  {
    id: 'past-continuous',
    level: 'A2',
    minutes: 6,
    title: 'อดีตกาลต่อเนื่อง',
    en: 'Past continuous',
    intro: 'ใช้บอกสิ่งที่ "กำลังทำอยู่" ณ เวลาหนึ่งในอดีต หรือสิ่งที่กำลังทำอยู่แล้วมีอีกเหตุการณ์แทรกเข้ามา',
    sections: [
      {
        title: 'รูปประโยค',
        table: {
          head: ['', 'สูตร', 'ตัวอย่าง'],
          rows: [
            ['บอกเล่า', 'was / were + V-ing', 'I was watching TV.'],
            ['ปฏิเสธ', 'wasn\'t / weren\'t + V-ing', 'They weren\'t sleeping.'],
            ['คำถาม', 'Was / Were + S + V-ing?', 'Were you working?'],
          ],
        },
        note: { kind: 'tip', text: 'I / he / she / it → **was** · you / we / they → **were**' },
      },
      {
        title: 'ใช้เมื่อไหร่',
        body: [
          '**กำลังทำอยู่ตอนนั้น:** at 8 p.m. last night, this time yesterday',
          '**กำลังทำอยู่ แล้วมีเหตุการณ์สั้น ๆ แทรก:** เหตุการณ์ที่กำลังทำ = past continuous / เหตุการณ์ที่แทรก = past simple (มักมี when หรือ while)',
        ],
        examples: [
          ['I was cooking at seven o\'clock.', 'ตอนเจ็ดโมงฉันกำลังทำอาหารอยู่'],
          ['I was watching TV when you called me.', 'ฉันกำลังดูทีวีอยู่ตอนที่คุณโทรมา'],
          ['While she was walking, it started to rain.', 'ขณะที่เธอกำลังเดิน ฝนก็เริ่มตก'],
        ],
      },
    ],
    exercises: [
      { q: 'I ___ TV when you called me.', c: ['watch', 'was watching', 'am watching', 'have watched'], a: 1, e: 'กำลังดูทีวีอยู่แล้วมีสายเข้า → was watching' },
      { q: 'At 8 p.m. yesterday, we ___ dinner.', c: ['had', 'were having', 'are having', 'have'], a: 1, e: 'ระบุเวลาในอดีตที่กำลังทำอยู่ → were having' },
      { q: 'While she ___, it started to rain.', c: ['walked', 'was walking', 'walks', 'is walking'], a: 1, e: 'while + เหตุการณ์ที่กำลังดำเนินอยู่ → was walking' },
      { q: '___ you sleeping when I called?', c: ['Did', 'Was', 'Were', 'Are'], a: 2, e: 'you ใช้ were → Were you sleeping...?' },
    ],
  },
  {
    id: 'adjectives-adverbs',
    level: 'A2',
    minutes: 6,
    title: 'คุณศัพท์และกริยาวิเศษณ์',
    en: 'Adjectives & adverbs',
    intro: 'คุณศัพท์ (adjective) ขยายนาม ส่วนกริยาวิเศษณ์ (adverb) ขยายกริยา คำคุณศัพท์อื่น หรือทั้งประโยค',
    sections: [
      {
        title: 'ขยายอะไร',
        table: {
          head: ['ชนิด', 'ขยาย', 'ตัวอย่าง'],
          rows: [
            ['adjective', 'นาม / ตามหลัง be', 'a quiet room · She is happy.'],
            ['adverb', 'กริยา', 'She sings beautifully.'],
            ['adverb', 'adjective', 'very tall · really good'],
          ],
        },
        note: { kind: 'tip', text: 'adjective + **ly** = adverb ส่วนใหญ่ เช่น quiet → quietly, slow → slowly, careful → carefully' },
      },
      {
        title: 'คำที่ต้องจำ',
        table: {
          head: ['adjective', 'adverb', 'ตัวอย่าง'],
          rows: [
            ['good', 'well', 'He plays well.'],
            ['fast', 'fast', 'She runs fast.'],
            ['hard', 'hard', 'They work hard.'],
            ['late', 'late', 'I got up late.'],
          ],
        },
        note: { kind: 'warn', text: '**feel / look / sound / seem / become** ตามด้วย adjective ไม่ใช่ adverb: It sounds **good**. (✗ sounds well)' },
      },
    ],
    exercises: [
      { q: 'She spoke so ___ that nobody could hear her.', c: ['quiet', 'quietly', 'quieter', 'quietness'], a: 1, e: 'ขยายกริยา spoke ต้องใช้ adverb quietly' },
      { q: 'He plays the guitar very ___.', c: ['good', 'well', 'goodly', 'better'], a: 1, e: 'ขยายกริยา plays ใช้ well (adverb ของ good)' },
      { q: 'This soup tastes ___.', c: ['wonderfully', 'wonderful', 'wonder', 'wonders'], a: 1, e: 'taste เป็น linking verb ตามด้วย adjective' },
      { q: 'He answered all the questions ___.', c: ['correct', 'correctly', 'correction', 'corrected'], a: 1, e: 'ขยายกริยา answered ใช้ adverb correctly' },
    ],
  },
  {
    id: 'conjunctions',
    level: 'A2',
    minutes: 6,
    title: 'คำเชื่อม',
    en: 'and / but / so / because / although',
    intro: 'คำที่เชื่อมสองส่วนของประโยคให้ต่อกัน ให้ดูว่าสองส่วนนั้นมีความสัมพันธ์แบบไหน (เพิ่ม ขัดแย้ง เหตุ ผล)',
    sections: [
      {
        title: 'ความสัมพันธ์ → คำเชื่อม',
        table: {
          head: ['ความสัมพันธ์', 'คำ', 'ตัวอย่าง'],
          rows: [
            ['เพิ่ม', 'and', 'I like tea and coffee.'],
            ['ขัดแย้ง', 'but', 'I\'m tired, but I can\'t sleep.'],
            ['เลือก', 'or', 'Tea or coffee?'],
            ['ผล', 'so', 'It was raining, so we stayed home.'],
            ['เหตุ', 'because', 'We stayed home because it was raining.'],
            ['ขัดแย้ง (แม้ว่า)', 'although / though', 'Although it was cold, he went out.'],
          ],
        },
      },
      {
        title: 'because กับ so ต่างกัน',
        body: ['**because** ตามด้วย "เหตุ" · **so** ตามด้วย "ผล" · ห้ามใช้ although กับ but พร้อมกันในประโยคเดียว'],
        examples: [
          ['I was late because I missed the bus.', 'ฉันมาสายเพราะตกรถ'],
          ['I missed the bus, so I was late.', 'ฉันตกรถ ก็เลยมาสาย'],
          ['Although he was tired, he kept working.', 'แม้เหนื่อย เขาก็ยังทำงานต่อ'],
        ],
        note: { kind: 'warn', text: 'ไม่พูด ✗ Although it was cold, but he went out. ให้ใช้อย่างใดอย่างหนึ่ง' },
      },
    ],
    exercises: [
      { q: 'I was late ___ I missed the bus.', c: ['so', 'because', 'but', 'although'], a: 1, e: 'ตามด้วยเหตุผล ใช้ because' },
      { q: 'It was raining, ___ we stayed at home.', c: ['because', 'although', 'so', 'or'], a: 2, e: 'ตามด้วยผลที่ตามมา ใช้ so' },
      { q: '___ it was cold, he went out without a coat.', c: ['Because', 'So', 'Although', 'But'], a: 2, e: 'ขัดแย้งกับที่คาด ใช้ Although' },
      { q: 'Do you want tea ___ coffee?', c: ['and', 'but', 'or', 'so'], a: 2, e: 'ให้เลือก ใช้ or' },
    ],
  },
  {
    id: 'phrasal-verbs',
    level: 'A2',
    minutes: 7,
    title: 'กริยาวลี',
    en: 'Phrasal verbs',
    intro: 'กริยา + คำเล็ก ๆ (up, off, out ...) แล้วความหมายเปลี่ยนไป ต้องจำเป็นคำ ๆ ไม่แปลทีละคำ',
    sections: [
      {
        title: 'ที่ใช้บ่อย',
        table: {
          head: ['กริยาวลี', 'ความหมาย', 'ตัวอย่าง'],
          rows: [
            ['get up', 'ตื่น / ลุกขึ้น', 'I get up at six.'],
            ['turn on / off', 'เปิด / ปิด', 'Turn off the light.'],
            ['look for', 'มองหา', 'I\'m looking for my keys.'],
            ['look after', 'ดูแล', 'She looks after her sister.'],
            ['take off', 'ถอด / เครื่องบินขึ้น', 'Take off your shoes.'],
            ['give up', 'เลิก / ยอมแพ้', 'He gave up smoking.'],
            ['find out', 'ค้นพบ / รู้ความจริง', 'I found out the answer.'],
            ['run out of', 'หมด', 'We ran out of milk.'],
          ],
        },
      },
      {
        title: 'แยกคำได้ไหม',
        body: [
          'บางตัวแยกคำได้ เมื่อกรรมเป็น **สรรพนาม** ต้องวางไว้กลาง: **turn it off** (✗ turn off it)',
          'บางตัวแยกไม่ได้ เช่น **look after her** · **look for it**',
        ],
        examples: [
          ['Turn the TV off. = Turn off the TV.', 'ปิดทีวีหน่อย'],
          ['Turn it off.', 'ปิดมันที'],
          ['Please look after the baby.', 'ช่วยดูแลเด็กหน่อย'],
        ],
      },
    ],
    exercises: [
      { q: 'I\'m looking ___ my keys. Have you seen them?', c: ['at', 'for', 'after', 'up'], a: 1, e: 'look for = มองหา' },
      { q: 'Please ___ your shoes before you come in.', c: ['take off', 'give up', 'look after', 'turn off'], a: 0, e: 'take off = ถอด (รองเท้า เสื้อผ้า)' },
      { q: 'We ran ___ milk, so I went to the shop.', c: ['out of', 'away from', 'off of', 'up with'], a: 0, e: 'run out of = ของหมด' },
      { q: 'He gave ___ smoking last year.', c: ['up', 'off', 'out', 'away'], a: 0, e: 'give up = เลิก (นิสัย)' },
    ],
  },
  // ───────────────────────── B1 ─────────────────────────
  {
    id: 'present-perfect',
    level: 'B1',
    minutes: 10,
    title: 'ปัจจุบันกาลสมบูรณ์',
    en: 'Present perfect',
    intro: 'เชื่อม "อดีต" กับ "ปัจจุบัน" เข้าด้วยกัน ใช้เมื่อสนใจ **ผลหรือประสบการณ์ที่ยังเกี่ยวกับตอนนี้** ไม่ใช่เวลาที่เกิดเหตุการณ์',
    sections: [
      {
        title: 'รูปประโยค',
        body: ['**have / has + กริยาช่อง 3** (I/you/we/they have, he/she/it has) ปฏิเสธ haven\'t / hasn\'t ถามด้วย Have / Has ขึ้นต้น'],
        examples: [
          ['I have finished my homework.', 'ฉันทำการบ้านเสร็จแล้ว'],
          ['She hasn\'t called me yet.', 'เธอยังไม่โทรหาฉันเลย'],
          ['Have you eaten lunch?', 'คุณกินข้าวเที่ยงหรือยัง'],
        ],
      },
      {
        title: '3 การใช้หลัก',
        table: {
          head: ['การใช้', 'คำที่มักมาด้วย', 'ตัวอย่าง'],
          rows: [
            ['ประสบการณ์', 'ever, never, before', 'Have you ever been to Japan?'],
            ['เพิ่งเกิด / ผลที่ยังเห็น', 'just, already, yet', 'I\'ve just finished. / She hasn\'t arrived yet.'],
            ['ต่อเนื่องถึงปัจจุบัน', 'for + ช่วงเวลา, since + จุดเวลา', 'I\'ve lived here for five years. / since 2019'],
          ],
        },
      },
      {
        title: 'ต่างจาก past simple',
        body: [
          'ถ้ามี **เวลาที่จบไปแล้วระบุชัด** (yesterday, last week, in 2020, ten minutes ago) ต้องใช้ **past simple** ไม่ใช้ present perfect',
        ],
        examples: [
          ['I saw him yesterday.', 'เมื่อวานฉันเจอเขา (✗ I have seen him yesterday)'],
          ['She has been to Paris.', 'เธอเคยไปปารีส (ไปแล้วกลับมาแล้ว)'],
          ['She has gone to Paris.', 'เธอไปปารีสแล้ว (ยังไม่กลับ)'],
        ],
      },
    ],
    exercises: [
      { q: 'I ___ in Bangkok since 2018.', c: ['lived', 'have lived', 'am living', 'live'], a: 1, e: 'since + จุดเวลา บอกว่าต่อเนื่องถึงปัจจุบัน ใช้ present perfect' },
      { q: '___ you ever ___ sushi?', c: ['Did / eat', 'Have / eaten', 'Do / eat', 'Are / eating'], a: 1, e: 'ถามประสบการณ์ด้วย ever → Have you ever eaten…?' },
      { q: 'She ___ to London in 2019.', c: ['has gone', 'went', 'has been', 'goes'], a: 1, e: 'ระบุเวลาที่จบแล้ว (in 2019) ใช้ past simple' },
      { q: 'I haven\'t finished my homework ___.', c: ['already', 'yet', 'since', 'ago'], a: 1, e: 'yet ใช้ในประโยคปฏิเสธ/คำถามของ present perfect' },
    ],
  },
  {
    id: 'conditionals',
    level: 'B1',
    minutes: 9,
    title: 'ประโยคเงื่อนไข',
    en: 'Zero, first & second conditional',
    intro: 'ประโยคเงื่อนไขมี 2 ส่วน คือ **if-clause** (เงื่อนไข) กับ **main clause** (ผลลัพธ์) ชนิดของประโยคขึ้นอยู่กับว่าเงื่อนไขนั้น "เป็นจริง/เป็นไปได้" แค่ไหน',
    sections: [
      {
        title: 'ชนิดของ conditional',
        table: {
          head: ['ชนิด', 'โครงสร้าง', 'ใช้เมื่อ'],
          rows: [
            ['Zero', 'If + present, present', 'ความจริงทั่วไป / วิทยาศาสตร์'],
            ['First', 'If + present, will + V1', 'เป็นไปได้ในอนาคต'],
            ['Second', 'If + past, would + V1', 'สมมติ / ไม่น่าเป็นจริงตอนนี้'],
          ],
        },
        examples: [
          ['If you heat ice, it melts.', 'ถ้าให้ความร้อนกับน้ำแข็ง มันจะละลาย'],
          ['If it rains, we will stay at home.', 'ถ้าฝนตก เราจะอยู่บ้าน'],
          ['If I had a lot of money, I would travel the world.', 'ถ้าฉันมีเงินเยอะ ฉันจะเที่ยวรอบโลก (แต่ตอนนี้ไม่มี)'],
        ],
      },
      {
        title: 'ข้อควรระวัง',
        body: [
          'ห้ามใส่ will ในส่วน if: ✗ If it **will rain** → ✓ If it **rains**',
          'ใน second conditional ใช้ **were** กับทุกประธานในภาษาทางการ: If I **were** you, I would apologise.',
          '**unless** = if … not: Unless you hurry, you\'ll be late. (= If you don\'t hurry …)',
        ],
      },
    ],
    exercises: [
      { q: 'If it ___ tomorrow, we will cancel the picnic.', c: ['will rain', 'rains', 'rained', 'would rain'], a: 1, e: 'ส่วน if ของ first conditional ใช้ present simple ไม่ใช้ will' },
      { q: 'If I ___ rich, I would buy an island.', c: ['am', 'were', 'will be', 'would be'], a: 1, e: 'สมมติสิ่งที่ไม่จริง ใช้ if + past (were) + would' },
      { q: 'If you heat water to 100°C, it ___.', c: ['boiled', 'boils', 'would boil', 'is boiling'], a: 1, e: 'ความจริงทางวิทยาศาสตร์ ใช้ zero conditional (present + present)' },
      { q: 'I ___ to the party if I had time, but I\'m busy.', c: ['will go', 'would go', 'went', 'go'], a: 1, e: 'if + past simple (had) คู่กับ would + V1' },
    ],
  },
  {
    id: 'passive-voice',
    level: 'B1',
    minutes: 8,
    title: 'ประโยคกรรมวาจก',
    en: 'Passive voice',
    intro: 'ใช้เมื่อเรา **สนใจสิ่งที่ถูกกระทำ** มากกว่าผู้กระทำ หรือไม่รู้/ไม่จำเป็นต้องบอกว่าใครทำ เช่น "รถของฉันถูกขโมย"',
    sections: [
      {
        title: 'รูปประโยค',
        body: ['**be + กริยาช่อง 3** โดยเปลี่ยน be ตามกาล (กริยาช่อง 3 ไม่เปลี่ยน)'],
        table: {
          head: ['กาล', 'Passive', 'ตัวอย่าง'],
          rows: [
            ['Present simple', 'am / is / are + V3', 'English is spoken here.'],
            ['Past simple', 'was / were + V3', 'The bridge was built in 1990.'],
            ['Present perfect', 'has / have been + V3', 'The work has been finished.'],
            ['Future', 'will be + V3', 'The parcel will be delivered tomorrow.'],
            ['Modal', 'modal + be + V3', 'It can be done.'],
          ],
        },
      },
      {
        title: 'เปลี่ยน active เป็น passive',
        body: ['เอา **กรรม** ของประโยค active มาเป็นประธาน แล้วใส่ผู้กระทำหลัง **by** ถ้าจำเป็น'],
        examples: [
          ['Someone stole my phone.', 'มีคนขโมยโทรศัพท์ฉัน'],
          ['My phone was stolen.', 'โทรศัพท์ฉันถูกขโมย'],
          ['Picasso painted this picture.', 'ปิกัสโซวาดภาพนี้'],
          ['This picture was painted by Picasso.', 'ภาพนี้ถูกวาดโดยปิกัสโซ'],
        ],
      },
    ],
    exercises: [
      { q: 'This bridge ___ in 1990.', c: ['built', 'was built', 'is built', 'has built'], a: 1, e: 'ถูกสร้างในอดีต (in 1990) ใช้ was + V3' },
      { q: 'English ___ in many countries.', c: ['speaks', 'is spoken', 'is speaking', 'spoke'], a: 1, e: 'ภาษาถูกพูด (ผู้ถูกกระทำ) ปัจจุบัน → is spoken' },
      { q: 'The parcel ___ tomorrow.', c: ['will deliver', 'will be delivered', 'has delivered', 'is deliver'], a: 1, e: 'อนาคตแบบ passive → will be + V3' },
      { q: 'My phone ___ yesterday.', c: ['stole', 'was stolen', 'has stolen', 'is stolen'], a: 1, e: 'โทรศัพท์ถูกขโมย (อดีต) → was stolen' },
    ],
  },
  {
    id: 'relative-clauses',
    level: 'B1',
    minutes: 8,
    title: 'อนุประโยคขยายนาม',
    en: 'Relative clauses',
    intro: 'ใช้ขยายนามเพื่อบอกว่า "คนไหน / อันไหน" โดยไม่ต้องแยกเป็นหลายประโยค ด้วยคำ who, which, that, where, whose',
    sections: [
      {
        title: 'เลือกคำเชื่อมให้ถูก',
        table: {
          head: ['คำ', 'ใช้กับ', 'ตัวอย่าง'],
          rows: [
            ['who', 'คน', 'The man who lives next door is a doctor.'],
            ['which', 'สิ่งของ', 'This is the book which I told you about.'],
            ['that', 'คนหรือสิ่งของ (แทน who / which)', 'The book that I read was great.'],
            ['where', 'สถานที่', 'That\'s the town where I was born.'],
            ['whose', 'ความเป็นเจ้าของ', 'She is the girl whose bag was stolen.'],
          ],
        },
      },
      {
        title: 'ตัดคำเชื่อมได้เมื่อไหร่',
        body: [
          'ถ้าคำเชื่อมเป็น **กรรม** ของอนุประโยค ตัดทิ้งได้: the book (that) I read',
          'ถ้าเป็น **ประธาน** ตัดไม่ได้: the man **who** lives next door',
        ],
      },
      {
        title: 'ใส่ลูกน้ำหรือไม่',
        body: [
          'ข้อมูลที่ **จำเป็น** ต้องมีเพื่อระบุว่าหมายถึงใคร ไม่ใส่ลูกน้ำ และใช้ that ได้',
          'ข้อมูล **เสริม** ใส่ลูกน้ำคร่อม และ **ห้ามใช้ that**: My sister, **who** lives in Phuket, is a nurse.',
        ],
      },
    ],
    exercises: [
      { q: 'The woman ___ lives next door is a nurse.', c: ['which', 'who', 'whose', 'where'], a: 1, e: 'ขยายคน และเป็นประธานของอนุประโยค ใช้ who' },
      { q: 'That is the restaurant ___ we had dinner.', c: ['which', 'who', 'where', 'whose'], a: 2, e: 'ขยายสถานที่ ใช้ where' },
      { q: 'He is the boy ___ bike was stolen.', c: ['who', 'which', 'whose', 'where'], a: 2, e: 'จักรยานของเด็กคนนั้น → whose (แสดงความเป็นเจ้าของ)' },
      { q: 'I lost the book ___ you gave me.', c: ['who', 'whose', 'that', 'where'], a: 2, e: 'ขยายสิ่งของ ใช้ that / which ได้ (ในตัวเลือกมีเฉพาะ that)' },
    ],
  },
  {
    id: 'gerund-infinitive',
    level: 'B1',
    minutes: 9,
    title: 'กริยาเติม -ing หรือ to + V1',
    en: 'Gerund & infinitive',
    intro: 'กริยาบางตัวต้องตามด้วย **-ing** บางตัวตามด้วย **to + V1** ไม่มีกฎที่ใช้ได้ทุกกรณี ต้องจำเป็นกลุ่ม',
    sections: [
      {
        title: 'ตามด้วย -ing (gerund)',
        body: ['**enjoy, finish, avoid, mind, suggest, keep, practise, consider, deny, give up**'],
        examples: [
          ['I enjoy reading.', 'ฉันชอบอ่านหนังสือ'],
          ['She suggested going to the cinema.', 'เธอเสนอให้ไปดูหนัง'],
        ],
      },
      {
        title: 'ตามด้วย to + V1 (infinitive)',
        body: ['**want, need, decide, hope, plan, promise, learn, agree, afford, refuse, would like**'],
        examples: [
          ['I want to go home.', 'ฉันอยากกลับบ้าน'],
          ['We decided to buy a new car.', 'เราตัดสินใจซื้อรถคันใหม่'],
        ],
      },
      {
        title: 'ตามได้ทั้งสองแบบ และกรณีพิเศษ',
        body: [
          '**like, love, hate, start, begin** ตามได้ทั้งสองแบบ ความหมายแทบไม่เปลี่ยน',
          '**stop doing** = เลิกทำ / **stop to do** = หยุดเพื่อไปทำอย่างอื่น',
          '**remember doing** = จำได้ว่าเคยทำ / **remember to do** = จำได้ว่าต้องทำ (ไม่ลืม)',
          'หลัง **บุพบท** ต้องเป็น -ing เสมอ: good **at** swimming, interested **in** learning, look forward **to** seeing',
          '**let / make + คน + V1** (ไม่มี to): My mum let me stay up late.',
        ],
      },
    ],
    exercises: [
      { q: 'She enjoys ___ to music.', c: ['listen', 'to listen', 'listening', 'listened'], a: 2, e: 'enjoy ตามด้วย -ing' },
      { q: 'We decided ___ a new car.', c: ['buying', 'buy', 'to buy', 'bought'], a: 2, e: 'decide ตามด้วย to + V1' },
      { q: 'Thank you for ___ me.', c: ['help', 'to help', 'helping', 'helped'], a: 2, e: 'หลังบุพบท (for) ใช้ -ing' },
      { q: 'I\'m looking forward to ___ you.', c: ['see', 'seeing', 'to see', 'saw'], a: 1, e: 'look forward to เป็นสำนวนที่ to เป็นบุพบท จึงตามด้วย -ing' },
    ],
  },
  {
    id: 'present-perfect-continuous',
    level: 'B1',
    minutes: 7,
    title: 'ปัจจุบันกาลสมบูรณ์ต่อเนื่อง',
    en: 'Present perfect continuous',
    intro: 'ใช้บอกสิ่งที่ "ทำต่อเนื่องมาจนถึงตอนนี้" เน้นว่าทำมานานแค่ไหน หรือผลที่เห็นอยู่ตอนนี้เกิดจากการทำต่อเนื่อง',
    sections: [
      {
        title: 'รูปประโยค',
        table: {
          head: ['', 'สูตร', 'ตัวอย่าง'],
          rows: [
            ['บอกเล่า', 'have / has + been + V-ing', 'I have been waiting for an hour.'],
            ['ปฏิเสธ', 'haven\'t / hasn\'t + been + V-ing', 'She hasn\'t been sleeping well.'],
            ['คำถาม', 'Have / Has + S + been + V-ing?', 'How long have you been learning English?'],
          ],
        },
        note: { kind: 'tip', text: 'คำที่มักมาด้วย: **for** + ระยะเวลา · **since** + จุดเวลา · **How long ...?**' },
      },
      {
        title: 'ต่างจาก present perfect',
        body: [
          '**present perfect continuous** เน้น "กระบวนการ / ช่วงเวลาที่ทำ" (ยังทำอยู่หรือเพิ่งหยุด)',
          '**present perfect** เน้น "ผลลัพธ์ / จำนวนที่ทำเสร็จ"',
        ],
        examples: [
          ['I have been living here for six years.', 'ฉันอยู่ที่นี่มาหกปีแล้ว (ยังอยู่)'],
          ['She is tired. She has been working all day.', 'เธอเหนื่อย เพราะทำงานมาทั้งวัน'],
          ['I have written three emails.', 'ฉันเขียนอีเมลไปสามฉบับ (เน้นจำนวนที่เสร็จ)'],
        ],
        note: { kind: 'warn', text: 'กริยาที่บอกสภาวะ (know, like, have = มี) ไม่ใช้ -ing: I **have known** her for years.' },
      },
    ],
    exercises: [
      { q: 'I ___ for you for an hour!', c: ['wait', 'am waiting', 'have been waiting', 'waited'], a: 2, e: 'for an hour + ยังรออยู่ถึงตอนนี้ → have been waiting' },
      { q: 'How long ___ English?', c: ['do you learn', 'have you been learning', 'did you learn', 'are you learning'], a: 1, e: 'How long + ทำต่อเนื่องถึงตอนนี้ → have you been learning' },
      { q: 'She has been working here ___ 2020.', c: ['for', 'since', 'from', 'during'], a: 1, e: 'since + จุดเวลา (2020)' },
      { q: 'Her eyes are red. She ___.', c: ['cries', 'has been crying', 'cried', 'will cry'], a: 1, e: 'ผลที่เห็นตอนนี้เกิดจากการทำต่อเนื่อง → has been crying' },
    ],
  },
  {
    id: 'past-perfect',
    level: 'B1',
    minutes: 7,
    title: 'อดีตกาลสมบูรณ์',
    en: 'Past perfect',
    intro: 'ใช้เมื่อมีเหตุการณ์ในอดีตสองอย่าง สิ่งที่เกิด **ก่อน** ใช้ past perfect ส่วนที่เกิด **ทีหลัง** ใช้ past simple',
    sections: [
      {
        title: 'รูปประโยค',
        table: {
          head: ['', 'สูตร', 'ตัวอย่าง'],
          rows: [
            ['บอกเล่า', 'had + V3', 'She had left.'],
            ['ปฏิเสธ', 'hadn\'t + V3', 'I hadn\'t eaten.'],
            ['คำถาม', 'Had + S + V3?', 'Had you met him before?'],
          ],
        },
      },
      {
        title: 'ก่อน → ทีหลัง',
        body: ['คำที่มักบอกลำดับ: **before, after, by the time, when, already, just**'],
        examples: [
          ['When I arrived, the film had already started.', 'ตอนฉันไปถึง หนังเริ่มฉายไปแล้ว'],
          ['I realized that I had left my keys at home.', 'ฉันนึกได้ว่าลืมกุญแจไว้ที่บ้าน'],
          ['By the time we got there, they had gone.', 'กว่าเราไปถึง พวกเขาไปแล้ว'],
        ],
        note: { kind: 'tip', text: 'ถ้ามีเหตุการณ์เดียวหรือเล่าตามลำดับเวลา ใช้ past simple ก็พอ' },
      },
    ],
    exercises: [
      { q: 'By the time we arrived, the film ___.', c: ['already started', 'had already started', 'has already started', 'was already starting'], a: 1, e: 'เริ่มฉายก่อนที่เราไปถึง → had already started' },
      { q: 'I realized that I ___ my car keys in the office.', c: ['left', 'has left', 'had left', 'was leaving'], a: 2, e: 'ลืมไว้ก่อนที่จะนึกได้ → had left' },
      { q: 'She was sad because she ___ her phone.', c: ['lost', 'had lost', 'has lost', 'loses'], a: 1, e: 'ทำหายก่อนที่จะเศร้า → had lost' },
      { q: 'After he ___ dinner, he watched TV.', c: ['finished', 'has finished', 'had finished', 'finishes'], a: 2, e: 'กินเสร็จก่อนแล้วค่อยดูทีวี → had finished' },
    ],
  },
  {
    id: 'reported-speech',
    level: 'B1',
    minutes: 8,
    title: 'การเล่าคำพูดคนอื่น',
    en: 'Reported speech',
    intro: 'เล่าสิ่งที่ใครพูดโดยไม่ยกคำพูดตรง ๆ ถ้ากริยาหลัก (said, told) เป็นอดีต ให้ **ถอยกริยาไปหนึ่งขั้น**',
    sections: [
      {
        title: 'ถอยกริยาไปหนึ่งขั้น',
        table: {
          head: ['คำพูดจริง', 'เล่าต่อ'],
          rows: [
            ['"I am tired." (present)', 'He said he was tired.'],
            ['"I work here." (present simple)', 'She said she worked there.'],
            ['"I have finished." (present perfect)', 'He said he had finished.'],
            ['"I will call you." (will)', 'She said she would call me.'],
            ['"I can swim." (can)', 'He said he could swim.'],
          ],
        },
      },
      {
        title: 'say กับ tell, และคำที่เปลี่ยน',
        body: [
          '**said (that) ...** · **told + คน + (that) ...** ห้ามพูด ✗ said me',
          'คำบอกเวลาก็เปลี่ยน: today → that day · tomorrow → the next day · yesterday → the day before',
        ],
        examples: [
          ['She told me that she was busy.', 'เธอบอกฉันว่าเธอยุ่ง'],
          ['He said he would meet me at the airport.', 'เขาบอกว่าจะไปรับที่สนามบิน'],
        ],
      },
    ],
    exercises: [
      { q: 'He said he ___ call me later.', c: ['will', 'would', 'is going', 'shall'], a: 1, e: 'said (อดีต) → will เลื่อนเป็น would' },
      { q: 'She told ___ that she was tired.', c: ['to me', 'me', 'for me', 'I'], a: 1, e: 'tell + คน (me) + that ...' },
      { q: '"I am hungry," he said. → He said he ___ hungry.', c: ['is', 'was', 'be', 'has been'], a: 1, e: 'am → was เมื่อเล่าต่อ' },
      { q: 'She said, "I have finished." → She said she ___ finished.', c: ['has', 'had', 'have', 'was'], a: 1, e: 'present perfect ถอยหนึ่งขั้นเป็น past perfect → had finished' },
    ],
  },
  {
    id: 'question-tags',
    level: 'B1',
    minutes: 5,
    title: 'ประโยคคำถามท้าย',
    en: 'Question tags',
    intro: 'คำถามสั้น ๆ ที่ต่อท้ายประโยค เพื่อขอให้ยืนยัน (ใช่ไหม / ไม่ใช่เหรอ) กฎหลัก: **บอกเล่า → ท้ายเป็นปฏิเสธ · ปฏิเสธ → ท้ายเป็นบอกเล่า**',
    sections: [
      {
        title: 'วิธีสร้าง',
        table: {
          head: ['ประโยคหลัก', 'คำถามท้าย'],
          rows: [
            ['You are a student,', 'aren\'t you?'],
            ['She likes coffee,', 'doesn\'t she?'],
            ['They didn\'t come,', 'did they?'],
            ['You haven\'t met him,', 'have you?'],
            ['He can swim,', 'can\'t he?'],
          ],
        },
        note: { kind: 'tip', text: 'ใช้ **กริยาช่วยตัวเดียวกับประโยคหลัก** (is, do/does/did, have, can ...) แล้วใช้สรรพนามแทนประธาน' },
      },
      {
        title: 'ข้อควรจำ',
        examples: [
          ['You play the piano, don\'t you?', 'คุณเล่นเปียโนใช่ไหม'],
          ['The team didn\'t win, did they?', 'ทีมไม่ชนะใช่ไหม'],
          ['I am late, aren\'t I?', 'ฉันมาสายใช่ไหม (กรณีพิเศษ am → aren\'t I)'],
        ],
      },
    ],
    exercises: [
      { q: 'You play the piano, ___ you?', c: ['aren\'t', 'haven\'t', 'won\'t', 'don\'t'], a: 3, e: 'play (present simple บอกเล่า) → don\'t you?' },
      { q: 'The other team didn\'t score, ___?', c: ['are they', 'didn\'t they', 'did they', 'do they'], a: 2, e: 'ปฏิเสธ (didn\'t) → ท้ายบอกเล่า did they?' },
      { q: 'You met John at the last meeting, ___ you?', c: ['don\'t', 'didn\'t', 'hadn\'t', 'haven\'t'], a: 1, e: 'met เป็น past simple บอกเล่า → didn\'t you?' },
      { q: 'You haven\'t met Mr. Smith, ___?', c: ['have you', 'do you', 'are you', 'did you'], a: 0, e: 'haven\'t (present perfect ปฏิเสธ) → have you?' },
    ],
  },
  {
    id: 'used-to',
    level: 'B1',
    minutes: 6,
    title: 'used to',
    en: 'used to / be used to / get used to',
    intro: 'รูปคล้ายกัน แต่ความหมายต่างกัน ให้ดูว่าหลัง to ตามด้วยอะไร',
    sections: [
      {
        title: 'สามแบบ',
        table: {
          head: ['แบบ', 'ความหมาย', 'ตามด้วย', 'ตัวอย่าง'],
          rows: [
            ['used to', 'เคยทำ (ตอนนี้ไม่แล้ว)', 'V1', 'I used to play football.'],
            ['be used to', 'คุ้นเคยกับ', 'V-ing / นาม', 'I\'m used to getting up early.'],
            ['get used to', 'เริ่มคุ้นเคย', 'V-ing / นาม', 'I\'m getting used to this phone.'],
          ],
        },
        note: { kind: 'warn', text: 'ปฏิเสธและถามของ used to ใช้ **did + use to** (ไม่มี d): I didn\'t **use to** like fish.' },
      },
      {
        title: 'ตัวอย่าง',
        examples: [
          ['I used to take the bus, but it was too slow.', 'ฉันเคยนั่งรถเมล์ แต่มันช้าเกินไป'],
          ['She is used to working at night.', 'เธอชินกับการทำงานกลางคืน'],
          ['I\'m still getting used to my new phone.', 'ฉันยังกำลังทำความคุ้นเคยกับโทรศัพท์เครื่องใหม่'],
        ],
      },
    ],
    exercises: [
      { q: 'Why don\'t you take the bus? — Well, I ___, but it was so slow.', c: ['have to', 'need to', 'used to', 'want to'], a: 2, e: 'เคยทำแต่เลิกแล้ว → used to' },
      { q: 'It\'s confusing. I\'m still getting ___ my new phone.', c: ['use', 'used', 'to use', 'used to'], a: 3, e: 'get used to + นาม = เริ่มคุ้นเคย' },
      { q: 'I\'m not used to ___ up so early.', c: ['get', 'getting', 'got', 'be getting'], a: 1, e: 'be used to + V-ing' },
      { q: 'We ___ live in a small village when I was a child.', c: ['used to', 'are used to', 'get used to', 'use to'], a: 0, e: 'เคยอยู่ในอดีต → used to + V1' },
    ],
  },
  {
    id: 'so-such-enough-too',
    level: 'B1',
    minutes: 6,
    title: 'so / such / enough / too',
    en: 'so, such, too, enough',
    intro: 'คำเน้นระดับที่ใช้บ่อยในข้อสอบ ให้ดูว่าหลังคำนั้นเป็นคุณศัพท์ล้วนหรือมีนามด้วย',
    sections: [
      {
        title: 'ใช้ยังไง',
        table: {
          head: ['คำ', 'โครงสร้าง', 'ตัวอย่าง'],
          rows: [
            ['so', 'so + adj / adv', 'The film was so exciting.'],
            ['such', 'such + a/an + adj + นาม', 'It was such an exciting film.'],
            ['too', 'too + adj (มากเกินไป)', 'It\'s too hot to go out.'],
            ['enough', 'adj + enough · enough + นาม', 'She is old enough. · We have enough food.'],
          ],
        },
        note: { kind: 'tip', text: '**so** + คุณศัพท์ล้วน · **such** + (a/an) + คุณศัพท์ + **นาม**' },
      },
      {
        title: 'ตำแหน่งของ enough',
        examples: [
          ['He isn\'t tall enough to reach it.', 'เขาสูงไม่พอที่จะเอื้อมถึง'],
          ['There isn\'t enough sugar.', 'น้ำตาลไม่พอ'],
          ['It was too late to call.', 'ดึกเกินกว่าจะโทร'],
        ],
        note: { kind: 'warn', text: 'enough ตามหลัง adj (tall **enough**) แต่ขึ้นหน้านาม (**enough** sugar)' },
      },
    ],
    exercises: [
      { q: 'It was ___ an exciting game.', c: ['so', 'that', 'very', 'such'], a: 3, e: 'such + a/an + adj + นาม (an exciting game)' },
      { q: 'The film was ___ boring that I fell asleep.', c: ['such', 'so', 'too', 'enough'], a: 1, e: 'so + adj + that (boring เป็น adj ล้วน)' },
      { q: 'There isn\'t ___ to make a cake.', c: ['enough sugar', 'sugar enough', 'enough of sugar', 'few sugar'], a: 0, e: 'enough ขึ้นหน้านาม: enough sugar' },
      { q: 'He isn\'t tall ___ to reach the shelf.', c: ['enough', 'so', 'too', 'such'], a: 0, e: 'adj + enough: tall enough (ไม่...พอที่จะ)' },
    ],
  },
  {
    id: 'both-either-neither',
    level: 'B1',
    minutes: 5,
    title: 'both / either / neither / none',
    en: 'both, either, neither, none',
    intro: 'คำที่ใช้พูดถึงสองสิ่ง หรือมากกว่าสอง ให้ดูก่อนว่ากำลังพูดถึงกี่สิ่ง และต้องการความหมายบวกหรือลบ',
    sections: [
      {
        title: 'สองสิ่ง vs มากกว่าสอง',
        table: {
          head: ['ความหมาย', 'สองสิ่ง', 'มากกว่าสอง'],
          rows: [
            ['ทั้งหมด', 'both', 'all'],
            ['อันไหนก็ได้', 'either', 'any'],
            ['ไม่มีเลย', 'neither', 'none / no one'],
          ],
        },
        note: { kind: 'tip', text: '**Neither of + พหูพจน์** ตามด้วยกริยาเอกพจน์: Neither of the girls **is** my student.' },
      },
      {
        title: 'ตัวอย่าง',
        examples: [
          ['Both of my parents are teachers.', 'พ่อแม่ทั้งสองของฉันเป็นครู'],
          ['Do you want tea or coffee? — Either is fine.', 'ชาหรือกาแฟ — อันไหนก็ได้'],
          ['Neither of them has a car.', 'ไม่มีใครในสองคนนั้นมีรถ'],
          ['None of my friends can speak French.', 'ไม่มีเพื่อนฉันคนไหนพูดฝรั่งเศสได้'],
        ],
      },
    ],
    exercises: [
      { q: 'We can meet on Monday or Tuesday. — ___ day is fine for me.', c: ['Both', 'Either', 'All', 'Every'], a: 1, e: 'สองตัวเลือก อันไหนก็ได้ → Either' },
      { q: 'I have two brothers, but ___ of them lives in Bangkok.', c: ['both', 'either', 'neither', 'none'], a: 2, e: 'พูดถึงสองคน ไม่มีทั้งคู่ → neither' },
      { q: 'There were ten people at the party, but ___ of them knew me.', c: ['neither', 'none', 'either', 'both'], a: 1, e: 'มากกว่าสองคน ไม่มีเลย → none' },
      { q: 'Both of my parents ___ teachers.', c: ['is', 'are', 'be', 'has'], a: 1, e: 'both = สองคน (พหูพจน์) → are' },
    ],
  },
  {
    id: 'dependent-prepositions',
    level: 'B1',
    minutes: 7,
    title: 'บุพบทที่ต้องจำคู่',
    en: 'Dependent prepositions',
    intro: 'กริยาและคุณศัพท์หลายคำต้องมีบุพบทเฉพาะตัวติดมาด้วย ไม่มีกฎ ต้องจำเป็นคู่ ๆ',
    sections: [
      {
        title: 'คุณศัพท์ + บุพบท',
        table: {
          head: ['คำ', 'บุพบท', 'ตัวอย่าง'],
          rows: [
            ['afraid / proud', 'of', 'afraid of spiders · proud of her'],
            ['interested', 'in', 'interested in music'],
            ['good / bad', 'at', 'good at maths'],
            ['married', 'to', 'married to a doctor'],
            ['worried', 'about', 'worried about the exam'],
          ],
        },
      },
      {
        title: 'กริยา + บุพบท',
        table: {
          head: ['คำ', 'บุพบท', 'ตัวอย่าง'],
          rows: [
            ['depend / rely', 'on', 'I depend on my parents.'],
            ['belong', 'to', 'This bag belongs to me.'],
            ['agree', 'with', 'I agree with you.'],
            ['apologise', 'for', 'She apologised for being late.'],
            ['look forward', 'to', 'I look forward to seeing you.'],
            ['insist', 'on', 'He insisted on paying.'],
          ],
        },
        note: { kind: 'tip', text: 'หลังบุพบทต้องเป็น **นาม หรือ V-ing** เสมอ (ไม่ใช้ to + V1)' },
      },
    ],
    exercises: [
      { q: 'She is afraid ___ spiders.', c: ['of', 'from', 'at', 'with'], a: 0, e: 'afraid of' },
      { q: 'I\'m interested ___ learning Japanese.', c: ['in', 'on', 'at', 'about'], a: 0, e: 'interested in' },
      { q: 'This bag belongs ___ my sister.', c: ['for', 'to', 'of', 'with'], a: 1, e: 'belong to' },
      { q: 'She apologised ___ being late.', c: ['for', 'of', 'about', 'to'], a: 0, e: 'apologise for + V-ing' },
    ],
  },
  {
    id: 'word-forms',
    level: 'B1',
    minutes: 7,
    title: 'ตระกูลคำ',
    en: 'Word forms',
    intro: 'คำเดียวมีหลายรูป (นาม กริยา คุณศัพท์ กริยาวิเศษณ์) เวลาเติมคำ ให้ดูก่อนว่าช่องนั้นต้องการคำชนิดไหน',
    sections: [
      {
        title: 'ดูตำแหน่งในประโยค',
        table: {
          head: ['ตำแหน่ง', 'ต้องการ', 'ตัวอย่าง'],
          rows: [
            ['หลัง a / the / adj', 'นาม', 'the construction of the bridge'],
            ['หน้านาม / หลัง be', 'คุณศัพท์', 'a talented singer · She is talented.'],
            ['หลังกริยา', 'adverb', 'He answered correctly.'],
            ['หลัง to', 'กริยา V1', 'to decide'],
          ],
        },
      },
      {
        title: 'ส่วนท้ายคำบอกชนิด',
        table: {
          head: ['ชนิด', 'ส่วนท้ายที่พบบ่อย', 'ตัวอย่าง'],
          rows: [
            ['นาม', '-tion, -ment, -ness, -er', 'decision, movement, happiness'],
            ['คุณศัพท์', '-ful, -ous, -able, -ive', 'useful, famous, comfortable'],
            ['adverb', '-ly', 'quickly, carefully'],
            ['กริยา', '-ise, -en', 'organise, widen'],
          ],
        },
        note: { kind: 'tip', text: 'ปฏิเสธ: **il- / im- / un- / dis-** นำหน้า: legal → **il**legal · possible → **im**possible · happy → **un**happy' },
      },
    ],
    exercises: [
      { q: 'She is a very ___ singer. Everyone loves her voice.', c: ['talent', 'talented', 'talently', 'talents'], a: 1, e: 'หน้านาม singer ต้องการคุณศัพท์ → talented' },
      { q: 'The ___ of the new bridge took two years.', c: ['construct', 'construction', 'constructive', 'constructed'], a: 1, e: 'หลัง The ต้องการนาม → construction' },
      { q: 'It is ___ to drive without a licence.', c: ['legal', 'illegal', 'unlegal', 'nonlegal'], a: 1, e: 'ปฏิเสธของ legal คือ illegal' },
      { q: 'I was ___ when I heard the good news.', c: ['delight', 'delighted', 'delighting', 'delightfully'], a: 1, e: 'was + adj ที่บอกความรู้สึก → delighted' },
    ],
  },
  {
    id: 'collocations',
    level: 'B1',
    minutes: 6,
    title: 'คำที่ใช้คู่กัน',
    en: 'Collocations: make / do / take / have',
    intro: 'บางคำ "เข้าคู่" กันโดยธรรมชาติ แปลตรงตัวแล้วอาจผิด ต้องจำเป็นวลี โดยเฉพาะกริยา make / do / take / have',
    sections: [
      {
        title: 'make / do',
        table: {
          head: ['make', 'do'],
          rows: [
            ['make a mistake', 'do homework'],
            ['make a decision', 'do the housework'],
            ['make money', 'do a favour'],
            ['make a phone call', 'do your best'],
          ],
        },
        note: { kind: 'tip', text: '**make** = สร้างสิ่งใหม่ / ผลลัพธ์ · **do** = ทำกิจกรรม / งาน' },
      },
      {
        title: 'take / have',
        table: {
          head: ['take', 'have'],
          rows: [
            ['take a photo', 'have a good time'],
            ['take a break', 'have a shower'],
            ['take a bus', 'have lunch'],
            ['take care', 'have a look'],
          ],
        },
        note: { kind: 'tip', text: 'อวยพร: **Have** a good weekend! · ไม่ใช้ get / make' },
      },
    ],
    exercises: [
      { q: 'Everyone ___ mistakes sometimes.', c: ['makes', 'does', 'has', 'takes'], a: 0, e: 'make a mistake' },
      { q: 'I need to ___ a decision by Friday.', c: ['do', 'make', 'take', 'have'], a: 1, e: 'make a decision' },
      { q: 'It was a long journey, so we ___ a break halfway.', c: ['took', 'did', 'made', 'put'], a: 0, e: 'take a break' },
      { q: 'Please ___ your best on the test.', c: ['make', 'do', 'take', 'have'], a: 1, e: 'do your best' },
    ],
  },
  // ───────────────────────── B2 ─────────────────────────
  {
    id: 'past-perfect-continuous',
    level: 'B2',
    minutes: 6,
    title: 'อดีตกาลสมบูรณ์ต่อเนื่อง',
    en: 'Past perfect continuous',
    intro: 'ใช้บอกสิ่งที่ "ทำต่อเนื่องมาก่อน" จนถึงอีกจุดหนึ่งในอดีต มักใช้อธิบายสาเหตุของสิ่งที่เห็นในตอนนั้น',
    sections: [
      {
        title: 'รูปประโยค',
        table: {
          head: ['', 'สูตร', 'ตัวอย่าง'],
          rows: [
            ['บอกเล่า', 'had been + V-ing', 'I had been waiting for an hour.'],
            ['ปฏิเสธ', 'hadn\'t been + V-ing', 'She hadn\'t been sleeping well.'],
            ['คำถาม', 'Had + S + been + V-ing?', 'Had you been working long?'],
          ],
        },
        note: { kind: 'tip', text: 'มักมี **for** + ระยะเวลา หรือ **since** + จุดเวลา · ต่างจาก past perfect ตรงที่เน้น "ช่วงเวลาที่ทำ"' },
      },
      {
        title: 'ตัวอย่าง',
        examples: [
          ['When she arrived, I had been waiting for two hours.', 'ตอนเธอมาถึง ฉันรอมาสองชั่วโมงแล้ว'],
          ['His eyes were red because he had been crying.', 'ตาเขาแดงเพราะร้องไห้มา'],
          ['They had been playing for an hour when it started to rain.', 'พวกเขาเล่นมาหนึ่งชั่วโมงแล้วฝนก็เริ่มตก'],
        ],
      },
    ],
    exercises: [
      { q: 'When she arrived, I ___ for two hours.', c: ['waited', 'had been waiting', 'have been waiting', 'was waiting'], a: 1, e: 'รอต่อเนื่องก่อนที่เธอจะมาถึง + for two hours → had been waiting' },
      { q: 'His eyes were red because he ___.', c: ['cried', 'has been crying', 'had been crying', 'cries'], a: 2, e: 'ร้องไห้มาก่อนหน้านั้นในอดีต → had been crying' },
      { q: 'They ___ for an hour when it started to rain.', c: ['played', 'had been playing', 'were play', 'have played'], a: 1, e: 'เล่นต่อเนื่องมาแล้วหนึ่งชั่วโมง → had been playing' },
      { q: 'She was tired. She ___ all day.', c: ['worked', 'had been working', 'has worked', 'works'], a: 1, e: 'เหตุผลของความเหนื่อยในอดีต → had been working' },
    ],
  },
  {
    id: 'future-continuous',
    level: 'B2',
    minutes: 6,
    title: 'อนาคตกาลต่อเนื่อง',
    en: 'Future continuous',
    intro: 'ใช้บอกสิ่งที่ "จะกำลังทำอยู่" ณ เวลาหนึ่งในอนาคต',
    sections: [
      {
        title: 'รูปประโยค',
        table: {
          head: ['', 'สูตร', 'ตัวอย่าง'],
          rows: [
            ['บอกเล่า', 'will be + V-ing', 'I will be working at 9.'],
            ['ปฏิเสธ', 'won\'t be + V-ing', 'She won\'t be sleeping.'],
            ['คำถาม', 'Will + S + be + V-ing?', 'Will you be using the car?'],
          ],
        },
        note: { kind: 'tip', text: 'คำที่มักมาด้วย: **this time tomorrow, this time next week, at 8 p.m. tomorrow**' },
      },
      {
        title: 'ตัวอย่าง',
        examples: [
          ['This time next week, we\'ll be lying on the beach.', 'เวลานี้สัปดาห์หน้า เราจะนอนอยู่บนชายหาด'],
          ['I\'ll be waiting for you at the station.', 'ฉันจะรออยู่ที่สถานี'],
          ['This time tomorrow I\'ll be packing our suitcases.', 'เวลานี้พรุ่งนี้ ฉันจะกำลังจัดกระเป๋าอยู่'],
        ],
        note: { kind: 'warn', text: 'will + V1 = ตัดสินใจ/ทำนาย · will be + V-ing = "จะกำลังทำอยู่" ตอนนั้น' },
      },
    ],
    exercises: [
      { q: 'This time next week, we ___ on the beach.', c: ['lie', 'will lie', 'will be lying', 'will have lain'], a: 2, e: 'this time next week → จะกำลังทำอยู่ → will be lying' },
      { q: 'Don\'t call me at 8 tomorrow. I ___ a meeting.', c: ['will have', 'will be having', 'have had', 'am have'], a: 1, e: 'ที่เวลา 8 โมงพรุ่งนี้จะกำลังประชุมอยู่ → will be having' },
      { q: 'I ___ for you at the station when you arrive.', c: ['will wait', 'will be waiting', 'waited', 'wait'], a: 1, e: 'จะรออยู่ ณ ตอนที่คุณมาถึง → will be waiting' },
      { q: 'This time tomorrow I ___ our suitcases.', c: ['pack', 'will be packing', 'will have packed', 'packed'], a: 1, e: 'this time tomorrow → will be packing' },
    ],
  },
  {
    id: 'future-perfect',
    level: 'B2',
    minutes: 7,
    title: 'อนาคตกาลสมบูรณ์',
    en: 'Future perfect (+ continuous)',
    intro: 'ใช้บอกว่า "ถึงเวลาหนึ่งในอนาคต จะเสร็จไปแล้ว" หรือ "จะครบระยะเวลาเท่านี้แล้ว"',
    sections: [
      {
        title: 'รูปประโยค',
        table: {
          head: ['', 'สูตร', 'ตัวอย่าง'],
          rows: [
            ['future perfect', 'will have + V3', 'I will have finished by 5.'],
            ['future perfect continuous', 'will have been + V-ing', 'By June, I will have been working here for 5 years.'],
          ],
        },
        note: { kind: 'tip', text: 'สัญญาณ: **by + เวลาอนาคต** (by tomorrow, by 2030) · **by the time + present simple**' },
      },
      {
        title: 'ตัวอย่าง',
        examples: [
          ['By the time Mary gets here, the movie will have finished.', 'กว่าแมรี่จะมา หนังจะจบไปแล้ว'],
          ['By next year, she will have worked here for ten years.', 'ถึงปีหน้า เธอจะทำงานที่นี่ครบสิบปี'],
          ['Don\'t worry. I will have cooked dinner by 7.', 'ไม่ต้องห่วง ฉันจะทำอาหารเสร็จก่อนเจ็ดโมง'],
        ],
        note: { kind: 'warn', text: 'หลัง **by the time / when / before** ในอนาคต ใช้ **present simple** (ไม่ใช้ will): By the time Mary **gets** here' },
      },
    ],
    exercises: [
      { q: 'By the time Mary gets here, the movie ___.', c: ['will finish', 'will have finished', 'is going to finish', 'will be finishing'], a: 1, e: 'by the time + อนาคต → เสร็จไปก่อนแล้ว → will have finished' },
      { q: 'By next year, she ___ here for ten years.', c: ['works', 'will work', 'will have worked', 'has worked'], a: 2, e: 'by next year + ครบระยะเวลา → will have worked' },
      { q: 'I ___ the report by Friday.', c: ['finish', 'will have finished', 'am finishing', 'finished'], a: 1, e: 'by Friday → จะเสร็จก่อนวันศุกร์ → will have finished' },
      { q: 'By June, we ___ in this house for 20 years.', c: ['will live', 'will have been living', 'lived', 'are living'], a: 1, e: 'ครบ 20 ปีที่อยู่ต่อเนื่อง → will have been living' },
    ],
  },
  {
    id: 'conditionals-advanced',
    level: 'B2',
    minutes: 8,
    title: 'เงื่อนไขอดีต และ wish',
    en: 'Third conditional & wish',
    intro: 'ใช้พูดถึง "สิ่งที่ไม่ได้เกิดขึ้นจริง" ในอดีต และความปรารถนาที่ต่างจากความเป็นจริง',
    sections: [
      {
        title: 'Third conditional (อดีตที่แก้ไม่ได้)',
        table: {
          head: ['if-clause', 'main clause'],
          rows: [
            ['If + had + V3', 'would have + V3'],
            ['If I had studied harder,', 'I would have passed the exam.'],
            ['If she hadn\'t missed the bus,', 'she wouldn\'t have been late.'],
          ],
        },
        note: { kind: 'tip', text: 'ความจริง: ฉันไม่ได้อ่านหนังสือ จึงสอบตก → พูดย้อนว่า "ถ้าอ่านหนักกว่านี้ก็คงสอบผ่าน"' },
      },
      {
        title: 'wish',
        table: {
          head: ['อยากให้เป็น', 'ใช้', 'ตัวอย่าง'],
          rows: [
            ['ปัจจุบันต่างจากจริง', 'wish + V2', 'I wish I had more time.'],
            ['อดีตต่างจากจริง', 'wish + had + V3', 'I wish I had studied harder.'],
            ['ตำหนิ / อยากให้เปลี่ยน', 'wish + would', 'I wish it would stop raining.'],
          ],
        },
        note: { kind: 'warn', text: 'wish ไม่ตามด้วย will / V1 ตรง ๆ: ✗ I wish I have more time → I wish I **had** more time' },
      },
    ],
    exercises: [
      { q: 'If I ___ harder, I would have passed the exam.', c: ['studied', 'had studied', 'would study', 'study'], a: 1, e: 'third conditional: if + had + V3' },
      { q: 'If she hadn\'t missed the bus, she ___ late.', c: ['wouldn\'t be', 'wouldn\'t have been', 'won\'t be', 'hasn\'t been'], a: 1, e: 'main clause: would have + V3 → wouldn\'t have been' },
      { q: 'I wish I ___ more time to travel.', c: ['have', 'had', 'would have', 'will have'], a: 1, e: 'wish + V2 (ปัจจุบันไม่ตรงจริง) → had' },
      { q: 'I left the keys at home. I wish I ___ them.', c: ["didn't leave", "hadn't left", "wouldn't leave", "don't leave"], a: 1, e: "wish ถึงอดีต → had(n't) + V3 (hadn't left)" },
    ],
  },
  {
    id: 'inversion-contrast',
    level: 'B2',
    minutes: 7,
    title: 'ประโยคสลับที่ และ ความขัดแย้ง',
    en: 'Inversion, despite & the more ... the more',
    intro: 'โครงสร้างระดับสูงที่ออกบ่อยใน B2: ขึ้นต้นด้วยคำปฏิเสธแล้วสลับ กริยาช่วย ไว้หน้าประธาน',
    sections: [
      {
        title: 'ขึ้นต้นด้วยคำปฏิเสธ → สลับที่',
        table: {
          head: ['ขึ้นต้นด้วย', 'ตัวอย่าง'],
          rows: [
            ['Not only', 'Not only did he arrive late, but he also forgot the documents.'],
            ['Never', 'Never have I seen such a beautiful place.'],
            ['Hardly ... when', 'Hardly had we sat down when the phone rang.'],
          ],
        },
        note: { kind: 'tip', text: 'เหมือนสร้างคำถาม: **กริยาช่วย + ประธาน + V** (did he arrive · have I seen)' },
      },
      {
        title: 'despite / the more ... the more',
        table: {
          head: ['โครงสร้าง', 'ตัวอย่าง'],
          rows: [
            ['Despite / In spite of + นาม หรือ V-ing', 'Despite working hard, he failed.'],
            ['Although + S + V', 'Although he worked hard, he failed.'],
            ['The + comparative, the + comparative', 'The more you practise, the better you become.'],
          ],
        },
        note: { kind: 'warn', text: '✗ Despite of ... ✗ Despite he worked → ใช้ Despite + V-ing หรือ **Although** + S + V' },
      },
    ],
    exercises: [
      { q: 'Not only ___ late, but he also forgot the documents.', c: ['he arrived', 'did he arrive', 'he did arrive', 'arrived he'], a: 1, e: 'Not only ขึ้นต้น → สลับ: did he arrive' },
      { q: 'Never ___ such a beautiful place.', c: ['I have seen', 'have I seen', 'I saw', 'saw I'], a: 1, e: 'Never ขึ้นต้น → have I seen' },
      { q: 'Despite ___ hard, he failed the test.', c: ['of working', 'working', 'he worked', 'to work'], a: 1, e: 'Despite + V-ing' },
      { q: 'The more you practise, ___ you become.', c: ['the better', 'better', 'the best', 'best'], a: 0, e: 'The + comparative, the + comparative' },
    ],
  },
  {
    id: 'causative',
    level: 'B2',
    minutes: 5,
    title: 'ให้คนอื่นทำให้',
    en: 'Causative: have / get something done',
    intro: 'ใช้เมื่อ "เราไม่ได้ทำเอง แต่จ้าง/ให้คนอื่นทำให้" เช่น ตัดผม ซ่อมรถ',
    sections: [
      {
        title: 'รูปประโยค',
        table: {
          head: ['สูตร', 'ตัวอย่าง'],
          rows: [
            ['have + สิ่งของ + V3', 'I had my car repaired.'],
            ['get + สิ่งของ + V3', 'She got her hair cut.'],
            ['have + คน + V1', 'He had the mechanic repair his car.'],
          ],
        },
        note: { kind: 'tip', text: 'สิ่งของ **ถูกทำ** → ตามด้วย V3 (repaired, cut, delivered)' },
      },
      {
        title: 'ตัวอย่าง',
        examples: [
          ['We are having the kitchen painted.', 'เรากำลังจ้างให้ทาสีห้องครัว'],
          ['I need to get this order sent in by Friday.', 'ฉันต้องให้ส่งออเดอร์นี้ภายในวันศุกร์'],
          ['She had her phone fixed yesterday.', 'เมื่อวานเธอเอาโทรศัพท์ไปซ่อม'],
        ],
      },
    ],
    exercises: [
      { q: 'I need to get that order ___ in by the end of the week.', c: ['send', 'sent', 'sending', 'be sent'], a: 1, e: 'get + สิ่งของ + V3 → get the order sent' },
      { q: 'She had her hair ___ yesterday.', c: ['cut', 'cutting', 'to cut', 'cuts'], a: 0, e: 'have + สิ่งของ + V3 → had her hair cut' },
      { q: 'We are having the kitchen ___.', c: ['paint', 'painting', 'painted', 'to paint'], a: 2, e: 'have + สิ่งของ + V3 → painted' },
      { q: 'I ___ my car repaired last week.', c: ['had', 'was', 'made', 'did'], a: 0, e: 'had + สิ่งของ + V3 = ให้คนอื่นซ่อมให้' },
    ],
  },
  {
    id: 'modals-perfect',
    level: 'B2',
    minutes: 6,
    title: 'กริยาช่วยกับอดีต',
    en: 'should have / could have / must have',
    intro: 'modal + have + V3 ใช้พูดถึง **อดีต**: ตำหนิ เสียดาย หรือเดาสิ่งที่เกิดขึ้น',
    sections: [
      {
        title: 'ใช้ยังไง',
        table: {
          head: ['รูป', 'ความหมาย', 'ตัวอย่าง'],
          rows: [
            ['should have + V3', 'น่าจะทำ (แต่ไม่ได้ทำ)', 'You should have come earlier.'],
            ['shouldn\'t have + V3', 'ไม่น่าทำเลย (แต่ทำไปแล้ว)', 'I shouldn\'t have said that.'],
            ['could have + V3', 'น่าจะทำได้ (แต่ไม่ได้ทำ)', 'You could have called me.'],
            ['must have + V3', 'คงจะ (เดาแน่ใจ)', 'He must have forgotten.'],
            ['might have + V3', 'อาจจะ (เดาไม่แน่ใจ)', 'She might have missed the bus.'],
          ],
        },
        note: { kind: 'tip', text: 'ทุกตัวตามด้วย **have + V3** เสมอ (ไม่ใช้ had)' },
      },
      {
        title: 'ตัวอย่าง',
        examples: [
          ['How am I going to finish? — You should have come in earlier.', 'จะทำเสร็จได้ยังไง — น่าจะมาเช้ากว่านี้'],
          ['The ground is wet. It must have rained.', 'พื้นเปียก ฝนคงตก'],
          ['I can\'t find my keys. I might have left them at work.', 'หากุญแจไม่เจอ อาจลืมไว้ที่ทำงาน'],
        ],
      },
    ],
    exercises: [
      { q: 'You ___ come in earlier. Now you can\'t finish.', c: ['should have', 'must', 'would have to', 'should'], a: 0, e: 'ตำหนิเรื่องในอดีต → should have + V3 (have come)' },
      { q: 'The ground is wet. It ___ rained.', c: ['must have', 'should have', 'can have', 'would'], a: 0, e: 'เดาจากหลักฐานอย่างแน่ใจ → must have + V3' },
      { q: 'I shouldn\'t have ___ that. I\'m sorry.', c: ['say', 'said', 'saying', 'to say'], a: 1, e: 'shouldn\'t have + V3 (said)' },
      { q: 'She isn\'t here. She ___ missed the bus.', c: ['might have', 'should', 'can', 'will'], a: 0, e: 'เดาไม่แน่ใจเรื่องในอดีต → might have + V3' },
    ],
  },
];
