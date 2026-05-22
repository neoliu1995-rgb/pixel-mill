import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/imageGenerator";
import { addWatermark } from "@/lib/watermark";
import { uploadImage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const results = { steps: [] as string[], errors: [] as string[] };
  const log = (step: string, ok: boolean, detail?: string) => {
    results.steps.push(`${ok ? "✅" : "❌"} ${step}${detail ? `: ${detail}` : ""}`);
    if (!ok && detail) results.errors.push(detail);
  };

  try {
    const startTime = Date.now();

    log("Step 1: Generate image", true);
    const result = await generateImage(
      { prompt: "a cute cat", width: 256, height: 256 },
      "free"
    );
    log("Step 1.1: Image generated", true, `${Date.now() - startTime}ms, ${result.provider}/${result.model}`);

    log("Step 2: Add watermark", true);
    let finalUrl = result.imageUrl;
    try {
      finalUrl = await addWatermark(result.imageUrl);
      log("Step 2.1: Watermark added", true, `${finalUrl.length} chars`);
    } catch (e) {
      log("Step 2.1: Watermark failed", false, e instanceof Error ? e.message : String(e));
    }

    log("Step 3: Upload to R2/storage", true);
    try {
      const r2Url = await uploadImage(finalUrl, "anon:test");
      log("Step 3.1: Upload done", true, typeof r2Url === "string" ? `${r2Url.length} chars` : "unknown");
    } catch (e) {
      log("Step 3.1: Upload failed", false, e instanceof Error ? e.message : String(e));
    }

    log("Step 4: Save history (anon user)", true);
    try {
      await prisma.generationHistory.create({
        data: { userId: "anon:test", prompt: "a cute cat", model: "flux-schnell", imageUrl: finalUrl.substring(0, 100) },
      });
      log("Step 4.1: History saved", true);
    } catch (e) {
      log("Step 4.1: History save failed", false, e instanceof Error ? e.message : String(e));
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    log("FATAL", false, error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, ...results, stack: error instanceof Error ? error.stack : undefined }, { status: 500 });
  }
}
