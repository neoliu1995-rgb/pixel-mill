import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rateLimitEntry: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ id: "1", key: "test", count: 1, resetAt: new Date() }),
      update: vi.fn().mockResolvedValue({ id: "1", key: "test", count: 2, resetAt: new Date() }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  PLANS: {
    free: { monthlyPrice: 0, yearlyPrice: 0 },
    pro: { monthlyPrice: 7.9, yearlyPrice: 59.9 },
    business: { monthlyPrice: 14.99, yearlyPrice: 119.99 },
  },
  CNY_PLANS: {
    free: { monthlyPrice: 0, yearlyPrice: 0 },
    pro: { monthlyPrice: 49.9, yearlyPrice: 399 },
    business: { monthlyPrice: 99.9, yearlyPrice: 799 },
  },
}));

vi.mock("@/lib/alipay", () => ({
  ALIPAY_PLANS: {
    pro: { monthly: 49.9, yearly: 399 },
    business: { monthly: 99.9, yearly: 799 },
  },
}));

vi.mock("@/lib/wechat-pay", () => ({
  WECHAT_PLANS: {
    pro: { monthly: 49.9, yearly: 399 },
    business: { monthly: 99.9, yearly: 799 },
  },
}));

import { rateLimiter, validatePaymentAmount, sanitizeCheckoutInput } from "@/lib/payment-security";
import { prisma } from "@/lib/prisma";

describe("rateLimiter.check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.rateLimitEntry.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.rateLimitEntry.upsert).mockResolvedValue({ id: "1", key: "test", count: 1, resetAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
    vi.mocked(prisma.rateLimitEntry.update).mockResolvedValue({ id: "1", key: "test", count: 2, resetAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
  });

  it("should allow first request when no entry exists", async () => {
    const result = await rateLimiter.check("192.168.1.1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should allow requests under limit", async () => {
    vi.mocked(prisma.rateLimitEntry.findUnique).mockResolvedValue({
      id: "1",
      key: "rl:192.168.1.2:60",
      count: 9,
      resetAt: new Date(Date.now() + 30_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.rateLimitEntry.update).mockResolvedValue({
      id: "1",
      key: "rl:192.168.1.2:60",
      count: 10,
      resetAt: new Date(Date.now() + 30_000),
    } as any);

    const result = await rateLimiter.check("192.168.1.2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should deny request at limit", async () => {
    vi.mocked(prisma.rateLimitEntry.findUnique).mockResolvedValue({
      id: "1",
      key: "rl:192.168.1.3:60",
      count: 10,
      resetAt: new Date(Date.now() + 30_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await rateLimiter.check("192.168.1.3");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should deny requests over limit", async () => {
    vi.mocked(prisma.rateLimitEntry.findUnique).mockResolvedValue({
      id: "1",
      key: "rl:192.168.1.4:60",
      count: 15,
      resetAt: new Date(Date.now() + 30_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await rateLimiter.check("192.168.1.4");
    expect(result.allowed).toBe(false);
  });

  it("should reset after window expires", async () => {
    vi.mocked(prisma.rateLimitEntry.findUnique).mockResolvedValue({
      id: "1",
      key: "rl:192.168.1.5:60",
      count: 10,
      resetAt: new Date(Date.now() - 1_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await rateLimiter.check("192.168.1.5");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should track different IPs independently", async () => {
    vi.mocked(prisma.rateLimitEntry.findUnique)
      .mockResolvedValueOnce({
        id: "1",
        key: "rl:10.0.0.1:60",
        count: 2,
        resetAt: new Date(Date.now() + 30_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.rateLimitEntry.update).mockResolvedValue({
      id: "1",
      key: "rl:10.0.0.1:60",
      count: 3,
      resetAt: new Date(Date.now() + 30_000),
    } as any);

    const result1 = await rateLimiter.check("10.0.0.1");
    expect(result1.remaining).toBe(7);

    const result2 = await rateLimiter.check("10.0.0.2");
    expect(result2.remaining).toBe(9);
  });

  it("should respect custom limit", async () => {
    const result = await rateLimiter.check("172.16.0.1", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should return resetAt timestamp", async () => {
    const result = await rateLimiter.check("192.168.1.10");
    expect(result.resetAt).toBeGreaterThan(0);
  });

  it("should fail open on database error", async () => {
    vi.mocked(prisma.rateLimitEntry.findUnique).mockRejectedValue(new Error("DB error"));

    const result = await rateLimiter.check("192.168.1.99");
    expect(result.allowed).toBe(true);
  });
});

describe("validatePaymentAmount", () => {
  it("should return USD monthly price for pro plan", () => {
    const amount = validatePaymentAmount("pro", "monthly", "usd");
    expect(amount).toBe(7.9);
  });

  it("should return USD yearly price for pro plan", () => {
    const amount = validatePaymentAmount("pro", "yearly", "usd");
    expect(amount).toBe(59.9);
  });

  it("should return USD monthly price for business plan", () => {
    const amount = validatePaymentAmount("business", "monthly", "usd");
    expect(amount).toBe(14.99);
  });

  it("should return USD yearly price for business plan", () => {
    const amount = validatePaymentAmount("business", "yearly", "usd");
    expect(amount).toBe(119.99);
  });

  it("should return CNY monthly price for pro plan", () => {
    const amount = validatePaymentAmount("pro", "monthly", "cny");
    expect(amount).toBe(49.9);
  });

  it("should return CNY yearly price for pro plan", () => {
    const amount = validatePaymentAmount("pro", "yearly", "cny");
    expect(amount).toBe(399);
  });

  it("should return CNY monthly price for business plan", () => {
    const amount = validatePaymentAmount("business", "monthly", "cny");
    expect(amount).toBe(99.9);
  });

  it("should return CNY yearly price for business plan", () => {
    const amount = validatePaymentAmount("business", "yearly", "cny");
    expect(amount).toBe(799);
  });

  it("should throw for invalid plan", () => {
    expect(() => validatePaymentAmount("free", "monthly", "usd")).toThrow("Invalid plan: free");
  });

  it("should throw for unknown plan", () => {
    expect(() => validatePaymentAmount("enterprise", "monthly", "usd")).toThrow("Invalid plan: enterprise");
  });

  it("should throw for invalid billing period", () => {
    expect(() => validatePaymentAmount("pro", "weekly", "usd")).toThrow("Invalid billing period: weekly");
  });

  it("should throw for invalid currency", () => {
    expect(() => validatePaymentAmount("pro", "monthly", "eur")).toThrow("Invalid currency: eur");
  });

  it("should throw for empty plan", () => {
    expect(() => validatePaymentAmount("", "monthly", "usd")).toThrow("Invalid plan:");
  });
});

describe("sanitizeCheckoutInput", () => {
  it("should sanitize valid pro monthly USD input", () => {
    const result = sanitizeCheckoutInput({ plan: "pro", billingPeriod: "monthly", currency: "usd" });
    expect(result).toEqual({ plan: "pro", billingPeriod: "monthly", currency: "usd" });
  });

  it("should sanitize valid business yearly CNY input", () => {
    const result = sanitizeCheckoutInput({ plan: "business", billingPeriod: "yearly", currency: "cny" });
    expect(result).toEqual({ plan: "business", billingPeriod: "yearly", currency: "cny" });
  });

  it("should throw for invalid plan", () => {
    expect(() => sanitizeCheckoutInput({ plan: "free", billingPeriod: "monthly", currency: "usd" })).toThrow("Invalid plan: free");
  });

  it("should throw for non-string plan", () => {
    expect(() => sanitizeCheckoutInput({ plan: 123, billingPeriod: "monthly", currency: "usd" })).toThrow("Invalid plan:");
  });

  it("should throw for missing plan", () => {
    expect(() => sanitizeCheckoutInput({ billingPeriod: "monthly", currency: "usd" })).toThrow("Invalid plan:");
  });

  it("should throw for invalid billing period", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "weekly", currency: "usd" })).toThrow("Invalid billing period: weekly");
  });

  it("should throw for non-string billing period", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: 123, currency: "usd" })).toThrow("Invalid billing period:");
  });

  it("should throw for invalid currency", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "monthly", currency: "eur" })).toThrow("Invalid currency: eur");
  });

  it("should throw for non-string currency", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "monthly", currency: 100 })).toThrow("Invalid currency:");
  });

  it("should throw for missing currency", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "monthly" })).toThrow("Invalid currency:");
  });
});
