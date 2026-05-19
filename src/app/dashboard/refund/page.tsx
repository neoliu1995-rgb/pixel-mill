"use client";

import { useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";

export default function RefundPage() {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const subscriptionId = searchParams.get("subscriptionId");

      if (!subscriptionId) {
        setError("Subscription ID is missing");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, reason }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setRefundAmount(data.refundAmount);
      } else {
        setError(data.error || "Failed to process refund");
      }
    } catch (err) {
      setError("Failed to process refund request");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Refund Processed</h2>
          <p className="text-gray-500 mb-4">
            Your subscription has been canceled and your refund is being processed.
          </p>
          {refundAmount !== null && refundAmount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-700 font-semibold">
                Refund Amount: ${refundAmount.toFixed(2)}
              </p>
            </div>
          )}
          <a
            href="/dashboard/subscription"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subscription
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Request a Refund</h1>
        <p className="text-gray-500 mt-2">Cancel your subscription and request a refund</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Refund Request</h2>
            <p className="text-gray-500">This will cancel your subscription immediately</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            Your subscription will be canceled immediately and a refund will be issued for the latest payment. This action cannot be undone.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Reason for refund (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900"
              placeholder="Tell us why you're requesting a refund..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <a
              href="/dashboard/subscription"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 inline mr-2" />
              )}
              Submit Refund Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
