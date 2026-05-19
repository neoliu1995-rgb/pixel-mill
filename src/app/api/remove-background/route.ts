import { NextRequest, NextResponse } from "next/server";
import { routeRemoveBackground } from "@/lib/providers/router";
import { addWatermark } from "@/lib/watermark";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { imageUrl, userTier: requestUserTier } = await req.json();
    const userTier = requestUserTier || (user.plan as "free" | "pro" | "business");

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    const hasRemoveBg = !!apiKey;

    if (hasRemoveBg) {
      try {
        const isBase64 = imageUrl.startsWith("data:image/");
        let formData: FormData;

        if (isBase64) {
          const base64Data = imageUrl.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          const blob = new Blob([buffer]);
          formData = new FormData();
          formData.append("image_file", blob, "image.png");
          formData.append("size", "auto");
          formData.append("format", "png");
        } else {
          formData = new FormData();
          formData.append("image_url", imageUrl);
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
          let resultUrl = `data:image/png;base64,${base64}`;
          if (userTier === "free") {
            try {
              resultUrl = await addWatermark(resultUrl);
            } catch (wmError) {
              console.error("Watermark error:", wmError);
            }
          }
          return NextResponse.json({
            imageUrl: resultUrl,
            success: true,
            provider: "removebg",
          });
        }
      } catch (err) {
        console.error("Remove.bg error:", err);
      }
    }

    try {
      const result = await routeRemoveBackground(imageUrl);
      let fallbackUrl = result.imageUrl;
      if (userTier === "free") {
        try {
          fallbackUrl = await addWatermark(result.imageUrl);
        } catch (wmError) {
          console.error("Watermark error:", wmError);
        }
      }
      return NextResponse.json({
        imageUrl: fallbackUrl,
        success: true,
        provider: result.provider,
        cost: result.cost,
      });
    } catch (routerError) {
      console.error("Router fallback error:", routerError);
      return NextResponse.json(
        {
          error: "AI抠图功能需要配置API密钥，即将上线！",
          success: false,
          needsApiKey: true,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Background removal error:", error);
    return NextResponse.json(
      { error: "图片处理失败：" + (error as Error).message, success: false },
      { status: 500 }
    );
  }
}
