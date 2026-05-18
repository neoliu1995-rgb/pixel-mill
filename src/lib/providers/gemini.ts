import {
  ImageProvider,
  ProviderImageResult,
  ProviderGenerateOptions,
  ProviderModelInfo,
} from "./base";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const MODELS: ProviderModelInfo[] = [
  {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    provider: "gemini",
    tier: "free",
    quality: 4,
    speed: 4,
    costPerImage: 0,
    supportsImg2Img: true,
    supportsChinese: true,
    bestFor: ["免费出图", "图生图", "中文提示词"],
  },
  {
    id: "imagen-4-fast",
    name: "Imagen 4 Fast",
    provider: "gemini",
    tier: "pro",
    quality: 4,
    speed: 5,
    costPerImage: 0.02,
    supportsImg2Img: false,
    supportsChinese: true,
    bestFor: ["高质量出图", "快速生成", "中文提示词"],
  },
];

const MODEL_API_MAP: Record<string, string> = {
  "gemini-2.5-flash-image": "gemini-2.5-flash-preview-image-generation",
  "imagen-4-fast": "imagen-4.0-generate-001",
};

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

function dataUrlToBase64(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("无效的 data URL 格式");
  }
  return { mimeType: match[1], data: match[2] };
}

async function generateWithGemini(
  apiKey: string,
  apiModel: string,
  options: ProviderGenerateOptions,
): Promise<string> {
  const parts: Array<Record<string, unknown>> = [];

  parts.push({ text: options.prompt });

  if (options.image) {
    const { mimeType, data } = dataUrlToBase64(options.image);
    parts.push({ inlineData: { mimeType, data } });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  const url = `${GEMINI_API_BASE}/models/${apiModel}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini 图像生成失败: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const candidates = data?.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("Gemini 图像生成未返回有效结果");
  }

  const responseParts = candidates[0]?.content?.parts;
  if (!responseParts) {
    throw new Error("Gemini 图像生成响应中缺少 parts");
  }

  for (const part of responseParts) {
    if (part.inlineData) {
      const { mimeType, data: base64Data } = part.inlineData;
      return `data:${mimeType};base64,${base64Data}`;
    }
  }

  throw new Error("Gemini 图像生成响应中未包含图片数据");
}

async function generateWithImagen(
  apiKey: string,
  apiModel: string,
  options: ProviderGenerateOptions,
): Promise<string> {
  const body = {
    instances: [{ prompt: options.prompt }],
    parameters: { sampleCount: 1, aspectRatio: "1:1" },
  };

  const url = `${GEMINI_API_BASE}/models/${apiModel}:predict?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Imagen 图像生成失败: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const predictions = data?.predictions;
  if (!predictions || predictions.length === 0) {
    throw new Error("Imagen 图像生成未返回有效结果");
  }

  const prediction = predictions[0];
  if (prediction.bytesBase64Encoded) {
    const mimeType = prediction.mimeType || "image/png";
    return `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;
  }

  throw new Error("Imagen 图像生成响应中未包含图片数据");
}

export class GeminiImageProvider implements ImageProvider {
  name = "gemini";
  models = MODELS;

  isAvailable(): boolean {
    return !!getApiKey();
  }

  async generate(options: ProviderGenerateOptions): Promise<ProviderImageResult> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("未配置 GEMINI_API_KEY");
    }

    const modelId = "gemini-2.5-flash-image";
    const apiModel = MODEL_API_MAP[modelId];
    if (!apiModel) {
      throw new Error(`不支持的 Gemini 模型: ${modelId}`);
    }

    const startTime = Date.now();

    let imageUrl: string;

    if (modelId === "gemini-2.5-flash-image") {
      imageUrl = await generateWithGemini(apiKey, apiModel, options);
    } else {
      imageUrl = await generateWithImagen(apiKey, apiModel, options);
    }

    const latency = Date.now() - startTime;
    const modelInfo = MODELS.find((m) => m.id === modelId);
    const cost = modelInfo?.costPerImage ?? 0;

    return {
      imageUrl,
      provider: "gemini",
      model: modelId,
      latency,
      cost,
    };
  }
}
