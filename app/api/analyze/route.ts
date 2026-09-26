import { z } from "zod";
import { analyze } from "@/lib/providers";
import { artifactSchema } from "@/lib/artifacts";
import { readBody, errorResponse } from "@/lib/request-guard";
export const runtime = "nodejs";
export const maxDuration = 30;
const input = z
  .object({
    text: z.string().max(14000),
    language: z.enum(["en", "hi", "te"]),
    artifacts: z.array(artifactSchema).max(3).default([]),
  })
  .refine((v) => v.text.trim() || v.artifacts.length);
export async function POST(req: Request) {
  try {
    const body = input.safeParse(await readBody(req, 80000, 20));
    if (!body.success)
      return Response.json(
        { error: "Provide a conversation or a confirmed attachment." },
        { status: 400 },
      );
    return Response.json(
      await analyze(
        body.data.text,
        body.data.language,
        fetch,
        body.data.artifacts,
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
