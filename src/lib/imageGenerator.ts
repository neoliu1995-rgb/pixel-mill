import {
  routeGenerate,
  routeTranslate,
  isChinese,
  getRouterModels,
  UserTier,
} from "./providers/router";
import { ProviderModelInfo } from "./providers/base";

export interface GenerationResult {
  imageUrl: string;
  provider: string;
  model: string;
  prompt: string;
  latency: number;
  qualityScore: number;
  cost: number;
}

export interface GenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  image?: string;
  model?: string;
  negativePrompt?: string;
  style?: string;
  color?: string;
  lighting?: string;
  composition?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  type: "free" | "pro" | "business";
  quality: number;
  speed: number;
  cost: number;
  supportsImg2Img: boolean;
  reliability: number;
  bestFor: string[];
  supportsChinese: boolean;
}

const styleMap: Record<string, string> = {
  realistic: "photorealistic, realistic lighting, high detail",
  anime: "anime style, vibrant colors, clean lineart",
  photographic: "professional photograph, DSLR quality, sharp focus",
  digital_art: "digital art, trending on artstation, concept design",
  oil_painting: "oil painting style, brush strokes visible, artistic",
  watercolor: "watercolor painting style, soft edges, artistic",
  cyberpunk: "cyberpunk aesthetic, neon lights, futuristic",
  fantasy: "fantasy art style, magical, epic",
  cinematic: "cinematic lighting, movie still, film grain",
  vintage: "vintage style, retro aesthetic, nostalgic",
};

const colorMap: Record<string, string> = {
  vibrant: "vibrant colors, saturated, bold",
  muted: "muted colors, subtle tones, desaturated",
  monochrome: "monochrome, black and white",
  warm: "warm color palette, golden tones",
  cool: "cool color palette, blue tones",
  pastel: "pastel colors, soft hues",
  neon: "neon colors, glowing, bright",
};

const lightingMap: Record<string, string> = {
  natural: "natural lighting, soft shadows, golden hour",
  studio: "studio lighting, professional, clean",
  dramatic: "dramatic lighting, high contrast, cinematic",
  sunset: "sunset lighting, warm tones, golden",
  night: "night scene, dramatic shadows, moonlight",
  neon: "neon lighting, glowing, cyberpunk",
  backlit: "backlit, rim light, silhouette",
  soft: "soft diffused light, gentle shadows",
};

const compositionMap: Record<string, string> = {
  centered: "centered composition, symmetrical",
  rule_of_thirds: "rule of thirds composition",
  leading_lines: "leading lines composition",
  negative_space: "negative space, minimalist composition",
  symmetrical: "symmetrical composition, balanced",
  dynamic: "dynamic composition, diagonal lines",
};

function buildEnhancedPrompt(
  originalPrompt: string,
  options: { style?: string; color?: string; lighting?: string; composition?: string }
): string {
  const additions: string[] = [];

  if (options.style && options.style !== "none" && styleMap[options.style]) {
    additions.push(styleMap[options.style]);
  }
  if (options.color && options.color !== "none" && colorMap[options.color]) {
    additions.push(colorMap[options.color]);
  }
  if (options.lighting && options.lighting !== "none" && lightingMap[options.lighting]) {
    additions.push(lightingMap[options.lighting]);
  }
  if (options.composition && options.composition !== "none" && compositionMap[options.composition]) {
    additions.push(compositionMap[options.composition]);
  }

  additions.push("high quality, sharp focus, detailed, professional");

  return additions.length > 0 ? `${originalPrompt}, ${additions.join(", ")}` : originalPrompt;
}

export const generateImage = async (
  options: GenerationOptions,
  userTier: UserTier = "free"
): Promise<GenerationResult> => {
  const startTime = Date.now();
  let finalPrompt = options.prompt;

  if (isChinese(finalPrompt)) {
    try {
      finalPrompt = await routeTranslate(finalPrompt);
      console.log("Translated prompt:", finalPrompt);
    } catch (e) {
      console.error("Translation failed, using original prompt:", e);
    }
  }

  finalPrompt = buildEnhancedPrompt(finalPrompt, {
    style: options.style,
    color: options.color,
    lighting: options.lighting,
    composition: options.composition,
  });

  const result = await routeGenerate(
    {
      prompt: finalPrompt,
      width: options.width,
      height: options.height,
      image: options.image,
      negativePrompt: options.negativePrompt,
    },
    userTier,
    options.model
  );

  const latency = Date.now() - startTime;

  return {
    imageUrl: result.imageUrl,
    provider: result.provider,
    model: result.model,
    prompt: options.prompt,
    latency,
    qualityScore: result.cost > 0 ? 85 + Math.min(result.cost * 100, 15) : 60,
    cost: result.cost,
  };
};

export const getAvailableModels = (tier: UserTier = "free"): ModelInfo[] => {
  const routerModels = getRouterModels(tier);
  return routerModels.map((m: ProviderModelInfo) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    type: m.tier,
    quality: m.quality * 20,
    speed: m.speed * 20,
    cost: m.costPerImage,
    supportsImg2Img: m.supportsImg2Img,
    reliability: m.supportsChinese ? 90 : 85,
    bestFor: m.bestFor,
    supportsChinese: m.supportsChinese,
  }));
};

export const getRecommendedModel = (
  prompt?: string,
  hasImage?: boolean,
  tier: UserTier = "free"
): ModelInfo => {
  const models = getAvailableModels(tier);
  if (models.length === 0) {
    return {
      id: "flux-schnell",
      name: "FLUX.1 Schnell (Fallback)",
      provider: "pollinations",
      type: "free",
      quality: 60,
      speed: 95,
      cost: 0,
      supportsImg2Img: true,
      reliability: 85,
      bestFor: ["general"],
      supportsChinese: false,
    };
  }

  if (prompt && isChinese(prompt)) {
    const chineseModels = models.filter((m) => m.supportsChinese);
    if (chineseModels.length > 0) {
      return chineseModels.sort((a, b) => b.quality - a.quality)[0];
    }
  }

  return models.sort((a, b) => b.quality - a.quality)[0];
};
