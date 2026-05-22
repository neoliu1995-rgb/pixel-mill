"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred. Please try again.");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {isSubmitted ? (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t.auth?.forgotPasswordSuccessTitle || "Check Your Email"}
              </h1>
              <p className="text-gray-500 mb-6">
                {t.auth?.forgotPasswordSuccessMessage ||
                  "If an account with that email exists, we've sent a password reset link."}
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                {t.auth?.backToSignIn || "Back to Sign In"}
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {t.auth?.forgotPasswordTitle || "Forgot Password?"}
                </h1>
                <p className="text-gray-500">
                  {t.auth?.forgotPasswordSubtitle ||
                    "Enter your email and we'll send you a reset link."}
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
                    {t.auth?.email || "Email"}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.auth?.emailPlaceholder || "you@example.com"}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
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
                      {t.auth?.sendResetLink || "Send Reset Link"}
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
