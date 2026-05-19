import { PLANS, CNY_PLANS } from "@/lib/stripe";
import { ALIPAY_PLANS } from "@/lib/alipay";
import { WECHAT_PLANS } from "@/lib/wechat-pay";
import { prisma } from "@/lib/prisma";
import { rateLimiter } from "@/lib/rate-limiter";

export { rateLimiter };

export async function dbRateLimitCheck(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = new Date();

  try {
    await prisma.rateLimitEntry.deleteMany({
      where: { resetAt: { lte: now } },
    });

    const entry = await prisma.rateLimitEntry.findUnique({
      where: { key },
    });

    if (!entry || entry.resetAt <= now) {
      const resetAt = new Date(Date.now() + windowMs);
      await prisma.rateLimitEntry.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
      return { allowed: true, remaining: limit - 1, resetAt: resetAt.getTime() };
    }

    if (entry.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt.getTime() };
    }

    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: limit - entry.count - 1,
      resetAt: entry.resetAt.getTime(),
    };
  } catch {
    return { allowed: true, remaining: limit - 1, resetAt: Date.now() + windowMs };
  }
}

const VALID_PLANS = ["pro", "business"] as const;
const VALID_BILLING_PERIODS = ["monthly", "yearly"] as const;
const VALID_CURRENCIES = ["usd", "cny"] as const;

type ValidPlan = (typeof VALID_PLANS)[number];
type ValidBillingPeriod = (typeof VALID_BILLING_PERIODS)[number];
type ValidCurrency = (typeof VALID_CURRENCIES)[number];

export function validatePaymentAmount(
  plan: string,
  billingPeriod: string,
  currency: string
): number {
  if (!VALID_PLANS.includes(plan as ValidPlan)) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  if (!VALID_BILLING_PERIODS.includes(billingPeriod as ValidBillingPeriod)) {
    throw new Error(`Invalid billing period: ${billingPeriod}`);
  }

  if (!VALID_CURRENCIES.includes(currency as ValidCurrency)) {
    throw new Error(`Invalid currency: ${currency}`);
  }

  if (currency === "usd") {
    const planData = PLANS[plan as ValidPlan];
    if (!planData) {
      throw new Error(`Plan not found: ${plan}`);
    }
    return billingPeriod === "yearly" ? planData.yearlyPrice : planData.monthlyPrice;
  }

  const planData = CNY_PLANS[plan as ValidPlan];
  if (!planData) {
    throw new Error(`Plan not found: ${plan}`);
  }
  return billingPeriod === "yearly" ? planData.yearlyPrice : planData.monthlyPrice;
}

export function sanitizeCheckoutInput(input: Record<string, unknown>): {
  plan: ValidPlan;
  billingPeriod: ValidBillingPeriod;
  currency: ValidCurrency;
} {
  const { plan, billingPeriod, currency } = input;

  if (typeof plan !== "string" || !VALID_PLANS.includes(plan as ValidPlan)) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  if (typeof billingPeriod !== "string" || !VALID_BILLING_PERIODS.includes(billingPeriod as ValidBillingPeriod)) {
    throw new Error(`Invalid billing period: ${billingPeriod}`);
  }

  if (typeof currency !== "string" || !VALID_CURRENCIES.includes(currency as ValidCurrency)) {
    throw new Error(`Invalid currency: ${currency}`);
  }

  return {
    plan: plan as ValidPlan,
    billingPeriod: billingPeriod as ValidBillingPeriod,
    currency: currency as ValidCurrency,
  };
}
