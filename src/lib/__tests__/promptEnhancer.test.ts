import { describe, it, expect } from "vitest";
import {
  enhancePrompt,
  analyzePromptQuality,
  DEFAULT_NEGATIVE_PROMPT,
} from "@/lib/promptEnhancer";

describe("DEFAULT_NEGATIVE_PROMPT", () => {
  it("should be a non-empty string", () => {
    expect(DEFAULT_NEGATIVE_PROMPT).toBeTruthy();
    expect(typeof DEFAULT_NEGATIVE_PROMPT).toBe("string");
  });

  it("should contain quality-related terms", () => {
    expect(DEFAULT_NEGATIVE_PROMPT).toContain("ugly");
    expect(DEFAULT_NEGATIVE_PROMPT).toContain("blurry");
    expect(DEFAULT_NEGATIVE_PROMPT).toContain("low quality");
  });

  it("should contain artifact-related terms", () => {
    expect(DEFAULT_NEGATIVE_PROMPT).toContain("watermark");
    expect(DEFAULT_NEGATIVE_PROMPT).toContain("text");
    expect(DEFAULT_NEGATIVE_PROMPT).toContain("signature");
  });

  it("should contain anatomy-related terms", () => {
    expect(DEFAULT_NEGATIVE_PROMPT).toContain("bad anatomy");
    expect(DEFAULT_NEGATIVE_PROMPT).toContain("extra fingers");
  });
});

describe("analyzePromptQuality", () => {
  it("should return 0 for empty string", () => {
    const score = analyzePromptQuality("");
    expect(score).toBe(0);
  });

  it("should return low score for short prompt", () => {
    const score = analyzePromptQuality("cat");
    expect(score).toBeLessThan(30);
  });

  it("should return higher score for longer prompt", () => {
    const score = analyzePromptQuality("a beautiful cat sitting on a windowsill with golden light");
    expect(score).toBeGreaterThan(0);
  });

  it("should give bonus for quality keywords", () => {
    const withQuality = analyzePromptQuality("a cat, high quality, masterpiece, sharp focus");
    const withoutQuality = analyzePromptQuality("a cat sitting on a mat");
    expect(withQuality).toBeGreaterThan(withoutQuality);
  });

  it("should give bonus for adjectives", () => {
    const withAdj = analyzePromptQuality("a beautiful stunning gorgeous cat");
    const withoutAdj = analyzePromptQuality("a cat");
    expect(withAdj).toBeGreaterThan(withoutAdj);
  });

  it("should cap score at 100", () => {
    const longPrompt = "high quality, highly detailed, professional, masterpiece, sharp focus, vibrant colors, 8k resolution, ultra realistic, cinematic lighting, professional photography, ultra detailed, intricate details, stunning, gorgeous, beautiful, digital-art, neon-punk, line-art, pixel-art, photographic, film-grain, origami, 3d-model, anime, fantasy-art, low-poly, cinematic, comic-book, isometric, clay-art, a beautiful detailed colorful vibrant elegant stunning gorgeous woman";
    const score = analyzePromptQuality(longPrompt);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should give bonus for length >= 20", () => {
    const short = analyzePromptQuality("cat");
    const medium = analyzePromptQuality("a beautiful cat sitting on a mat");
    expect(medium).toBeGreaterThan(short);
  });

  it("should give bonus for length >= 50", () => {
    const medium = analyzePromptQuality("a beautiful cat sitting on a windowsill with golden light");
    const long = analyzePromptQuality("a beautiful detailed cat sitting on a windowsill with golden light streaming through, creating a warm and cozy atmosphere, professional photography, sharp focus");
    expect(long).toBeGreaterThan(medium);
  });
});

describe("enhancePrompt", () => {
  it("should return trimmed prompt", () => {
    const result = enhancePrompt("  a cat  ");
    expect(result.startsWith("a cat")).toBe(true);
  });

  it("should add style keywords when style is selected", () => {
    const result = enhancePrompt("a cat", "digital-art");
    expect(result).toContain("digital art style");
  });

  it("should not add style keywords when style is none", () => {
    const result = enhancePrompt("a cat", "none");
    expect(result).not.toContain("digital art style");
  });

  it("should add style keywords for neon-punk", () => {
    const result = enhancePrompt("a city", "neon-punk");
    expect(result).toContain("neon punk");
    expect(result).toContain("cyberpunk aesthetic");
  });

  it("should add style keywords for anime", () => {
    const result = enhancePrompt("a girl", "anime");
    expect(result).toContain("anime style");
    expect(result).toContain("Japanese animation");
  });

  it("should add style keywords for photographic", () => {
    const result = enhancePrompt("a landscape", "photographic");
    expect(result).toContain("photorealistic");
    expect(result).toContain("high detailed photography");
  });

  it("should add style keywords for cinematic", () => {
    const result = enhancePrompt("a scene", "cinematic");
    expect(result).toContain("cinematic");
    expect(result).toContain("dramatic lighting");
  });

  it("should add style keywords for pixel-art", () => {
    const result = enhancePrompt("a game", "pixel-art");
    expect(result).toContain("pixel art");
    expect(result).toContain("retro game style");
  });

  it("should add style keywords for 3d-model", () => {
    const result = enhancePrompt("an object", "3d-model");
    expect(result).toContain("3D render");
    expect(result).toContain("realistic 3D model");
  });

  it("should add style keywords for fantasy-art", () => {
    const result = enhancePrompt("a dragon", "fantasy-art");
    expect(result).toContain("fantasy art");
    expect(result).toContain("magical");
  });

  it("should add style keywords for line-art", () => {
    const result = enhancePrompt("a portrait", "line-art");
    expect(result).toContain("line art");
    expect(result).toContain("minimalist drawing");
  });

  it("should add style keywords for origami", () => {
    const result = enhancePrompt("a bird", "origami");
    expect(result).toContain("origami paper art");
  });

  it("should add style keywords for clay-art", () => {
    const result = enhancePrompt("a character", "clay-art");
    expect(result).toContain("clay art");
    expect(result).toContain("plasticine");
  });

  it("should auto-enhance low quality prompts", () => {
    const result = enhancePrompt("cat");
    expect(result.length).toBeGreaterThan("cat".length);
  });

  it("should add quality keywords for short prompts", () => {
    const result = enhancePrompt("cat");
    const qualityKeywords = [
      "high quality", "highly detailed", "professional", "masterpiece",
      "sharp focus", "vibrant colors", "8k resolution", "ultra realistic",
      "cinematic lighting", "professional photography", "ultra detailed",
      "intricate details", "stunning", "gorgeous", "beautiful",
    ];
    const hasQualityKeyword = qualityKeywords.some(kw => result.includes(kw));
    expect(hasQualityKeyword).toBe(true);
  });

  it("should add composition keywords for short prompts", () => {
    const result = enhancePrompt("cat");
    const hasComposition = result.includes("beautiful composition") ||
      result.includes("perfect lighting") ||
      result.includes("artistic composition") ||
      result.includes("golden ratio") ||
      result.includes("rule of thirds") ||
      result.includes("professional composition");
    expect(hasComposition).toBe(true);
  });

  it("should add background keywords when prompt mentions background", () => {
    const result = enhancePrompt("cat with background");
    const hasBackground = result.includes("clean background") ||
      result.includes("simple background") ||
      result.includes("professional background");
    expect(hasBackground).toBe(true);
  });

  it("should add background keywords when prompt contains Chinese background term", () => {
    const result = enhancePrompt("一只猫，白色背景");
    const hasBackground = result.includes("clean background") ||
      result.includes("simple background") ||
      result.includes("professional background");
    expect(hasBackground).toBe(true);
  });

  it("should add default description for prompts without clear subject", () => {
    const result = enhancePrompt("abstract concept");
    const hasSubjectEnhancement = result.includes("beautiful") ||
      result.includes("artwork") ||
      result.includes("high quality") ||
      result.includes("ultra detailed") ||
      result.includes("sharp focus") ||
      result.includes("professional");
    expect(hasSubjectEnhancement).toBe(true);
  });

  it("should not add default description for prompts with art keyword", () => {
    const longArtPrompt = "high quality, highly detailed, professional, masterpiece, sharp focus, vibrant colors, 8k resolution, ultra realistic, cinematic lighting, professional photography, ultra detailed, intricate details, stunning, gorgeous, beautiful art painting";
    const result = enhancePrompt(longArtPrompt);
    expect(result).not.toMatch(/beautiful artwork, high quality.*beautiful artwork/);
  });

  it("should remove duplicate keywords", () => {
    const result = enhancePrompt("high quality, high quality, a cat, a cat");
    const parts = result.split(/\s*,\s*/);
    const uniqueParts = new Set(parts);
    expect(parts.length).toBe(uniqueParts.size);
  });

  it("should not modify high quality prompts excessively", () => {
    const highQuality = "a beautiful cat, high quality, highly detailed, professional, masterpiece, sharp focus, vibrant colors, 8k resolution, ultra realistic, cinematic lighting, professional photography, ultra detailed, intricate details, stunning, gorgeous, beautiful composition";
    const result = enhancePrompt(highQuality);
    expect(result).toContain("a beautiful cat");
  });

  it("should handle unknown style gracefully", () => {
    const result = enhancePrompt("a cat", "unknown-style-xyz");
    expect(result).toContain("a cat");
  });

  it("should handle empty prompt", () => {
    const result = enhancePrompt("");
    expect(result).toBeTruthy();
  });

  it("should handle prompt with only whitespace", () => {
    const result = enhancePrompt("   ");
    expect(result).toBeTruthy();
  });
});
