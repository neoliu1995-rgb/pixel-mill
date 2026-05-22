import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn().mockResolvedValue({ id: "email-id" });

vi.mock("resend", () => {
  return {
    Resend: vi.fn(function (this: any, apiKey: string) {
      this.emails = {
        send: mockSend,
      };
    }),
  };
});

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { sendPaymentConfirmationEmail, sendPasswordResetEmail } from "@/lib/email";
import { Resend } from "resend";

describe("sendPaymentConfirmationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should skip sending when RESEND_API_KEY is not set", async () => {
    const originalEnv = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendPaymentConfirmationEmail("test@example.com", {
      planName: "pro",
      billingPeriod: "monthly",
      amount: 29,
      currency: "CNY",
      nextBillingDate: "2026-06-20",
    });

    expect(Resend).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[Email] RESEND_API_KEY not configured, skipping email send."
    );

    consoleSpy.mockRestore();
    process.env.RESEND_API_KEY = originalEnv;
  });

  it("should call resend.emails.send when RESEND_API_KEY is configured", async () => {
    const originalEnv = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_test_api_key";

    await sendPaymentConfirmationEmail("test@example.com", {
      planName: "pro",
      billingPeriod: "monthly",
      amount: 29,
      currency: "CNY",
      nextBillingDate: "2026-06-20",
    });

    expect(Resend).toHaveBeenCalledWith("re_test_api_key");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "PixelMill <noreply@pixelmill.xyz>",
        to: "test@example.com",
        subject: "PixelMill Pro Subscription Confirmation",
      })
    );
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Pro"),
      })
    );

    process.env.RESEND_API_KEY = originalEnv;
  });

  it("should use correct plan display name for business plan", async () => {
    const originalEnv = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_test_api_key";

    await sendPaymentConfirmationEmail("test@example.com", {
      planName: "business",
      billingPeriod: "yearly",
      amount: 299,
      currency: "USD",
      nextBillingDate: "2027-05-20",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "PixelMill Business Subscription Confirmation",
      })
    );
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Business"),
      })
    );

    process.env.RESEND_API_KEY = originalEnv;
  });

  it("should handle email send errors gracefully", async () => {
    const originalEnv = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_test_api_key";

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSend.mockReturnValueOnce({
      catch: vi.fn((cb: any) => cb(new Error("Send failed"))),
    });

    await sendPaymentConfirmationEmail("test@example.com", {
      planName: "pro",
      billingPeriod: "monthly",
      amount: 29,
      currency: "CNY",
      nextBillingDate: "2026-06-20",
    });

    process.env.RESEND_API_KEY = originalEnv;
    consoleErrorSpy.mockRestore();
  });
});

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should skip sending when RESEND_API_KEY is not set", async () => {
    const originalEnv = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendPasswordResetEmail("test@example.com", "https://example.com/reset?token=abc");

    expect(Resend).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[Email] RESEND_API_KEY not configured, skipping password reset email send."
    );

    consoleSpy.mockRestore();
    process.env.RESEND_API_KEY = originalEnv;
  });

  it("should call resend.emails.send when RESEND_API_KEY is configured", async () => {
    const originalEnv = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_test_api_key";

    await sendPasswordResetEmail("test@example.com", "https://example.com/reset?token=abc");

    expect(Resend).toHaveBeenCalledWith("re_test_api_key");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "PixelMill <noreply@pixelmill.xyz>",
        to: "test@example.com",
        subject: "PixelMill Password Reset",
      })
    );
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("https://example.com/reset?token=abc"),
      })
    );

    process.env.RESEND_API_KEY = originalEnv;
  });

  it("should include reset URL in email HTML", async () => {
    const originalEnv = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_test_api_key";

    const resetUrl = "https://pixelmill.xyz/auth/reset-password?token=xyz123";
    await sendPasswordResetEmail("user@example.com", resetUrl);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(resetUrl),
      })
    );

    process.env.RESEND_API_KEY = originalEnv;
  });

  it("should handle email send errors gracefully", async () => {
    const originalEnv = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_test_api_key";

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSend.mockReturnValueOnce({
      catch: vi.fn((cb: any) => cb(new Error("Send failed"))),
    });

    await sendPasswordResetEmail("test@example.com", "https://example.com/reset?token=abc");

    process.env.RESEND_API_KEY = originalEnv;
    consoleErrorSpy.mockRestore();
  });
});
