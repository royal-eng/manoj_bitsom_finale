# Verification — 26 September 2026

## Version 2 verification

- Published successfully to https://scamshield-ten-mu.vercel.app (deployment `dpl_GwwjhurkoPiQBdwqUHeHXDr69BYV`, application commit `5e3bf95`). Hosted homepage returned 200, screenshot extraction and analysis requests succeeded, and the QR asset loaded. The hosted guided QR demo completed with Gemini, a high-risk warning and two validated cross-source connections; its final check took 2.6 seconds. Browser error collection was empty and the point-in-time production error-log query found no logs.

- 21 automated tests pass, including cross-source quotation validation, credential evidence, QR/URL parsing, contextual warnings, streamed body limits, rate-limit expiry and same-origin requests behind a Next bind address. TypeScript and the production build pass.
- Live synthetic evaluation: **10/10 expected levels**. Normal/OTP/QR cases in English, Hindi and Telugu, plus screenshot text alone. All returned Gemini in this run; latency 1.64–3.70 seconds. Each QR case returned at least one supported cross-source connection. This small smoke set is not a real-world accuracy measurement.
- Live failover check returned Gemini, then Groq when Gemini was skipped, then local rules with both skipped. All three identified the synthetic bank/OTP request as high risk.
- Browser: QR demo decoded a real synthetic QR and connected the claimed verification to a 499 INR payment request. Ordinary demo returned low risk without intervention. Uploaded QR was decoded locally; screenshot OCR required consent, extracted the visible synthetic text, and required confirmation before assessment.
- Safety panel opened, switched to the sent-money steps and exposed the 1930/official reporting links. Dialog naming and selected-stage accessibility were improved.
- New session during an active demo cleared transcript/evidence and remained clear after waiting for late requests. Sample mode never represented microphone input.
- 390 px mobile layout visually inspected: document width equaled viewport width (390 px), with no horizontal overflow. File input is visually hidden and retains an accessible label. Test-browser error collection was empty; a separate development browser logged extension-injected hydration attributes.
- Fixed issues found during testing: valid localhost requests rejected by internal bind-address comparison; unsupported inference of a credential request from generic account review; missing mobile heading whitespace; delayed blob URL cleanup for report export.
- Production-mode API checks returned 400 for invalid analysis input, malformed image bytes and missing consent; an unrelated browser Origin returned 403.
- Report export verified through the normal Save button: a 3,728-byte JSON file was saved in Downloads and parsed successfully (version 2, transcript, high-risk assessment, three next steps and three references). The automation download helper cancelled its own download attempt; direct app export succeeded.
- Production-mode Telugu selection disclosed the unavailable installed voice and offered an explicit English fallback. Browser voice inventory included English and Hindi, but no Telugu.
- The first v2 deployment was blocked by commit-author association. Local Git used an unassociated email; it was corrected to the authenticated Vercel owner's account email for subsequent commits, without rewriting pushed history or changing project permissions.

Actual microphone recognition/amplitude, audible voice quality and multilingual speech accuracy still require presentation-device testing. Synthetic inputs do not verify these capabilities.

Reproduce: `npm test`, `npm run build`, `npx tsx scripts/evaluate.ts`, and `npx tsx scripts/check-providers.ts`. Provider checks require local environment credentials and may consume quota.

## Confirmed

- Vercel production deployment reached READY: https://scamshield-ten-mu.vercel.app. The public homepage returned HTTP 200 and rendered the application in the browser without reported browser errors.
- The hosted `/api/analyze` returned HTTP 200 with Gemini for both a low-risk ordinary conversation and a high-risk bank/OTP request with three evidence items.
- Production keys are stored as Vercel secrets. The post-deployment error-log query returned no matching error logs; this is a point-in-time check, not continuous monitoring.

- Production compilation, TypeScript validation and static route generation passed with Next.js 16.3.6 and the Windows WASM/Webpack launcher.
- Nine automated tests passed: ordinary conversation, isolated OTP caution, combined scam intervention, educational advice, Hindi/Telugu local matching, redaction, fabricated evidence rejection, 429/503 failover and malformed JSON.
- Desktop and 390 px mobile pages were opened and visually inspected. No browser errors were reported by the test browser.
- Typed normal conversation reached the real Gemini API and returned low risk, without a warning.
- Typed bank impersonation + OTP + urgency + isolation reached Gemini and rendered a high-risk warning with observed quotations.
- Warning Replay caused the browser's `speechSynthesis.speaking` to become true. Audible quality was not independently heard or validated.
- Help panel opened and displayed independent bank-verification advice and observed evidence.
- Forced Gemini failure reached real Groq using `openai/gpt-oss-20b`; it returned a validated high-risk result. The originally considered Llama model returned 404 and was replaced with an available documented model.
- Forced failure of both providers returned local rules. The browser displayed **Basic protection**, the outage notice, exact local evidence, and the visible warning. Failure injection was removed afterward.
- The browser exposed speech recognition and English/Hindi voices, but no Telugu voice. The app prominently discloses unavailable voice languages.
- Microphone access was denied in the automation environment. The app showed its permission explanation and retained typed input.

## Presentation-device checks still required

Live microphone amplitude, real incremental speech recognition, recognition recovery, automatic pause/resume around voice playback, audible output quality, and speech recognition accuracy in English, Hindi, Telugu and mixed speech require an actual microphone-enabled browser session. These were not represented as verified by synthetic input.

The waveform uses the actual AnalyserNode frequency data; idle and typed mode remain flat. No fake live transcript, synthetic audio or prerecorded waveform was used in browser verification.

## Reproduce

`npm test`, `npm run build`, then `npm run dev`. With optional real credentials in `.env`, `npx tsx scripts/check-providers.ts` checks normal, Gemini-disabled, and both-disabled analysis using a synthetic sentence and prints only source/level/evidence counts. It does not change `.env`.

See the README for setup, privacy, account quotas, deployment and a live judging flow.
