import { describe, it, expect } from "vitest";
import { cn, buildPollinationsUrl } from "@/lib/utils";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should return empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("buildPollinationsUrl", () => {
  it("should build URL with default parameters", () => {
    const url = buildPollinationsUrl("a cat");
    expect(url).toContain("https://image.pollinations.ai/prompt/");
    expect(url).toContain("width=1024");
    expect(url).toContain("height=1024");
    expect(url).toContain("model=flux");
    expect(url).toContain("nologo=true");
  });

  it("should build URL with custom parameters", () => {
    const url = buildPollinationsUrl("a dog", 512, 512, "turbo");
    expect(url).toContain("width=512");
    expect(url).toContain("height=512");
    expect(url).toContain("model=turbo");
  });

  it("should enhance prompt with quality suffix", () => {
    const url = buildPollinationsUrl("a cat");
    const decoded = decodeURIComponent(url.split("/prompt/")[1].split("?")[0]);
    expect(decoded).toContain("high quality");
  });
});
