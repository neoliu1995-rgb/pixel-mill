import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import {
  PLANS,
  CNY_PLANS,
  PRICES,
  CNY_PRICES,
  PRICE_TO_PLAN,
  mapPriceToPlan,
  getPlansForCurrency,
  CURRENCY_PLANS,
} from "@/lib/stripe";
import { logger } from "@/lib/logger";

describe("PLANS", () => {
  const planKeys = ["free", "pro", "business"] as const;

  it("should have free, pro, and business tiers", () => {
    expect(Object.keys(PLANS)).toEqual(planKeys);
  });

  it("should have monthlyPrice and yearlyPrice for each plan", () => {
    for (const key of planKeys) {
      expect(PLANS[key]).toHaveProperty("monthlyPrice");
      expect(PLANS[key]).toHaveProperty("yearlyPrice");
      expect(typeof PLANS[key].monthlyPrice).toBe("number");
      expect(typeof PLANS[key].yearlyPrice).toBe("number");
    }
  });

  it("should have free tier with zero prices", () => {
    expect(PLANS.free.monthlyPrice).toBe(0);
    expect(PLANS.free.yearlyPrice).toBe(0);
  });

  it("should have pro tier with correct USD prices", () => {
    expect(PLANS.pro.monthlyPrice).toBe(7.9);
    expect(PLANS.pro.yearlyPrice).toBe(59.9);
  });

  it("should have business tier with correct USD prices", () => {
    expect(PLANS.business.monthlyPrice).toBe(14.99);
    expect(PLANS.business.yearlyPrice).toBe(119.99);
  });

  it("should have name and description for each plan", () => {
    for (const key of planKeys) {
      expect(typeof PLANS[key].name).toBe("string");
      expect(PLANS[key].name.length).toBeGreaterThan(0);
      expect(typeof PLANS[key].description).toBe("string");
      expect(PLANS[key].description.length).toBeGreaterThan(0);
    }
  });

  it("should have features array for each plan", () => {
    for (const key of planKeys) {
      expect(Array.isArray(PLANS[key].features)).toBe(true);
      expect(PLANS[key].features.length).toBeGreaterThan(0);
    }
  });

  it("should have limits object for each plan", () => {
    for (const key of planKeys) {
      expect(PLANS[key].limits).toBeDefined();
      expect(typeof PLANS[key].limits).toBe("object");
    }
  });

  it("should have pro as the popular plan", () => {
    expect(PLANS.pro.popular).toBe(true);
    expect(PLANS.free.popular).toBe(false);
    expect(PLANS.business.popular).toBe(false);
  });

  it("should have pro plan with promotional pricing", () => {
    expect(PLANS.pro.promotional).toBe(true);
    expect(PLANS.pro.originalMonthlyPrice).toBeDefined();
    expect(PLANS.pro.originalYearlyPrice).toBeDefined();
    expect(PLANS.pro.originalMonthlyPrice).toBeGreaterThan(PLANS.pro.monthlyPrice);
    expect(PLANS.pro.originalYearlyPrice).toBeGreaterThan(PLANS.pro.yearlyPrice);
  });

  it("should have increasing prices across tiers", () => {
    expect(PLANS.pro.monthlyPrice).toBeGreaterThan(PLANS.free.monthlyPrice);
    expect(PLANS.business.monthlyPrice).toBeGreaterThan(PLANS.pro.monthlyPrice);
    expect(PLANS.pro.yearlyPrice).toBeGreaterThan(PLANS.free.yearlyPrice);
    expect(PLANS.business.yearlyPrice).toBeGreaterThan(PLANS.pro.yearlyPrice);
  });
});

describe("CNY_PLANS", () => {
  const planKeys = ["free", "pro", "business"] as const;

  it("should have free, pro, and business tiers", () => {
    expect(Object.keys(CNY_PLANS)).toEqual(planKeys);
  });

  it("should have monthlyPrice and yearlyPrice for each plan", () => {
    for (const key of planKeys) {
      expect(CNY_PLANS[key]).toHaveProperty("monthlyPrice");
      expect(CNY_PLANS[key]).toHaveProperty("yearlyPrice");
      expect(typeof CNY_PLANS[key].monthlyPrice).toBe("number");
      expect(typeof CNY_PLANS[key].yearlyPrice).toBe("number");
    }
  });

  it("should have free tier with zero prices", () => {
    expect(CNY_PLANS.free.monthlyPrice).toBe(0);
    expect(CNY_PLANS.free.yearlyPrice).toBe(0);
  });

  it("should have pro tier with correct CNY prices", () => {
    expect(CNY_PLANS.pro.monthlyPrice).toBe(49.9);
    expect(CNY_PLANS.pro.yearlyPrice).toBe(399);
  });

  it("should have business tier with correct CNY prices", () => {
    expect(CNY_PLANS.business.monthlyPrice).toBe(99.9);
    expect(CNY_PLANS.business.yearlyPrice).toBe(799);
  });

  it("should have pro plan with promotional pricing", () => {
    expect(CNY_PLANS.pro.promotional).toBe(true);
    expect(CNY_PLANS.pro.originalMonthlyPrice).toBe(69.9);
    expect(CNY_PLANS.pro.originalYearlyPrice).toBe(699);
    expect(CNY_PLANS.pro.originalMonthlyPrice).toBeGreaterThan(CNY_PLANS.pro.monthlyPrice);
    expect(CNY_PLANS.pro.originalYearlyPrice).toBeGreaterThan(CNY_PLANS.pro.yearlyPrice);
  });

  it("should have CNY prices higher than USD prices for pro and business", () => {
    expect(CNY_PLANS.pro.monthlyPrice).toBeGreaterThan(PLANS.pro.monthlyPrice);
    expect(CNY_PLANS.business.monthlyPrice).toBeGreaterThan(PLANS.business.monthlyPrice);
  });
});

describe("PRICES", () => {
  it("should have proMonthly price ID", () => {
    expect(PRICES).toHaveProperty("proMonthly");
  });

  it("should have proYearly price ID", () => {
    expect(PRICES).toHaveProperty("proYearly");
  });

  it("should have businessMonthly price ID", () => {
    expect(PRICES).toHaveProperty("businessMonthly");
  });

  it("should have businessYearly price ID", () => {
    expect(PRICES).toHaveProperty("businessYearly");
  });

  it("should read proMonthly from STRIPE_PRO_MONTHLY_PRICE_ID env var", () => {
    expect(PRICES.proMonthly).toBe(process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "");
  });

  it("should read proYearly from STRIPE_PRO_YEARLY_PRICE_ID env var", () => {
    expect(PRICES.proYearly).toBe(process.env.STRIPE_PRO_YEARLY_PRICE_ID || "");
  });

  it("should read businessMonthly from STRIPE_BUSINESS_MONTHLY_PRICE_ID env var", () => {
    expect(PRICES.businessMonthly).toBe(process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "");
  });

  it("should read businessYearly from STRIPE_BUSINESS_YEARLY_PRICE_ID env var", () => {
    expect(PRICES.businessYearly).toBe(process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || "");
  });

  it("should default to empty string when env vars are not set", () => {
    const originalValue = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
    delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
    const { proMonthly } = PRICES;
    if (!originalValue) {
      expect(proMonthly).toBe("");
    }
    if (originalValue) {
      process.env.STRIPE_PRO_MONTHLY_PRICE_ID = originalValue;
    }
  });
});

describe("CNY_PRICES", () => {
  it("should have proMonthly price ID", () => {
    expect(CNY_PRICES).toHaveProperty("proMonthly");
  });

  it("should have proYearly price ID", () => {
    expect(CNY_PRICES).toHaveProperty("proYearly");
  });

  it("should have businessMonthly price ID", () => {
    expect(CNY_PRICES).toHaveProperty("businessMonthly");
  });

  it("should have businessYearly price ID", () => {
    expect(CNY_PRICES).toHaveProperty("businessYearly");
  });

  it("should read proMonthly from STRIPE_CNY_PRO_MONTHLY_PRICE_ID env var", () => {
    expect(CNY_PRICES.proMonthly).toBe(process.env.STRIPE_CNY_PRO_MONTHLY_PRICE_ID || "");
  });

  it("should read proYearly from STRIPE_CNY_PRO_YEARLY_PRICE_ID env var", () => {
    expect(CNY_PRICES.proYearly).toBe(process.env.STRIPE_CNY_PRO_YEARLY_PRICE_ID || "");
  });

  it("should read businessMonthly from STRIPE_CNY_BUSINESS_MONTHLY_PRICE_ID env var", () => {
    expect(CNY_PRICES.businessMonthly).toBe(process.env.STRIPE_CNY_BUSINESS_MONTHLY_PRICE_ID || "");
  });

  it("should read businessYearly from STRIPE_CNY_BUSINESS_YEARLY_PRICE_ID env var", () => {
    expect(CNY_PRICES.businessYearly).toBe(process.env.STRIPE_CNY_BUSINESS_YEARLY_PRICE_ID || "");
  });
});

describe("validatePriceIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log warning when price IDs are missing", async () => {
    vi.resetModules();
    vi.doMock("@/lib/logger", () => ({
      logger: {
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
      },
    }));
    vi.doMock("stripe", () => ({
      default: class Stripe {
        constructor() {}
      },
    }));

    const originalKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_test_real_key_12345";
    delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
    delete process.env.STRIPE_PRO_YEARLY_PRICE_ID;
    delete process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID;
    delete process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID;
    delete process.env.STRIPE_CNY_PRO_MONTHLY_PRICE_ID;
    delete process.env.STRIPE_CNY_PRO_YEARLY_PRICE_ID;
    delete process.env.STRIPE_CNY_BUSINESS_MONTHLY_PRICE_ID;
    delete process.env.STRIPE_CNY_BUSINESS_YEARLY_PRICE_ID;

    const { logger: mockLogger } = await import("@/lib/logger");
    await import("@/lib/stripe");

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Missing or invalid price IDs")
    );

    process.env.STRIPE_SECRET_KEY = originalKey;
  });

  it("should not log warning when stripe is null", async () => {
    vi.resetModules();
    vi.doMock("@/lib/logger", () => ({
      logger: {
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
      },
    }));

    const originalKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const { logger: mockLogger } = await import("@/lib/logger");
    await import("@/lib/stripe");

    expect(mockLogger.warn).not.toHaveBeenCalled();

    process.env.STRIPE_SECRET_KEY = originalKey;
  });
});

describe("getPlansForCurrency", () => {
  it("should return PLANS for usd currency", () => {
    const plans = getPlansForCurrency("usd");
    expect(plans).toBe(PLANS);
  });

  it("should return CNY_PLANS for cny currency", () => {
    const plans = getPlansForCurrency("cny");
    expect(plans).toBe(CNY_PLANS);
  });
});

describe("CURRENCY_PLANS", () => {
  it("should map usd to PLANS", () => {
    expect(CURRENCY_PLANS.usd).toBe(PLANS);
  });

  it("should map cny to CNY_PLANS", () => {
    expect(CURRENCY_PLANS.cny).toBe(CNY_PLANS);
  });
});

describe("PRICE_TO_PLAN", () => {
  it("should map proMonthly price to pro/monthly", () => {
    if (PRICES.proMonthly) {
      expect(PRICE_TO_PLAN[PRICES.proMonthly]).toEqual({ plan: "pro", billingPeriod: "monthly" });
    }
  });

  it("should map proYearly price to pro/yearly", () => {
    if (PRICES.proYearly) {
      expect(PRICE_TO_PLAN[PRICES.proYearly]).toEqual({ plan: "pro", billingPeriod: "yearly" });
    }
  });

  it("should map businessMonthly price to business/monthly", () => {
    if (PRICES.businessMonthly) {
      expect(PRICE_TO_PLAN[PRICES.businessMonthly]).toEqual({ plan: "business", billingPeriod: "monthly" });
    }
  });

  it("should map businessYearly price to business/yearly", () => {
    if (PRICES.businessYearly) {
      expect(PRICE_TO_PLAN[PRICES.businessYearly]).toEqual({ plan: "business", billingPeriod: "yearly" });
    }
  });
});

describe("mapPriceToPlan", () => {
  it("should return plan info for known price ID", () => {
    if (PRICES.proMonthly) {
      expect(mapPriceToPlan(PRICES.proMonthly)).toEqual({ plan: "pro", billingPeriod: "monthly" });
    }
  });

  it("should return null for unknown price ID", () => {
    expect(mapPriceToPlan("price_unknown")).toBeNull();
  });

  it("should return null for a truly unknown string", () => {
    expect(mapPriceToPlan("price_not_in_mapping_abc123")).toBeNull();
  });
});

describe("Stripe client", () => {
  it("should be null when STRIPE_SECRET_KEY is not set", async () => {
    vi.resetModules();
    vi.doMock("@/lib/logger", () => ({
      logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
    }));

    const originalKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const { stripe: nullStripe } = await import("@/lib/stripe");
    expect(nullStripe).toBeNull();

    process.env.STRIPE_SECRET_KEY = originalKey;
  });

  it("should be null when STRIPE_SECRET_KEY is placeholder", async () => {
    vi.resetModules();
    vi.doMock("@/lib/logger", () => ({
      logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
    }));

    const originalKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_test_your_secret_key_here";

    const { stripe: placeholderStripe } = await import("@/lib/stripe");
    expect(placeholderStripe).toBeNull();

    process.env.STRIPE_SECRET_KEY = originalKey;
  });
});
