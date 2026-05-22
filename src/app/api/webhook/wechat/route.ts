import { NextResponse } from "next/server";
import {
  verifyWechatNotification,
  decryptWechatNotification,
} from "@/lib/wechat-pay";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import { CNY_PLANS } from "@/lib/stripe";
import { logger } from "@/lib/logger";

interface WechatPaymentNotification {
  trade_state: string;
  out_trade_no: string;
  transaction_id: string;
  attach?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const isValid = await verifyWechatNotification(body, headers);
    if (!isValid) {
      logger.error("WeChat Pay notification signature verification failed");
      return new NextResponse(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Signature verification failed]]></return_msg></xml>',
        {
          status: 400,
          headers: { "Content-Type": "application/xml" },
        }
      );
    }

    let notification: WechatPaymentNotification | null = null;
    try {
      const parsed = JSON.parse(body);
      const resource = parsed.resource;
      if (resource) {
        notification = decryptWechatNotification(
          resource.ciphertext,
          resource.associated_data,
          resource.nonce
        );
      }
    } catch {
      logger.error("Failed to parse WeChat Pay notification body");
      return new NextResponse(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Parse error]]></return_msg></xml>',
        {
          status: 400,
          headers: { "Content-Type": "application/xml" },
        }
      );
    }

    if (!notification) {
      logger.error("Failed to decrypt WeChat Pay notification");
      return new NextResponse(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Decrypt error]]></return_msg></xml>',
        {
          status: 400,
          headers: { "Content-Type": "application/xml" },
        }
      );
    }

    if (notification.trade_state === "SUCCESS") {
      const outTradeNo = notification.out_trade_no;
      const transactionId = notification.transaction_id;

      let plan = "pro";
      let billingPeriod = "monthly";
      let userId = "";

      if (notification.attach) {
        try {
          const attach = JSON.parse(notification.attach);
          plan = attach.plan || "pro";
          billingPeriod = attach.billingPeriod || "monthly";
          userId = attach.userId || "";
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
        logger.error("No userId found for WeChat Pay trade:", { outTradeNo });
        return new NextResponse(
          '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[No userId]]></return_msg></xml>',
          {
            status: 400,
            headers: { "Content-Type": "application/xml" },
          }
        );
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
          stripeCustomerId: `wechat_${userId}`,
          stripeSubscriptionId: transactionId,
          currentPeriodEnd,
        },
        create: {
          userId,
          plan,
          status: "active",
          stripeCustomerId: `wechat_${userId}`,
          stripeSubscriptionId: transactionId,
          currentPeriodEnd,
        },
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        const planConfig = CNY_PLANS[plan as keyof typeof CNY_PLANS];
        const amount = billingPeriod === "yearly"
          ? (planConfig?.yearlyPrice ?? 0)
          : (planConfig?.monthlyPrice ?? 0);
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

    return new NextResponse(
      '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>',
      {
        status: 200,
        headers: { "Content-Type": "application/xml" },
      }
    );
  } catch (error) {
    logger.error("WeChat Pay webhook error:", { error });
    return new NextResponse(
      '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Internal error]]></return_msg></xml>',
      {
        status: 500,
        headers: { "Content-Type": "application/xml" },
      }
    );
  }
}
