import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";
import { generateImage } from "@/lib/imageGenerator";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const results = { steps: [] as string[] };
  const log = (s: string, ok: boolean, d?: string) => { results.steps.push(`${ok?"✅":"❌"} ${s}${d?`: ${d}`:""}"); };

  try {
    log("1. Rate limit check", true);
    try {
      const rl = await rateLimiter.check("test-main-flow", 10, 60000);
      log("1.1 RL result", rl.allowed, JSON.stringify(rl));
    } catch (e) {
      log("1.1 RL FAILED", false, e instanceof Error ? e.message : String(e));
    }

    log("2. Generate image", true);
    const result = await generateImage({ prompt: "a cute cat", width: 256, height: 256 }, "free");
    log("2.1 Generated", true, `${result.provider}/${result.model}`);

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    log("FATAL", false, error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, ...results }, { status: 500 });
  }
}
