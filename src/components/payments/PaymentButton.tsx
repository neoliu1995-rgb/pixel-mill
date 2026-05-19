"use client";

import { useState } from "react";
import { Zap, Loader2, RefreshCw, X, ChevronDown, ChevronUp, Tag, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type PaymentMethod = "stripe" | "alipay" | "wechat";

interface CouponData {
  valid: boolean;
  discount?: number;
  type?: string;
  error?: string;
}

interface PaymentButtonProps {
  plan: "pro" | "business";
  billingPeriod: "monthly" | "yearly";
  price: string;
  currency?: "usd" | "cny";
  isPopular?: boolean;
}

export default function PaymentButton({
  plan = "pro",
  billingPeriod = "monthly",
  price,
  currency = "usd",
  isPopular = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showError, setShowError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(currency === "cny" ? "alipay" : "stripe");
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string>("");

  const maxRetries = 2;

  const numericPrice = parseFloat(price);

  const getDiscountedPrice = (): number => {
    if (!couponData?.valid || !couponData.discount) return numericPrice;
    if (couponData.type === "percentage") {
      return numericPrice * (1 - couponData.discount / 100);
    }
    return Math.max(0, numericPrice - couponData.discount);
  };

  const discountedPrice = getDiscountedPrice();

  const formatPrice = (amount: number): string => {
    if (currency === "cny") {
      return amount.toFixed(2);
    }
    return amount.toFixed(2);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponData(null);

    try {
      const response = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), plan, billingPeriod }),
      });

      const data = await response.json();

      if (data.valid) {
        setCouponData(data);
        setAppliedCoupon(couponCode.trim().toUpperCase());
      } else {
        setCouponData(data);
      }
    } catch {
      setCouponData({ valid: false, error: "验证失败，请重试" });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    setAppliedCoupon("");
  };

  const handlePayment = async (retry = false) => {
    if (retry) {
      setRetryCount(prev => prev + 1);
    }
    setLoading(true);
    setError(null);
    setShowError(false);

    try {
      let endpoint = "/api/checkout";
      if (paymentMethod === "alipay") {
        endpoint = "/api/checkout/alipay";
      } else if (paymentMethod === "wechat") {
        endpoint = "/api/checkout/wechat";
      }

      const requestBody: Record<string, string> = { plan, billingPeriod, currency };
      if (appliedCoupon) {
        requestBody.couponCode = appliedCoupon;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (paymentMethod === "wechat" && data.codeUrl) {
        setQrCodeUrl(data.codeUrl);
        setShowQrDialog(true);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        const errorMessage = data.error || "Failed to create payment session";
        setError(errorMessage);
        setShowError(true);
      }
    } catch (err) {
      const errorMessage = "Failed to connect to payment service";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      handlePayment(true);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setPaymentMethod("stripe")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all border",
            paymentMethod === "stripe"
              ? "border-purple-500 bg-purple-50 text-purple-700"
              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M1 10h22" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Credit Card</span>
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("alipay")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all border",
            paymentMethod === "alipay"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
          )}
        >
          <Image
            src="/icons/alipay.svg"
            alt="Alipay"
            width={16}
            height={16}
            className="w-4 h-4"
          />
          <span>Alipay</span>
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("wechat")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all border",
            paymentMethod === "wechat"
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.42 6.42 0 01-.248-1.753c0-3.694 3.452-6.692 7.706-6.692.257 0 .507.023.756.048C16.708 4.858 13.073 2.188 8.691 2.188zm-2.85 4.56a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2zm5.7 0a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2zm4.3 4.378c-3.652 0-6.615 2.472-6.615 5.517s2.963 5.517 6.615 5.517a7.8 7.8 0 002.222-.323.617.617 0 01.51.073l1.36.795a.233.233 0 00.119.04.21.21 0 00.207-.211c0-.051-.02-.102-.034-.152l-.279-1.057a.422.422 0 01.152-.474C21.655 18.79 22.5 17.14 22.5 15.643c0-3.045-2.963-5.517-6.615-5.517h.056zm-2.43 3.201a.883.883 0 110 1.767.883.883 0 010-1.767zm4.858 0a.883.883 0 110 1.767.883.883 0 010-1.767z"/>
          </svg>
          <span>WeChat</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowCoupon(!showCoupon)}
        className="w-full mb-3 py-2 px-3 rounded-lg text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 transition-all border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
      >
        <Tag className="w-3.5 h-3.5" />
        <span>{appliedCoupon ? `优惠码: ${appliedCoupon}` : "有优惠码？"}</span>
        {showCoupon ? (
          <ChevronUp className="w-3.5 h-3.5 ml-auto" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-auto" />
        )}
      </button>

      {showCoupon && (
        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          {appliedCoupon && couponData?.valid ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {appliedCoupon}
                  {couponData.type === "percentage"
                    ? ` (-${couponData.discount}%)`
                    : couponData.type === "fixed"
                    ? ` (-${currency === "cny" ? "¥" : "$"}${couponData.discount})`
                    : null}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    if (couponData) setCouponData(null);
                  }}
                  placeholder="输入优惠码"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyCoupon();
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    couponLoading || !couponCode.trim()
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  )}
                >
                  {couponLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "应用"
                  )}
                </button>
              </div>
              {couponData && !couponData.valid && couponData.error && (
                <p className="mt-2 text-xs text-red-600">{couponData.error}</p>
              )}
            </>
          )}
        </div>
      )}

      <button
        onClick={() => handlePayment(false)}
        disabled={loading}
        className={cn(
          "w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
          isPopular
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200",
          loading && "opacity-70 cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{retryCount > 0 ? `Retry ${retryCount}/${maxRetries}...` : "Processing..."}</span>
          </>
        ) : (
          <>
            {paymentMethod === "alipay" ? (
              <Image
                src="/icons/alipay.svg"
                alt="Alipay"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            ) : paymentMethod === "wechat" ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.42 6.42 0 01-.248-1.753c0-3.694 3.452-6.692 7.706-6.692.257 0 .507.023.756.048C16.708 4.858 13.073 2.188 8.691 2.188zm-2.85 4.56a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2zm5.7 0a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2zm4.3 4.378c-3.652 0-6.615 2.472-6.615 5.517s2.963 5.517 6.615 5.517a7.8 7.8 0 002.222-.323.617.617 0 01.51.073l1.36.795a.233.233 0 00.119.04.21.21 0 00.207-.211c0-.051-.02-.102-.034-.152l-.279-1.057a.422.422 0 01.152-.474C21.655 18.79 22.5 17.14 22.5 15.643c0-3.045-2.963-5.517-6.615-5.517h.056zm-2.43 3.201a.883.883 0 110 1.767.883.883 0 010-1.767zm4.858 0a.883.883 0 110 1.767.883.883 0 010-1.767z"/>
              </svg>
            ) : (
              <Zap className="w-5 h-5" />
            )}
            <span>
              {appliedCoupon && couponData?.valid ? (
                <>
                  <span className="line-through opacity-50">{currency === "cny" ? "¥" : "$"}{price}</span>
                  <span className="ml-1">{currency === "cny" ? "¥" : "$"}{formatPrice(discountedPrice)}</span>
                  <span>/{billingPeriod === "monthly" ? "月" : "年"}</span>
                </>
              ) : (
                <>{currency === "cny" ? "¥" : "$"}{price}/{billingPeriod === "monthly" ? "月" : "年"}</>
              )}
            </span>
          </>
        )}
      </button>

      {showQrDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">WeChat Pay</h3>
              <button
                onClick={() => {
                  setShowQrDialog(false);
                  setQrCodeUrl("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="3" height="3"/>
                  <rect x="18" y="14" width="3" height="3"/>
                  <rect x="14" y="18" width="3" height="3"/>
                  <rect x="18" y="18" width="3" height="3"/>
                </svg>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Open WeChat and scan the QR code to complete payment
              </p>
              <a
                href={qrCodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-800 underline break-all text-center"
              >
                Open payment link in WeChat
              </a>
            </div>
          </div>
        </div>
      )}

      {showError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start justify-between">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setShowError(false)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {retryCount < maxRetries && (
            <button
              onClick={handleRetry}
              className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry ({maxRetries - retryCount} attempts left)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
