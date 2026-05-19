"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CheckCircle, ArrowLeft, Lock, Shield, Sparkles, Zap, Crown } from "lucide-react";
import PaymentButton from "@/components/payments/PaymentButton";
import { PLANS, getPlansForCurrency } from "@/lib/stripe";

export default function PricingPage() {
  const { t } = useLanguage();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<"usd" | "cny">("usd");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "business">("pro");

  const currentPlans = getPlansForCurrency(currency);
  const currencySymbol = currency === "usd" ? "$" : "¥";

  const handleSubscribe = (plan: "pro" | "business") => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="hidden lg:block w-1/2 bg-gradient-to-br from-purple-600 to-pink-600"></div>
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 py-16">
          <button
            onClick={() => {
              setPaymentComplete(false);
              setShowPayment(false);
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors self-start"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.pricing.backToPricing}
          </button>
          
          <div className="max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.pricing.payment.successful}</h2>
              <p className="text-gray-500">
                {t.pricing.payment.thankYou}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">{t.pricing.payment.subscription}</span>
                <span className="font-semibold text-gray-900">{t.pricing.plans[selectedPlan].name}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">{t.pricing.payment.billingPeriod}</span>
                <span className="font-semibold text-gray-900">{billingPeriod === "monthly" ? t.pricing.monthly : t.pricing.yearly}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t.pricing.payment.total}</span>
                <span className="text-xl font-bold text-purple-600">
                  {currencySymbol}{billingPeriod === "monthly" ? currentPlans[selectedPlan].monthlyPrice : currentPlans[selectedPlan].yearlyPrice}
                </span>
              </div>
            </div>

            <button
              onClick={() => window.location.href = "/dashboard"}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              {t.pricing.payment.continueToDashboard}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showPayment) {
    const plan = currentPlans[selectedPlan];
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="hidden lg:block w-1/2 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col justify-center items-center p-12">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-light text-white mb-3 tracking-tight">PixelMill AI</h2>
            <p className="text-white/80 text-center mb-10 max-w-md text-base font-light tracking-wide">
              Create stunning AI-generated images effortlessly
            </p>
            
            <div className="w-full max-w-sm space-y-3">
              {plan.features.slice(0, 3).map((feature, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm tracking-wide">{feature}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="absolute top-10 right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 py-16">
          <button
            onClick={() => setShowPayment(false)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors self-start"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.pricing.backToPricing}
          </button>
          
          <div className="max-w-md">
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">{t.pricing.payment.subscription}</span>
                <span className="font-semibold text-gray-900">{t.pricing.plans[selectedPlan].name}</span>
              </div>
              
              <div className="flex justify-center mb-4">
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      billingPeriod === "monthly" 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t.pricing.monthly}
                  </button>
                  <button
                    onClick={() => setBillingPeriod("yearly")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                      billingPeriod === "yearly" 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t.pricing.yearly}
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                      {t.pricing.save} 20%
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t.pricing.payment.total}</span>
                <div className="text-right">
                  {(currentPlans[selectedPlan] as any).promotional && (
                    <div className="text-sm text-gray-400 line-through">
                      {currencySymbol}{billingPeriod === "monthly" ? (currentPlans[selectedPlan] as any).originalMonthlyPrice : (currentPlans[selectedPlan] as any).originalYearlyPrice}
                    </div>
                  )}
                  <span className="text-3xl font-bold text-gray-900">
                    {currencySymbol}{billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                    <span className="text-base font-normal text-gray-500">/{billingPeriod === "monthly" ? "mo" : "yr"}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">{t.pricing.payment.secure}</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.pricing.payment.secureCheckout}</p>
                    <p className="text-xs text-gray-500">{t.pricing.payment.poweredByStripe}</p>
                  </div>
                </div>
              </div>
            </div>

            <PaymentButton
              plan={selectedPlan}
              billingPeriod={billingPeriod}
              price={billingPeriod === "monthly" ? plan.monthlyPrice.toString() : plan.yearlyPrice.toString()}
              isPopular={plan.popular}
              currency={currency}
            />

            <p className="text-center text-xs text-gray-500 mt-4">
              {t.pricing.payment.agreeTerms}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
        <button
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 sm:mb-8 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.pricing.backToHome}
        </button>

        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-3 sm:mb-4">
            {t?.pricing?.title || "选择您的方案"}
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            {t?.pricing?.subtitle || "使用免费方案开始创作，或升级获取高级功能"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center mb-8 gap-3 sm:gap-4">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm self-center">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 sm:px-6 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
                billingPeriod === "monthly"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              月付
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 sm:px-6 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 min-h-[44px] ${
                billingPeriod === "yearly"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              年付
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                省 20%
              </span>
            </button>
          </div>
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm self-center">
            <button
              onClick={() => setCurrency("usd")}
              className={`px-4 sm:px-6 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
                currency === "usd"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              USD $
            </button>
            <button
              onClick={() => setCurrency("cny")}
              className={`px-4 sm:px-6 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
                currency === "cny"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              CNY ¥
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="absolute -top-3 left-8 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              {t.pricing.starter}
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-900">{t.pricing.plans.free.name}</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">{t.pricing.plans.free.description}</p>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">{currencySymbol}0</span>
              <span className="text-gray-500 ml-1">{t.pricing.freeForever}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {(t.pricing.plans.free.features as string[]).map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className="w-full py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors min-h-[44px]"
            >
              {t.pricing.freeStart}
            </button>
          </div>

          <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-2xl md:-translate-y-4 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-yellow-400 text-purple-700 text-sm font-bold rounded-full flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {t.pricing.popular}
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-yellow-300" />
              <h3 className="text-xl font-bold">{t.pricing.plans.pro.name}</h3>
            </div>
            
            <p className="text-sm text-white/80 mb-4">{t.pricing.plans.pro.description}</p>
            
            <div className="mb-6">
              {currentPlans.pro.promotional && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-white/50 line-through">
                    {currencySymbol}{billingPeriod === "monthly" ? (currentPlans.pro as any).originalMonthlyPrice : (currentPlans.pro as any).originalYearlyPrice}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">
                    -{Math.round((1 - currentPlans.pro.monthlyPrice / (currentPlans.pro as any).originalMonthlyPrice) * 100)}%
                  </span>
                </div>
              )}
              <span className="text-5xl font-bold">
                {currencySymbol}{billingPeriod === "monthly" ? currentPlans.pro.monthlyPrice : currentPlans.pro.yearlyPrice}
              </span>
              <span className="text-white/70 ml-1">/{billingPeriod === "monthly" ? t.pricing.monthly : t.pricing.yearly}</span>
              {billingPeriod === "yearly" && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                  {t.pricing.save} {currencySymbol}{currency === "usd" ? ((currentPlans.pro as any).originalYearlyPrice - currentPlans.pro.yearlyPrice).toFixed(2) : ((currentPlans.pro as any).originalYearlyPrice - currentPlans.pro.yearlyPrice).toFixed(1)}/{t.pricing.monthly}
                </span>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {(t.pricing.plans.pro.features as string[]).map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                  <span className="text-white/90 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe("pro")}
              className="w-full py-3 rounded-xl font-semibold bg-white text-purple-600 hover:bg-gray-100 transition-colors shadow-lg min-h-[44px]"
            >
              {t.pricing.upgradeNow}
            </button>
          </div>

          <div className="relative bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="absolute -top-3 left-8 px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
              {t.pricing.enterprise}
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-6 h-6 text-purple-500" />
              <h3 className="text-xl font-bold text-gray-900">{t.pricing.plans.business.name}</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">{t.pricing.plans.business.description}</p>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                {currencySymbol}{billingPeriod === "monthly" ? currentPlans.business.monthlyPrice : currentPlans.business.yearlyPrice}
              </span>
              <span className="text-gray-500 ml-1">/{billingPeriod === "monthly" ? t.pricing.monthly : t.pricing.yearly}</span>
              {billingPeriod === "yearly" && (
                <span className="ml-2 text-xs bg-green-100 px-2 py-1 rounded-full text-green-700">
                  {t.pricing.save} {currencySymbol}{currency === "usd" ? "14.89" : "99.9"}/{t.pricing.monthly}
                </span>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {(t.pricing.plans.business.features as string[]).map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe("business")}
              className="w-full py-3 rounded-xl font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors min-h-[44px]"
            >
              {t.pricing.contactSales}
            </button>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-2xl p-4 sm:p-8 border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">{t.pricing.featureComparison}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">{t.pricing.featureTable.feature}</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">{currentPlans.free.name}</th>
                  <th className="text-center py-3 px-4 font-medium text-purple-600">{currentPlans.pro.name}</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">{currentPlans.business.name}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">{t.pricing.featureTable.generations}</td>
                  <td className="text-center py-3 px-4">10张/天</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">300张/月</td>
                  <td className="text-center py-3 px-4">800张/月</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">AI模型</td>
                  <td className="text-center py-3 px-4">Gemini</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">FLUX.2 Pro + 通义万相</td>
                  <td className="text-center py-3 px-4">FLUX.2 Flex + Qwen-Image</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">水印</td>
                  <td className="text-center py-3 px-4">有水印</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">无水印</td>
                  <td className="text-center py-3 px-4">无水印</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">特效</td>
                  <td className="text-center py-3 px-4">基础特效</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">全部特效</td>
                  <td className="text-center py-3 px-4">全部特效</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">AI文案生成</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">抠图</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">20次/月</td>
                  <td className="text-center py-3 px-4">无限</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">电商工具</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">{t.pricing.featureTable.api}</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">{t.pricing.featureTable.commercial}</td>
                  <td className="text-center py-3 px-4">✗</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">{t.pricing.featureTable.support}</td>
                  <td className="text-center py-3 px-4">{t.pricing.featureTable.community}</td>
                  <td className="text-center py-3 px-4 text-purple-600 font-medium">{t.pricing.featureTable.email}</td>
                  <td className="text-center py-3 px-4">优先支持</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}