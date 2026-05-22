"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t.auth?.passwordMinLength || "Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth?.passwordMismatch || "Passwords do not match");
      return;
    }

    if (!token) {
      setError(t.auth?.invalidResetToken || "Invalid or missing reset token");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred. Please try again.");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t.auth?.invalidResetToken || "Invalid Reset Link"}
            </h1>
            <p className="text-gray-500 mb-6">
              {t.auth?.invalidResetTokenMessage ||
                "This password reset link is invalid or has expired. Please request a new one."}
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
            >
              {t.auth?.requestNewLink || "Request New Link"}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {isSuccess ? (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t.auth?.resetPasswordSuccessTitle || "Password Reset Successful"}
              </h1>
              <p className="text-gray-500 mb-6">
                {t.auth?.resetPasswordSuccessMessage ||
                  "Your password has been reset. You can now sign in with your new password."}
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
              >
                {t.auth?.login || "Sign In"}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {t.auth?.resetPasswordTitle || "Reset Password"}
                </h1>
                <p className="text-gray-500">
                  {t.auth?.resetPasswordSubtitle || "Enter your new password below."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.auth?.newPassword || "New Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      minLength={8}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {t.auth?.passwordRequirement || "Must be at least 8 characters"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.auth?.confirmPassword || "Confirm Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {t.auth?.resetPasswordButton || "Reset Password"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  &larr; {t.auth?.backToSignIn || "Back to Sign In"}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
