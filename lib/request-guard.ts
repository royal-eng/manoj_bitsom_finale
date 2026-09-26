import { createHash } from "node:crypto";
const buckets = new Map<string, { count: number; until: number }>();
export function allowRequest(key: string, limit: number, now = Date.now()) {
  for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  const current = buckets.get(key);
  if (current && current.until > now) {
    if (current.count >= limit) return false;
    current.count++;
    return true;
  }
  if (buckets.size >= 2000) return false;
  buckets.set(key, { count: 1, until: now + 60000 });
  return true;
}
export async function readBody(req: Request, maxBytes: number, limit: number) {
  const origin = req.headers.get("origin");
  const requestURL = new URL(req.url);
  // Next may expose its bind address in req.url; Host retains the public address.
  const publicOrigin = new URL(requestURL.origin);
  publicOrigin.host = req.headers.get("host") || requestURL.host;
  if (origin && origin !== publicOrigin.origin)
    throw new RequestError("Cross-origin request refused", 403);
  const ip =
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "local";
  const key = createHash("sha256")
    .update(ip + new URL(req.url).pathname)
    .digest("hex");
  if (!allowRequest(key, limit))
    throw new RequestError("Too many checks. Please wait a minute.", 429);
  if (Number(req.headers.get("content-length")) > maxBytes)
    throw new RequestError("File or message is too large.", 413);
  const reader = req.body?.getReader();
  if (!reader) throw new RequestError("Empty request", 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new RequestError("File or message is too large.", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError("Invalid JSON", 400);
  }
}
export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function errorResponse(e: unknown) {
  return Response.json(
    {
      error:
        e instanceof RequestError
          ? e.message
          : "The check could not be completed.",
    },
    {
      status: e instanceof RequestError ? e.status : 400,
      headers: {
        "Cache-Control": "no-store",
        ...(e instanceof RequestError && e.status === 429
          ? { "Retry-After": "60" }
          : {}),
      },
    },
  );
}
