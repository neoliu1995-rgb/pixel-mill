"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  Plus,
  X,
  Copy,
  Check,
  ArrowLeft,
  PenLine,
  Type,
  List,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface CopywritingResult {
  title: string;
  bulletPoints: string[];
  description: string;
  socialCopy: string;
  adSlogan: string;
  provider: string;
  model: string;
  cost: number;
}

export default function CopywritingPage() {
  const { t } = useLanguage();
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [sellingPoints, setSellingPoints] = useState<string[]>([""]);
  const [targetAudience, setTargetAudience] = useState("");
  const [style, setStyle] = useState<"professional" | "lively" | "literary" | "promotional">("professional");
  const [platform, setPlatform] = useState<"taobao" | "jd" | "pinduoduo" | "amazon" | "shopify" | "xiaohongshu" | "douyin">("taobao");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CopywritingResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const CATEGORIES = [
    { value: "digital", label: t.copywriting.categoryDigital },
    { value: "clothing", label: t.copywriting.categoryFashion },
    { value: "beauty", label: t.copywriting.categoryBeauty },
    { value: "food", label: t.copywriting.categoryFood },
    { value: "home", label: t.copywriting.categoryHome },
    { value: "baby", label: t.copywriting.categoryBaby },
    { value: "other", label: t.copywriting.categoryOther },
  ];

  const STYLES = [
    { value: "professional", label: t.copywriting.styleProfessional },
    { value: "lively", label: t.copywriting.styleLively },
    { value: "literary", label: t.copywriting.styleLiterary },
    { value: "promotional", label: t.copywriting.stylePromotional },
  ];

  const PLATFORMS = [
    { value: "taobao", label: t.copywriting.platformTaobao },
    { value: "jd", label: t.copywriting.platformJd },
    { value: "pinduoduo", label: t.copywriting.platformPdd },
    { value: "xiaohongshu", label: t.copywriting.platformXiaohongshu },
    { value: "douyin", label: t.copywriting.platformDouyin },
    { value: "amazon", label: t.copywriting.platformAmazon },
    { value: "shopify", label: t.copywriting.platformShopify },
  ];

  const addSellingPoint = () => {
    if (sellingPoints.length < 5) {
      setSellingPoints([...sellingPoints, ""]);
    }
  };

  const removeSellingPoint = (index: number) => {
    if (sellingPoints.length > 1) {
      setSellingPoints(sellingPoints.filter((_, i) => i !== index));
    }
  };

  const updateSellingPoint = (index: number, value: string) => {
    const updated = [...sellingPoints];
    updated[index] = value;
    setSellingPoints(updated);
  };

  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError(t.copywritingPage.errorProductName);
      return;
    }

    const validSellingPoints = sellingPoints.filter((s) => s.trim());
    if (validSellingPoints.length === 0) {
      setError(t.copywritingPage.errorSellingPoint);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/copywriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          category: category || undefined,
          sellingPoints: validSellingPoints,
          targetAudience: targetAudience.trim() || undefined,
          style,
          platform,
          userTier: "free",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t.copywritingPage.errorGenerate);
      }

      setResult({
        title: data.title,
        bulletPoints: data.bulletPoints,
        description: data.description,
        socialCopy: data.socialCopy,
        adSlogan: data.adSlogan,
        provider: data.provider,
        model: data.model,
        cost: data.cost,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const resultCards = result
    ? [
        {
          key: "title",
          icon: <Type className="w-5 h-5" />,
          label: t.copywriting.titleLabel,
          content: result.title,
          gradient: "from-purple-500 to-indigo-500",
        },
        {
          key: "bulletPoints",
          icon: <List className="w-5 h-5" />,
          label: t.copywriting.sellingPointsLabel,
          content: result.bulletPoints.join("\n"),
          gradient: "from-blue-500 to-cyan-500",
        },
        {
          key: "description",
          icon: <PenLine className="w-5 h-5" />,
          label: t.copywriting.descriptionLabel,
          content: result.description,
          gradient: "from-pink-500 to-rose-500",
        },
        {
          key: "socialCopy",
          icon: <MessageSquare className="w-5 h-5" />,
          label: t.copywriting.socialCopyLabel,
          content: result.socialCopy,
          gradient: "from-orange-500 to-amber-500",
        },
        {
          key: "adSlogan",
          icon: <Megaphone className="w-5 h-5" />,
          label: t.copywriting.adSloganLabel,
          content: result.adSlogan,
          gradient: "from-green-500 to-emerald-500",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t.copywriting.title}</h1>
              <p className="text-xs text-gray-400">{t.copywriting.subtitle}</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              {t.nav.backToHome}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t.copywritingPage.aiPowered}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.copywriting.title}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t.copywriting.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <PenLine className="w-5 h-5" />
                  {t.copywritingPage.productInfo}
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.copywritingPage.productNameRequired}
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={t.copywritingPage.productNamePlaceholder}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.copywriting.categoryLabel}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t.copywritingPage.selectCategory}</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.copywritingPage.sellingPointsMax}
                  </label>
                  <div className="space-y-2">
                    {sellingPoints.map((point, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => updateSellingPoint(index, e.target.value)}
                          placeholder={t.copywritingPage.sellingPointPlaceholder}
                          className="flex-1 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                        />
                        {sellingPoints.length > 1 && (
                          <button
                            onClick={() => removeSellingPoint(index)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {sellingPoints.length < 5 && (
                      <button
                        onClick={addSellingPoint}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        {t.copywritingPage.addSellingPoint}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.copywriting.targetAudience}
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder={t.copywritingPage.targetAudiencePlaceholder}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.copywriting.styleLabel}
                    </label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value as typeof style)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      {STYLES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.copywriting.platformLabel}
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as typeof platform)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !productName.trim()}
                  className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.copywritingPage.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {t.copywritingPage.generateCopyBtn}
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                {resultCards.map((card) => (
                  <div
                    key={card.key}
                    className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden"
                  >
                    <div className={`bg-gradient-to-r ${card.gradient} px-6 py-3 flex items-center justify-between`}>
                      <h4 className="text-white font-semibold flex items-center gap-2">
                        {card.icon}
                        {card.label}
                      </h4>
                      <button
                        onClick={() => copyToClipboard(card.content, card.key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-all"
                      >
                        {copiedField === card.key ? (
                          <>
                            <Check className="w-4 h-4" />
                            {t.copywritingPage.copiedBtn}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            {t.copywritingPage.copy}
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-6">
                      {card.key === "bulletPoints" ? (
                        <ul className="space-y-2">
                          {result.bulletPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                              <span className="text-purple-400 font-bold mt-0.5">{i + 1}.</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {card.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="text-center text-xs text-gray-500">
                  {t.copywritingPage.generatedBy} {result.provider} / {result.model} | {t.copywritingPage.cost}: ${result.cost}
                </div>
              </>
            ) : (
              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-purple-400" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">
                  {t.copywritingPage.fillInfoToStart}
                </h4>
                <p className="text-sm text-gray-400">
                  {t.copywritingPage.fillInfoDesc}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
