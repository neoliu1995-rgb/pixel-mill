import { Resend } from "resend";

export interface PaymentEmailData {
  planName: string;
  billingPeriod: string;
  amount: number;
  currency: string;
  nextBillingDate: string;
}

function generateEmailHtml(data: PaymentEmailData): string {
  const planDisplayName = data.planName === "pro" ? "专业版" : data.planName === "business" ? "企业版" : data.planName;
  const periodLabel = data.billingPeriod === "yearly" ? "年付" : "月付";
  const currencySymbol = data.currency === "CNY" ? "¥" : "$";
  const formattedAmount = `${currencySymbol}${data.amount}`;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PixelMill 支付确认</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7,#c084fc);padding:40px 40px 32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">PixelMill</h1>
            <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.85);font-size:16px;">支付成功确认</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">您好，</p>
            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">感谢您订阅 PixelMill！您的支付已成功处理，以下是您的订阅详情：</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;overflow:hidden;margin:0 0 24px 0;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <span style="font-size:14px;color:#6b7280;">订阅方案</span>
                </td>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;">
                  <span style="font-size:14px;color:#111827;font-weight:600;">PixelMill ${planDisplayName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <span style="font-size:14px;color:#6b7280;">计费周期</span>
                </td>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;">
                  <span style="font-size:14px;color:#111827;font-weight:600;">${periodLabel}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <span style="font-size:14px;color:#6b7280;">支付金额</span>
                </td>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;text-align:right;">
                  <span style="font-size:14px;color:#111827;font-weight:600;">${formattedAmount}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <span style="font-size:14px;color:#6b7280;">下次计费日期</span>
                </td>
                <td style="padding:16px 20px;text-align:right;">
                  <span style="font-size:14px;color:#111827;font-weight:600;">${data.nextBillingDate}</span>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;line-height:1.6;">您现在可以享受 ${planDisplayName} 的所有功能，包括更高分辨率的图片生成、更多模型选择和优先技术支持。</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://pixelmill.ai"}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">开始使用</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5;">此邮件由 PixelMill 系统自动发送，请勿直接回复。</p>
            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5;">如有问题，请联系我们的客服团队。</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function sendPaymentConfirmationEmail(to: string, data: PaymentEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured, skipping email send.");
    console.log("[Email] To:", to);
    console.log("[Email] Data:", JSON.stringify(data, null, 2));
    return;
  }

  const resend = new Resend(apiKey);
  const planDisplayName = data.planName === "pro" ? "专业版" : data.planName === "business" ? "企业版" : data.planName;

  resend.emails
    .send({
      from: "PixelMill <noreply@pixelmill.ai>",
      to,
      subject: `PixelMill ${planDisplayName} 订阅确认`,
      html: generateEmailHtml(data),
    })
    .catch((error) => {
      console.error("[Email] Failed to send payment confirmation email:", error);
    });
}
