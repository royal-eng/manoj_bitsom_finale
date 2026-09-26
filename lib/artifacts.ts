import { z } from "zod";
export const artifactSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(120),
  kind: z.enum(["message", "image", "qr", "link"]),
  text: z.string().min(1).max(5000),
  qrPayload: z.string().max(2000).optional(),
  confirmed: z.literal(true),
  demo: z.boolean().optional(),
});
export type Artifact = z.infer<typeof artifactSchema>;
export function inspectPayload(payload: string) {
  try {
    const url = new URL(payload.trim());
    if (url.protocol === "upi:" && url.hostname === "pay") {
      const amount = url.searchParams.get("am");
      return {
        kind: "payment" as const,
        title: "UPI payment request",
        facts: [
          "Decoded QR contains a UPI payment request.",
          `Payee address in payload: ${url.searchParams.get("pa") || "unknown"}`,
          `Display name in payload (unverified): ${url.searchParams.get("pn") || "unknown"}`,
          `Amount in payload: ${amount || "not specified"} ${url.searchParams.get("cu") || "currency unknown"}`,
        ],
        limitation:
          "A payment payload does not prove fraud. The payee and display name have not been verified.",
      };
    }
    if (["https:", "http:"].includes(url.protocol))
      return {
        kind: "link" as const,
        title: "Link inspected without opening",
        facts: [
          `Destination hostname: ${url.hostname}`,
          `Connection scheme: ${url.protocol.replace(":", "")}`,
          url.username || url.password
            ? "URL contains embedded credentials."
            : "No embedded URL credentials.",
          url.hostname.includes("xn--")
            ? "Internationalised hostname: check carefully."
            : "Reputation and ownership are unknown.",
        ],
        limitation: "We do not visit links or certify that a website is safe.",
      };
  } catch {}
  return {
    kind: "unknown" as const,
    title: "Unrecognised QR content",
    facts: ["No supported payment or web-link format was found."],
    limitation: "Review the decoded text. It has not been opened or executed.",
  };
}
export function artifactContext(artifacts: Artifact[]) {
  return artifacts
    .map(
      (a) =>
        `Attachment ${a.id} (${a.kind}, user-confirmed):\n${a.text}${a.qrPayload ? "\n" + inspectPayload(a.qrPayload).facts.join("\n") : ""}`,
    )
    .join("\n\n");
}
