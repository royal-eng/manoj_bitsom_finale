# ScamShield

A warm, light, single-screen financial-scam intervention prototype. Real microphone amplitude drives the waveform; browser speech recognition progressively transcribes nearby conversation. Evidence-backed warnings are visible and spoken when a matching system voice exists. No scripted transcript is presented as live speech.

## Run locally

Requires Node.js 20.9+ and npm. Run `npm install`, copy `.env.example` to `.env`, add optional provider credentials, then `npm run dev`. Open http://localhost:3000. `npm run build` creates a production build; `npm start` serves it. `npm test` runs detection, evidence, redaction and failover tests.

On Windows the launcher uses the bundled WASM compiler because some devices block native compiler modules. Webpack and Tailwind 3 keep this setup portable. Other platforms use the normal native compiler.

Keys are server-side only. `.env` is ignored. Do not use `NEXT_PUBLIC_` for keys. No credentials are needed for text mode and local basic protection.

## Providers

`GEMINI_API_KEY`, `GROQ_API_KEY`, `GEMINI_MODEL=gemini-2.5-flash`, `GROQ_MODEL=openai/gpt-oss-20b`.

The route tries Gemini, then Groq, then deterministic rules. Each provider has a 5.5 second timeout and no retries. Missing credentials skip that provider. Authentication errors, quota errors, bad JSON, schema errors and invented quotes all trigger failover. Basic protection is explicitly labeled. It is conservative and less context-aware than AI; absence of a match is not assurance of safety.

Documented models: [Gemini 2.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash), [Groq structured outputs](https://console.groq.com/docs/structured-outputs). Quotas and availability depend on your account, model, region and billing tier. Verify current limits in [Google AI Studio](https://aistudio.google.com/) and [Groq Console](https://console.groq.com/settings/limits); no free quota is assumed.

For local failure checks, set `SCAMSHIELD_FORCE_FAILURE=gemini` in `.env` and restart development to skip Gemini; a valid Groq key should produce the Groq label. Set `SCAMSHIELD_FORCE_FAILURE=all` for basic protection. Remove the setting and restart to restore normal behavior. This switch is ignored in production. Automated tests also inject provider 429/503 and malformed JSON responses.

## Browser and languages

Use current desktop Chrome or Edge on localhost or HTTPS. Browser recognition availability varies by platform and network; permission denial, service errors and unsupported recognition languages are shown with text mode offered. Select English (India), Hindi or Telugu. Auto / mixed asks for the closest recognition language; it does not claim automatic speech-language detection. Analysis understands mixed-language text. Core status messages and warnings are localized; supporting controls and instructions currently remain in English.

System voice availability is checked at runtime. A missing Hindi or Telugu voice is disclosed instead of passing an English voice off as native speech. Install a suitable OS voice or select another language for spoken warnings. Actual speech accuracy and audible output must be checked on the presentation device.

## Privacy and behavior

Sessions stay in browser memory, except a report explicitly downloaded by the user. ScamShield does not record or send raw audio to Gemini/Groq. Browser speech recognition may send audio to the browser vendor's service. Gemini/Groq receive bounded transcript text with obvious 4–19 digit sequences and emails redacted. Redaction is best effort; avoid sharing sensitive information. Personal reports contain observed transcript text and should be handled privately.

Stop releases microphone tracks and stops recognition. Navigation/unmount also releases audio. Warning playback pauses recognition to avoid transcribing itself, then resumes if listening is still requested. Automatic recognition restarts are bounded. One high-risk voice alert is issued per session; Replay is explicit. A confirmed high state remains until New session. No certainty of safety, interception of cellular calls, bank notification or official report submission is claimed.

The client debounces analysis for 2.3 seconds and caps dispatch at one request per four seconds, cancels stale requests, retains recent context plus initial context for long conversations, and immediately applies basic cues. In a public deployment add authenticated access or a durable shared rate limiter to protect provider spend: client throttling alone is not an abuse barrier. Extremely long sessions retain only the beginning and recent transcript for analysis; the in-memory report retains all observed segments.

## Judging flow

### Guided demos and evidence

Choose **The verification QR**, **The urgent OTP**, or **An ordinary conversation**, then play the guided demo. All three have English, Hindi and Telugu inputs. They send synthetic text through the real analysis pipeline; they do not play prerecorded verdicts or activate the microphone. The QR sample is decoded locally and uses an invalid synthetic payee. Replay, Stop demo, Exit demo and New session are available.

Upload a PNG/JPEG/WebP (up to 8 MB before on-device resizing) to decode QR locally. Reading screenshot text requires separate consent to send the resized image to Gemini, followed by human review and confirmation. Images are not retained by the application. Confirmed text, payment fields and pasted links can be assessed alongside the conversation. Links are parsed without fetching destinations; neither payee identity nor URL reputation is verified. Cross-source conclusions require quotations matched to both supplied inputs.

The evidence timeline records first observations and labels AI versus rule interpretation. Safety guidance changes for people who have paused, shared information, or sent money, with links to RBI and government reporting guidance. Downloads contain a personal JSON record and clearly label demo sessions.

API routes enforce bounded streamed request bodies, same-origin browser submissions and per-instance request limits (20 analysis / 5 extraction requests per minute per IP). These in-memory limits are not global across serverless instances; a public production service should add durable limits/authentication. Screenshot extraction needs Gemini; its failure offers manual text input.

Run `npx tsx scripts/evaluate.ts` for a small, paid-provider synthetic smoke evaluation of nine multilingual demo cases plus an attachment-only case. It prints observed levels, provider and latency. This is not a real-world accuracy benchmark.

1. Open on the presentation laptop; choose language and enable voice warnings.
2. Press Start listening and grant mic permission. Speak near the device, or put a separate phone on speaker. Start with an ordinary conversation.
3. Improvise a bank impersonation followed by a request to share an OTP urgently. Observe final and provisional transcript, quoted evidence, changing risk color and audible interruption.
4. Open Help me stay safe, review independent verification advice, and save a personal JSON report.
5. Stop listening; verify the browser microphone indicator clears. New session clears the conversation and held warning.
6. Test Type a conversation if microphone recognition is unavailable. Typed segments are explicitly marked.

## Deployment

Production: https://scamshield-ten-mu.vercel.app — deployed to the `scamshield` project in `cnu1812s-projects`. Both API keys and model settings are configured as production secrets. No database or telephony account is required.

To deploy subsequent changes from this linked directory, run `npx vercel deploy --prod`. `.vercelignore` excludes local environment files and test artifacts. Deployment is manual; no Git-triggered deployment is configured.

## Verification

See `VERIFICATION.md` for checks performed and limitations. Never treat synthetic or mocked recognition tests as proof of real microphone or multilingual voice performance.

