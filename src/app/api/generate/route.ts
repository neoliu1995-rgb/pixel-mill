import { NextRequest, NextResponse } from "next/server";
import { generateImage, GenerationResult, getAvailableModels } from "@/lib/imageGenerator";
import { addWatermark } from "@/lib/watermark";
import { checkQuota, incrementUsage, getUsage, getQuotaInfo, QUOTA_LIMITS } from "@/lib/quota";

export type ModelType = "flux-schnell" | "flux-dev" | "sdxl" | "turbo" | "realistic" | "anime" | "auto"
  | "black-forest-labs/FLUX.2-pro" | "black-forest-labs/FLUX.2-flex" | "Zhihu-ai/Z-Image-Turbo"
  | "wanx2.6-t2i" | "wanx2.1-t2i-turbo";

export interface GenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
  style?: string;
  model?: string;
  image?: string;
  negativePrompt?: string;
  userTier?: "free" | "pro" | "business";
  color?: string;
  lighting?: string;
  composition?: string;
}

export interface GenerationResponse {
  imageUrl: string;
  prompt: string;
  model: string;
  modelName: string;
  isFree: boolean;
  provider: string;
  qualityScore: number;
  latency: number;
  cost: number;
}

export async function GET(req: NextRequest) {
  const tier = (req.nextUrl.searchParams.get("tier") as "free" | "pro" | "business") || "free";
  const models = getAvailableModels(tier);
  return NextResponse.json({
    models: models.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      type: m.type,
      quality: m.quality,
      speed: m.speed,
      supportsImg2Img: m.supportsImg2Img,
      supportsChinese: m.supportsChinese,
      bestFor: m.bestFor,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();

    const {
      prompt,
      width = 1024,
      height = 1024,
      model = "auto",
      image,
      negativePrompt,
      userTier = "free",
      style,
      color,
      lighting,
      composition,
    }: GenerationRequest = await req.json();

    console.log(`[${new Date().toISOString()}] Generation request:`, {
      promptLength: prompt?.length || 0,
      width, height,
      model,
      hasImage: !!image,
      userTier,
      style: style || "none",
    });

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: "Prompt too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    if (image && typeof image === "string") {
      if (!image.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Invalid image format. Please upload a valid image." },
          { status: 400 }
        );
      }
      if (image.length > 5000000) {
        return NextResponse.json(
          { error: "参考图片太大，请压缩后重试（建议小于2MB）" },
          { status: 400 }
        );
      }
    }

    const userId = "default";
    const dailyUsage = getUsage(userId, "dailyGenerations");
    const monthlyUsage = getUsage(userId, "monthlyGenerations");

    const dailyCheck = checkQuota(userTier, "dailyGenerations", dailyUsage);
    const monthlyCheck = checkQuota(userTier, "monthlyGenerations", monthlyUsage);

    if (!dailyCheck.allowed) {
      const config = QUOTA_LIMITS[userTier] || QUOTA_LIMITS.free;
      return NextResponse.json(
        {
          error: `今日生成次数已达上限（${config.dailyGenerations}次），请明天再试或升级套餐`,
          quotaExceeded: true,
          quotaType: "daily",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(config.dailyGenerations),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": "tomorrow",
          },
        }
      );
    }

    if (!monthlyCheck.allowed) {
      const config = QUOTA_LIMITS[userTier] || QUOTA_LIMITS.free;
      return NextResponse.json(
        {
          error: `本月生成次数已达上限（${config.monthlyGenerations}次），请升级套餐获取更多次数`,
          quotaExceeded: true,
          quotaType: "monthly",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(config.monthlyGenerations),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    if (userTier === "free") {
      console.log("Free tier: queuing...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const result: GenerationResult = await generateImage(
      { prompt, width, height, model, image, negativePrompt, style, color, lighting, composition },
      userTier
    );

    const totalLatency = Date.now() - startTime;

    let finalImageUrl = result.imageUrl;
    if (userTier === "free") {
      try {
        finalImageUrl = await addWatermark(result.imageUrl);
      } catch (wmError) {
        console.error("Watermark error:", wmError);
      }
    }

    console.log(`Generation successful! Provider: ${result.provider}, Model: ${result.model}, Latency: ${totalLatency}ms, Cost: ${result.cost}`);

    incrementUsage(userId, "dailyGenerations");
    incrementUsage(userId, "monthlyGenerations");

    const updatedDailyUsage = getUsage(userId, "dailyGenerations");
    const updatedMonthlyUsage = getUsage(userId, "monthlyGenerations");
    const config = QUOTA_LIMITS[userTier] || QUOTA_LIMITS.free;

    return NextResponse.json<GenerationResponse>({
      imageUrl: finalImageUrl,
      prompt: result.prompt,
      model: model,
      modelName: result.model,
      isFree: result.cost === 0,
      provider: result.provider,
      qualityScore: result.qualityScore,
      latency: totalLatency,
      cost: result.cost,
    }, {
      headers: {
        "X-RateLimit-Limit-Daily": String(config.dailyGenerations),
        "X-RateLimit-Remaining-Daily": String(Math.max(0, config.dailyGenerations - updatedDailyUsage)),
        "X-RateLimit-Limit-Monthly": String(config.monthlyGenerations),
        "X-RateLimit-Remaining-Monthly": String(Math.max(0, config.monthlyGenerations - updatedMonthlyUsage)),
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "生成图片失败，请重试。" },
      { status: 500 }
    );
  }
}
