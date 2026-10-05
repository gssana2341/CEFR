# CEFR Quiz

เว็บเรียน ฝึก และวัดระดับภาษาอังกฤษ CEFR A1–B2 (อธิบายเป็นภาษาไทย) — เว็บ static ล้วน ไม่มี build step และมี Vercel Function เพียงตัวเดียวสำหรับระบบแปล

## มีอะไรบ้าง

เมนูหลักเป็นแท็บ 4 อัน (แสดงบนทุกหน้า): **หน้าหลัก** (ทำต่อจากที่ค้างไว้ + เส้นทางแนะนำ 4 ขั้น: วัดระดับ → เรียน → ฝึก → สอบจำลอง) · **เรียน** (รายการบทเรียน) · **ฝึก** (ชุดข้อสอบ 4 ชุด) · **ทดสอบ** (วัดระดับ + สอบจำลอง)

| หน้า | URL | เนื้อหา |
|---|---|---|
| ทดสอบระดับ | `/placement` | 4 ระดับ A1→B2 ระดับละ 10 ข้อ (สุ่มจากคลัง 48 ข้อ) ผ่านระดับด้วย ≥ 70% ได้ผลระดับ + แนะนำบทเรียน |
| บทเรียนไวยากรณ์ | `/learn` | 15 บทเรียน A1–B1 มีตาราง ตัวอย่างแปลไทย และแบบฝึกหัดท้ายบท (60 ข้อ) |
| Grammar | `/grammar` | 150 ข้อ |
| Conversations | `/conversations` | 100 ข้อ |
| Cloze Test | `/cloze` | 26 บทความ (197 ช่องว่าง) เลือกทำทีละบทได้ |
| ฝึกเพิ่มเติม | `/extra` | 48 ข้อใหม่: phrasal verbs, collocations, prepositions, word forms, ภาษาพูด, ข้อผิดพลาดที่พบบ่อย |
| สอบจำลอง | `/exam` | จับเวลา 60 นาที ไม่มีเฉลยระหว่างทำ ข้ามไปมา/ทำเครื่องหมายข้อได้ ส่งแล้วจึงเห็นผล หมดเวลาส่งอัตโนมัติ |

**ระบบแปล** (ทุกหน้าที่มีเนื้อหา): คลิกคำภาษาอังกฤษเพื่อดูความหมาย หรือลากคลุมวลี/ประโยคเพื่อแปล มีปุ่มฟังเสียงอ่าน และปุ่ม "แปลทั้งข้อ" ในข้อสอบปรนัย ปิดอัตโนมัติระหว่างทดสอบระดับและสอบจำลอง (เปิดได้ตอนทบทวนผล)

**อื่นๆ:** สุ่มลำดับข้อ/ตัวเลือก · ทำต่อจากที่ค้างไว้ได้ · ทบทวนข้อที่เคยผิด · สถิติ · โหมดมืด/สว่าง · คีย์ลัด · ใช้บนมือถือได้ · ความคืบหน้าทั้งหมดเก็บใน `localStorage` ของผู้ใช้ (ไม่มี backend)

## โครงสร้างโปรเจกต์

```
.
├── api/translate.js            Vercel Function: แปลวลี/ประโยค (EN→TH) + cache ที่ edge
├── public/                     ← โฟลเดอร์ที่ Vercel เสิร์ฟ
│   ├── index.html              หน้าหลัก 4 แท็บ (#home #learn #practice #test) สร้างด้วย hub.js
│   ├── learn.html · placement.html · exam.html
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
│       │   └── hub.js · theme.js   hub.js = หน้าหลักและแท็บ
│       └── data/               ← เนื้อหาทั้งหมดอยู่ที่นี่
│           ├── grammar.js · conversations.js · cloze.js · extra.js
│           ├── placement.js · lessons.js · exam.js
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

```js
durationMin: 60,
parts: [
  { id: 'grammar', title: 'Part 1 · Grammar', type: 'mcq', source: 'grammar', count: 30 },
  …
]
```

เปลี่ยนเวลา จำนวนข้อ หรือเพิ่ม/ลบส่วนได้ที่นี่ (ชนิดที่รองรับ: `mcq`, `cloze`)

### พจนานุกรม — `glossary.js`

```js
"borrow": "ยืม (v. ยืมของคนอื่นมา)",
"went": ">go|ช่อง 2 ของ go",      // รูปไม่ปกติ → ชี้ไปที่คำพื้นฐาน
```

ใส่เฉพาะคำพื้นฐาน รูปที่เติม -s -es -ed -ing -er -est -ly ระบบสืบเองให้ แยกหลายความหมายด้วย ` · ` (ตัวแรกจะแสดงเป็นความหมายหลัก)

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

## เพิ่ม Part 4 (Listening) ภายหลัง

ระบบเตรียมจุดต่อไว้แล้ว ขั้นตอนโดยสรุป:

1. **ไฟล์เสียง** — วางที่ `public/assets/audio/` (เช่น `l1.mp3`) CSP `default-src 'self'` อนุญาตไฟล์เสียงจากโดเมนตัวเองอยู่แล้ว
2. **ข้อมูล** — สร้าง `public/assets/data/listening.js` รูปแบบเดียวกับ `extra.js` (`n, q, c, a, e`) เพิ่มฟิลด์ `audio: 'assets/audio/l1.mp3'` และ `transcript` (ถ้ามี) แล้วเพิ่มชื่อ `'listening'` ในรายการไฟล์ที่ `scripts/validate-data.mjs` (ฟังก์ชัน vm ด้านบนและลูป `grammar/conversations/extra`)
3. **หน้าเว็บ** — คัดลอก `extra.html` เป็น `listening.html` เปลี่ยน `data-quiz="listening"` และ `<script src="assets/data/listening.js">` (แท็บเมนู `<nav class="tabs" data-section="practice">` ติดมาด้วยแล้ว)
4. **ทะเบียน** — เพิ่ม `listening: { id: 'listening', kind: 'mcq', dataKey: 'listening', page: 'listening.html', intro: '…', labels: 'number' }` ใน `QUIZZES` ที่ `common.js`
5. **ตัวเล่นเสียง** — ใน `quiz-engine.js` (ฟังก์ชัน `renderQuiz`) และ `exam-engine.js` (`renderExam`) เพิ่มก่อนโจทย์: `q.audio && h('audio', { controls: true, preload: 'none', src: q.audio })`
6. **หน้าหลัก** — เพิ่มรายการใน `PRACTICE` ที่ต้น `hub.js` (คัดลอกรายการ Extra: `id`, `title`, `thai`, `desc`, `href`) จะได้การ์ดในแท็บฝึกและการ์ด "ทำต่อ" ให้เอง และถ้าต้องการให้อยู่ในสอบจำลอง เพิ่ม `{ id: 'listening', title: 'Part 4 · Listening', type: 'mcq', source: 'listening', count: 10 }` ใน `exam.js`

## หมายเหตุ

- ฟอนต์ IBM Plex Sans Thai โหลดจาก Google Fonts ถ้าออฟไลน์จะ fallback เป็นฟอนต์ระบบ
- Content-Security-Policy ใน `vercel.json` อนุญาตสคริปต์จากโดเมนตัวเอง, Google Fonts และ `api.mymemory.translated.net` (ตัวสำรองของระบบแปล) ถ้าจะเพิ่มบริการภายนอกอื่น (เช่น analytics) ต้องเพิ่มโดเมนในนั้นด้วย
- ผลวัดระดับเป็นการประมาณจากข้อสอบสั้นๆ เฉพาะไวยากรณ์และคำศัพท์ ไม่ใช่ใบรับรองอย่างเป็นทางการ
