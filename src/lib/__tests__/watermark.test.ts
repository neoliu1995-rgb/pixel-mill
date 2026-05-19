import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockComposite,
  mockPng,
  mockJpeg,
  mockWebp,
  mockToBuffer,
  mockSharpInstance,
  mockSharp,
} = vi.hoisted(() => {
  const composite = vi.fn().mockReturnThis();
  const png = vi.fn().mockReturnThis();
  const jpeg = vi.fn().mockReturnThis();
  const webp = vi.fn().mockReturnThis();
  const toBuffer = vi.fn().mockResolvedValue(Buffer.from("watermarked-image-data"));
  const instance = {
    metadata: vi.fn().mockResolvedValue({ width: 1024, height: 1024, format: "png" }),
    composite,
    png,
    jpeg,
    webp,
    toBuffer,
  };
  const sharp = vi.fn().mockReturnValue(instance);
  return {
    mockComposite: composite,
    mockPng: png,
    mockJpeg: jpeg,
    mockWebp: webp,
    mockToBuffer: toBuffer,
    mockSharpInstance: instance,
    mockSharp: sharp,
  };
});

vi.mock("sharp", () => ({
  default: mockSharp,
}));

import { addWatermark } from "@/lib/watermark";

describe("addWatermark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSharp.mockReturnValue(mockSharpInstance);
    mockSharpInstance.metadata.mockResolvedValue({ width: 1024, height: 1024, format: "png" });
    mockComposite.mockReturnThis();
    mockPng.mockReturnThis();
    mockJpeg.mockReturnThis();
    mockWebp.mockReturnThis();
    mockToBuffer.mockResolvedValue(Buffer.from("watermarked-image-data"));
  });

  it("should add watermark to PNG image", async () => {
    const base64 = Buffer.from("fake-png-data").toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;
    const result = await addWatermark(dataUrl);
    expect(result).toContain("data:image/png;base64,");
    expect(mockSharp).toHaveBeenCalled();
    expect(mockComposite).toHaveBeenCalled();
  });

  it("should add watermark to JPEG image", async () => {
    const base64 = Buffer.from("fake-jpeg-data").toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    const result = await addWatermark(dataUrl);
    expect(result).toContain("data:image/jpeg;base64,");
    expect(mockJpeg).toHaveBeenCalledWith({ quality: 90 });
  });

  it("should add watermark to WebP image", async () => {
    const base64 = Buffer.from("fake-webp-data").toString("base64");
    const dataUrl = `data:image/webp;base64,${base64}`;
    const result = await addWatermark(dataUrl);
    expect(result).toContain("data:image/webp;base64,");
    expect(mockWebp).toHaveBeenCalledWith({ quality: 90 });
  });

  it("should return original data URL for invalid format", async () => {
    const invalidInput = "not-a-data-url";
    const result = await addWatermark(invalidInput);
    expect(result).toBe(invalidInput);
  });

  it("should return original data URL for malformed base64", async () => {
    const malformed = "data:image/png;invalid";
    const result = await addWatermark(malformed);
    expect(result).toBe(malformed);
  });

  it("should handle small images", async () => {
    mockSharpInstance.metadata.mockResolvedValue({ width: 100, height: 100, format: "png" });
    const base64 = Buffer.from("fake-small-png").toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;
    const result = await addWatermark(dataUrl);
    expect(result).toContain("data:image/png;base64,");
    expect(mockComposite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          input: expect.any(Buffer),
        }),
      ])
    );
  });

  it("should position watermark at bottom-right", async () => {
    mockSharpInstance.metadata.mockResolvedValue({ width: 1024, height: 1024, format: "png" });
    const base64 = Buffer.from("fake-png-data").toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;
    await addWatermark(dataUrl);
    const compositeCall = mockComposite.mock.calls[0][0][0];
    expect(compositeCall.top).toBeGreaterThan(0);
    expect(compositeCall.left).toBeGreaterThan(0);
  });

  it("should use default dimensions when metadata missing", async () => {
    mockSharpInstance.metadata.mockResolvedValue({ format: "png" });
    const base64 = Buffer.from("fake-png-data").toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;
    const result = await addWatermark(dataUrl);
    expect(result).toContain("data:image/png;base64,");
    expect(mockComposite).toHaveBeenCalled();
  });

  it("should call sharp with image buffer for metadata", async () => {
    const base64 = Buffer.from("fake-png-data").toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;
    await addWatermark(dataUrl);
    expect(mockSharp).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it("should call sharp twice - once for metadata, once for compositing", async () => {
    const base64 = Buffer.from("fake-png-data").toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;
    await addWatermark(dataUrl);
    expect(mockSharp).toHaveBeenCalledTimes(2);
  });
});
