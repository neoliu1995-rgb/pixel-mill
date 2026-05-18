"use client";

import { useState, useEffect } from "react";
import { User, Mail, Edit3, Save, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

interface UserData {
  id: string;
  email: string;
  name: string;
  plan: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError(t.dashboard.profile.pleaseLogin);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setName(data.user.name || "");
        setError(null);
      } else {
        setError(t.dashboard.profile.failedFetchUserData);
      }
    } catch (err) {
      setError(t.dashboard.profile.failedFetchUserData);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditing(false);
        setMessage(t.dashboard.profile.profileUpdated);
        setMessageType("success");
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(t.dashboard.profile.failedUpdateProfile);
        setMessageType("error");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage(t.dashboard.profile.failedUpdateProfile);
      setMessageType("error");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage(t.dashboard.profile.passwordsNotMatch);
      setMessageType("error");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setMessage(t.dashboard.profile.passwordMinLength);
      setMessageType("error");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        setMessage(t.dashboard.profile.passwordChanged);
        setMessageType("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || t.dashboard.profile.failedChangePassword);
        setMessageType("error");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage(t.dashboard.profile.failedChangePassword);
      setMessageType("error");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchUser}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            {t.dashboard.profile.retry}
          </button>
        </div>
      </div>
    );
  }

  const userData = user!;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.profile.title}</h1>
        <p className="text-gray-500 mt-2">{t.dashboard.profile.subtitle}</p>
      </div>

      {message && (
        <div
          className={cn(
            "mb-6 p-4 rounded-xl",
            messageType === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          )}
        >
          <div className="flex items-center gap-2">
            {messageType === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={cn(messageType === "success" ? "text-green-700" : "text-red-700")}>
              {message}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t.dashboard.profile.enterName}
                />
                <button
                  onClick={handleUpdateProfile}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setName(userData.name || "");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {t.dashboard.profile.cancel}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900">
                  {userData.name || t.dashboard.profile.noName}
                </h2>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-1"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{t.dashboard.profile.editName}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">{userData.email}</span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm font-medium">
                {userData.plan === "free" ? "F" : "P"}
              </span>
            </div>
            <span className="text-gray-700">
              {userData.plan === "free" ? t.dashboard.profile.freePlan : t.dashboard.profile.proPlan}
            </span>
            <span
              className={cn(
                "ml-auto px-2 py-1 rounded-full text-xs font-medium",
                userData.subscriptionStatus === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {userData.subscriptionStatus === "active" ? t.dashboard.profile.active : userData.subscriptionStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500 text-sm">{t.dashboard.profile.memberSince}</span>
            <span className="text-gray-700">
              {new Date(userData.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.profile.changePassword}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.dashboard.profile.currentPassword}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                placeholder={t.dashboard.profile.enterCurrentPassword}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.dashboard.profile.newPassword}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={t.dashboard.profile.enterNewPassword}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.dashboard.profile.confirmNewPassword}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={t.dashboard.profile.confirmPassword}
            />
          </div>

          <button
            onClick={handleChangePassword}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            {t.dashboard.profile.changePassword}
          </button>
        </div>
      </div>
    </div>
  );
}