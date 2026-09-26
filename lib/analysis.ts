import { z } from "zod";
export const signalNames = [
  "authority",
  "urgency",
  "isolation",
  "credential_request",
  "payment_request",
  "remote_access",
  "suspicious_link",
] as const;
export const analysisSchema = z.object({
  riskScore: z
    .number()
    .transform((n) => Math.round(Math.max(0, Math.min(100, n)))),
  level: z.enum(["low", "watch", "high"]),
  scamType: z.enum([
    "none",
    "bank_impersonation",
    "kyc",
    "credential",
    "remote_access",
    "payment",
    "investment",
    "other",
  ]),
  signals: z.array(z.enum(signalNames)),
  evidence: z.array(
    z.object({
      quote: z.string().min(1),
      signal: z.enum(signalNames),
      why: z.string(),
      timestamp: z.number().optional(),
      origin: z.enum(["conversation", "attachment"]).optional(),
    }),
  ),
  explanation: z.string(),
  interventionRequired: z.boolean(),
  warningText: z.string().nullable(),
  outputLanguage: z.enum(["en", "hi", "te"]),
  source: z.enum(["gemini", "groq", "local_rules"]),
  connections: z
    .array(
      z.object({
        conversationQuote: z.string().min(1),
        artifactQuote: z.string().min(1),
        explanation: z.string().max(600),
      }),
    )
    .max(3)
    .default([]),
  uncertainties: z.array(z.string().max(300)).max(4).default([]),
});
export type Analysis = z.infer<typeof analysisSchema>;
export type Language = "en" | "hi" | "te";
export function contextualWarning(
  signals: Analysis["signals"],
  language: Language,
) {
  const action = signals.includes("credential_request")
    ? "code"
    : signals.includes("remote_access")
      ? "remote"
      : signals.includes("payment_request")
        ? "payment"
        : "general";
  const messages: Record<Language, Record<string, string>> = {
    en: {
      code: "Pause. Someone is asking for a private code. Do not share it. End the call and contact your bank independently.",
      remote:
        "Pause. Someone is asking for access to your device. Do not install or open a remote-access app. Verify independently.",
      payment:
        "Pause. A payment request needs checking. Do not approve it under pressure. Contact your bank through its official channel.",
      general: warnings.en,
    },
    hi: {
      code: "रुकिए। आपसे निजी कोड माँगा जा रहा है। कोड न बताएँ। कॉल काटकर बैंक से आधिकारिक माध्यम से संपर्क करें।",
      remote:
        "रुकिए। आपके डिवाइस का एक्सेस माँगा जा रहा है। रिमोट ऐप न खोलें। स्वतंत्र रूप से जाँच करें।",
      payment:
        "रुकिए। भुगतान का अनुरोध जाँचें। दबाव में मंज़ूरी न दें। बैंक के आधिकारिक माध्यम से संपर्क करें।",
      general: warnings.hi,
    },
    te: {
      code: "ఆగండి. మీ వ్యక్తిగత కోడ్ అడుగుతున్నారు. చెప్పకండి. కాల్ ముగించి బ్యాంకును అధికారికంగా సంప్రదించండి.",
      remote:
        "ఆగండి. మీ పరికరానికి యాక్సెస్ అడుగుతున్నారు. రిమోట్ యాప్ తెరవకండి. స్వతంత్రంగా నిర్ధారించుకోండి.",
      payment:
        "ఆగండి. చెల్లింపు అభ్యర్థనను పరిశీలించండి. ఒత్తిడిలో ఆమోదించకండి. బ్యాంకును అధికారికంగా సంప్రదించండి.",
      general: warnings.te,
    },
  };
  return messages[language][action];
}
export const warnings: Record<Language, string> = {
  en: "Pause for a moment. Please don’t share a code or send money while you’re on this call. Hang up and contact your bank using its official number.",
  hi: "एक पल रुकिए। इस कॉल पर कोई कोड साझा न करें और पैसे न भेजें। कॉल काटकर अपने बैंक के आधिकारिक नंबर पर संपर्क करें।",
  te: "ఒక్క క్షణం ఆగండి. ఈ కాల్‌లో కోడ్ చెప్పకండి, డబ్బు పంపకండి. కాల్ ముగించి మీ బ్యాంకు అధికారిక నంబరుకు సంప్రదించండి.",
};
export function redact(text: string) {
  return text
    .replace(/\b(?:\d[ -]?){4,19}\b/g, "[REDACTED]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[EMAIL]");
}
const rules: [(typeof signalNames)[number], RegExp, string][] = [
  [
    "authority",
    /(?:calling from (?:your |the )?bank|bank (?:manager|officer|security)|from (?:SBI|HDFC|ICICI)|बैंक से|బ్యాంక్ నుంచి|bank se)/i,
    "Someone is claiming to represent a bank.",
  ],
  [
    "urgency",
    /(?:right now|immediately|within \w+ minutes|account.{0,20}block|KYC.{0,20}expir|तुरंत|अभी|खाता.{0,15}बंद|వెంటనే|ఇప్పుడే|abhi|turant)/i,
    "Pressure to act before you can check.",
  ],
  [
    "isolation",
    /(?:do not tell anyone|don.t tell anyone|keep this secret|किसी को मत|ఎవరికీ చెప్ప|kisi ko mat)/i,
    "You are being asked to keep this private.",
  ],
  [
    "credential_request",
    /(?:(?:share|tell|send|give|read).{0,35}(?:OTP|code|PIN|CVV|password)|(?:OTP|PIN|CVV|कोड|ओटीपी|పిన్|కోడ్).{0,25}(?:बताओ|बताइए|भेज|చెప్ప|పంప|batao|bhejo|share|cheppu))/i,
    "A request for a private code or credential.",
  ],
  [
    "payment_request",
    /(?:(?:send|transfer|pay).{0,30}(?:money|rupees|payment|fee)|scan.{0,20}QR|UPI payment request|पैसे.{0,20}(?:भेज|ट्रांसफर)|డబ్బు.{0,20}పంప|paise.{0,20}bhej)/i,
    "A request to move money or scan a payment code.",
  ],
  [
    "remote_access",
    /(?:(?:install|download|open).{0,25}(?:AnyDesk|TeamViewer|remote access)|स्क्रीन शेयर|స్క్రీన్ షేర్)/i,
    "Remote access could expose your device.",
  ],
  [
    "suspicious_link",
    /(?:click|open|visit).{0,25}(?:link|https?:\/\/)|लिंक.{0,15}खोल|లింక్.{0,15}తెర/i,
    "An unexpected link needs independent verification.",
  ],
];
export function localAnalysis(
  text: string,
  language: Language = "en",
): Analysis {
  const evidence: Analysis["evidence"] = [];
  for (const sentence of text.split(/(?<=[.!?\n])\s+/)) {
    if (
      /(?:never share|don.t share|do not share|about scams|scam awareness|नहीं बताना|मत बताना|పంచుకోవద్దు)/i.test(
        sentence,
      )
    )
      continue;
    for (const [signal, regex, why] of rules) {
      const m = sentence.match(regex);
      if (m && !evidence.some((e) => e.signal === signal))
        evidence.push({
          quote: m[0],
          signal,
          why,
          timestamp: text.indexOf(m[0]),
        });
    }
  }
  evidence.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  evidence.forEach((e) => delete e.timestamp);
  const signals = evidence.map((e) => e.signal);
  const strong = signals.some((s) =>
    ["credential_request", "remote_access", "payment_request"].includes(s),
  );
  const high = strong && signals.length >= 2;
  const score = high
    ? Math.min(95, 72 + (signals.length - 2) * 7)
    : signals.length
      ? 35
      : 0;
  return {
    riskScore: score,
    level: high ? "high" : signals.length ? "watch" : "low",
    scamType: signals.includes("credential_request")
      ? "credential"
      : signals.includes("remote_access")
        ? "remote_access"
        : signals.includes("payment_request")
          ? "payment"
          : "none",
    signals,
    evidence,
    explanation: high
      ? "Several concerning requests appeared together. Pause and verify independently."
      : signals.length
        ? "A concerning phrase appeared. More context is needed."
        : "We couldn't fully check this conversation right now",
    interventionRequired: high,
    warningText: high ? contextualWarning(signals, language) : null,
    outputLanguage: language,
    source: "local_rules",
    connections: [],
    uncertainties: [
      "Basic rules cannot fully interpret the conversation or verify an identity.",
    ],
  };
}
export function validateAnalysis(
  value: unknown,
  text: string,
  source: Analysis["source"],
  language: Language,
  attachmentText = "",
) {
  const a = analysisSchema.parse(value);
  const combined = text + "\n" + attachmentText;
  if (
    a.evidence.some(
      (e) => !combined.toLowerCase().includes(e.quote.toLowerCase()),
    ) ||
    a.signals.some((s) => !a.evidence.some((e) => e.signal === s))
  )
    throw Error("Unsupported evidence");
  if (a.evidence.some((e) => e.signal === "credential_request" &&
    !/(?:otp|pin|password|passcode|cvv|verification code|security code|account number|ओटीपी|पिन|पासवर्ड|कोड|ఓటీపీ|పిన్|పాస్‌వర్డ్|కోడ్)/i.test(e.quote)))
    throw Error("Credential evidence must name the requested secret");
  if (
    a.connections.some(
      (c) =>
        !text.toLowerCase().includes(c.conversationQuote.toLowerCase()) ||
        !attachmentText.toLowerCase().includes(c.artifactQuote.toLowerCase()),
    )
  )
    throw Error("Unsupported connection");
  a.evidence = a.evidence.map((e) => ({
    ...e,
    origin: text.toLowerCase().includes(e.quote.toLowerCase())
      ? "conversation"
      : "attachment",
  }));
  a.evidence.sort(
    (a, b) =>
      combined.toLowerCase().indexOf(a.quote.toLowerCase()) -
      combined.toLowerCase().indexOf(b.quote.toLowerCase()),
  );
  const high =
    a.riskScore >= 70 && new Set(a.evidence.map((e) => e.signal)).size >= 2;
  return {
    ...a,
    riskScore: !high ? Math.min(a.riskScore, 69) : a.riskScore,
    level: high ? "high" : a.riskScore >= 35 ? "watch" : "low",
    interventionRequired: high,
    warningText: high ? contextualWarning(a.signals, language) : null,
    source,
    outputLanguage: language,
  } as Analysis;
}
