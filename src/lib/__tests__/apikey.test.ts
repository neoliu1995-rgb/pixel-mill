import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { generateApiKey, hashApiKey, verifyApiKey, authenticateApiKey } from "@/lib/apikey";

describe("generateApiKey", () => {
  it("should return key with pm_sk_ prefix", () => {
    const key = generateApiKey();
    expect(key.startsWith("pm_sk_")).toBe(true);
  });

  it("should return key with 48 hex characters after prefix", () => {
    const key = generateApiKey();
    const hexPart = key.slice(6);
    expect(hexPart.length).toBe(48);
    expect(/^[0-9a-f]{48}$/.test(hexPart)).toBe(true);
  });

  it("should generate unique keys", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1).not.toBe(key2);
  });

  it("should have total length of 54 characters", () => {
    const key = generateApiKey();
    expect(key.length).toBe(54);
  });
});

describe("hashApiKey", () => {
  it("should return SHA256 hash as hex string", () => {
    const key = "pm_sk_testkey123";
    const hash = hashApiKey(key);
    const expectedHash = crypto.createHash("sha256").update(key).digest("hex");
    expect(hash).toBe(expectedHash);
  });

  it("should return a 64-character hex string", () => {
    const hash = hashApiKey("any-key");
    expect(hash.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it("should produce consistent hash for same input", () => {
    const key = "pm_sk_consistent";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("should produce different hashes for different inputs", () => {
    expect(hashApiKey("key1")).not.toBe(hashApiKey("key2"));
  });
});

describe("verifyApiKey", () => {
  it("should return true for valid key-hash pair", () => {
    const key = "pm_sk_validkey";
    const hash = hashApiKey(key);
    expect(verifyApiKey(key, hash)).toBe(true);
  });

  it("should return false for invalid key-hash pair", () => {
    const key = "pm_sk_validkey";
    const wrongHash = hashApiKey("pm_sk_wrongkey");
    expect(verifyApiKey(key, wrongHash)).toBe(false);
  });

  it("should return false for empty hash", () => {
    expect(verifyApiKey("pm_sk_key", "")).toBe(false);
  });
});

describe("authenticateApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when no API key header is present", async () => {
    const request = new Request("https://example.com/api/test");
    const result = await authenticateApiKey(request);
    expect(result).toBeNull();
  });

  it("should authenticate via x-api-key header", async () => {
    const apiKey = "pm_sk_testapikey12345678901234567890123456";
    const keyHash = hashApiKey(apiKey);
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "key-1",
      key: keyHash,
      userId: "user-1",
      user: {
        id: "user-1",
        email: "test@example.com",
        subscription: { plan: "pro" },
      },
    } as any);

    const request = new Request("https://example.com/api/test", {
      headers: { "x-api-key": apiKey },
    });
    const result = await authenticateApiKey(request);

    expect(result).toEqual({ userId: "user-1", plan: "pro" });
    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: keyHash },
      })
    );
  });

  it("should authenticate via Authorization Bearer header", async () => {
    const apiKey = "pm_sk_bearertoken123456789012345678901234";
    const keyHash = hashApiKey(apiKey);
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "key-2",
      key: keyHash,
      userId: "user-2",
      user: {
        id: "user-2",
        email: "bearer@example.com",
        subscription: { plan: "free" },
      },
    } as any);

    const request = new Request("https://example.com/api/test", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const result = await authenticateApiKey(request);

    expect(result).toEqual({ userId: "user-2", plan: "free" });
  });

  it("should prefer x-api-key over Authorization header", async () => {
    const xApiKey = "pm_sk_xapikey123456789012345678901234567";
    const keyHash = hashApiKey(xApiKey);
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "key-3",
      key: keyHash,
      userId: "user-3",
      user: {
        id: "user-3",
        email: "xapi@example.com",
        subscription: { plan: "business" },
      },
    } as any);

    const request = new Request("https://example.com/api/test", {
      headers: {
        "x-api-key": xApiKey,
        Authorization: "Bearer pm_sk_otherkey123456789012345678901234",
      },
    });
    const result = await authenticateApiKey(request);

    expect(result).toEqual({ userId: "user-3", plan: "business" });
  });

  it("should return null when API key does not start with pm_", async () => {
    const request = new Request("https://example.com/api/test", {
      headers: { "x-api-key": "invalid_key_format" },
    });
    const result = await authenticateApiKey(request);
    expect(result).toBeNull();
  });

  it("should return null when Bearer token does not start with pm_", async () => {
    const request = new Request("https://example.com/api/test", {
      headers: { Authorization: "Bearer some_other_token" },
    });
    const result = await authenticateApiKey(request);
    expect(result).toBeNull();
  });

  it("should return null when API key is not found in database", async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);
    const request = new Request("https://example.com/api/test", {
      headers: { "x-api-key": "pm_sk_notfound123456789012345678901234" },
    });
    const result = await authenticateApiKey(request);
    expect(result).toBeNull();
  });

  it("should default to free plan when user has no subscription", async () => {
    const apiKey = "pm_sk_nosub123456789012345678901234567890";
    const keyHash = hashApiKey(apiKey);
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "key-4",
      key: keyHash,
      userId: "user-4",
      user: {
        id: "user-4",
        email: "nosub@example.com",
        subscription: null,
      },
    } as any);

    const request = new Request("https://example.com/api/test", {
      headers: { "x-api-key": apiKey },
    });
    const result = await authenticateApiKey(request);

    expect(result).toEqual({ userId: "user-4", plan: "free" });
  });
});
