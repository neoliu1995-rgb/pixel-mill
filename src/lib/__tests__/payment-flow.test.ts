import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    rateLimitEntry: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ id: "1", key: "test", count: 1, resetAt: new Date(), createdAt: new Date(), updatedAt: new Date() }),
      update: vi.fn().mockResolvedValue({ id: "1", key: "test", count: 2, resetAt: new Date(), createdAt: new Date(), updatedAt: new Date() }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    subscriptions: { cancel: vi.fn() },
    invoices: { list: vi.fn() },
    refunds: { create: vi.fn() },
  },
  PRICES: {
    proMonthly: "price_pro_monthly",
    proYearly: "price_pro_yearly",
    businessMonthly: "price_biz_monthly",
    businessYearly: "price_biz_yearly",
  },
  CNY_PRICES: {
    proMonthly: "price_cny_pro_monthly",
    proYearly: "price_cny_pro_yearly",
    businessMonthly: "price_cny_biz_monthly",
    businessYearly: "price_cny_biz_yearly",
  },
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
  refundAlipayOrder: vi.fn(),
  ALIPAY_PLANS: {
    pro: { monthly: 49.9, yearly: 399 },
    business: { monthly: 99.9, yearly: 799 },
  },
}));

vi.mock("@/lib/wechat-pay", () => ({
  refundWechatOrder: vi.fn(),
  WECHAT_PLANS: {
    pro: { monthly: 49.9, yearly: 399 },
    business: { monthly: 99.9, yearly: 799 },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { validatePaymentAmount, sanitizeCheckoutInput } from "@/lib/payment-security";
import { prisma } from "@/lib/prisma";
import { POST as couponPOST } from "@/app/api/coupon/route";
import { POST as refundPOST } from "@/app/api/refund/route";
import { getCurrentUser } from "@/lib/auth";

function makeCoupon(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    code: "TEST",
    type: "percentage",
    value: 10,
    validFrom: new Date(),
    validUntil: null as Date | null,
    maxUses: null as number | null,
    usedCount: 0,
    planRestriction: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any;
}

describe("Checkout validation - sanitizeCheckoutInput", () => {
  it("should accept valid pro monthly USD input", () => {
    const result = sanitizeCheckoutInput({ plan: "pro", billingPeriod: "monthly", currency: "usd" });
    expect(result).toEqual({ plan: "pro", billingPeriod: "monthly", currency: "usd" });
  });

  it("should accept valid business yearly CNY input", () => {
    const result = sanitizeCheckoutInput({ plan: "business", billingPeriod: "yearly", currency: "cny" });
    expect(result).toEqual({ plan: "business", billingPeriod: "yearly", currency: "cny" });
  });

  it("should reject missing plan", () => {
    expect(() => sanitizeCheckoutInput({ billingPeriod: "monthly", currency: "usd" })).toThrow("Invalid plan: undefined");
  });

  it("should reject missing billingPeriod", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", currency: "usd" })).toThrow("Invalid billing period: undefined");
  });

  it("should reject missing currency", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "monthly" })).toThrow("Invalid currency: undefined");
  });

  it("should reject invalid plan - free", () => {
    expect(() => sanitizeCheckoutInput({ plan: "free", billingPeriod: "monthly", currency: "usd" })).toThrow("Invalid plan: free");
  });

  it("should reject invalid plan - enterprise", () => {
    expect(() => sanitizeCheckoutInput({ plan: "enterprise", billingPeriod: "monthly", currency: "usd" })).toThrow("Invalid plan: enterprise");
  });

  it("should reject invalid billing period - weekly", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "weekly", currency: "usd" })).toThrow("Invalid billing period: weekly");
  });

  it("should reject invalid billing period - quarterly", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "quarterly", currency: "usd" })).toThrow("Invalid billing period: quarterly");
  });

  it("should reject invalid currency - eur", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "monthly", currency: "eur" })).toThrow("Invalid currency: eur");
  });

  it("should reject invalid currency - jpy", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "monthly", currency: "jpy" })).toThrow("Invalid currency: jpy");
  });

  it("should reject non-string plan", () => {
    expect(() => sanitizeCheckoutInput({ plan: 123, billingPeriod: "monthly", currency: "usd" })).toThrow();
  });

  it("should reject non-string billingPeriod", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: true, currency: "usd" })).toThrow();
  });

  it("should reject non-string currency", () => {
    expect(() => sanitizeCheckoutInput({ plan: "pro", billingPeriod: "monthly", currency: null })).toThrow();
  });
});

describe("Checkout validation - validatePaymentAmount", () => {
  it("should return correct USD pro monthly amount", () => {
    expect(validatePaymentAmount("pro", "monthly", "usd")).toBe(7.9);
  });

  it("should return correct USD pro yearly amount", () => {
    expect(validatePaymentAmount("pro", "yearly", "usd")).toBe(59.9);
  });

  it("should return correct USD business monthly amount", () => {
    expect(validatePaymentAmount("business", "monthly", "usd")).toBe(14.99);
  });

  it("should return correct USD business yearly amount", () => {
    expect(validatePaymentAmount("business", "yearly", "usd")).toBe(119.99);
  });

  it("should return correct CNY pro monthly amount", () => {
    expect(validatePaymentAmount("pro", "monthly", "cny")).toBe(49.9);
  });

  it("should return correct CNY business yearly amount", () => {
    expect(validatePaymentAmount("business", "yearly", "cny")).toBe(799);
  });

  it("should throw for invalid plan", () => {
    expect(() => validatePaymentAmount("free", "monthly", "usd")).toThrow("Invalid plan: free");
  });

  it("should throw for invalid billing period", () => {
    expect(() => validatePaymentAmount("pro", "weekly", "usd")).toThrow("Invalid billing period: weekly");
  });

  it("should throw for invalid currency", () => {
    expect(() => validatePaymentAmount("pro", "monthly", "gbp")).toThrow("Invalid currency: gbp");
  });

  it("should throw for empty plan", () => {
    expect(() => validatePaymentAmount("", "monthly", "usd")).toThrow("Invalid plan:");
  });

  it("should throw for empty billing period", () => {
    expect(() => validatePaymentAmount("pro", "", "usd")).toThrow("Invalid billing period:");
  });

  it("should throw for empty currency", () => {
    expect(() => validatePaymentAmount("pro", "monthly", "")).toThrow("Invalid currency:");
  });
});

describe("Coupon validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject missing coupon code", async () => {
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe("请输入优惠码");
  });

  it("should reject non-string coupon code", async () => {
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: 123 }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.valid).toBe(false);
  });

  it("should reject non-existent coupon", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "INVALID" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.valid).toBe(false);
    expect(data.error).toBe("优惠码不存在");
  });

  it("should accept valid coupon", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(makeCoupon({ code: "VALID10", value: 10 }));
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "valid10" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.discount).toBe(10);
    expect(data.type).toBe("percentage");
  });

  it("should reject expired coupon", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(
      makeCoupon({ code: "EXPIRED", type: "fixed", value: 5, validUntil: new Date("2020-01-01") })
    );
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "expired" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe("优惠码已过期");
  });

  it("should reject coupon that has not started yet", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(
      makeCoupon({ code: "FUTURE", value: 20, validFrom: new Date("2099-01-01") })
    );
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "future" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe("优惠码尚未生效");
  });

  it("should reject coupon with max uses exceeded", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(
      makeCoupon({ code: "MAXUSED", type: "fixed", value: 10, maxUses: 100, usedCount: 100 })
    );
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "maxused" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe("优惠码已达到使用上限");
  });

  it("should accept coupon with max uses not yet reached", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(
      makeCoupon({ code: "STILLVALID", value: 15, maxUses: 100, usedCount: 99 })
    );
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "stillvalid" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.discount).toBe(15);
  });

  it("should reject coupon with plan restriction not matching", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(
      makeCoupon({ code: "PROONLY", value: 20, planRestriction: "pro" })
    );
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "proonly", plan: "business" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toBe("该优惠码不适用于当前套餐");
  });

  it("should accept coupon with matching plan restriction", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(
      makeCoupon({ code: "PROONLY", value: 20, planRestriction: "pro" })
    );
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "proonly", plan: "pro" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.discount).toBe(20);
  });

  it("should trim and uppercase coupon code before lookup", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(makeCoupon({ code: "SAVE10", type: "fixed", value: 10 }));
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "  save10  " }),
    });
    await couponPOST(req);
    expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: "SAVE10" },
    });
  });

  it("should accept coupon with null maxUses (unlimited)", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(
      makeCoupon({ code: "UNLIMITED", value: 5, usedCount: 9999 })
    );
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "unlimited" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
  });

  it("should accept fixed-amount coupon", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(
      makeCoupon({ code: "FIXED5", type: "fixed", value: 5 })
    );
    const req = new NextRequest("http://localhost/api/coupon", {
      method: "POST",
      body: JSON.stringify({ code: "fixed5" }),
    });
    const res = await couponPOST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.type).toBe("fixed");
  });
});

describe("Refund validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject unauthenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new Request("http://localhost/api/refund", {
      method: "POST",
      headers: new Headers({ "x-forwarded-for": "1.2.3.4" }),
      body: JSON.stringify({ subscriptionId: "sub_123" }),
    });
    const res = await refundPOST(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("should reject missing subscriptionId", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user1", email: "test@test.com" } as any);
    const req = new Request("http://localhost/api/refund", {
      method: "POST",
      headers: new Headers({ "x-forwarded-for": "1.2.3.4" }),
      body: JSON.stringify({}),
    });
    const res = await refundPOST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Subscription ID is required");
  });

  it("should reject subscription not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user1", email: "test@test.com" } as any);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
    const req = new Request("http://localhost/api/refund", {
      method: "POST",
      headers: new Headers({ "x-forwarded-for": "1.2.3.4" }),
      body: JSON.stringify({ subscriptionId: "sub_nonexistent" }),
    });
    const res = await refundPOST(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toBe("Subscription not found");
  });

  it("should reject refund of another user's subscription", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user1", email: "test@test.com" } as any);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      id: "sub_123",
      userId: "user2",
      plan: "pro",
      status: "active",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_stripe_123",
      currentPeriodEnd: new Date(),
      updatedAt: new Date(),
    } as any);
    const req = new Request("http://localhost/api/refund", {
      method: "POST",
      headers: new Headers({ "x-forwarded-for": "1.2.3.4" }),
      body: JSON.stringify({ subscriptionId: "sub_123" }),
    });
    const res = await refundPOST(req);
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBe("You can only refund your own subscription");
  });

  it("should process Stripe refund successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user1", email: "test@test.com" } as any);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      id: "sub_123",
      userId: "user1",
      plan: "pro",
      status: "active",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_stripe_123",
      currentPeriodEnd: new Date(),
      updatedAt: new Date(),
    } as any);

    const { stripe } = await import("@/lib/stripe");
    if (stripe) {
      vi.mocked(stripe.subscriptions.cancel).mockResolvedValue({} as any);
      vi.mocked(stripe.invoices.list).mockResolvedValue({
        data: [{ payment_intent: "pi_123" }],
      } as any);
      vi.mocked(stripe.refunds.create).mockResolvedValue({ amount: 790 } as any);
    }
    vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/refund", {
      method: "POST",
      headers: new Headers({ "x-forwarded-for": "1.2.3.4" }),
      body: JSON.stringify({ subscriptionId: "sub_123", reason: "Not satisfied" }),
    });
    const res = await refundPOST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.refundAmount).toBe(7.9);
    expect(data.subscriptionId).toBe("sub_123");
  });

  it("should downgrade subscription to free after refund", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user1", email: "test@test.com" } as any);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      id: "sub_123",
      userId: "user1",
      plan: "pro",
      status: "active",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_stripe_123",
      currentPeriodEnd: new Date(),
      updatedAt: new Date(),
    } as any);

    const { stripe } = await import("@/lib/stripe");
    if (stripe) {
      vi.mocked(stripe.subscriptions.cancel).mockResolvedValue({} as any);
      vi.mocked(stripe.invoices.list).mockResolvedValue({ data: [] } as any);
    }
    vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/refund", {
      method: "POST",
      headers: new Headers({ "x-forwarded-for": "1.2.3.4" }),
      body: JSON.stringify({ subscriptionId: "sub_123" }),
    });
    await refundPOST(req);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub_123" },
        data: expect.objectContaining({
          plan: "free",
          status: "inactive",
          currentPeriodEnd: null,
        }),
      })
    );
  });
});
