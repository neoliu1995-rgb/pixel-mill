import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rateLimitEntry: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ id: "1", key: "test", count: 1, resetAt: new Date() }),
      update: vi.fn().mockResolvedValue({ id: "1", key: "test", count: 2, resetAt: new Date() }),
    },
  },
}));

import { dbRateLimitCheck } from "@/lib/payment-security";

describe("dbRateLimitCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow first request when no entry exists", async () => {
    const result = await dbRateLimitCheck("test:ip1", 10, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should allow request under limit", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.rateLimitEntry.findUnique).mockResolvedValue({
      id: "1",
      key: "test:ip2",
      count: 5,
      resetAt: new Date(Date.now() + 30_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await dbRateLimitCheck("test:ip2", 10, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should deny request at limit", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.rateLimitEntry.findUnique).mockResolvedValue({
      id: "1",
      key: "test:ip3",
      count: 10,
      resetAt: new Date(Date.now() + 30_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await dbRateLimitCheck("test:ip3", 10, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should reset when entry is expired", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.rateLimitEntry.findUnique).mockResolvedValue({
      id: "1",
      key: "test:ip4",
      count: 10,
      resetAt: new Date(Date.now() - 1_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await dbRateLimitCheck("test:ip4", 10, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should allow request on database error (fail open)", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.rateLimitEntry.deleteMany).mockRejectedValue(new Error("DB error"));

    const result = await dbRateLimitCheck("test:ip5", 10, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("should respect custom limit parameter", async () => {
    const result = await dbRateLimitCheck("test:ip6", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
