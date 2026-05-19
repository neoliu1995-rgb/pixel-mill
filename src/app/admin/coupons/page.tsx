"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  Ticket,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CouponItem {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  planRestriction: string | null;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState("percentage");
  const [formValue, setFormValue] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formValidFrom, setFormValidFrom] = useState("");
  const [formValidUntil, setFormValidUntil] = useState("");
  const [formPlanRestriction, setFormPlanRestriction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) throw new Error("Failed to fetch coupons");
      const data = await res.json();
      setCoupons(data.coupons);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreate = async () => {
    if (!formCode || !formValue) {
      showMessage("Code and value are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          type: formType,
          value: parseFloat(formValue),
          maxUses: formMaxUses || null,
          validFrom: formValidFrom || null,
          validUntil: formValidUntil || null,
          planRestriction: formPlanRestriction || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showMessage(data.error || "Failed to create coupon", "error");
        return;
      }

      showMessage("Coupon created successfully", "success");
      setShowCreateModal(false);
      resetForm();
      fetchCoupons();
    } catch {
      showMessage("Failed to create coupon", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;

    setDeleting(code);
    try {
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage(data.error || "Failed to delete coupon", "error");
        return;
      }
      showMessage("Coupon deleted successfully", "success");
      fetchCoupons();
    } catch {
      showMessage("Failed to delete coupon", "error");
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormCode("");
    setFormType("percentage");
    setFormValue("");
    setFormMaxUses("");
    setFormValidFrom("");
    setFormValidUntil("");
    setFormPlanRestriction("");
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Coupons</h1>
          <p className="text-gray-400 mt-1">Manage discount coupons</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {message && (
        <div
          className={cn(
            "flex items-center gap-2 p-4 rounded-xl",
            messageType === "success"
              ? "bg-green-900/30 border border-green-800"
              : "bg-red-900/30 border border-red-800"
          )}
        >
          {messageType === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <p
            className={cn(
              "text-sm",
              messageType === "success" ? "text-green-300" : "text-red-300"
            )}
          >
            {message}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No coupons yet</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Code</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Value</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Usage</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Validity</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const expired = isExpired(coupon.validUntil);
                  return (
                    <tr
                      key={coupon.id}
                      className={cn(
                        "border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors",
                        expired && "opacity-50"
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="text-gray-200 text-sm font-mono">
                          {coupon.code}
                        </span>
                        {expired && (
                          <span className="ml-2 px-1.5 py-0.5 bg-red-600/30 text-red-300 text-xs rounded">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm capitalize">
                        {coupon.type}
                      </td>
                      <td className="px-4 py-3 text-gray-200 text-sm">
                        {coupon.type === "percentage"
                          ? `${coupon.value}%`
                          : `$${coupon.value}`}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {coupon.usedCount}
                        {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        <div>
                          <span>{new Date(coupon.validFrom).toLocaleDateString()}</span>
                          {coupon.validUntil && (
                            <>
                              {" - "}
                              <span>{new Date(coupon.validUntil).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {coupon.planRestriction || "All"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(coupon.code)}
                          disabled={deleting === coupon.code}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Create Coupon</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. SUMMER2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Value *
                  </label>
                  <input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={formType === "percentage" ? "10" : "5.00"}
                    step={formType === "percentage" ? "1" : "0.01"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Max Uses
                </label>
                <input
                  type="number"
                  value={formMaxUses}
                  onChange={(e) => setFormMaxUses(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Plan Restriction
                </label>
                <select
                  value={formPlanRestriction}
                  onChange={(e) => setFormPlanRestriction(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Plans</option>
                  <option value="pro">Pro Only</option>
                  <option value="business">Business Only</option>
                  <option value="pro,business">Pro & Business</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
