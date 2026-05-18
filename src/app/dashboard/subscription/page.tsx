"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Calendar,
  Check,
  X,
  AlertTriangle,
  FileText,
  ChevronRight,
  RefreshCw,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  plan: string;
  status: "active" | "canceled" | "past_due";
  currentPeriodEnd: string;
  price: number;
  interval: "month" | "year";
  invoices: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  amount: number;
  status: "paid" | "pending" | "draft";
  date: string;
  pdfUrl?: string;
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subscription");
      const data = await response.json();
      if (data.subscription) {
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
      setError(null);
    } catch (err) {
      setError("Failed to fetch subscription");
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setSubscription({ ...subscription!, status: "canceled" });
        setCancelConfirm(false);
      } else {
        setError(data.error || "Failed to cancel subscription");
      }
    } catch (err) {
      setError("Failed to cancel subscription");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleSwitchPlan = async (newPlan: "monthly" | "yearly") => {
    try {
      const response = await fetch("/api/subscription/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to switch plan");
      }
    } catch (err) {
      setError("Failed to switch plan");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchSubscription}
            className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-500 mt-2">Manage your subscription plan and billing</p>
      </div>

      {!subscription ? (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
          <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-500 mb-6">Upgrade to Pro for unlimited generations and premium features</p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Zap className="w-5 h-5" />
            Upgrade to Pro
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                  <p className="text-gray-500">Pro {subscription.interval === "month" ? "Monthly" : "Yearly"}</p>
                </div>
              </div>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  subscription.status === "active"
                    ? "bg-green-100 text-green-700"
                    : subscription.status === "canceled"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-yellow-100 text-yellow-700"
                )}
              >
                {subscription.status === "active" ? "Active" : subscription.status === "canceled" ? "Canceled" : "Past Due"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Current Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${subscription.price}/{subscription.interval === "month" ? "mo" : "yr"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Next Billing Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {["Unlimited Generations", "HD Resolution", "All AI Models", "Priority Processing", "Commercial License"].map((feature, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                  <Check className="w-4 h-4" />
                  {feature}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleSwitchPlan(subscription.interval === "month" ? "yearly" : "monthly")}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Switch to {subscription.interval === "month" ? "Yearly" : "Monthly"}
              </button>
              {subscription.status === "active" && (
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
                  <p className="text-gray-500">View and download your billing history</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {subscription.invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No invoices yet</p>
                </div>
              ) : (
                subscription.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          invoice.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : invoice.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {invoice.status === "paid" ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Invoice #{invoice.id.slice(-8)}</p>
                        <p className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900">${invoice.amount}</span>
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Download <ChevronRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {cancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Cancellation</h3>
                <p className="text-gray-500 text-sm">Are you sure you want to cancel?</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                Your subscription will remain active until {new Date(subscription?.currentPeriodEnd || Date.now()).toLocaleDateString()}.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 inline mr-2" />
                Cancel
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCanceling ? (
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                )}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}