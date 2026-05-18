import { NextRequest, NextResponse } from "next/server";
import { routeCopywriting } from "@/lib/providers/router";
import { routeGenerate } from "@/lib/providers/router";

interface PosterRequest {
  productName: string;
  productImageUrl: string;
  template: "promotion" | "new_product" | "daily" | "festival";
  size: "taobao_main" | "detail_header" | "social_media" | "wechat";
  brandColor?: string;
  userTier?: "free" | "pro" | "business";
}

const TEMPLATE_PROMPTS: Record<string, string> = {
  promotion: "Create a vibrant promotional sale poster for {productName}. Bold sale typography, dynamic layout, red and gold color scheme, festive atmosphere, product prominently displayed",
  new_product: "Create a sleek new product launch poster for {productName}. Modern minimalist design, clean typography, premium feel, soft lighting, elegant composition",
  daily: "Create a clean daily marketing poster for {productName}. Professional product photography style, simple background, clear product features, trustworthy feel",
  festival: "Create a festive holiday poster for {productName}. Seasonal decorations, warm lighting, celebratory mood, gift-wrapping elements, holiday colors",
};

const SIZE_MAP: Record<string, { width: number; height: number }> = {
  taobao_main: { width: 800, height: 800 },
  detail_header: { width: 790, height: 950 },
  social_media: { width: 1080, height: 1080 },
  wechat: { width: 900, height: 383 },
};

export async function POST(req: NextRequest) {
  try {
    const {
      productName,
      productImageUrl,
      template = "promotion",
      size = "taobao_main",
      brandColor,
      userTier = "free",
    }: PosterRequest = await req.json();

    if (!productName || typeof productName !== "string") {
      return NextResponse.json(
        { success: false, error: "产品名称为必填项" },
        { status: 400 }
      );
    }

    if (!productImageUrl || typeof productImageUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "产品图片为必填项" },
        { status: 400 }
      );
    }

    if (userTier === "free") {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const copyResult = await routeCopywriting({
      productName,
      style: template === "promotion" ? "promotional" : template === "new_product" ? "professional" : template === "festival" ? "lively" : "professional",
      platform: "taobao",
    });

    const posterTitle = copyResult.title || productName;
    const posterSubtitle = copyResult.adSlogan || "";
    const sellingPoints = copyResult.bulletPoints || [];

    let posterPrompt = TEMPLATE_PROMPTS[template] || TEMPLATE_PROMPTS.promotion;
    posterPrompt = posterPrompt.replace("{productName}", productName);

    if (brandColor) {
      posterPrompt += `, brand color ${brandColor}`;
    }

    posterPrompt += `. Include text "${posterTitle}" as headline`;
    if (posterSubtitle) {
      posterPrompt += `, "${posterSubtitle}" as subheadline`;
    }

    const dimensions = SIZE_MAP[size] || SIZE_MAP.taobao_main;

    const imageResult = await routeGenerate(
      {
        prompt: posterPrompt,
        width: dimensions.width,
        height: dimensions.height,
        image: productImageUrl,
      },
      userTier
    );

    return NextResponse.json({
      success: true,
      posterImageUrl: imageResult.imageUrl,
      copywriting: {
        title: posterTitle,
        subtitle: posterSubtitle,
        sellingPoints,
      },
      provider: imageResult.provider,
      model: imageResult.model,
      cost: imageResult.cost + (copyResult.cost || 0),
    });
  } catch (error) {
    console.error("Poster generation error:", error);
    return NextResponse.json(
      { success: false, error: "海报生成失败，请重试。" },
      { status: 500 }
    );
  }
}
