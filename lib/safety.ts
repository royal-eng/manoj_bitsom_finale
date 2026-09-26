import type { Language } from "./analysis";
export const references = [
  {
    id: "rbi-credentials",
    title: "RBI · Protect your credentials",
    url: "https://rbikehtahai.rbi.org.in/rbi-cautions-sms.html",
    summary: "Do not share bank account details, CVV, OTP or PIN with callers.",
  },
  {
    id: "rbi-qr",
    title: "RBI · Understand QR requests",
    url: "https://rbikehtahai.rbi.org.in/qr",
    summary: "Entering a PIN or OTP is not required to receive money.",
  },
  {
    id: "report",
    title: "Government of India · Financial fraud reporting",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1814120",
    summary:
      "Report financial cyber fraud through 1930 and the National Cybercrime Reporting Portal.",
  },
];
export type SafetyStage = "paused" | "shared" | "paid";
export const safetySteps: Record<SafetyStage, Record<Language, string[]>> = {
  paused: {
    en: [
      "Pause the conversation. Do not share codes, install remote-access apps, or approve a payment.",
      "Contact your bank using its official app, website, or the number printed on your card.",
      "Save the observed evidence if you want a personal record.",
    ],
    hi: [
      "बातचीत रोकें। कोड न बताएँ, रिमोट ऐप न लगाएँ और भुगतान मंज़ूर न करें।",
      "बैंक के आधिकारिक ऐप, वेबसाइट या कार्ड पर दिए नंबर से संपर्क करें।",
      "ज़रूरत हो तो सबूत का निजी रिकॉर्ड सेव करें।",
    ],
    te: [
      "సంభాషణను ఆపండి. కోడ్‌లు చెప్పకండి, రిమోట్ యాప్‌లు ఇన్‌స్టాల్ చేయకండి, చెల్లింపును ఆమోదించకండి.",
      "బ్యాంకు అధికారిక యాప్, వెబ్‌సైట్ లేదా కార్డుపై ఉన్న నంబరుతో సంప్రదించండి.",
      "అవసరమైతే ఆధారాలను వ్యక్తిగత రికార్డుగా సేవ్ చేయండి.",
    ],
  },
  shared: {
    en: [
      "Stop sharing information and disconnect any screen-sharing session.",
      "Contact your bank immediately through an official channel. Explain exactly what you shared and ask how to secure the affected account.",
      "Use the official app or site to change exposed passwords. Save the messages and times.",
    ],
    hi: [
      "जानकारी देना और स्क्रीन शेयर करना बंद करें।",
      "तुरंत बैंक के आधिकारिक माध्यम से संपर्क करें। क्या साझा किया है बताएँ और खाता सुरक्षित करने की मदद लें।",
      "आधिकारिक ऐप या साइट पर उजागर पासवर्ड बदलें। संदेश और समय सेव करें।",
    ],
    te: [
      "సమాచారం ఇవ్వడం, స్క్రీన్ షేరింగ్ ఆపండి.",
      "వెంటనే అధికారిక మార్గంలో బ్యాంకును సంప్రదించండి. ఏమి పంచుకున్నారో చెప్పి ఖాతా రక్షణకు సహాయం కోరండి.",
      "అధికారిక యాప్ లేదా సైట్‌లో బయటపడిన పాస్‌వర్డ్‌లను మార్చండి. సందేశాలు, సమయాలను భద్రపరచండి.",
    ],
  },
  paid: {
    en: [
      "Contact your bank’s official fraud support immediately and report the transaction.",
      "In India, call 1930 and report at cybercrime.gov.in. Prompt reporting does not guarantee recovery.",
      "Keep the transaction reference, amount, time and messages. Do not send more money to anyone promising recovery.",
    ],
    hi: [
      "तुरंत बैंक की आधिकारिक धोखाधड़ी सहायता से संपर्क करें और लेनदेन बताएँ।",
      "भारत में 1930 पर कॉल करें और cybercrime.gov.in पर रिपोर्ट करें। धन वापसी की गारंटी नहीं है।",
      "लेनदेन नंबर, राशि, समय और संदेश रखें। पैसे वापस दिलाने के नाम पर और पैसे न भेजें।",
    ],
    te: [
      "వెంటనే బ్యాంకు అధికారిక మోసం సహాయ విభాగానికి లావాదేవీని తెలియజేయండి.",
      "భారతదేశంలో 1930కు కాల్ చేసి cybercrime.gov.inలో నివేదించండి. డబ్బు తిరిగి రావడానికి హామీ లేదు.",
      "లావాదేవీ నంబరు, మొత్తం, సమయం, సందేశాలు ఉంచండి. డబ్బు తిరిగి ఇప్పిస్తామని చెప్పేవారికి మరింత పంపకండి.",
    ],
  },
};
