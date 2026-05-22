import { NextResponse } from "next/server";
import { stripe, PRICES, CNY_PRICES } from "@/lib/stripe";
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

    const dbRateLimitResult = await dbRateLimitCheck(`checkout:${ip}`, 10, 60_000);
    if (!dbRateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Payment service not available" },
        { status: 503 }
      );
    }

    const body = await request.json();

    let sanitized: ReturnType<typeof sanitizeCheckoutInput>;
    try {
      sanitized = sanitizeCheckoutInput(body);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    const { plan, billingPeriod, currency } = sanitized;
    const { customerId, userId, couponCode } = body;

    const prices = currency === "cny" ? CNY_PRICES : PRICES;

    let priceId: string;
    if (plan === "business") {
      priceId = billingPeriod === "yearly" ? prices.businessYearly : prices.businessMonthly;
    } else {
      priceId = billingPeriod === "yearly" ? prices.proYearly : prices.proMonthly;
    }

    const metadata: Record<string, string> = {
      userId: userId || "",
      plan: plan || "pro",
      billingPeriod: billingPeriod || "monthly",
    };

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
          metadata.couponCode = coupon.code;
          metadata.couponType = coupon.type;
          metadata.couponValue = String(coupon.value);
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      currency: currency === "cny" ? "cny" : "usd",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer: customerId || undefined,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error("Error creating checkout session:", { error });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
