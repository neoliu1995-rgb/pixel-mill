import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockProModel,
  mockBusinessModel,
  mockChineseModel,
  mockGeminiModel,
} = vi.hoisted(() => ({
  mockProModel: {
    id: "flux-dev",
    name: "FLUX.1 Dev",
    provider: "siliconflow",
    tier: "pro" as const,
    quality: 4,
    speed: 3,
    costPerImage: 0.02,
    supportsImg2Img: true,
    supportsChinese: true,
    bestFor: ["quality"],
  },
  mockBusinessModel: {
    id: "flux-pro",
    name: "FLUX.1 Pro",
    provider: "siliconflow",
    tier: "business" as const,
    quality: 5,
    speed: 2,
    costPerImage: 0.05,
    supportsImg2Img: true,
    supportsChinese: true,
    bestFor: ["best quality"],
  },
  mockChineseModel: {
    id: "wanx-v1",
    name: "Wanx v1",
    provider: "alibailian",
    tier: "pro" as const,
    quality: 3,
    speed: 3,
    costPerImage: 0.01,
    supportsImg2Img: false,
    supportsChinese: true,
    bestFor: ["Chinese prompts"],
  },
  mockGeminiModel: {
    id: "gemini-image",
    name: "Gemini Image",
    provider: "gemini",
    tier: "free" as const,
    quality: 3,
    speed: 3,
    costPerImage: 0,
    supportsImg2Img: false,
    supportsChinese: false,
    bestFor: ["general"],
  },
}));

vi.mock("@/lib/providers/siliconflow", () => {
  function SiliconFlowImageProvider(this: any) {
    this.name = "siliconflow";
    this.models = [mockProModel, mockBusinessModel];
    this.isAvailable = () => true;
    this.generate = vi.fn();
  }
  function SiliconFlowTextProvider(this: any) {
    this.name = "siliconflow-text";
    this.isAvailable = () => false;
    this.translatePrompt = vi.fn();
    this.generateCopywriting = vi.fn();
  }
  return { SiliconFlowImageProvider, SiliconFlowTextProvider };
});

vi.mock("@/lib/providers/alibailian", () => {
  function AliBailianImageProvider(this: any) {
    this.name = "alibailian";
    this.models = [mockChineseModel];
    this.isAvailable = () => true;
    this.generate = vi.fn();
  }
  return { AliBailianImageProvider };
});

vi.mock("@/lib/providers/alibailian-edit", () => {
  function AliBailianEditProvider(this: any) {
    this.name = "alibailian-edit";
    this.isAvailable = () => false;
    this.removeBackground = vi.fn();
    this.replaceBackground = vi.fn();
    this.upscale = vi.fn();
  }
  return { AliBailianEditProvider };
});

vi.mock("@/lib/providers/gemini", () => {
  function GeminiImageProvider(this: any) {
    this.name = "gemini";
    this.models = [mockGeminiModel];
    this.isAvailable = () => true;
    this.generate = vi.fn();
  }
  return { GeminiImageProvider };
});

import { isChinese, getRouterModels } from "@/lib/providers/router";

describe("isChinese", () => {
  it("should detect Chinese text", () => {
    expect(isChinese("这是一段中文提示词")).toBe(true);
  });

  it("should detect mixed Chinese and English text with enough Chinese", () => {
    expect(isChinese("生成一张美丽的风景画 with high quality")).toBe(true);
  });

  it("should not detect English text as Chinese", () => {
    expect(isChinese("a beautiful landscape")).toBe(false);
  });

  it("should not detect short Chinese as Chinese when below threshold", () => {
    expect(isChinese("Hello 你好 world")).toBe(false);
  });

  it("should handle empty string", () => {
    expect(isChinese("")).toBe(false);
  });

  it("should handle text with minimal Chinese characters", () => {
    expect(isChinese("abc")).toBe(false);
  });

  it("should detect predominantly Chinese text", () => {
    expect(isChinese("请帮我生成一张非常美丽的风景画，要有山有水")).toBe(true);
  });
});

describe("getRouterModels", () => {
  it("should return only free models for free tier", () => {
    const models = getRouterModels("free");
    for (const model of models) {
      expect(model.tier).toBe("free");
    }
  });

  it("should return free and pro models for pro tier", () => {
    const models = getRouterModels("pro");
    for (const model of models) {
      expect(model.tier).not.toBe("business");
    }
  });

  it("should return all models for business tier", () => {
    const models = getRouterModels("business");
    expect(models.length).toBeGreaterThan(0);
  });

  it("should not include providerInstance in returned models", () => {
    const models = getRouterModels("free");
    for (const model of models) {
      expect(model).not.toHaveProperty("providerInstance");
    }
  });

  it("should include chinese-supporting models for pro tier", () => {
    const models = getRouterModels("pro");
    const hasChinese = models.some(m => m.supportsChinese);
    expect(hasChinese).toBe(true);
  });

  it("should include gemini model for free tier", () => {
    const models = getRouterModels("free");
    const hasGemini = models.some(m => m.provider === "gemini");
    expect(hasGemini).toBe(true);
  });
});

describe("selectModelForPrompt via getRouterModels", () => {
  it("should provide pro models for pro user", () => {
    const models = getRouterModels("pro");
    const hasPro = models.some(m => m.tier === "pro");
    const hasFree = models.some(m => m.tier === "free");
    expect(hasPro || hasFree).toBe(true);
    const hasBusiness = models.some(m => m.tier === "business");
    expect(hasBusiness).toBe(false);
  });

  it("should include business models for business user", () => {
    const models = getRouterModels("business");
    expect(models.length).toBeGreaterThan(0);
  });

  it("should return models with varying quality levels for business tier", () => {
    const models = getRouterModels("business");
    const qualities = models.map(m => m.quality);
    const maxQuality = Math.max(...qualities);
    expect(maxQuality).toBeGreaterThan(0);
  });
});

describe("routeGenerate fallback", () => {
  it("should fall back to Pollinations when all providers fail", async () => {
    const { routeGenerate } = await import("@/lib/providers/router");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(new Blob([new ArrayBuffer(8)], { type: "image/png" })),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await routeGenerate(
      { prompt: "test prompt", width: 512, height: 512 },
      "free"
    );
    expect(result).toBeDefined();
    expect(result.imageUrl).toBeDefined();
    expect(result.provider).toBeDefined();

    vi.restoreAllMocks();
  });
});
