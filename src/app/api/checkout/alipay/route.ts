import { NextResponse } from "next/server";
import { alipayClient, createAlipayOrder, ALIPAY_PLANS } from "@/lib/alipay";
import { rateLimiter, dbRateLimitCheck, sanitizeCheckoutInput } from "@/lib/payment-security";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    const rateLimitResult = await rateLimiter.check(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const dbRateLimitResult = await dbRateLimitCheck(`alipay:${ip}`, 10, 60_000);
    if (!dbRateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    if (!alipayClient) {
      return NextResponse.json(
        { error: "Alipay payment service not available" },
        { status: 503 }
      );
    }

    const body = await request.json();

    let sanitized: ReturnType<typeof sanitizeCheckoutInput>;
    try {
      sanitized = sanitizeCheckoutInput({ ...body, currency: "cny" });
    } catch (validationError: unknown) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : "Invalid input" },
        { status: 400 }
      );
    }

    const { plan, billingPeriod } = sanitized;
    const { userId, couponCode } = body;

    const planData = ALIPAY_PLANS[plan as keyof typeof ALIPAY_PLANS];
    let amount =
      billingPeriod === "yearly" ? (planData?.yearly ?? 49.9) : (planData?.monthly ?? 49.9);

    if (couponCode && typeof couponCode === "string") {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });
      if (coupon) {
        const now = new Date();
        const isValid = (!coupon.validFrom || now >= coupon.validFrom)
          && (!coupon.validUntil || now <= coupon.validUntil)
          && (coupon.maxUses === null || coupon.usedCount < coupon.maxUses);
        if (isValid) {
          if (coupon.type === "percentage") {
            amount = amount * (1 - coupon.value / 100);
          } else if (coupon.type === "fixed") {
            amount = Math.max(0.01, amount - coupon.value);
          }
        }
      }
    }

    const paymentUrl = await createAlipayOrder(plan, billingPeriod, userId, amount);

    return NextResponse.json({ url: paymentUrl });
  } catch (error) {
    logger.error("Error creating Alipay order:", { error });
    return NextResponse.json(
      { error: "Failed to create Alipay order" },
      { status: 500 }
    );
  }
}
