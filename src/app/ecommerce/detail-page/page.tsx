"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Download,
  X,
  Check,
  Sparkles,
  ShoppingBag,
  FileText,
  Plus,
  Trash2,
  Copy,
  Code,
  Eye,
} from "lucide-react";

type DetailStyle = "professional" | "lively" | "luxury" | "minimal";
type TabView = "preview" | "code" | "modules";

export default function DetailPagePage() {
  const { t } = useLanguage();
  const dp = t.ecommercePage.detailPagePage;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [sellingPoints, setSellingPoints] = useState<string[]>([""]);
  const [style, setStyle] = useState<DetailStyle>("professional");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    copywriting: { title: string; bulletPoints: string[]; description: string; adSlogan: string };
    html: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>("preview");
  const [copied, setCopied] = useState(false);

  const styleOptions: { id: DetailStyle; label: string; desc: string; color: string }[] = [
    { id: "professional", label: dp.detailPageStyle, desc: dp.professionalDesc, color: "from-blue-500 to-indigo-500" },
    { id: "lively", label: dp.detailPageStyle, desc: dp.livelyDesc, color: "from-red-500 to-orange-500" },
    { id: "luxury", label: dp.detailPageStyle, desc: dp.luxuryDesc, color: "from-amber-600 to-yellow-500" },
    { id: "minimal", label: dp.detailPageStyle, desc: dp.minimalDesc, color: "from-gray-500 to-gray-400" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError(dp.errorUploadImage);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(dp.errorFileSize);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSellingPoint = () => {
    setSellingPoints([...sellingPoints, ""]);
  };

  const removeSellingPoint = (index: number) => {
    if (sellingPoints.length <= 1) return;
    setSellingPoints(sellingPoints.filter((_, i) => i !== index));
  };

  const updateSellingPoint = (index: number, value: string) => {
    const updated = [...sellingPoints];
    updated[index] = value;
    setSellingPoints(updated);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError(dp.errorUploadFirst);
      return;
    }
    if (!productName.trim()) {
      setError(dp.errorProductName);
      return;
    }
    if (!category.trim()) {
      setError(dp.errorCategory);
      return;
    }

    const validPoints = sellingPoints.filter((p) => p.trim());
    if (validPoints.length === 0) {
      setError(dp.errorSellingPoint);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 12;
      });
    }, 300);

    try {
      const response = await fetch("/api/detail-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          productImageUrl: uploadedImage,
          category: category.trim(),
          sellingPoints: validPoints,
          style,
          userTier: "free",
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || dp.errorGenerate);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setResult(data);
      setActiveTab("preview");
    } catch (err) {
      clearInterval(progressInterval);
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyHtml = async () => {
    if (!result?.html) return;
    try {
      await navigator.clipboard.writeText(result.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = result.html;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadHtml = () => {
    if (!result?.html) return;
    const blob = new Blob([result.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `detail-page-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setUploadedImage(null);
    setResult(null);
    setError(null);
    setProductName("");
    setCategory("");
    setSellingPoints([""]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{dp.title}</h1>
              <p className="text-xs text-gray-400">{dp.subtitle}</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/ecommerce" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" />
              {t.nav.ecommerceTools}
            </Link>
            <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">
              {t.nav.backToHome}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {dp.aiPowered}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {dp.generatorTitle}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {dp.generatorDesc}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {dp.uploadProduct}
                </h3>
              </div>
              <div className="p-6">
                {!uploadedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-green-500 hover:bg-green-500/10 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-10 h-10 text-green-400" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">
                      {dp.clickOrDrag}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {dp.supportedFormats}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-square bg-gray-700 rounded-xl overflow-hidden">
                      <Image
                        src={uploadedImage}
                        alt="Uploaded"
                        fill
                        className="object-contain"
                      />
                      <button
                        onClick={handleClear}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:scale-110 transition-all"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {uploadedImage && (
              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {dp.settings}
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      {dp.productName}
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder={dp.productNamePlaceholder}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      {dp.category}
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder={dp.categoryPlaceholder}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      {dp.sellingPoints}
                    </label>
                    <div className="space-y-2">
                      {sellingPoints.map((point, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => updateSellingPoint(index, e.target.value)}
                            placeholder={dp.sellingPointPlaceholder}
                            className="flex-1 px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {sellingPoints.length > 1 && (
                            <button
                              onClick={() => removeSellingPoint(index)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addSellingPoint}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {dp.addSellingPoint}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block">
                      {dp.detailPageStyle}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {styleOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setStyle(option.id)}
                          className={`p-3 rounded-xl text-left transition-all ${
                            style === option.id
                              ? "bg-green-600 text-white ring-2 ring-green-400"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs mt-1 opacity-70">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing || !productName.trim() || !category.trim()}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                      isProcessing || !productName.trim() || !category.trim()
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02]"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {dp.processing}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {dp.generateDetailPage}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {isProcessing && (
              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-8">
                  <div className="relative bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 overflow-hidden border border-green-500/20">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-shimmer" />
                    <div className="relative text-center">
                      <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30" />
                        <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {dp.processing}
                      </h4>
                      <p className="text-sm text-gray-400 mb-4">
                        {dp.generatingCopy}
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {Math.round(progress)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border bg-red-500/20 border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {result && (
              <>
                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      {dp.complete}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyHtml}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          copied
                            ? "bg-green-500 text-white"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? t.copywritingPage.copiedBtn : "HTML"}
                      </button>
                      <button
                        onClick={handleDownloadHtml}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        HTML
                      </button>
                    </div>
                  </div>

                  <div className="flex border-b border-gray-700">
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "preview"
                          ? "text-green-400 border-b-2 border-green-400 bg-green-500/5"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      {dp.preview}
                    </button>
                    <button
                      onClick={() => setActiveTab("code")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "code"
                          ? "text-green-400 border-b-2 border-green-400 bg-green-500/5"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      <Code className="w-4 h-4" />
                      {dp.htmlCode}
                    </button>
                    <button
                      onClick={() => setActiveTab("modules")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "modules"
                          ? "text-green-400 border-b-2 border-green-400 bg-green-500/5"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      {dp.modules}
                    </button>
                  </div>

                  <div className="p-6">
                    {activeTab === "preview" && (
                      <div className="bg-white rounded-xl overflow-hidden" style={{ maxHeight: "600px", overflowY: "auto" }}>
                        <iframe
                          srcDoc={result.html}
                          className="w-full border-0"
                          style={{ minHeight: "600px", maxHeight: "600px" }}
                          title="Detail Page Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    )}

                    {activeTab === "code" && (
                      <div className="relative">
                        <pre className="bg-gray-900 rounded-xl p-4 text-xs text-gray-300 overflow-auto max-h-[600px] whitespace-pre-wrap break-all font-mono">
                          {result.html}
                        </pre>
                      </div>
                    )}

                    {activeTab === "modules" && (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        <div className="bg-gray-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-green-400 mb-2">{dp.headerArea}</h4>
                          <p className="text-sm text-gray-300">{result.copywriting.title}</p>
                          {result.copywriting.adSlogan && (
                            <p className="text-sm text-amber-400 mt-1">{result.copywriting.adSlogan}</p>
                          )}
                        </div>
                        <div className="bg-gray-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-green-400 mb-2">{dp.sellingPointsArea}</h4>
                          <ul className="space-y-1">
                            {sellingPoints.filter((p) => p.trim()).map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-gray-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-green-400 mb-2">{dp.sceneDesc}</h4>
                          <p className="text-sm text-gray-300">{result.copywriting.description}</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-green-400 mb-2">{dp.productParams}</h4>
                          <div className="space-y-1 text-sm text-gray-300">
                            <p>{dp.productNameLabel}：{productName}</p>
                            <p>{dp.categoryLabel}：{category}</p>
                          </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-green-400 mb-2">{dp.serviceGuarantee}</h4>
                          <div className="flex gap-4 text-sm text-gray-300">
                            <span>{dp.authentic}</span>
                            <span>{dp.fastShipping}</span>
                            <span>{dp.sevenDayReturn}</span>
                            <span>{dp.onlineSupport}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 pb-6">
                    <button
                      onClick={handleClear}
                      className="w-full px-4 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                    >
                      {dp.regenerate}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {dp.aiCopy}
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{dp.titleLabel}</p>
                      <p className="text-white font-medium">{result.copywriting.title}</p>
                    </div>
                    {result.copywriting.adSlogan && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{dp.adSloganLabel}</p>
                        <p className="text-amber-400">{result.copywriting.adSlogan}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{dp.descLabel}</p>
                      <p className="text-gray-300 text-sm">{result.copywriting.description}</p>
                    </div>
                    {result.copywriting.bulletPoints.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">{dp.detailedSellingPoints}</p>
                        <ul className="space-y-1">
                          {result.copywriting.bulletPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {!result && !isProcessing && !error && (
              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-400 mb-2">
                    {dp.waiting}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {dp.waitingDesc}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{dp.tips}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {dp.tip1}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {dp.tip2}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {dp.tip3}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {dp.tip4}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-16 bg-gray-800/50 backdrop-blur-md border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-gray-400">
            {t.ecommercePage.footer}
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
