export interface ProviderImageResult {
  imageUrl: string;
  provider: string;
  model: string;
  latency: number;
  cost: number;
}

export interface ProviderGenerateOptions {
  prompt: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
  image?: string;
  seed?: number;
}

export interface ProviderEditOptions {
  imageUrl: string;
  prompt: string;
  width?: number;
  height?: number;
}

export interface ProviderModelInfo {
  id: string;
  name: string;
  provider: string;
  tier: "free" | "pro" | "business";
  quality: number;
  speed: number;
  costPerImage: number;
  supportsImg2Img: boolean;
  supportsChinese: boolean;
  bestFor: string[];
}

export interface ImageProvider {
  name: string;
  models: ProviderModelInfo[];

  generate(options: ProviderGenerateOptions): Promise<ProviderImageResult>;
  isAvailable(): boolean;
}

export interface ImageEditProvider {
  name: string;

  removeBackground(imageUrl: string): Promise<ProviderImageResult>;
  replaceBackground(imageUrl: string, bgColor: string): Promise<ProviderImageResult>;
  upscale(imageUrl: string, scale: 2 | 4): Promise<ProviderImageResult>;
  isAvailable(): boolean;
}

export interface TextProvider {
  name: string;

  translatePrompt(chinesePrompt: string): Promise<string>;
  generateCopywriting(input: CopywritingInput): Promise<CopywritingResult>;
  isAvailable(): boolean;
}

export interface CopywritingInput {
  productName: string;
  category?: string;
  sellingPoints?: string[];
  targetAudience?: string;
  style?: "professional" | "lively" | "literary" | "promotional";
  platform?: "taobao" | "jd" | "pinduoduo" | "amazon" | "shopify" | "xiaohongshu" | "douyin";
  language?: "zh" | "en" | "ja" | "ko";
}

export interface CopywritingResult {
  title: string;
  bulletPoints: string[];
  description: string;
  socialCopy: string;
  adSlogan: string;
  provider: string;
  model: string;
  cost: number;
}
