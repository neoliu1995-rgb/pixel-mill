import {
  ImageProvider,
  ImageEditProvider,
  TextProvider,
  ProviderImageResult,
  ProviderGenerateOptions,
  ProviderModelInfo,
} from "./base";
import { SiliconFlowImageProvider, SiliconFlowTextProvider } from "./siliconflow";
import { AliBailianImageProvider } from "./alibailian";
import { AliBailianEditProvider } from "./alibailian-edit";
import { GeminiImageProvider } from "./gemini";

type UserTier = "free" | "pro" | "business";

interface RouterModel extends ProviderModelInfo {
  providerInstance: ImageProvider;
}

class PollinationsProvider implements ImageProvider {
  name = "pollinations";
  models: ProviderModelInfo[] = [
    {
      id: "flux-schnell",
      name: "FLUX.1 Schnell",
      provider: "pollinations",
      tier: "free",
      quality: 2,
      speed: 4,
      costPerImage: 0,
      supportsImg2Img: true,
      supportsChinese: false,
      bestFor: ["快速出图", "概念验证"],
    },
  ];

  isAvailable(): boolean {
    return true;
  }

  async generate(options: ProviderGenerateOptions): Promise<ProviderImageResult> {
    const { prompt, width = 1024, height = 1024, negativePrompt } = options;
    const encodedPrompt = encodeURIComponent(prompt);
    const negativeParam = negativePrompt ? `&negative=${encodeURIComponent(negativePrompt)}` : "";
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&model=flux-schnell${negativeParam}`;

    const startTime = Date.now();
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Pollinations 请求失败: ${response.status}`);
    }
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = blob.type || "image/png";
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const latency = Date.now() - startTime;

    return {
      imageUrl: dataUrl,
      provider: "pollinations",
      model: "flux-schnell",
      latency,
      cost: 0,
    };
  }
}

function isChinese(text: string): boolean {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
  return (chineseChars?.length ?? 0) > text.length * 0.2;
}

const imageProviders: ImageProvider[] = [
  new GeminiImageProvider(),
  new AliBailianImageProvider(),
  new SiliconFlowImageProvider(),
  new PollinationsProvider(),
];

const editProviders: ImageEditProvider[] = [
  new AliBailianEditProvider(),
];

const textProviders: TextProvider[] = [
  new SiliconFlowTextProvider(),
];

function getAvailableImageProviders(tier: UserTier): RouterModel[] {
  const result: RouterModel[] = [];
  for (const provider of imageProviders) {
    if (!provider.isAvailable()) continue;
    for (const model of provider.models) {
      if (tier === "free" && model.tier !== "free") continue;
      if (tier === "pro" && model.tier === "business") continue;
      result.push({ ...model, providerInstance: provider });
    }
  }
  return result;
}

function selectModelForPrompt(
  prompt: string,
  tier: UserTier,
  preferredModel?: string
): RouterModel | null {
  const available = getAvailableImageProviders(tier);
  if (available.length === 0) return null;

  if (preferredModel) {
    const found = available.find((m) => m.id === preferredModel);
    if (found) return found;
  }

  const hasChinese = isChinese(prompt);

  const chineseModels = available.filter((m) => m.supportsChinese);
  const englishModels = available.filter((m) => !m.supportsChinese || m.quality >= 4);

  if (hasChinese && chineseModels.length > 0) {
    chineseModels.sort((a, b) => b.quality - a.quality);
    return chineseModels[0];
  }

  englishModels.sort((a, b) => b.quality - a.quality);
  return englishModels[0] || available[0];
}

export async function routeGenerate(
  options: ProviderGenerateOptions,
  tier: UserTier = "free",
  preferredModel?: string
): Promise<ProviderImageResult> {
  const selected = selectModelForPrompt(options.prompt, tier, preferredModel);
  if (!selected) {
    const pollinations = new PollinationsProvider();
    return pollinations.generate(options);
  }

  try {
    const result = await selected.providerInstance.generate({
      ...options,
      ...(selected.id !== options.prompt ? { prompt: options.prompt } : {}),
      model: selected.id,
    });
    result.model = selected.id;
    return result;
  } catch (error) {
    console.error(`Provider ${selected.provider} failed:`, error);

    const fallbacks = getAvailableImageProviders(tier).filter(
      (m) => m.id !== selected.id
    );
    for (const fallback of fallbacks) {
      try {
        const result = await fallback.providerInstance.generate({
          ...options,
          model: fallback.id,
        });
        result.model = fallback.id;
        return result;
      } catch (e) {
        console.error(`Fallback ${fallback.provider} also failed:`, e);
      }
    }

    const pollinations = new PollinationsProvider();
    return pollinations.generate(options);
  }
}

export async function routeTranslate(chinesePrompt: string): Promise<string> {
  for (const provider of textProviders) {
    if (!provider.isAvailable()) continue;
    try {
      return await provider.translatePrompt(chinesePrompt);
    } catch (e) {
      console.error(`Translation provider ${provider.name} failed:`, e);
    }
  }
  return chinesePrompt;
}

export async function routeCopywriting(
  input: Parameters<TextProvider["generateCopywriting"]>[0]
) {
  for (const provider of textProviders) {
    if (!provider.isAvailable()) continue;
    try {
      return await provider.generateCopywriting(input);
    } catch (e) {
      console.error(`Copywriting provider ${provider.name} failed:`, e);
    }
  }
  throw new Error("所有文案生成提供商均不可用");
}

export async function routeRemoveBackground(imageUrl: string): Promise<ProviderImageResult> {
  for (const provider of editProviders) {
    if (!provider.isAvailable()) continue;
    try {
      return await provider.removeBackground(imageUrl);
    } catch (e) {
      console.error(`Edit provider ${provider.name} failed:`, e);
    }
  }
  throw new Error("所有抠图提供商均不可用");
}

export async function routeReplaceBackground(
  imageUrl: string,
  bgColor: string
): Promise<ProviderImageResult> {
  for (const provider of editProviders) {
    if (!provider.isAvailable()) continue;
    try {
      return await provider.replaceBackground(imageUrl, bgColor);
    } catch (e) {
      console.error(`Edit provider ${provider.name} failed:`, e);
    }
  }
  throw new Error("所有换背景提供商均不可用");
}

export async function routeUpscale(
  imageUrl: string,
  scale: 2 | 4 = 2
): Promise<ProviderImageResult> {
  for (const provider of editProviders) {
    if (!provider.isAvailable()) continue;
    try {
      return await provider.upscale(imageUrl, scale);
    } catch (e) {
      console.error(`Upscale provider ${provider.name} failed:`, e);
    }
  }
  throw new Error("所有超分提供商均不可用");
}

export function getRouterModels(tier: UserTier): ProviderModelInfo[] {
  return getAvailableImageProviders(tier).map(({ providerInstance, ...info }) => info);
}

export { isChinese };
export type { UserTier };
