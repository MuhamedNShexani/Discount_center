/** Default common questions — synced with legacy i18n `about.faq.q*`. */
const DEFAULT_FAQ_SEED = [
  {
    seedKey: "default-q1",
    sortOrder: 1,
    question: "ئایا iDashkan بۆ بەکارهێنەران بەخۆڕاییە؟",
    questionEn: "Is iDashkan free for users?",
    questionAr: "هل iDashkan مجاني للمستخدمين؟",
    questionKu: "ئایا iDashkan بۆ بەکارهێنەران بەخۆڕاییە؟",
    answer:
      "بەڵێ، بەکارهێنەران دەتوانن داشکاندن و فرۆشگا و بڕاند بەخۆڕایی بدۆزنەوە.",
    answerEn:
      "Yes. Users can discover discounts, stores, brands, jobs, gifts, and reels for free.",
    answerAr:
      "نعم، يمكن للمستخدمين اكتشاف الخصومات والمتاجر والعلامات والوظائف والهدايا والريلز مجاناً.",
    answerKu:
      "بەڵێ، بەکارهێنەران دەتوانن داشکاندن و فرۆشگا و بڕاند بەخۆڕایی بدۆزنەوە.",
  },
  {
    seedKey: "default-q2",
    sortOrder: 2,
    question: "بیزنسەکان چۆن دەست پێبکەن؟",
    questionEn: "How do businesses start?",
    questionAr: "كيف تبدأ الشركات؟",
    questionKu: "بیزنسەکان چۆن دەست پێبکەن؟",
    answer:
      "پڕۆفایلی بیزنس دروست بکە، یەکەم ئۆفەر بڵاو بکەوە، پاشان لە داشبۆرد کارا بکە.",
    answerEn:
      "Create a business profile, publish your first offer, and optimize visibility from your dashboard.",
    answerAr:
      "أنشئ ملف عملك، وانشر أول عرض، ثم حسّن الظهور من لوحة التحكم.",
    answerKu:
      "پڕۆفایلی بیزنس دروست بکە، یەکەم ئۆفەر بڵاو بکەوە، پاشان لە داشبۆرد کارا بکە.",
  },
  {
    seedKey: "default-q3",
    sortOrder: 3,
    question: "ئایا دەتوانم لە ڕێگەی iDashkan کاڵا داوا بکەم؟",
    questionEn: "Can I order products through iDashkan ?",
    questionAr: "هل يمكنني طلب المنتجات عبر iDashkan؟",
    questionKu: "ئایا دەتوانم لە ڕێگەی iDashkan کاڵا داوا بکەم؟",
    answer:
      "بەڵێ. هەندێک فرۆشگا پشتگیریی داواکاری و گەیاندن دەکەن، بەڵام بە فرۆشگا بستراوە.",
    answerEn:
      "Yes. Some stores support ordering and delivery. Availability depends on the store.",
    answerAr:
      "نعم. بعض المتاجر تدعم الطلب والتوصيل، ويعتمد ذلك على المتجر.",
    answerKu:
      "بەڵێ. هەندێک فرۆشگا پشتگیریی داواکاری و گەیاندن دەکەن، بەڵام بە فرۆشگا بستراوە.",
  },
  {
    seedKey: "default-q4",
    sortOrder: 4,
    question: "ئایا iDashkan خۆی کاڵا دەفرۆشێت؟",
    questionEn: "Does iDashkan sell products directly?",
    questionAr: "هل يبيع iDashkan المنتجات بشكل مباشر؟",
    questionKu: "ئایا iDashkan خۆی کاڵا دەفرۆشێت؟",
    answer:
      "نەخێر. iDashkan بەکارهێنەران بە فرۆشگا و بیزنسەکان دەبەستێتەوە کە ئۆفەر و کاڵا بڵاودەکەنەوە.",
    answerEn:
      "No. iDashkan connects users with stores and businesses that publish offers and products.",
    answerAr:
      "لا. iDashkan يربط المستخدمين بالمتاجر والشركات التي تنشر العروض والمنتجات.",
    answerKu:
      "نەخێر. iDashkan بەکارهێنەران بە فرۆشگا و بیزنسەکان دەبەستێتەوە کە ئۆفەر و کاڵا بڵاودەکەنەوە.",
  },
  {
    seedKey: "default-q5",
    sortOrder: 5,
    question: "ئایا iDashkan خۆی کاڵا دەفرۆشێت؟",
    questionEn: "Does iDashkan sell products directly?",
    questionAr: "هل يبيع iDashkan المنتجات بشكل مباشر؟",
    questionKu: "ئایا iDashkan خۆی کاڵا دەفرۆشێت؟",
    answer:
      "نەخێر. iDashkan بەکارهێنەران بە فرۆشگا و بیزنسەکان دەبەستێتەوە کە ئۆفەر و کاڵا بڵاودەکەنەوە.",
    answerEn:
      "No. iDashkan connects users with stores and businesses that publish offers and products.",
    answerAr:
      "لا. iDashkan يربط المستخدمين بالمتاجر والشركات التي تنشر العروض والمنتجات.",
    answerKu:
      "نەخێر. iDashkan بەکارهێنەران بە فرۆشگا و بیزنسەکان دەبەستێتەوە کە ئۆفەر و کاڵا بڵاودەکەنەوە.",
  },
  {
    seedKey: "default-q6",
    sortOrder: 6,
    question: "چۆن دەتوانم داشکاندنێکی هەڵە یان کێشەیەک ڕاپۆرت بکەم؟",
    questionEn: "How do I report a wrong discount or issue?",
    questionAr: "كيف أبلغ عن خصم خاطئ أو مشكلة؟",
    questionKu: "چۆن دەتوانم داشکاندنێکی هەڵە یان کێشەیەک ڕاپۆرت بکەم؟",
    answer:
      "لە ناو ئەپدا هەڵبژاردەی ڕاپۆرت یان پەیوەندی بەکاربهێنە بۆ ئاگادارکردنەوەمان.",
    answerEn:
      "Use the report or contact option inside the app to let us know.",
    answerAr:
      "استخدم خيار الإبلاغ أو التواصل داخل التطبيق لإبلاغنا بالمشكلة.",
    answerKu:
      "لە ناو ئەپدا هەڵبژاردەی ڕاپۆرت یان پەیوەندی بەکاربهێنە بۆ ئاگادارکردنەوەمان.",
  },
];

module.exports = { DEFAULT_FAQ_SEED };
