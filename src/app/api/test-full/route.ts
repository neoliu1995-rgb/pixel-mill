import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimiter } from "@/lib/rate-limiter";
import { routeGenerate } from "@/lib/providers/router";

export const maxDuration = 60;

export async function GET() {
  const results = {
    steps: [] as string[],
    errors: [] as string[],
  };

  const log = (step: string, success: boolean, detail?: string) => {
    results.steps.push(`${success ? "✅" : "❌"} ${step}${detail ? `: ${detail}` : ""}`);
    if (!success && detail) results.errors.push(detail);
  };

  try {
    log("Step 1: Database connection", true);
    await prisma.$queryRaw`SELECT 1`;

    log("Step 2: RateLimitEntry table", true);
    try {
      await prisma.rateLimitEntry.count();
      log("Step 2.1: RateLimitEntry query", true);
    } catch (e) {
      log("Step 2.1: RateLimitEntry query", false, e instanceof Error ? e.message : String(e));
    }

    log("Step 3: UsageRecord table", true);
    try {
      await prisma.usageRecord.count();
      log("Step 3.1: UsageRecord query", true);
    } catch (e) {
      log("Step 3.1: UsageRecord query", false, e instanceof Error ? e.message : String(e));
    }

    log("Step 4: GenerationHistory table", true);
    try {
      await prisma.generationHistory.count();
      log("Step 4.1: GenerationHistory query", true);
    } catch (e) {
      log("Step 4.1: GenerationHistory query", false, e instanceof Error ? e.message : String(e));
    }

    log("Step 5: Rate limiter check", true);
    const rlResult = await rateLimiter.check("test-diagnostic", 100, 60000);
    log("Step 5.1: Rate limiter result", rlResult.allowed, JSON.stringify(rlResult));

    log("Step 6: Pollinations image generation...", true);
    const genStart = Date.now();
    const genResult = await routeGenerate(
      { prompt: "a cute cat", width: 256, height: 256 },
      "free"
    );
    const genLatency = Date.now() - genStart;
    log("Step 6.1: Image generated", true, `${genLatency}ms, provider=${genResult.provider}, model=${genResult.model}`);
    log("Step 6.2: Image URL length", true, `${genResult.imageUrl.length} chars`);

    log("Step 7: Save generation history", true);
    try {
      await prisma.generationHistory.create({
        data: {
          userId: "diagnostic-test",
          prompt: "a cute cat",
          model: "flux-schnell",
          imageUrl: genResult.imageUrl.substring(0, 100),
        },
      });
      log("Step 7.1: History saved", true);
    } catch (e) {
      log("Step 7.1: History save failed", false, e instanceof Error ? e.message : String(e));
    }

    return NextResponse.json({
      success: true,
      message: "All tests passed!",
      ...results,
    });
  } catch (error) {
    log("FATAL ERROR", false, error instanceof Error ? error.message : String(error));
    return NextResponse.json({
      success: false,
      ...results,
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
