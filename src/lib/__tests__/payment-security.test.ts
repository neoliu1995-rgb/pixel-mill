import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimiter, validatePaymentAmount, sanitizeCheckoutInput } from "@/lib/payment-security";

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

describe("rateLimiter.check", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T12:00:00Z"));
  });

  it("should allow first request", () => {
    const result = rateLimiter.check("192.168.1.1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should allow requests under limit", () => {
    for (let i = 0; i < 9; i++) {
      rateLimiter.check("192.168.1.2");
    }
    const result = rateLimiter.check("192.168.1.2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should deny request at limit", () => {
    for (let i = 0; i < 10; i++) {
      rateLimiter.check("192.168.1.3");
    }
    const result = rateLimiter.check("192.168.1.3");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should deny requests over limit", () => {
    for (let i = 0; i < 15; i++) {
      rateLimiter.check("192.168.1.4");
    }
    const result = rateLimiter.check("192.168.1.4");
    expect(result.allowed).toBe(false);
  });

  it("should reset after window expires", () => {
    for (let i = 0; i < 10; i++) {
      rateLimiter.check("192.168.1.5");
    }
    const denied = rateLimiter.check("192.168.1.5");
    expect(denied.allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    const result = rateLimiter.check("192.168.1.5");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should track different IPs independently", () => {
    rateLimiter.check("10.0.0.1");
    rateLimiter.check("10.0.0.1");
    const result1 = rateLimiter.check("10.0.0.1");
    expect(result1.remaining).toBe(7);

    const result2 = rateLimiter.check("10.0.0.2");
    expect(result2.remaining).toBe(9);
  });

  it("should respect custom limit", () => {
    const result = rateLimiter.check("172.16.0.1", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should respect custom window", () => {
    for (let i = 0; i < 3; i++) {
      rateLimiter.check("172.16.0.2", 3, 30_000);
    }
    const denied = rateLimiter.check("172.16.0.2", 3, 30_000);
    expect(denied.allowed).toBe(false);

    vi.advanceTimersByTime(30_001);

    const result = rateLimiter.check("172.16.0.2", 3, 30_000);
    expect(result.allowed).toBe(true);
  });

  it("should return resetAt timestamp", () => {
    const result = rateLimiter.check("192.168.1.10");
    expect(result.resetAt).toBeGreaterThan(0);
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
