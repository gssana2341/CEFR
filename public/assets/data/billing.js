// Membership settings (the browser side). Prices live on the server in api/_pay.js.
//
//   enabled : false = everything stays free and nothing about membership is shown.
//             Set to true only after STRIPE_SECRET_KEY and PASS_SECRET are set on Vercel.
//   premium : what needs an active membership once enabled. Everything not listed here stays free.
//
// To look at the locked version without selling anything, open any page with ?paywall=on
// (it lasts for that browser tab; ?paywall=off turns it off again).
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.billing = {
  enabled: false,
  premium: {
    exam: true,                                          // สอบจำลอง
    markup: true,                                        // เส้นโยงบนประโยค + การ์ด tense
    markupFreePerDay: 3,                                 // ...แต่ทุกคนดูฟรีได้วันละกี่ข้อ (ตัวอย่างให้ลองก่อนซื้อ)
    practice: ['conversations', 'cloze', 'extra'],       // ชุดฝึกที่ต้องเป็นสมาชิก (Grammar ฟรี)
    lessonLevels: ['A2', 'B1', 'B2'],                    // บทเรียนระดับที่ต้องเป็นสมาชิก (A1 ฟรี)
  },
};

try {
  const q = new URLSearchParams(location.search).get('paywall');
  if (q === 'on') sessionStorage.setItem('cefr:paywall', 'on');
  if (q === 'off') sessionStorage.removeItem('cefr:paywall');
  if (sessionStorage.getItem('cefr:paywall') === 'on') window.CEFR_DATA.billing.enabled = true;
} catch { /* storage blocked: no preview */ }
