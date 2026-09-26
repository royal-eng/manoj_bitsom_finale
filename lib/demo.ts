import { Language } from "./analysis";
export const demoScenarios = {
  qr: {
    title: "The “verification” QR",
    description:
      "A reassuring call. An urgent request. A payment hiding in plain sight.",
    steps: {
      en: [
        "Hello, I am calling from your bank about an account review.",
        "Your account will be blocked immediately. This is only verification, no payment is needed.",
        "Scan this QR now to finish verification. Do not tell anyone about this call.",
      ],
      hi: [
        "नमस्ते, मैं बैंक से आपके खाते की जाँच के लिए बोल रहा हूँ।",
        "आपका खाता अभी बंद हो जाएगा। यह केवल सत्यापन है, भुगतान नहीं करना है।",
        "अभी यह QR स्कैन करें। किसी को मत बताना।",
      ],
      te: [
        "నమస్తే, బ్యాంక్ నుంచి మీ ఖాతా పరిశీలన గురించి మాట్లాడుతున్నాను.",
        "మీ ఖాతా వెంటనే బ్లాక్ అవుతుంది. ఇది కేవలం ధృవీకరణ, చెల్లింపు అవసరం లేదు.",
        "వెంటనే ఈ QR స్కాన్ చేయండి. ఎవరికీ చెప్పకండి.",
      ],
    },
  },
  otp: {
    title: "The urgent OTP",
    description:
      "Watch an ordinary opening turn into a request for a private code.",
    steps: {
      en: [
        "Hello, is this a good time to speak?",
        "I am calling from your bank. Your account will be blocked immediately.",
        "Share your OTP now so I can unlock your account.",
      ],
      hi: [
        "नमस्ते, क्या अभी बात कर सकते हैं?",
        "मैं बैंक से बोल रहा हूँ। आपका खाता अभी बंद हो जाएगा।",
        "खाता खोलने के लिए ओटीपी बताओ अभी।",
      ],
      te: [
        "నమస్తే, ఇప్పుడు మాట్లాడవచ్చా?",
        "బ్యాంక్ నుంచి మాట్లాడుతున్నాను. మీ ఖాతా వెంటనే బ్లాక్ అవుతుంది.",
        "మీ ఖాతా తెరవడానికి కోడ్ చెప్పండి వెంటనే.",
      ],
    },
  },
  normal: {
    title: "An ordinary conversation",
    description: "Banking words alone should not cause a scam warning.",
    steps: {
      en: [
        "Shall we have lunch tomorrow?",
        "I went to the bank today to update my address.",
        "The awareness poster said never share your OTP or PIN with anyone.",
      ],
      hi: [
        "क्या हम कल दोपहर खाना खाएँ?",
        "आज बैंक में अपना पता अपडेट किया।",
        "पोस्टर में लिखा था कि अपना ओटीपी या पिन किसी को नहीं बताना।",
      ],
      te: [
        "రేపు మధ్యాహ్నం భోజనానికి కలుద్దామా?",
        "ఈరోజు బ్యాంకులో నా చిరునామా మార్చాను.",
        "మీ OTP లేదా PIN ఎవరికీ చెప్పకండి అని పోస్టర్‌లో ఉంది.",
      ],
    },
  },
} satisfies Record<
  string,
  { title: string; description: string; steps: Record<Language, string[]> }
>;
export type DemoScenario = keyof typeof demoScenarios;
export const demoQR =
  "upi://pay?pa=demo-only@invalid&pn=DEMO%20ONLY%20-%20Not%20a%20real%20payee&am=499&cu=INR&tn=Synthetic%20verification%20demo";
