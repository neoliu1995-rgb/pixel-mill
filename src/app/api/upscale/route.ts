import { NextRequest, NextResponse } from "next/server";
import { routeUpscale } from "@/lib/providers/router";
import { upscaleWithCanvas } from "@/lib/upscale-server";
import { addWatermark } from "@/lib/watermark";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { imageUrl, scale = 2, useAI = true, userTier: requestUserTier } = await req.json();
    const userTier = requestUserTier || (user.plan as "free" | "pro" | "business");

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const upscaleFactor = scale === 4 ? 4 : 2;

    if (useAI) {
      try {
        const result = await routeUpscale(imageUrl, upscaleFactor);
        let resultUrl = result.imageUrl;
        if (userTier === "free") {
          try {
            resultUrl = await addWatermark(result.imageUrl);
          } catch (wmError) {
            logger.error("Watermark error:", { error: wmError });
          }
        }
        return NextResponse.json({
          imageUrl: resultUrl,
          success: true,
          provider: result.provider,
          scale: upscaleFactor,
          cost: result.cost,
        });
      } catch (aiError) {
        logger.error("AI upscale failed, falling back to canvas:", { error: aiError });
      }
    }

    const canvasResult = await upscaleWithCanvas(imageUrl, upscaleFactor);
    let canvasUrl = canvasResult;
    if (userTier === "free") {
      try {
        canvasUrl = await addWatermark(canvasResult);
      } catch (wmError) {
        logger.error("Watermark error:", { error: wmError });
      }
    }
    return NextResponse.json({
      imageUrl: canvasUrl,
      success: true,
      provider: "canvas",
      scale: upscaleFactor,
      cost: 0,
      warning: "Used canvas upscaling - quality may be lower than AI upscaling",
    });
  } catch (error) {
    logger.error("Upscale error:", { error });
    return NextResponse.json(
      { error: "图片放大失败：" + (error as Error).message, success: false },
      { status: 500 }
    );
  }
}
