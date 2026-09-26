import { analyze } from "../lib/providers";
async function main() {
  process.loadEnvFile(".env");
  const text = "I am calling from your bank. Share your OTP immediately.";
  for (const forced of ["", "gemini", "all"]) {
    process.env.SCAMSHIELD_FORCE_FAILURE = forced;
    const result = await analyze(text, "en");
    console.log(
      JSON.stringify({
        forcedFailure: forced || "none",
        source: result.source,
        level: result.level,
        evidenceCount: result.evidence.length,
      }),
    );
  }
}
void main();
