"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  userEmail: string;
  userName: string | null;
  plan: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = ["", "active", "inactive", "canceled", "past_due"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-700 text-gray-300",
      pro: "bg-purple-600/30 text-purple-300",
      business: "bg-orange-600/30 text-orange-300",
    };
    return colors[plan] || colors.free;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-600/30 text-green-300",
      inactive: "bg-gray-700 text-gray-400",
      canceled: "bg-red-600/30 text-red-300",
      past_due: "bg-yellow-600/30 text-yellow-300",
    };
    return colors[status] || colors.inactive;
  };

  const planPrice = (plan: string) => {
    const prices: Record<string, string> = {
      free: "$0",
      pro: "$9.99",
      business: "$29.99",
    };
    return prices[plan] || "$0";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-gray-400 mt-1">View subscription orders</p>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="text-gray-400 text-sm">
        {total} order{total !== 1 ? "s" : ""} total
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">User</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Payment</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Period End</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-gray-200 text-sm">{order.userEmail}</p>
                      {order.userName && (
                        <p className="text-gray-500 text-xs">{order.userName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium capitalize",
                          planBadge(order.plan)
                        )}
                      >
                        {order.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-200 text-sm">
                      {planPrice(order.plan)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium capitalize",
                          statusBadge(order.status)
                        )}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {order.stripeSubscriptionId ? "Stripe" : order.stripeCustomerId ? "Stripe" : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {order.currentPeriodEnd
                        ? new Date(order.currentPeriodEnd).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-gray-400 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
