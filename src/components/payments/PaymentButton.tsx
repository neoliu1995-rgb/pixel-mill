"use client";

import { useState } from "react";
import { Zap, Loader2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentButtonProps {
  plan: "pro" | "business";
  billingPeriod: "monthly" | "yearly";
  price: string;
  currency?: string;
  isPopular?: boolean;
}

export default function PaymentButton({
  plan = "pro",
  billingPeriod = "monthly",
  price,
  currency = "CNY",
  isPopular = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showError, setShowError] = useState(false);

  const maxRetries = 2;

  const handlePayment = async (retry = false) => {
    if (retry) {
      setRetryCount(prev => prev + 1);
    }
    setLoading(true);
    setError(null);
    setShowError(false);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, billingPeriod }),
      });

      const data = await response.json();

      if (data.url) {
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
            <Zap className="w-5 h-5" />
            <span>
              {currency === "CNY" ? "¥" : "$"}{price}/
              {billingPeriod === "monthly" ? "月" : "年"}
            </span>
          </>
        )}
      </button>

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