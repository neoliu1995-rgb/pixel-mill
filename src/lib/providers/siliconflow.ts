import {
  ImageProvider,
  TextProvider,
  ProviderImageResult,
  ProviderGenerateOptions,
  ProviderModelInfo,
  CopywritingInput,
  CopywritingResult,
} from "./base";

const API_BASE = "https://api.siliconflow.cn/v1";
const TEXT_MODEL = "deepseek-ai/DeepSeek-V3";
const INPUT_PRICE_PER_M_TOKENS = 2;
const OUTPUT_PRICE_PER_M_TOKENS = 8;

const MODELS: ProviderModelInfo[] = [
  {
    id: "black-forest-labs/FLUX.2-pro",
    name: "FLUX.2 Pro",
    provider: "siliconflow",
    tier: "pro",
    quality: 5,
    speed: 3,
    costPerImage: 0.03,
    supportsImg2Img: false,
    supportsChinese: false,
    bestFor: ["高质量出图", "专业设计", "细节丰富"],
  },
  {
    id: "black-forest-labs/FLUX.2-flex",
    name: "FLUX.2 Flex",
    provider: "siliconflow",
    tier: "business",
    quality: 4,
    speed: 4,
    costPerImage: 0.06,
    supportsImg2Img: false,
    supportsChinese: false,
    bestFor: ["灵活创作", "商业用途", "高自由度"],
  },
  {
    id: "Tongyi-MAI/Z-Image-Turbo",
    name: "Z-Image Turbo",
    provider: "siliconflow",
    tier: "free",
    quality: 2,
    speed: 5,
    costPerImage: 0.005,
    supportsImg2Img: false,
    supportsChinese: true,
    bestFor: ["快速出图", "概念验证", "中文提示词"],
  },
];

function getApiKey(): string | undefined {
  return process.env.SILICONFLOW_API_KEY;
}

function formatImageSize(width?: number, height?: number): string {
  if (width && height) {
    return `${width}x${height}`;
  }
  return "1024x1024";
}

async function downloadAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`下载图片失败: ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length * 1.5);
}

function calculateTextCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * INPUT_PRICE_PER_M_TOKENS
    + (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_M_TOKENS;
}

async function chatCompletion(
  apiKey: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SiliconFlow 文本请求失败: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("SiliconFlow 文本请求未返回有效内容");
  }

  const inputTokens = data?.usage?.prompt_tokens ?? estimateTokens(messages.map((m) => m.content).join(""));
  const outputTokens = data?.usage?.completion_tokens ?? estimateTokens(content);

  return { content, inputTokens, outputTokens };
}

export class SiliconFlowImageProvider implements ImageProvider {
  name = "siliconflow";
  models = MODELS;

  isAvailable(): boolean {
    return !!getApiKey();
  }

  async generate(options: ProviderGenerateOptions): Promise<ProviderImageResult> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("未配置 SILICONFLOW_API_KEY");
    }

    const model = options.image
      ? "black-forest-labs/FLUX.2-pro"
      : (options.model || MODELS.find(m => m.tier === "free")?.id || MODELS[0].id);
    const image_size = formatImageSize(options.width, options.height);

    const body: Record<string, unknown> = {
      model,
      prompt: options.prompt,
      image_size,
      ...(options.negativePrompt ? { negative_prompt: options.negativePrompt } : {}),
      ...(options.seed !== undefined ? { seed: options.seed } : {}),
      num_inference_steps: 20,
    };

    const startTime = Date.now();

    const res = await fetch(`${API_BASE}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`SiliconFlow 图像生成失败: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const remoteUrl = data?.data?.[0]?.url;
    if (!remoteUrl) {
      throw new Error("SiliconFlow 图像生成未返回图片URL");
    }

    const dataUrl = await downloadAsDataUrl(remoteUrl);
    const latency = Date.now() - startTime;

    const modelInfo = MODELS.find((m) => m.id === model);
    const cost = modelInfo?.costPerImage ?? 0.03;

    return {
      imageUrl: dataUrl,
      provider: "siliconflow",
      model,
      latency,
      cost,
    };
  }
}

export class SiliconFlowTextProvider implements TextProvider {
  name = "siliconflow";

  isAvailable(): boolean {
    return !!getApiKey();
  }

  async translatePrompt(chinesePrompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("未配置 SILICONFLOW_API_KEY");
    }

    const { content } = await chatCompletion(apiKey, [
      {
        role: "system",
        content: "You are a professional prompt translator for AI image generation. Translate the given Chinese text into a detailed, high-quality English prompt optimized for image generation models. Only output the translated English prompt, nothing else.",
      },
      {
        role: "user",
        content: chinesePrompt,
      },
    ]);

    return content.trim();
  }

  async generateCopywriting(input: CopywritingInput): Promise<CopywritingResult> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("未配置 SILICONFLOW_API_KEY");
    }

    const styleMap: Record<string, string> = {
      professional: "专业严谨",
      lively: "活泼生动",
      literary: "文艺优美",
      promotional: "促销导向",
    };
    const platformMap: Record<string, string> = {
      taobao: "淘宝",
      jd: "京东",
      pinduoduo: "拼多多",
      amazon: "Amazon",
      shopify: "Shopify",
      xiaohongshu: "小红书",
      douyin: "抖音",
    };

    const style = input.style ? styleMap[input.style] || input.style : "专业严谨";
    const platform = input.platform ? platformMap[input.platform] || input.platform : "通用";
    const language = input.language === "en" ? "English" : input.language === "ja" ? "日本語" : input.language === "ko" ? "한국어" : "中文";

    const userMessage = [
      `产品名称: ${input.productName}`,
      input.category ? `品类: ${input.category}` : "",
      input.sellingPoints?.length ? `卖点: ${input.sellingPoints.join("、")}` : "",
      input.targetAudience ? `目标人群: ${input.targetAudience}` : "",
      `风格: ${style}`,
      `平台: ${platform}`,
      `输出语言: ${language}`,
    ].filter(Boolean).join("\n");

    const { content, inputTokens, outputTokens } = await chatCompletion(apiKey, [
      {
        role: "system",
        content: `You are an expert e-commerce copywriter. Generate compelling product copy based on the given information. You must respond in valid JSON format with the following fields:
- "title": product title (string)
- "bulletPoints": array of 3-5 selling point strings
- "description": product description paragraph (string)
- "socialCopy": social media copy (string)
- "adSlogan": advertising slogan (string)

Output ONLY the JSON object, no other text.`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ]);

    let parsed: Record<string, unknown>;
    try {
      const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(`SiliconFlow 文案生成返回内容无法解析为JSON: ${content.slice(0, 200)}`);
    }

    const title = typeof parsed.title === "string" ? parsed.title : "";
    const bulletPoints = Array.isArray(parsed.bulletPoints)
      ? parsed.bulletPoints.filter((v): v is string => typeof v === "string")
      : [];
    const description = typeof parsed.description === "string" ? parsed.description : "";
    const socialCopy = typeof parsed.socialCopy === "string" ? parsed.socialCopy : "";
    const adSlogan = typeof parsed.adSlogan === "string" ? parsed.adSlogan : "";

    if (!title && !description) {
      throw new Error("SiliconFlow 文案生成结果缺少有效内容");
    }

    const cost = calculateTextCost(inputTokens, outputTokens);

    return {
      title,
      bulletPoints,
      description,
      socialCopy,
      adSlogan,
      provider: "siliconflow",
      model: TEXT_MODEL,
      cost,
    };
  }
}
