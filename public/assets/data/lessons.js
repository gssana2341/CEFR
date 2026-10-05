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
];
