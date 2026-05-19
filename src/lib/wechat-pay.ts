import WxPay from "wechatpay-node-v3";

export const wechatPayClient =
  process.env.WECHAT_MCH_ID && process.env.WECHAT_API_KEY
    ? new WxPay({
        appid: process.env.WECHAT_APP_ID || "",
        mchid: process.env.WECHAT_MCH_ID,
        publicKey: Buffer.from(process.env.WECHAT_PUBLIC_KEY || ""),
        privateKey: Buffer.from(process.env.WECHAT_PRIVATE_KEY || ""),
        key: process.env.WECHAT_API_KEY,
      })
    : null;

export const WECHAT_PLANS = {
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

export async function createWechatOrder(
  plan: string,
  billingPeriod: string,
  userId: string,
  customAmount?: number
): Promise<string> {
  if (!wechatPayClient) {
    throw new Error("WeChat Pay is not configured");
  }

  const outTradeNo = `PM_${plan}_${billingPeriod}_${userId}_${Date.now()}`;

  const planName = plan === "business" ? "Business" : "Pro";
  const periodName = billingPeriod === "yearly" ? "Yearly" : "Monthly";
  const description = `PixelMill ${planName} - ${periodName}`;

  const planData = WECHAT_PLANS[plan as keyof typeof WECHAT_PLANS];
  const defaultAmount =
    (planData as any)?.[billingPeriod] ?? 49.9;

  const amount = customAmount !== undefined ? customAmount : defaultAmount;

  const totalFen = Math.round(amount * 100);

  const notifyUrl = process.env.WECHAT_NOTIFY_URL || "";

  const result = await wechatPayClient.transactions_native({
    description,
    out_trade_no: outTradeNo,
    notify_url: notifyUrl,
    amount: {
      total: totalFen,
      currency: "CNY",
    },
    attach: JSON.stringify({ plan, billingPeriod, userId }),
  });

  if (result.status === 200 && result.data?.code_url) {
    return result.data.code_url;
  }

  throw new Error(result.error?.message || "Failed to create WeChat Pay order");
}

export async function verifyWechatNotification(
  body: string,
  headers: Record<string, string>
): Promise<boolean> {
  if (!wechatPayClient) {
    return false;
  }

  try {
    const isValid = await wechatPayClient.verifySign({
      timestamp: headers["wechatpay-timestamp"] || "",
      nonce: headers["wechatpay-nonce"] || "",
      body,
      serial: headers["wechatpay-serial"] || "",
      signature: headers["wechatpay-signature"] || "",
    });
    return isValid;
  } catch {
    return false;
  }
}

export function decryptWechatNotification(
  ciphertext: string,
  associatedData: string,
  nonce: string
): any {
  if (!wechatPayClient) {
    return null;
  }

  try {
    return wechatPayClient.decipher_gcm(
      ciphertext,
      associatedData,
      nonce,
      process.env.WECHAT_API_KEY
    );
  } catch {
    return null;
  }
}

export async function refundWechatOrder(
  outTradeNo: string,
  totalAmount: number,
  refundAmount: number,
  outRefundNo: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  if (!wechatPayClient) {
    return { success: false, error: "WeChat Pay is not configured" };
  }

  try {
    const result = await wechatPayClient.refunds({
      out_trade_no: outTradeNo,
      out_refund_no: outRefundNo,
      amount: {
        total: totalAmount,
        refund: refundAmount,
        currency: "CNY",
      },
    });

    if (result.status === 200 && result.data?.refund_id) {
      return { success: true, refundId: result.data.refund_id };
    }

    return {
      success: false,
      error: result.error?.message || "Failed to process WeChat Pay refund",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "WeChat Pay refund request failed",
    };
  }
}
