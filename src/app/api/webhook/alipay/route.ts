import { NextResponse } from "next/server";
import { verifyAlipayNotification } from "@/lib/alipay";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import { CNY_PLANS } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const isValid = verifyAlipayNotification(params);
    if (!isValid) {
      logger.error("Alipay notification signature verification failed");
      return new NextResponse("fail", { status: 400 });
    }

    const tradeStatus = params.trade_status;

    if (tradeStatus === "TRADE_SUCCESS") {
      const outTradeNo = params.out_trade_no;
      const tradeNo = params.trade_no;
      const totalAmount = params.total_amount;

      let plan = "pro";
      let billingPeriod = "monthly";
      let userId = "";

      if (params.passback_params) {
        try {
          const passback = JSON.parse(params.passback_params);
          plan = passback.plan || "pro";
          billingPeriod = passback.billingPeriod || "monthly";
          userId = passback.userId || "";
        } catch {
          const parts = outTradeNo.split("_");
          if (parts.length >= 4) {
            plan = parts[1];
            billingPeriod = parts[2];
            userId = parts[3];
          }
        }
      } else {
        const parts = outTradeNo.split("_");
        if (parts.length >= 4) {
          plan = parts[1];
          billingPeriod = parts[2];
          userId = parts[3];
        }
      }

      if (!userId) {
        logger.error("No userId found for Alipay trade:", { outTradeNo });
        return new NextResponse("fail", { status: 400 });
      }

      const currentPeriodEnd = new Date();
      if (billingPeriod === "yearly") {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      await prisma.subscription.upsert({
        where: { userId },
        update: {
          plan,
          status: "active",
          stripeCustomerId: `alipay_${userId}`,
          stripeSubscriptionId: tradeNo,
          currentPeriodEnd,
        },
        create: {
          userId,
          plan,
          status: "active",
          stripeCustomerId: `alipay_${userId}`,
          stripeSubscriptionId: tradeNo,
          currentPeriodEnd,
        },
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        const planConfig = CNY_PLANS[plan as keyof typeof CNY_PLANS];
        const amount = billingPeriod === "yearly"
          ? (planConfig?.yearlyPrice ?? parseFloat(totalAmount))
          : (planConfig?.monthlyPrice ?? parseFloat(totalAmount));
        const nextBillingDate = currentPeriodEnd.toLocaleDateString("zh-CN");

        sendPaymentConfirmationEmail(user.email, {
          planName: plan,
          billingPeriod,
          amount,
          currency: "CNY",
          nextBillingDate,
        });
      }
    }

    return new NextResponse("success");
  } catch (error) {
    logger.error("Alipay webhook error:", { error });
    return new NextResponse("fail", { status: 500 });
  }
}
