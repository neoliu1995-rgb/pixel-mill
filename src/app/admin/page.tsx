"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CreditCard,
  DollarSign,
  Image,
  TrendingUp,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalGenerations: number;
  planBreakdown: Record<string, number>;
  recentSignups: { email: string; name: string | null; createdAt: string }[];
  recentPayments: { email: string; plan: string; amount: number; date: string }[];
  dailyGenerations: { date: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-900/30 border border-red-800 rounded-xl p-4">
        <p className="text-red-400">{error || "No data available"}</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-purple-400 hover:text-purple-300 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const maxGen = Math.max(...stats.dailyGenerations.map((d) => d.count), 1);

  const metricCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "from-blue-600 to-blue-500",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions.toLocaleString(),
      icon: CreditCard,
      color: "from-green-600 to-green-500",
    },
    {
      label: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "from-purple-600 to-purple-500",
    },
    {
      label: "Total Generations",
      value: stats.totalGenerations.toLocaleString(),
      icon: Image,
      color: "from-orange-600 to-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">{card.label}</span>
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                  card.color
                )}
              >
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">
              7-Day Generation Trend
            </h2>
          </div>
          <div className="flex items-end gap-2 h-48">
            {stats.dailyGenerations.map((day) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs text-gray-500">
                  {day.count > 0 ? day.count : ""}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm min-h-[4px] transition-all"
                  style={{
                    height: `${Math.max((day.count / maxGen) * 160, 4)}px`,
                  }}
                />
                <span className="text-xs text-gray-500">
                  {day.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">
              Plan Distribution
            </h2>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.planBreakdown).map(([plan, count]) => {
              const total = Object.values(stats.planBreakdown).reduce(
                (a, b) => a + b,
                0
              );
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300 capitalize">{plan}</span>
                    <span className="text-gray-400">
                      {count} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">
              Recent Signups
            </h2>
          </div>
          <div className="space-y-2">
            {stats.recentSignups.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent signups</p>
            ) : (
              stats.recentSignups.map((user, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg"
                >
                  <div>
                    <p className="text-gray-200 text-sm">{user.email}</p>
                    {user.name && (
                      <p className="text-gray-500 text-xs">{user.name}</p>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">
              Recent Payments
            </h2>
          </div>
          <div className="space-y-2">
            {stats.recentPayments.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent payments</p>
            ) : (
              stats.recentPayments.map((payment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg"
                >
                  <div>
                    <p className="text-gray-200 text-sm">{payment.email}</p>
                    <p className="text-gray-500 text-xs capitalize">
                      {payment.plan}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm font-medium">
                      ${payment.amount}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(payment.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
