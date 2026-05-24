import { NextRequest, NextResponse } from "next/server";
import { routeRemoveBackground } from "@/lib/providers/router";
import { logger } from "@/lib/logger";

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 5;
const MAX_REQUESTS_PER_DAY = 30;

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + 60_000 });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, message: "Too many requests. Please wait a moment." };
  }

  entry.count++;
  return { allowed: true };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message, success: false },
        { status: 429 }
      );
    }

    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Image data is required", success: false },
        { status: 400 }
      );
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    const hasRemoveBg = !!apiKey;

    if (hasRemoveBg) {
      try {
        const isBase64 = image.startsWith("data:image/");
        let formData: FormData;

        if (isBase64) {
          const base64Data = image.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          const blob = new Blob([buffer]);
          formData = new FormData();
          formData.append("image_file", blob, "image.png");
          formData.append("size", "auto");
          formData.append("format", "png");
        } else {
          formData = new FormData();
          formData.append("image_url", image);
          formData.append("size", "auto");
          formData.append("format", "png");
        }

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: { "X-Api-Key": apiKey! },
          body: formData,
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const resultUrl = `data:image/png;base64,${base64}`;
          return NextResponse.json({
            imageUrl: resultUrl,
            success: true,
            provider: "removebg",
          });
        }
      } catch (err) {
        logger.error("Remove.bg error:", { error: err });
      }
    }

    try {
      const result = await routeRemoveBackground(image);
      return NextResponse.json({
        imageUrl: result.imageUrl,
        success: true,
        provider: result.provider,
      });
    } catch (routerError) {
      logger.error("Router fallback error:", { error: routerError });
      return NextResponse.json(
        { error: "Background removal service unavailable", success: false },
        { status: 503 }
      );
    }
  } catch (error) {
    logger.error("Background removal error:", { error });
    return NextResponse.json(
      { error: "Processing failed: " + (error as Error).message, success: false },
      { status: 500 }
    );
  }
}
