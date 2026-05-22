import { Resend } from "resend";
import {
  getLocale,
  generatePaymentEmailHtml,
  generateResetEmailHtml,
  getPaymentSubject,
  getResetSubject,
} from "./email-templates";
import type { PaymentEmailData, Locale } from "./email-templates";

export type { PaymentEmailData };

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  locale?: string
): Promise<void> {
  const resolvedLocale: Locale = getLocale(locale);
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured, skipping password reset email send.");
    console.log("[Email] To:", to);
    console.log("[Email] Reset URL:", resetUrl);
    return;
  }

  const resend = new Resend(apiKey);

  resend.emails
    .send({
      from: "PixelMill <noreply@pixelmill.xyz>",
      to,
      subject: getResetSubject(resolvedLocale),
      html: generateResetEmailHtml(resetUrl, resolvedLocale),
    })
    .catch((error) => {
      console.error("[Email] Failed to send password reset email:", error);
    });
}

export async function sendPaymentConfirmationEmail(
  to: string,
  data: PaymentEmailData,
  locale?: string
): Promise<void> {
  const resolvedLocale: Locale = getLocale(locale);
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured, skipping email send.");
    console.log("[Email] To:", to);
    console.log("[Email] Data:", JSON.stringify(data, null, 2));
    return;
  }

  const resend = new Resend(apiKey);

  resend.emails
    .send({
      from: "PixelMill <noreply@pixelmill.xyz>",
      to,
      subject: getPaymentSubject(data, resolvedLocale),
      html: generatePaymentEmailHtml(data, resolvedLocale),
    })
    .catch((error) => {
      console.error("[Email] Failed to send payment confirmation email:", error);
    });
}
