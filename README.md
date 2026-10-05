# CEFR Quiz

เว็บเรียน ฝึก และวัดระดับภาษาอังกฤษ CEFR A1–B2 (อธิบายเป็นภาษาไทย) — เว็บ static ล้วน ไม่มี build step และมี Vercel Function เพียงตัวเดียวสำหรับระบบแปล

## มีอะไรบ้าง

เมนูหลักเป็นแท็บ 4 อัน (แสดงบนทุกหน้า): **หน้าหลัก** (ทำต่อจากที่ค้างไว้ + เส้นทางแนะนำ 4 ขั้น: วัดระดับ → เรียน → ฝึก → สอบจำลอง) · **เรียน** (รายการบทเรียน) · **ฝึก** (ชุดข้อสอบ 4 ชุด) · **ทดสอบ** (วัดระดับ + สอบจำลอง)

| หน้า | URL | เนื้อหา |
|---|---|---|
| ทดสอบระดับ | `/placement` | 4 ระดับ A1→B2 ระดับละ 10 ข้อ (สุ่มจากคลัง 48 ข้อ) ผ่านระดับด้วย ≥ 70% ได้ผลระดับ + แนะนำบทเรียน |
| บทเรียนไวยากรณ์ | `/learn` | 39 บทเรียน A1–B2 ครบทั้ง 12 tenses และหัวข้อที่ออกในข้อสอบ มีตาราง ตัวอย่างแปลไทย และแบบฝึกหัดท้ายบท (156 ข้อ) |
| สรุป 12 Tenses | `/tenses` | ตารางสูตร 3 × 4 พร้อมกฎการใช้ คำบอกเวลา และตัวอย่างของทั้ง 12 tenses (เปิดจากแท็บเรียนหรือจากการ์ด tense ใต้เฉลย) |
| Grammar | `/grammar` | 150 ข้อ |
| Conversations | `/conversations` | 100 ข้อ |
| Cloze Test | `/cloze` | 26 บทความ (197 ช่องว่าง) เลือกทำทีละบทได้ |
| ฝึกเพิ่มเติม | `/extra` | 48 ข้อใหม่: phrasal verbs, collocations, prepositions, word forms, ภาษาพูด, ข้อผิดพลาดที่พบบ่อย |
| สอบจำลอง | `/exam` | เลือกได้ 2 แบบ: **แบบ EF SET** (จับเวลาแยกส่วน ส่วนละ 25 นาที ย้อนกลับไม่ได้) หรือ **แบบยืดหยุ่น** 60 นาที (ข้ามไปมา/ทำเครื่องหมายข้อได้) ไม่มีเฉลยระหว่างทำ หมดเวลาส่งอัตโนมัติ |

**ระบบแปล** (ทุกหน้าที่มีเนื้อหา): คลิกคำภาษาอังกฤษเพื่อดูความหมาย หรือลากคลุมวลี/ประโยคเพื่อแปล มีปุ่มฟังเสียงอ่าน และปุ่ม "แปลทั้งข้อ" ในข้อสอบปรนัย ปิดอัตโนมัติระหว่างทดสอบระดับและสอบจำลอง (เปิดได้ตอนทบทวนผล)

**เส้นโยงบนประโยค** (ใต้เฉลยของ Grammar, Conversations, ฝึกเพิ่มเติม, บทเรียน, ทดสอบระดับ และตอนทบทวนผลสอบจำลอง): ประโยคถูกวาดเหมือนจดบนกระดาษ มีเส้นโค้งจากคำใบ้ไปยังคำที่ถูกควบคุม (เช่น `yesterday` → `were`) พร้อมป้ายอธิบายบนเส้น และคำอธิบายสั้นใต้คำ (`was + V3`) ตามด้วย "ทางลัด" หนึ่งบรรทัด และถ้าข้อนั้นเป็นเรื่อง tense จะมีการ์ดบอกชื่อ tense สูตร (+ / − / ?) กฎการใช้ คำบอกเวลา และตาราง 12 tenses ที่ไฮไลต์ช่องของข้อนี้ (Cloze ยังไม่มีเส้นโยง)

**อื่นๆ:** สุ่มลำดับข้อ/ตัวเลือก · ทำต่อจากที่ค้างไว้ได้ · ทบทวนข้อที่เคยผิด · สถิติ · โหมดมืด/สว่าง · คีย์ลัด · ใช้บนมือถือได้ · ความคืบหน้าทั้งหมดเก็บใน `localStorage` ของผู้ใช้ (ไม่มี backend)

## โครงสร้างโปรเจกต์

```
.
├── api/translate.js            Vercel Function: แปลวลี/ประโยค (EN→TH) + cache ที่ edge
├── api/plans · checkout · claim · pass .js   ระบบสมาชิก (ดูหัวข้อ "ระบบสมาชิก"); _pay.js = ตัวช่วยกลาง + ราคา
├── public/                     ← โฟลเดอร์ที่ Vercel เสิร์ฟ
│   ├── index.html              หน้าหลัก 4 แท็บ (#home #learn #practice #test) สร้างด้วย hub.js
│   ├── learn.html · placement.html · exam.html · tenses.html · pricing.html
│   ├── grammar.html · conversations.html · cloze.html · extra.html · 404.html
│   └── assets/
│       ├── css/style.css       สไตล์ทั้งหมด (สี/ธีมอยู่ใน :root ต้นไฟล์)
│       ├── js/
│       │   ├── common.js           helper กลาง + ทะเบียนชุดข้อสอบ
│       │   ├── translate.js        ระบบแปลคลิกคำ/ลากคลุม + ป๊อปอัป
│       │   ├── dictionary.js       ตัวค้นคำ (ตัดท้ายคำ -s -ed -ing ... หาคำพื้นฐาน)
│       │   ├── quiz-engine.js      ข้อสอบปรนัย (Grammar, Conversations, Extra)
│       │   ├── cloze-engine.js     Cloze
│       │   ├── learn-engine.js     หน้าบทเรียน (รายการบทเรียนอยู่ในแท็บเรียนของ hub.js)
│       │   ├── placement-engine.js ทดสอบระดับ
│       │   ├── exam-engine.js      สอบจำลอง
│       │   ├── markup.js           วาดเส้นโยงบนประโยค + การ์ด tense + ตาราง 12 tenses
│       │   ├── tenses-page.js      หน้า /tenses
│       │   └── hub.js · theme.js   hub.js = หน้าหลักและแท็บ
│       └── data/               ← เนื้อหาทั้งหมดอยู่ที่นี่
│           ├── grammar.js · conversations.js · cloze.js · extra.js
│           ├── placement.js · lessons.js · exam.js
│           ├── tenses.js       สูตร/กฎ/คำบอกเวลาของ 12 tenses
│           ├── clues-*.js      เส้นโยงบนประโยค แยกไฟล์ต่อชุดข้อสอบ (ไม่ปนกับข้อสอบ)
│           └── glossary.js     พจนานุกรมสำหรับระบบแปลคำเดี่ยว
├── scripts/
│   ├── validate-data.mjs       ตรวจความถูกต้องของข้อมูลทั้งหมด
│   └── dev-server.mjs          เซิร์ฟเวอร์ทดสอบในเครื่อง (จำลอง Vercel รวม /api)
├── vercel.json · package.json
```

## รันในเครื่อง

```bash
npm run dev
```

เปิด http://localhost:3000 (ถ้าพอร์ตไม่ว่างจะเลื่อนไปพอร์ตถัดไปให้เอง) เซิร์ฟเวอร์นี้ใช้ headers/CSP จาก `vercel.json` และรัน `api/translate.js` ให้ จึงเทียบได้ใกล้เคียง production โดยไม่ต้องล็อกอิน Vercel

## เพิ่ม / แก้ไขเนื้อหา

แก้ไฟล์ใน `public/assets/data/` แล้วรันตัวตรวจก่อน commit ทุกครั้ง:

```bash
npm run validate
```

ตัวตรวจจะเช็คเลขข้อซ้ำ เฉลยเกินช่วง placeholder ของ Cloze ไม่ตรง ตารางบทเรียนคอลัมน์ไม่เท่ากัน ฯลฯ และ **เตือนถ้ามีคำอังกฤษที่ยังไม่มีในพจนานุกรม**

### ข้อสอบปรนัย — `grammar.js`, `conversations.js`, `extra.js`

```js
{ n: 1, q: "Man: Where's Billy?\nWoman: He's _______ his bedroom.", c: ["in", "on", "under"], a: 0, e: "in ใช้กับพื้นที่ปิด" },
```

`n` เลขข้อ (ห้ามซ้ำ) · `q` โจทย์ (`\n` = ขึ้นบรรทัดใหม่) · `c` ตัวเลือก 2–5 ตัว · `a` ลำดับคำตอบที่ถูก (เริ่มที่ 0) · `e` คำอธิบาย (`**ตัวหนา**` ได้) · ใน `extra.js` ใส่ `level` ('A1'–'B2') และ `topic` เพิ่ม

### ข้อสอบวัดระดับ — `placement.js`

```js
{ id: 'B1-05', level: 'B1', skill: 'grammar', q: "She suggested ___ to the cinema.", c: ["to go", "go", "going", "went"], a: 2, e: "suggest ตามด้วย -ing" },
```

ต้องมีอย่างน้อย 10 ข้อต่อระดับ (ระบบสุ่มมาใช้ระดับละ 10) · เกณฑ์ผ่าน/จำนวนข้อต่อระดับ ปรับที่ต้น `placement-engine.js` (`PER_STAGE`, `PASS_RATIO`)

### บทเรียน — `lessons.js`

แต่ละบทมี `id` `level` `title` `en` `intro` `sections` (หัวข้อ + `body` / `table` / `examples` / `note`) และ `exercises` ดูรูปแบบเต็มที่หัวไฟล์

### สอบจำลอง — `exam.js`

มี 2 รูปแบบ (`profiles`) ให้ผู้ใช้เลือก:

| รูปแบบ | กติกา |
|---|---|
| **แบบ EF SET** | แบ่งเป็นส่วน (ตอนนี้ Reading 25 นาที, Listening 25 นาที "เร็วๆ นี้") นาฬิกาแยกส่วน ย้อนกลับไม่ได้ ต้องตอบก่อนไปข้อถัดไป ไม่มีเฉลยระหว่างทำ |
| **แบบยืดหยุ่น** | 60 นาที ข้ามไปมา ทำเครื่องหมายข้อ แก้คำตอบได้จนกว่าจะส่ง |

```js
{ id: 'efset', oneWay: true,
  sections: [
    { id: 'reading', title: 'Reading', minutes: 25, parts: [
        { id: 'grammar', title: 'Grammar', type: 'mcq', source: 'grammar', count: 20 }, … ] },
    { id: 'listening', title: 'Listening', minutes: 25, comingSoon: true, parts: [] },
  ] }
```

กติกาอ้างอิงจากหน้าทางการของ EF SET ([efset.org](https://www.efset.org/)): 50 นาที = Reading 25 + Listening 25, ไม่จำกัดเวลาต่อข้อ, ย้อนกลับไม่ได้, Listening ฟังได้ 2 รอบ, คะแนน 0–100 เทียบ CEFR (A1 1–30 … C2 71–100) ที่เว็บนี้ **ไม่ได้** จำลองการปรับความยากอัตโนมัติ (adaptive) และไม่ได้แปลงคะแนนเป็นระดับ CEFR เพราะเนื้อหาเป็นข้อสอบชุดคงที่ A1–B1 (ใช้หน้าทดสอบระดับแทน) ส่วนชุด 4 ทักษะ 90 นาทีของ EF SET ไม่ได้จำลอง

เปลี่ยนเวลา จำนวนข้อ หรือเพิ่ม/ลบส่วนได้ที่นี่ (ชนิดที่รองรับ: `mcq`, `cloze`)

### พจนานุกรม — `glossary.js`

```js
"borrow": "ยืม (v. ยืมของคนอื่นมา)",
"went": ">go|ช่อง 2 ของ go",      // รูปไม่ปกติ → ชี้ไปที่คำพื้นฐาน
```

ใส่เฉพาะคำพื้นฐาน รูปที่เติม -s -es -ed -ing -er -est -ly ระบบสืบเองให้ แยกหลายความหมายด้วย ` · ` (ตัวแรกจะแสดงเป็นความหมายหลัก)

### เส้นโยงบนประโยค — `clues-*.js`

แยกจากข้อสอบ เพื่อให้แก้/แทนที่ไฟล์ข้อสอบได้โดยไม่กระทบคำอธิบาย ผูกกับข้อด้วยหมายเลข (`n`) ของข้อ (placement ใช้ `id` เช่น `'A1-01'`, บทเรียนใช้ `id บท → ลำดับแบบฝึกหัดที่นับจาก 0`)

```js
// clues-grammar.js
141: {
  tense: 'present-perfect',                 // (ไม่บังคับ) แสดงการ์ด tense — id ดูใน tenses.js
  lesson: 'present-perfect',                // (ไม่บังคับ) ลิงก์ไปบทเรียน
  links: [['for six years', 'have lived', 'ช่วงเวลา → ต่อเนื่องถึงตอนนี้']],   // [คำใบ้, คำที่ถูกควบคุม, ป้ายบนเส้น]
  tags:  [['have lived', 'have + V3']],     // คำอธิบายสั้น ๆ ใต้คำ
  tip:   'for + ช่วงเวลา → present perfect',  // ทางลัดบรรทัดเดียว
},
```

- คำในเส้นโยงต้องเป็นข้อความที่อยู่ในประโยคจริง (ช่องว่างถูกเติมด้วยเฉลยก่อน) เขียนคำซ้ำให้ระบุลำดับด้วย `คำ@2` (ตัวที่ 2) · ใส่ `null` เป็นคำที่สองเพื่อวาดแค่ป้ายชี้คำเดียว · คำใบ้อยู่คนละบรรทัดกับเฉลยได้ (ลูกศรชี้ขึ้น/ลง)
- ใช้ได้ทั้ง 12 tense: `past-simple`, `past-continuous`, `past-perfect`, `past-perfect-continuous`, `present-simple`, `present-continuous`, `present-perfect`, `present-perfect-continuous`, `future-simple` (รวม be going to), `future-continuous`, `future-perfect`, `future-perfect-continuous`
- `npm run validate` ตรวจว่าทุกคำเจอในประโยค, id ของ tense/บทเรียนมีจริง และรายงานคำที่ซ้ำหลายตำแหน่ง · ข้อที่ไม่มีรายการในไฟล์ `clues-*` จะแสดงเฉลยแบบเดิม ไม่พัง
- เพิ่มชุดใหม่ (เช่น Listening): สร้าง `clues-listening.js` (`window.CEFR_DATA.clues.listening = {…}`) แล้วใส่ `<script>` ต่อจาก `markup.js` ในหน้านั้น (และใน `exam.html` ถ้าอยู่ในสอบจำลอง) และเพิ่มชื่อชุดในลูป `clues` ของ `scripts/validate-data.mjs`

## ระบบแปลทำงานอย่างไร

| ข้อความที่เลือก | แปลด้วย | หมายเหตุ |
|---|---|---|
| คำเดี่ยว | **พจนานุกรมในเว็บ** (`glossary.js`) | แม่นยำ ออฟไลน์ ไม่กินโควต้า |
| คำเดี่ยวที่ไม่มีในพจนานุกรม | API (ติดป้าย "แปลอัตโนมัติ") | บริการแปลฟรีให้คำเดี่ยวคลาดเคลื่อนบ่อย จึงไม่ใช้เป็นหลัก |
| วลี / ประโยค | `/api/translate` → MyMemory | ติดป้าย "แปลโดยเครื่อง" |

`/api/translate` จำกัดความยาว 300 ตัวอักษร จำกัดจำนวนครั้งต่อ IP และตั้ง cache ที่ edge 30 วัน (ประโยคเดิมจะไม่เรียกบริการแปลซ้ำ) ถ้า function ใช้ไม่ได้ เบราว์เซอร์จะเรียก MyMemory ตรงเป็นตัวสำรอง และผลแปลถูกแคชใน `localStorage`

**เพิ่มคุณภาพ/โควต้า (ตั้งค่าใน Vercel → Project → Settings → Environment Variables):**

| ตัวแปร | ผล |
|---|---|
| `GOOGLE_TRANSLATE_API_KEY` | ใช้ Google Cloud Translation (ทางการ แม่นกว่า) เป็นอันดับแรก |
| `MYMEMORY_EMAIL` | อีเมลจริงของคุณ ช่วยขยายโควต้าฟรีของ MyMemory ต่อวัน |

## Deploy บน Vercel ผ่าน Git

1. push โค้ดขึ้น GitHub (`git push`)
2. [vercel.com/new](https://vercel.com/new) → Import Git Repository → เลือก repo → **Deploy** (ไม่ต้องตั้งค่าเพิ่ม `vercel.json` กำหนดไว้ให้แล้ว)
3. ตั้ง Environment Variables ข้างบน (ถ้าต้องการ) แล้ว Redeploy

push เข้า `main` = deploy production อัตโนมัติ · branch/PR อื่น = ได้ลิงก์ Preview

> ความคืบหน้าของผู้ใช้ผูกกับโดเมน ถ้าเปลี่ยนโดเมน สถิติจะเริ่มนับใหม่

## ระบบสมาชิก (1 / 3 / 7 / 30 วัน)

**ตอนนี้ปิดอยู่** (`enabled: false` ใน `public/assets/data/billing.js`) ทุกอย่างยังฟรีและไม่เห็นเมนูสมาชิก เปิดใช้เมื่อพร้อม:

1. สมัคร [Stripe](https://dashboard.stripe.com) แล้วเปิดวิธีจ่ายเงิน **PromptPay** และ **บัตร** (Settings → Payment methods) · เริ่มจากโหมดทดสอบ (`sk_test_…`) ก่อน
2. ที่ Vercel → Settings → Environment Variables ใส่ `STRIPE_SECRET_KEY` (คีย์ลับ ห้ามใส่ในโค้ดหรือแชต) และ `PASS_SECRET` (ข้อความสุ่มยาว ๆ อะไรก็ได้) แล้ว Redeploy
3. แก้ `enabled: true` ใน `billing.js` แล้ว push → เห็นแท็บ "สมาชิก" และสอบจำลอง + เส้นโยงจะถูกล็อกสำหรับคนที่ยังไม่ซื้อ (เลือกว่าจะล็อกอะไรที่ `premium`)
4. ลองจ่ายในโหมดทดสอบให้ผ่านก่อน แล้วค่อยเปลี่ยนเป็นคีย์จริง (`sk_live_…`)

ราคาแก้ที่ `api/_pay.js` (`PLANS`) ที่เดียว · ตอนนี้ 1 วัน 20 / 3 วัน 60 / 7 วัน 120 / 30 วัน 550 บาท

**ทำงานยังไง (ไม่มีฐานข้อมูล ไม่ต้องสมัครบัญชี):** กด "ซื้อ" → ไปหน้าชำระเงินของ Stripe → กลับมาที่ `/pricing?session_id=…` → `/api/claim` ถาม Stripe ว่าจ่ายแล้วจริงไหม ถ้าจริงจะออก "รหัสสมาชิก" (ลงลายเซ็นด้วย `PASS_SECRET`) เก็บในเบราว์เซอร์ · ซื้อซ้ำตอนยังไม่หมดอายุ วันจะต่อท้ายให้ · เปลี่ยนเครื่องให้คัดลอกรหัสไปใส่ (ปุ่ม "ย้ายเครื่อง" ในหน้าสมาชิก)

**ทดสอบในเครื่องโดยไม่ใช้ Stripe:** `PAY_MODE=mock npm run dev` (ปุ่มซื้อจะข้ามหน้าจ่ายเงินและออกรหัสให้เลย — ใช้ไม่ได้บน Vercel production)

**ข้อจำกัด (ตั้งใจให้เรียบง่าย):** ล็อกเฉพาะฝั่งหน้าเว็บ ไฟล์ข้อสอบเป็นไฟล์ธรรมดา คนที่เก่งเปิดดูได้ และรหัสสมาชิกคัดลอกให้คนอื่นใช้ได้ ถ้าต้องการกันจริงจังต้องย้ายข้อมูลไปไว้หลัง API และผูกกับบัญชีผู้ใช้ · ยังไม่มีคืนเงิน/ใบเสร็จ (Stripe ส่งใบเสร็จทางอีเมลให้ได้ถ้าเปิดไว้)

## เพิ่ม Part 4 (Listening) ภายหลัง

ระบบเตรียมจุดต่อไว้แล้ว ขั้นตอนโดยสรุป:

1. **ไฟล์เสียง** — วางที่ `public/assets/audio/` (เช่น `l1.mp3`) CSP `default-src 'self'` อนุญาตไฟล์เสียงจากโดเมนตัวเองอยู่แล้ว
2. **ข้อมูล** — สร้าง `public/assets/data/listening.js` รูปแบบเดียวกับ `extra.js` (`n, q, c, a, e`) เพิ่มฟิลด์ `audio: 'assets/audio/l1.mp3'` และ `transcript` (ถ้ามี) แล้วเพิ่มชื่อ `'listening'` ในรายการไฟล์ที่ `scripts/validate-data.mjs` (ฟังก์ชัน vm ด้านบนและลูป `grammar/conversations/extra`)
3. **หน้าเว็บ** — คัดลอก `extra.html` เป็น `listening.html` เปลี่ยน `data-quiz="listening"` และ `<script src="assets/data/listening.js">` (แท็บเมนู `<nav class="tabs" data-section="practice">` ติดมาด้วยแล้ว)
4. **ทะเบียน** — เพิ่ม `listening: { id: 'listening', kind: 'mcq', dataKey: 'listening', page: 'listening.html', intro: '…', labels: 'number' }` ใน `QUIZZES` ที่ `common.js`
5. **ตัวเล่นเสียง** — ใน `quiz-engine.js` (ฟังก์ชัน `renderQuiz`) และ `exam-engine.js` (`renderExam`) เพิ่มก่อนโจทย์: `q.audio && h('audio', { controls: true, preload: 'none', src: q.audio })`
6. **หน้าหลัก** — เพิ่มรายการใน `PRACTICE` ที่ต้น `hub.js` (คัดลอกรายการ Extra: `id`, `title`, `thai`, `desc`, `href`) จะได้การ์ดในแท็บฝึกและการ์ด "ทำต่อ" ให้เอง และถ้าต้องการให้อยู่ในสอบจำลอง ให้ใส่ `parts: [{ id: 'listening', title: 'Listening', type: 'mcq', source: 'listening', count: 20 }]` แล้วลบ `comingSoon: true` ออกจากส่วน Listening ของแบบ EF SET ใน `exam.js` (ส่วนนี้จะมีนาฬิกา 25 นาทีของตัวเองต่อจาก Reading โดยอัตโนมัติ) พร้อมทั้ง: เพิ่ม `<script src="assets/data/listening.js">` ใน `exam.html` และเพิ่ม `'listening'` ในรายการ `source` ที่ตัวตรวจ (`scripts/validate-data.mjs`) อนุญาต ถ้าอยากให้เหมือน EF SET ให้จำกัดการเล่นเสียงไม่เกิน 2 รอบต่อไฟล์

## หมายเหตุ

- ฟอนต์ IBM Plex Sans Thai โหลดจาก Google Fonts ถ้าออฟไลน์จะ fallback เป็นฟอนต์ระบบ
- Content-Security-Policy ใน `vercel.json` อนุญาตสคริปต์จากโดเมนตัวเอง, Google Fonts และ `api.mymemory.translated.net` (ตัวสำรองของระบบแปล) ถ้าจะเพิ่มบริการภายนอกอื่น (เช่น analytics) ต้องเพิ่มโดเมนในนั้นด้วย
- ผลวัดระดับเป็นการประมาณจากข้อสอบสั้นๆ เฉพาะไวยากรณ์และคำศัพท์ ไม่ใช่ใบรับรองอย่างเป็นทางการ
