// Membership settings (the browser side). Prices live on the server in api/_pay.js.
//
//   enabled : false = everything stays free and nothing about membership is shown.
//             Set to true only after STRIPE_SECRET_KEY and PASS_SECRET are set on Vercel.
//   premium : which features need an active membership once enabled.
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.billing = {
  enabled: false,
  premium: {
    exam: true,     // สอบจำลอง
    markup: true,   // เส้นโยงบนประโยค + การ์ด tense
  },
};
