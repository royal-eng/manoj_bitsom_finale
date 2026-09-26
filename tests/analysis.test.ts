import test from "node:test";
import assert from "node:assert/strict";
import { localAnalysis, redact, validateAnalysis } from "../lib/analysis";
import { analyze } from "../lib/providers";
test("ordinary conversation does not trigger intervention", () => {
  assert.equal(
    localAnalysis("Let us meet for lunch tomorrow.").interventionRequired,
    false,
  );
});
test("an isolated OTP request is cautious, not a confirmed scam", () => {
  assert.equal(localAnalysis("Please share your OTP").level, "watch");
});
test("bank impersonation and OTP request triggers a warning with exact evidence", () => {
  const text = "I am calling from your bank. Share your OTP immediately.";
  const a = localAnalysis(text);
  assert.equal(a.level, "high");
  assert.ok(a.evidence.every((e) => text.includes(e.quote)));
});
test("educational anti-scam advice stays low", () => {
  assert.equal(
    localAnalysis("Never share your OTP with a bank officer.").level,
    "low",
  );
});
test("Hindi and Telugu requests can trigger local protection", () => {
  assert.equal(
    localAnalysis("बैंक से बोल रहा हूँ। ओटीपी बताओ अभी", "hi").level,
    "high",
  );
  assert.equal(
    localAnalysis("బ్యాంక్ నుంచి మాట్లాడుతున్నాను. కోడ్ చెప్పండి వెంటనే", "te")
      .level,
    "high",
  );
});
test("sensitive numeric strings are removed before cloud analysis", () => {
  const r = redact("OTP 123456 and card 4111 1111 1111 1111");
  assert.ok(!r.includes("123456"));
  assert.ok(!r.includes("4111"));
});
test("fabricated provider evidence is rejected", () => {
  const a = localAnalysis("Share your OTP immediately.");
  assert.throws(() => validateAnalysis(a, "Good morning", "gemini", "en"));
});
test("Gemini failure falls through to Groq; both failures to local", async () => {
  process.env.GEMINI_API_KEY = "test";
  process.env.GROQ_API_KEY = "test";
  const text = "Share your OTP immediately.";
  let calls = 0;
  const mock = (async () => {
    calls++;
    return calls === 1
      ? new Response("{}", { status: 429 })
      : Response.json({
          choices: [
            { message: { content: JSON.stringify(localAnalysis(text)) } },
          ],
        });
  }) as typeof fetch;
  const result = await analyze(text, "en", mock);
  assert.equal(result.source, "groq");
  assert.equal(calls, 2);
  const fail = (async () =>
    new Response("{}", { status: 503 })) as typeof fetch;
  assert.equal((await analyze(text, "en", fail)).source, "local_rules");
});
test("invalid provider JSON also fails over", async () => {
  const bad = (async () =>
    Response.json({
      candidates: [{ content: { parts: [{ text: "bad json" }] } }],
      choices: [{ message: { content: "bad json" } }],
    })) as typeof fetch;
  assert.equal((await analyze("Hi there", "en", bad)).source, "local_rules");
});
