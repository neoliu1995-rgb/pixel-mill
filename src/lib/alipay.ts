import { AlipaySdk } from "alipay-sdk";

export const alipayClient =
  process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY
    ? new AlipaySdk({
        appId: process.env.ALIPAY_APP_ID,
        privateKey: process.env.ALIPAY_PRIVATE_KEY,
        alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || "",
        signType: "RSA2",
        charset: "utf-8",
        gateway: "https://openapi.alipay.com/gateway.do",
      })
    : null;

export const ALIPAY_PLANS = {
  pro: {
    monthly: 49.9,
    originalMonthly: 69.9,
    yearly: 399,
    originalYearly: 699,
  },
  business: {
    monthly: 99.9,
    yearly: 799,
  },
};

export async function createAlipayOrder(
  plan: string,
  billingPeriod: string,
  userId: string,
  customAmount?: number
): Promise<string> {
  if (!alipayClient) {
    throw new Error("Alipay is not configured");
  }

  const outTradeNo = `PM_${plan}_${billingPeriod}_${userId}_${Date.now()}`;

  const planName = plan === "business" ? "Business" : "Pro";
  const periodName = billingPeriod === "yearly" ? "Yearly" : "Monthly";
  const subject = `PixelMill ${planName} - ${periodName}`;

  const planData = ALIPAY_PLANS[plan as keyof typeof ALIPAY_PLANS];
  const defaultAmount =
    (planData as any)?.[billingPeriod] ?? 49.9;

  const amount = customAmount !== undefined ? customAmount : defaultAmount;

  const notifyUrl = process.env.ALIPAY_NOTIFY_URL || "";
  const returnUrl = process.env.ALIPAY_RETURN_URL || "";

  const result = alipayClient.pageExecute(
    "alipay.trade.page.pay",
    "GET",
    {
      bizContent: {
        outTradeNo,
        totalAmount: amount.toFixed(2),
        subject,
        productCode: "FAST_INSTANT_TRADE_PAY",
        passbackParams: JSON.stringify({ plan, billingPeriod, userId }),
      },
      notifyUrl,
      returnUrl,
    }
  );

  return result;
}

export function verifyAlipayNotification(
  params: Record<string, string>
): boolean {
  if (!alipayClient) {
    return false;
  }
  return alipayClient.checkNotifySignV2(params);
}

export async function refundAlipayOrder(
  outTradeNo: string,
  refundAmount: number,
  refundReason?: string,
  tradeNo?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  if (!alipayClient) {
    return { success: false, error: "Alipay is not configured" };
  }

  try {
    const bizContent: Record<string, string> = {
      refundAmount: refundAmount.toFixed(2),
    };

    if (tradeNo) {
      bizContent.tradeNo = tradeNo;
    } else {
      bizContent.outTradeNo = outTradeNo;
    }

    if (refundReason) {
      bizContent.refundReason = refundReason;
    }

    const result = await alipayClient.exec("alipay.trade.refund", {
      bizContent,
    });

    if (result.code === "10000") {
      return {
        success: true,
        refundId: result.tradeNo || result.outTradeNo || outTradeNo,
      };
    }

    return {
      success: false,
      error: result.subMsg || result.msg || "Refund failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
