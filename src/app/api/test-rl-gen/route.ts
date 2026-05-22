import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";
import { generateImage } from "@/lib/imageGenerator";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const results = { steps: [] as string[], errors: [] as string[] };

  try {
    results.steps.push("[OK] Step 1: Rate limit check");
    try {
      const rl = await rateLimiter.check("test-main-flow", 10, 60000);
      results.steps.push("[OK] Step 1.1: RL allowed=" + rl.allowed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.steps.push("[FAIL] Step 1.1: " + msg);
      results.errors.push(msg);
    }

    results.steps.push("[OK] Step 2: Generate image");
    const result = await generateImage({ prompt: "a cute cat", width: 256, height: 256 }, "free");
    results.steps.push("[OK] Step 2.1: " + result.provider + "/" + result.model);

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.steps.push("[FAIL] FATAL: " + msg);
    results.errors.push(msg);
    return NextResponse.json({ success: false, ...results }, { status: 500 });
  }
}
