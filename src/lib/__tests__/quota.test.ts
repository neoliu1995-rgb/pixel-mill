import { describe, it, expect, vi, beforeEach } from "vitest";
import { QUOTA_LIMITS, checkQuota, getUsage, incrementUsage, getQuotaInfo } from "@/lib/quota";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usageRecord: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("QUOTA_LIMITS", () => {
  it("should have free tier limits", () => {
    expect(QUOTA_LIMITS.free).toBeDefined();
    expect(QUOTA_LIMITS.free.dailyGenerations).toBe(10);
    expect(QUOTA_LIMITS.free.monthlyGenerations).toBe(300);
    expect(QUOTA_LIMITS.free.monthlyBgRemoval).toBe(0);
    expect(QUOTA_LIMITS.free.monthlyCopywriting).toBe(3);
  });

  it("should have pro tier limits", () => {
    expect(QUOTA_LIMITS.pro).toBeDefined();
    expect(QUOTA_LIMITS.pro.dailyGenerations).toBe(50);
    expect(QUOTA_LIMITS.pro.monthlyGenerations).toBe(300);
    expect(QUOTA_LIMITS.pro.monthlyBgRemoval).toBe(20);
    expect(QUOTA_LIMITS.pro.monthlyCopywriting).toBe(100);
  });

  it("should have business tier limits", () => {
    expect(QUOTA_LIMITS.business).toBeDefined();
    expect(QUOTA_LIMITS.business.dailyGenerations).toBe(999);
    expect(QUOTA_LIMITS.business.monthlyGenerations).toBe(800);
    expect(QUOTA_LIMITS.business.monthlyBgRemoval).toBe(999);
    expect(QUOTA_LIMITS.business.monthlyCopywriting).toBe(999);
  });

  it("should have increasing daily generation limits across tiers", () => {
    expect(QUOTA_LIMITS.free.dailyGenerations).toBeLessThan(QUOTA_LIMITS.pro.dailyGenerations);
    expect(QUOTA_LIMITS.pro.dailyGenerations).toBeLessThan(QUOTA_LIMITS.business.dailyGenerations);
  });

  it("should have increasing monthly bg removal limits across tiers", () => {
    expect(QUOTA_LIMITS.free.monthlyBgRemoval).toBeLessThan(QUOTA_LIMITS.pro.monthlyBgRemoval);
    expect(QUOTA_LIMITS.pro.monthlyBgRemoval).toBeLessThan(QUOTA_LIMITS.business.monthlyBgRemoval);
  });
});

describe("checkQuota", () => {
  it("should allow when usage is under limit", () => {
    const result = checkQuota("free", "dailyGenerations", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it("should deny when usage is at limit", () => {
    const result = checkQuota("free", "dailyGenerations", 10);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should deny when usage is over limit", () => {
    const result = checkQuota("free", "dailyGenerations", 15);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should fall back to free tier for unknown tier", () => {
    const result = checkQuota("unknown", "dailyGenerations", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it("should fall back to free tier for empty tier", () => {
    const result = checkQuota("", "dailyGenerations", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it("should return allowed with remaining 999 for unknown usage type", () => {
    const result = checkQuota("free", "unknownType", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(999);
  });

  it("should work correctly for pro tier", () => {
    const result = checkQuota("pro", "dailyGenerations", 49);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("should work correctly for business tier", () => {
    const result = checkQuota("business", "monthlyGenerations", 800);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should deny free tier bg removal since limit is 0", () => {
    const result = checkQuota("free", "monthlyBgRemoval", 0);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should allow pro tier copywriting under limit", () => {
    const result = checkQuota("pro", "monthlyCopywriting", 50);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(50);
  });
});

describe("getUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when no record found", async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(null);
    const result = await getUsage("user1", "dailyGenerations");
    expect(result).toBe(0);
  });

  it("should return count from existing record", async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue({
      id: "1",
      userId: "user1",
      usageType: "dailyGenerations",
      periodKey: "2026-05-18",
      count: 42,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await getUsage("user1", "dailyGenerations");
    expect(result).toBe(42);
  });

  it("should call findUnique with correct composite key", async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(null);
    await getUsage("user1", "dailyGenerations");
    const callArg = vi.mocked(prisma.usageRecord.findUnique).mock.calls[0][0] as any;
    expect(callArg.where.userId_usageType_periodKey.userId).toBe("user1");
    expect(callArg.where.userId_usageType_periodKey.usageType).toBe("dailyGenerations");
  });
});

describe("incrementUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create new record with count 1 when no existing record", async () => {
    vi.mocked(prisma.usageRecord.upsert).mockResolvedValue({
      id: "1",
      userId: "user1",
      usageType: "dailyGenerations",
      periodKey: "2026-05-18",
      count: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await incrementUsage("user1", "dailyGenerations");
    expect(result).toBe(1);
    expect(prisma.usageRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ count: 1 }),
      })
    );
  });

  it("should increment existing record count", async () => {
    vi.mocked(prisma.usageRecord.upsert).mockResolvedValue({
      id: "1",
      userId: "user1",
      usageType: "dailyGenerations",
      periodKey: "2026-05-18",
      count: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await incrementUsage("user1", "dailyGenerations");
    expect(result).toBe(6);
    expect(prisma.usageRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { count: { increment: 1 } },
      })
    );
  });

  it("should return the incremented count", async () => {
    vi.mocked(prisma.usageRecord.upsert).mockResolvedValue({
      id: "1",
      userId: "user1",
      usageType: "monthlyGenerations",
      periodKey: "2026-05",
      count: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await incrementUsage("user1", "monthlyGenerations");
    expect(result).toBe(100);
  });
});

describe("getQuotaInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return quota info for free tier", async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(null);
    const result = await getQuotaInfo("user1", "free");
    expect(result.daily.used).toBe(0);
    expect(result.daily.limit).toBe(10);
    expect(result.daily.remaining).toBe(10);
    expect(result.monthly.used).toBe(0);
    expect(result.monthly.limit).toBe(300);
    expect(result.bgRemoval.used).toBe(0);
    expect(result.bgRemoval.limit).toBe(0);
    expect(result.copywriting.used).toBe(0);
    expect(result.copywriting.limit).toBe(3);
  });

  it("should return quota info for pro tier", async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(null);
    const result = await getQuotaInfo("user1", "pro");
    expect(result.daily.limit).toBe(50);
    expect(result.monthly.limit).toBe(300);
    expect(result.bgRemoval.limit).toBe(20);
    expect(result.copywriting.limit).toBe(100);
  });

  it("should fall back to free tier for unknown tier", async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(null);
    const result = await getQuotaInfo("user1", "unknown");
    expect(result.daily.limit).toBe(10);
  });

  it("should calculate remaining correctly with existing usage", async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockImplementation((args: any) => {
      const usageType = args.where.userId_usageType_periodKey.usageType;
      if (usageType === "dailyGenerations") {
        return Promise.resolve({ id: "1", userId: "user1", usageType, periodKey: "2026-05-18", count: 5, createdAt: new Date(), updatedAt: new Date() }) as any;
      }
      if (usageType === "monthlyGenerations") {
        return Promise.resolve({ id: "2", userId: "user1", usageType, periodKey: "2026-05", count: 200, createdAt: new Date(), updatedAt: new Date() }) as any;
      }
      return Promise.resolve(null) as any;
    });
    const result = await getQuotaInfo("user1", "pro");
    expect(result.daily.used).toBe(5);
    expect(result.daily.remaining).toBe(45);
    expect(result.monthly.used).toBe(200);
    expect(result.monthly.remaining).toBe(100);
    expect(result.bgRemoval.used).toBe(0);
    expect(result.bgRemoval.remaining).toBe(20);
  });

  it("should cap remaining at 0 when usage exceeds limit", async () => {
    vi.mocked(prisma.usageRecord.findUnique).mockImplementation((args: any) => {
      const usageType = args.where.userId_usageType_periodKey.usageType;
      if (usageType === "dailyGenerations") {
        return Promise.resolve({ id: "1", userId: "user1", usageType, periodKey: "2026-05-18", count: 999, createdAt: new Date(), updatedAt: new Date() }) as any;
      }
      return Promise.resolve(null) as any;
    });
    const result = await getQuotaInfo("user1", "free");
    expect(result.daily.remaining).toBe(0);
  });
});
