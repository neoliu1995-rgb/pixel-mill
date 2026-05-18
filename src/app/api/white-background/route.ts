import { NextRequest, NextResponse } from "next/server";
import { routeReplaceBackground } from "@/lib/providers/router";
import { addWatermark } from "@/lib/watermark";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, bgColor, userTier = "free" } = await req.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const backgroundColor = bgColor && typeof bgColor === "string"
      ? bgColor.replace("#", "")
      : "白色";

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
          formData.append("bg_color", backgroundColor);
          formData.append("add_shadow", "true");
        } else {
          formData = new FormData();
          formData.append("image_url", imageUrl);
          formData.append("size", "auto");
          formData.append("format", "png");
          formData.append("bg_color", backgroundColor);
          formData.append("add_shadow", "true");
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
      const result = await routeReplaceBackground(imageUrl, backgroundColor);
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
          error: "白底图功能需要配置API密钥，即将上线！",
          success: false,
          needsApiKey: true,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("White background error:", error);
    return NextResponse.json(
      { error: "图片处理失败：" + (error as Error).message, success: false },
      { status: 500 }
    );
  }
}
