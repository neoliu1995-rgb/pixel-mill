import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { refundAlipayOrder, ALIPAY_PLANS } from "@/lib/alipay";
import { refundWechatOrder, WECHAT_PLANS } from "@/lib/wechat-pay";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/auth";
import { dbRateLimitCheck } from "@/lib/payment-security";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const dbRateLimitResult = await dbRateLimitCheck(`refund:${ip}`, 5, 60_000);
    if (!dbRateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many refund requests. Please try again later." },
        { status: 429 }
      );
    }

    const { subscriptionId, reason } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const dbSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!dbSubscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (dbSubscription.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only refund your own subscription" },
        { status: 403 }
      );
    }

    let refundAmount = 0;
    const paymentMethod = dbSubscription.stripeCustomerId?.startsWith("alipay_")
      ? "alipay"
      : dbSubscription.stripeCustomerId?.startsWith("wechat_")
      ? "wechat"
      : "stripe";

    if (paymentMethod === "stripe" && stripe && dbSubscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(dbSubscription.stripeSubscriptionId);

        const invoices = await stripe.invoices.list({
          subscription: dbSubscription.stripeSubscriptionId,
          limit: 1,
        });

        if (invoices.data.length > 0) {
          const latestInvoice = invoices.data[0] as any;
          if (latestInvoice.payment_intent) {
            const refund = await stripe.refunds.create({
              payment_intent: latestInvoice.payment_intent as string,
            });
            refundAmount = refund.amount / 100;
          }
        }
      } catch (stripeError) {
        logger.error("Stripe refund error:", { error: stripeError });
        return NextResponse.json(
          { error: "Failed to process refund with payment provider" },
          { status: 500 }
        );
      }
    } else if (paymentMethod === "alipay") {
      const plan = dbSubscription.plan as keyof typeof ALIPAY_PLANS;
      const planData = ALIPAY_PLANS[plan];

      if (!planData) {
        return NextResponse.json(
          { error: "Cannot determine refund amount for this plan" },
          { status: 400 }
        );
      }

      if (!dbSubscription.stripeSubscriptionId) {
        return NextResponse.json(
          { error: "No Alipay transaction found for this subscription" },
          { status: 400 }
        );
      }

      let billingPeriod: string = "monthly";
      if (dbSubscription.currentPeriodEnd && dbSubscription.updatedAt) {
        const durationMs = dbSubscription.currentPeriodEnd.getTime() - dbSubscription.updatedAt.getTime();
        const days = durationMs / (1000 * 60 * 60 * 24);
        billingPeriod = days > 180 ? "yearly" : "monthly";
      }

      refundAmount = billingPeriod === "yearly"
        ? (planData as any).yearly ?? (planData as any).monthly
        : (planData as any).monthly ?? 49.9;

      const result = await refundAlipayOrder(
        "",
        refundAmount,
        reason,
        dbSubscription.stripeSubscriptionId
      );

      if (!result.success) {
        logger.error("Alipay refund error:", { error: result.error });
        return NextResponse.json(
          { error: "Failed to process refund with Alipay" },
          { status: 500 }
        );
      }
    } else if (paymentMethod === "wechat") {
      const plan = dbSubscription.plan as keyof typeof WECHAT_PLANS;
      const planData = WECHAT_PLANS[plan];

      if (!planData) {
        return NextResponse.json(
          { error: "Cannot determine refund amount for this plan" },
          { status: 400 }
        );
      }

      if (!dbSubscription.stripeSubscriptionId) {
        return NextResponse.json(
          { error: "No WeChat transaction found for this subscription" },
          { status: 400 }
        );
      }

      let billingPeriod: string = "monthly";
      if (dbSubscription.currentPeriodEnd && dbSubscription.updatedAt) {
        const durationMs = dbSubscription.currentPeriodEnd.getTime() - dbSubscription.updatedAt.getTime();
        const days = durationMs / (1000 * 60 * 60 * 24);
        billingPeriod = days > 180 ? "yearly" : "monthly";
      }

      refundAmount = billingPeriod === "yearly"
        ? (planData as any).yearly ?? (planData as any).monthly
        : (planData as any).monthly ?? 49.9;

      const totalFen = Math.round(refundAmount * 100);
      const refundFen = totalFen;
      const outRefundNo = `RF_${dbSubscription.id}_${Date.now()}`;

      const result = await refundWechatOrder(
        dbSubscription.stripeSubscriptionId,
        totalFen,
        refundFen,
        outRefundNo
      );

      if (!result.success) {
        logger.error("WeChat refund error:", { error: result.error });
        return NextResponse.json(
          { error: "Failed to process refund with WeChat Pay" },
          { status: 500 }
        );
      }
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        plan: "free",
        status: "inactive",
        currentPeriodEnd: null,
      },
    });

    return NextResponse.json({
      success: true,
      refundAmount,
      subscriptionId,
    });
  } catch (error) {
    logger.error("Error processing refund:", { error });
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
