export type Locale = "en" | "zh";

export function getLocale(locale?: string): Locale {
  if (locale === "zh" || locale === "zh-CN" || locale === "zh-TW") return "zh";
  return "en";
}

const paymentTranslations = {
  en: {
    title: "Payment Confirmation",
    greeting: "Hello,",
    thankYou: "Thank you for subscribing to PixelMill! Your payment has been successfully processed. Here are your subscription details:",
    planLabel: "Plan",
    billingLabel: "Billing Cycle",
    amountLabel: "Amount",
    nextBillingLabel: "Next Billing Date",
    monthly: "Monthly",
    yearly: "Yearly",
    footer: "If you have any questions, please contact our support team.",
    autoSent: "This email was sent automatically by the PixelMill system. Please do not reply directly.",
    planFeature: "You can now enjoy all features of {plan}, including higher resolution image generation, more model choices, and priority technical support.",
    getStarted: "Get Started",
    emailTitle: "PixelMill Payment Confirmation",
    planPro: "Pro",
    planBusiness: "Business",
    subject: "PixelMill {plan} Subscription Confirmation",
  },
  zh: {
    title: "支付成功确认",
    greeting: "您好，",
    thankYou: "感谢您订阅 PixelMill！您的支付已成功处理，以下是您的订阅详情：",
    planLabel: "订阅方案",
    billingLabel: "计费周期",
    amountLabel: "支付金额",
    nextBillingLabel: "下次计费日期",
    monthly: "月付",
    yearly: "年付",
    footer: "如有任何问题，请联系我们的客服团队。",
    autoSent: "此邮件由 PixelMill 系统自动发送，请勿直接回复。",
    planFeature: "您现在可以享受 {plan} 的所有功能，包括更高分辨率的图片生成、更多模型选择和优先技术支持。",
    getStarted: "开始使用",
    emailTitle: "PixelMill 支付确认",
    planPro: "专业版",
    planBusiness: "企业版",
    subject: "PixelMill {plan} 订阅确认",
  },
} as const;

const resetTranslations = {
  en: {
    title: "Reset Your Password",
    greeting: "Hello,",
    instruction: "We received a request to reset your password. Click the button below to create a new password:",
    buttonText: "Reset Password",
    expiry: "This link will expire in 1 hour.",
    ignore: "If you did not request a password reset, please ignore this email. Your password will not be changed.",
    footer: "If you have any questions, please contact our support team.",
    autoSent: "This email was sent automatically by the PixelMill system. Please do not reply directly.",
    emailTitle: "PixelMill Password Reset",
    subject: "PixelMill Password Reset",
  },
  zh: {
    title: "密码重置请求",
    greeting: "您好，",
    instruction: "我们收到了重置您密码的请求。请点击下方按钮重置您的密码：",
    buttonText: "重置密码",
    expiry: "此链接将在 1 小时后过期。",
    ignore: "如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。",
    footer: "如有问题，请联系我们的客服团队。",
    autoSent: "此邮件由 PixelMill 系统自动发送，请勿直接回复。",
    emailTitle: "PixelMill 密码重置",
    subject: "PixelMill 密码重置",
  },
} as const;

export interface PaymentEmailData {
  planName: string;
  billingPeriod: string;
  amount: number;
  currency: string;
  nextBillingDate: string;
}

export function getPaymentSubject(data: PaymentEmailData, locale: Locale): string {
  const t = paymentTranslations[locale];
  const planDisplayName =
    data.planName === "pro"
      ? t.planPro
      : data.planName === "business"
        ? t.planBusiness
        : data.planName;
  return t.subject.replace("{plan}", planDisplayName);
}

export function generatePaymentEmailHtml(data: PaymentEmailData, locale: Locale): string {
  const t = paymentTranslations[locale];
  const planDisplayName =
    data.planName === "pro"
      ? t.planPro
      : data.planName === "business"
        ? t.planBusiness
        : data.planName;
  const periodLabel = data.billingPeriod === "yearly" ? t.yearly : t.monthly;
  const currencySymbol = data.currency === "CNY" ? "¥" : "$";
  const formattedAmount = `${currencySymbol}${data.amount}`;
  const langAttr = locale === "zh" ? "zh-CN" : "en";

  return `
<!DOCTYPE html>
<html lang="${langAttr}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.emailTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7,#c084fc);padding:40px 40px 32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">PixelMill</h1>
            <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.85);font-size:16px;">${t.title}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">${t.greeting}</p>
            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">${t.thankYou}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;overflow:hidden;margin:0 0 24px 0;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <span style="font-size:14px;color:#6b7280;">${t.planLabel}</span>
                </td>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;">
                  <span style="font-size:14px;color:#111827;font-weight:600;">PixelMill ${planDisplayName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <span style="font-size:14px;color:#6b7280;">${t.billingLabel}</span>
                </td>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;">
                  <span style="font-size:14px;color:#111827;font-weight:600;">${periodLabel}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <span style="font-size:14px;color:#6b7280;">${t.amountLabel}</span>
                </td>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;">
                  <span style="font-size:14px;color:#111827;font-weight:600;">${formattedAmount}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <span style="font-size:14px;color:#6b7280;">${t.nextBillingLabel}</span>
                </td>
                <td style="padding:16px 20px;text-align:right;">
                  <span style="font-size:14px;color:#111827;font-weight:600;">${data.nextBillingDate}</span>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">${t.planFeature.replace("{plan}", planDisplayName)}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://pixelmill.xyz"}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">${t.getStarted}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5;">${t.autoSent}</p>
            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5;">${t.footer}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function getResetSubject(locale: Locale): string {
  return resetTranslations[locale].subject;
}

export function generateResetEmailHtml(resetUrl: string, locale: Locale): string {
  const t = resetTranslations[locale];
  const langAttr = locale === "zh" ? "zh-CN" : "en";

  return `
<!DOCTYPE html>
<html lang="${langAttr}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.emailTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7,#c084fc);padding:40px 40px 32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">PixelMill</h1>
            <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.85);font-size:16px;">${t.title}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">${t.greeting}</p>
            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">${t.instruction}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 24px 0;">
                  <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">${t.buttonText}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px 0;font-size:14px;color:#6b7280;line-height:1.6;">${t.ignore}</p>
            <p style="margin:0 0 0 0;font-size:14px;color:#9ca3af;line-height:1.6;">${t.expiry}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5;">${t.autoSent}</p>
            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5;">${t.footer}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
