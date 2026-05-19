"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  User as UserIcon,
  CreditCard,
  ImageIcon,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  plan: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  generationCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 mt-1">Manage platform users</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="text-gray-400 text-sm">
        {total} user{total !== 1 ? "s" : ""} total
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Generations</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-200 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{user.name || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium capitalize",
                          planBadge(user.plan)
                        )}
                      >
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium capitalize",
                          statusBadge(user.subscriptionStatus)
                        )}
                      >
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {user.generationCount}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
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

      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-200 text-sm">{selectedUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-gray-200 text-sm">{selectedUser.name || "Not set"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Plan / Status</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium capitalize",
                        planBadge(selectedUser.plan)
                      )}
                    >
                      {selectedUser.plan}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium capitalize",
                        statusBadge(selectedUser.subscriptionStatus)
                      )}
                    >
                      {selectedUser.subscriptionStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Total Generations</p>
                  <p className="text-gray-200 text-sm">{selectedUser.generationCount}</p>
                </div>
              </div>

              {selectedUser.currentPeriodEnd && (
                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Current Period End</p>
                    <p className="text-gray-200 text-sm">
                      {new Date(selectedUser.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-gray-200 text-sm">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
