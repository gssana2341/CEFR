# CEFR Quiz

เว็บฝึกข้อสอบภาษาอังกฤษระดับ CEFR A1–B1 (ภาษาไทย) — เว็บ static ล้วน ไม่มี build step ไม่มี dependency

| ชุดข้อสอบ | หน้า | จำนวน |
|---|---|---|
| Part 1 · Grammar | `/grammar` | 150 ข้อ |
| Part 2 · Conversations | `/conversations` | 100 ข้อ |
| Part 3 · Cloze Test | `/cloze` | 26 บทความ (197 ช่องว่าง) |

**ฟีเจอร์:** สุ่มลำดับข้อ/ตัวเลือก · เฉลยพร้อมคำอธิบายทันที · ทำต่อจากที่ค้างไว้ได้ · ทบทวนเฉพาะข้อที่เคยผิด · สถิติรอบล่าสุด/ดีที่สุด · โหมดมืด/สว่าง · คีย์ลัด (`1–4`/`A–C` เลือกคำตอบ, `Enter` ไปต่อ) · ใช้งานบนมือถือได้

ความคืบหน้าทั้งหมดเก็บใน `localStorage` ของเบราว์เซอร์ผู้ใช้ (ไม่มี backend ไม่ส่งข้อมูลไปไหน)

## โครงสร้างโปรเจกต์

```
.
├── public/                 ← โฟลเดอร์ที่ Vercel เสิร์ฟ (ตัวเว็บทั้งหมด)
│   ├── index.html          หน้าหลัก เลือกชุดข้อสอบ
│   ├── grammar.html        Part 1
│   ├── conversations.html  Part 2
│   ├── cloze.html          Part 3
│   ├── 404.html
│   └── assets/
│       ├── css/style.css   สไตล์ทั้งหมด (สี/ธีมอยู่ใน :root ด้านบนไฟล์)
│       ├── js/
│       │   ├── common.js        helper กลาง + ทะเบียนชุดข้อสอบ
│       │   ├── quiz-engine.js   engine ข้อสอบปรนัย (Part 1 + 2)
│       │   ├── cloze-engine.js  engine Cloze (Part 3)
│       │   ├── hub.js           สถิติบนหน้าหลัก
│       │   └── theme.js         จำโหมดมืด/สว่างก่อนวาดหน้า
│       └── data/           ← ข้อสอบทั้งหมดอยู่ที่นี่
│           ├── grammar.js
│           ├── conversations.js
│           └── cloze.js
├── scripts/validate-data.mjs   ตรวจความถูกต้องของไฟล์ข้อสอบ
├── vercel.json                 ตั้งค่า Vercel (output = public, clean URLs, security headers)
└── package.json
```

## รันในเครื่อง

```bash
npm run dev
```

หรือเปิดไฟล์ `public/index.html` ตรงๆ ในเบราว์เซอร์ก็ใช้ได้เช่นกัน

## เพิ่ม / แก้ไขข้อสอบ

แก้ที่ไฟล์ใน `public/assets/data/` แล้วรันตัวตรวจก่อน commit ทุกครั้ง:

```bash
npm run validate
```

**Part 1 / 2** (`grammar.js`, `conversations.js`) — หนึ่งข้อต่อหนึ่งบรรทัด:

```js
{ n: 1, q: "Man: Where's Billy?\nWoman: He's _______ his bedroom.", c: ["in", "on", "under"], a: 0, e: "in ใช้กับพื้นที่ปิด" },
```

- `n` เลขข้อ (ห้ามซ้ำ) · `q` โจทย์ (`\n` = ขึ้นบรรทัดใหม่) · `c` ตัวเลือก (2–5 ตัว) · `a` ลำดับของคำตอบที่ถูก (เริ่มจาก 0) · `e` คำอธิบาย (ใช้ `**ตัวหนา**` ได้)

**Part 3** (`cloze.js`) — ใส่ `{1}`, `{2}`, … ในเนื้อเรื่องตรงจุดที่เว้นว่าง ให้ตรงกับลำดับใน `blanks`:

```js
{
  topic: "1. EMAIL (1)",
  text: "The house is big, {1} there is plenty of room.",
  blanks: [ { c: ["but", "and", "or", "so"], a: 1, e: "and >> ใช้เชื่อมประโยค" } ]
}
```

> ระบบสุ่มลำดับตัวเลือกเองทุกครั้ง จึงไม่ต้องกังวลว่าคำตอบจะอยู่ตำแหน่งเดิม

## Deploy บน Vercel ผ่าน Git

1. สร้าง repository เปล่าบน GitHub (หรือ GitLab / Bitbucket) แล้วผูกกับโฟลเดอร์นี้:

   ```bash
   git remote add origin https://github.com/<ชื่อผู้ใช้>/<ชื่อ-repo>.git
   git push -u origin main
   ```

2. เข้า [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → เลือก repo นี้
3. กด **Deploy** ได้เลย ไม่ต้องตั้งค่าเพิ่ม (`vercel.json` กำหนด Framework = Other, ไม่มี build command, output = `public` ไว้แล้ว)

หลังจากนั้น: push เข้า `main` = deploy production อัตโนมัติ · push branch อื่น/เปิด Pull Request = ได้ลิงก์ Preview ให้ลองก่อน

**ผู้ใช้เก่าเสียความคืบหน้าไหม?** ความคืบหน้าผูกกับโดเมน ถ้าเปลี่ยนโดเมน (เช่น เพิ่ม custom domain ทีหลัง) ผู้ใช้จะเริ่มนับสถิติใหม่ที่โดเมนนั้น

## หมายเหตุ

- ฟอนต์ Sarabun โหลดจาก Google Fonts; ถ้าออฟไลน์จะ fallback เป็นฟอนต์ระบบ
- Content-Security-Policy ใน `vercel.json` อนุญาตเฉพาะสคริปต์จากโดเมนตัวเอง และ Google Fonts — ถ้าจะเพิ่มบริการภายนอก (เช่น analytics) ต้องเพิ่มโดเมนในนั้นด้วย
