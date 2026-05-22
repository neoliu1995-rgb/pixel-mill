import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSend = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function (this: any) {
    this.send = mockSend;
  }),
  PutObjectCommand: vi.fn(function (this: any, args: any) {
    Object.assign(this, args);
  }),
  DeleteObjectCommand: vi.fn(function (this: any, args: any) {
    Object.assign(this, args);
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { uploadImage, deleteImage, getPublicUrl } from "@/lib/storage";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/lib/logger";

describe("uploadImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;
  });

  it("should return original data when R2 is not configured", async () => {
    const base64Data = "data:image/png;base64,iVBORw0KGgo=";
    const result = await uploadImage(base64Data);
    expect(result).toBe(base64Data);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should call S3 PutObjectCommand when R2 is configured", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    const base64Data = "data:image/png;base64,iVBORw0KGgo=";
    const result = await uploadImage(base64Data, "user-1");

    expect(mockSend).toHaveBeenCalled();
    expect(result).toContain("https://cdn.example.com/");
    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "test-bucket",
        ContentType: "image/png",
      })
    );
  });

  it("should handle plain base64 data without data URI prefix", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    const plainBase64 = "iVBORw0KGgo=";
    const result = await uploadImage(plainBase64);

    expect(mockSend).toHaveBeenCalled();
    expect(result).toContain("https://cdn.example.com/");
    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        ContentType: "image/png",
      })
    );
  });

  it("should use correct extension for JPEG images", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    const jpegData = "data:image/jpeg;base64,/9j/4AAQ=";
    await uploadImage(jpegData, "user-1");

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        ContentType: "image/jpeg",
      })
    );
    const callArgs = (PutObjectCommand as any).mock.calls[0][0];
    expect(callArgs.Key).toMatch(/\.jpg$/);
  });

  it("should use correct extension for WebP images", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    const webpData = "data:image/webp;base64,UklGRiQ=";
    await uploadImage(webpData, "user-1");

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        ContentType: "image/webp",
      })
    );
    const callArgs = (PutObjectCommand as any).mock.calls[0][0];
    expect(callArgs.Key).toMatch(/\.webp$/);
  });

  it("should use custom key when provided", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    const base64Data = "data:image/png;base64,iVBORw0KGgo=";
    const customKey = "custom/path/image.png";
    const result = await uploadImage(base64Data, "user-1", customKey);

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Key: customKey,
      })
    );
    expect(result).toContain("https://cdn.example.com/custom/path/image.png");
  });

  it("should return original data on upload failure", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    mockSend.mockRejectedValue(new Error("Upload failed"));

    const base64Data = "data:image/png;base64,iVBORw0KGgo=";
    const result = await uploadImage(base64Data);

    expect(result).toBe(base64Data);
    expect(logger.error).toHaveBeenCalledWith(
      "R2 upload failed:",
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it("should generate paths in pixelmill/{userId}/{date}/{uuid}.{ext} format", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    const base64Data = "data:image/png;base64,iVBORw0KGgo=";
    await uploadImage(base64Data, "user-1");

    const callArgs = (PutObjectCommand as any).mock.calls[0][0];
    expect(callArgs.Key).toMatch(/^pixelmill\/user-1\/\d{4}\/\d{2}\/\d{2}\/[\w-]+\.png$/);
  });

  it("should use anonymous when userId is not provided", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    const base64Data = "data:image/png;base64,iVBORw0KGgo=";
    await uploadImage(base64Data);

    const callArgs = (PutObjectCommand as any).mock.calls[0][0];
    expect(callArgs.Key).toMatch(/^pixelmill\/anonymous\//);
  });
});

describe("deleteImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;
  });

  it("should handle missing config gracefully", async () => {
    await expect(deleteImage("some-key")).resolves.toBeUndefined();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("should call S3 DeleteObjectCommand when R2 is configured", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";

    await deleteImage("pixelmill/user-1/2026/05/20/test.png");

    expect(mockSend).toHaveBeenCalled();
    expect(DeleteObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "test-bucket",
        Key: "pixelmill/user-1/2026/05/20/test.png",
      })
    );
  });

  it("should handle delete failure gracefully", async () => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";

    mockSend.mockRejectedValue(new Error("Delete failed"));

    await expect(deleteImage("some-key")).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      "R2 delete failed:",
      expect.objectContaining({ error: expect.any(Error) })
    );
  });
});

describe("getPublicUrl", () => {
  afterEach(() => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;
  });

  it("should use R2_PUBLIC_URL when configured", () => {
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    const url = getPublicUrl("pixelmill/user-1/test.png");
    expect(url).toBe("https://cdn.example.com/pixelmill/user-1/test.png");
  });

  it("should strip trailing slash from R2_PUBLIC_URL", () => {
    process.env.R2_PUBLIC_URL = "https://cdn.example.com/";

    const url = getPublicUrl("pixelmill/user-1/test.png");
    expect(url).toBe("https://cdn.example.com/pixelmill/user-1/test.png");
  });

  it("should construct URL from bucket and account when R2_PUBLIC_URL is not set", () => {
    process.env.R2_ACCOUNT_ID = "myaccount";
    process.env.R2_BUCKET_NAME = "mybucket";

    const url = getPublicUrl("test/key.png");
    expect(url).toBe("https://mybucket.myaccount.r2.cloudflarestorage.com/test/key.png");
  });
});
