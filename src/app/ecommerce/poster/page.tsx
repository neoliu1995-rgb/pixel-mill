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
  LayoutTemplate,
  Palette,
  Maximize,
} from "lucide-react";

type PosterTemplate = "promotion" | "new_product" | "daily" | "festival";
type PosterSize = "taobao_main" | "detail_header" | "social_media" | "wechat";

export default function PosterPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [template, setTemplate] = useState<PosterTemplate>("promotion");
  const [size, setSize] = useState<PosterSize>("taobao_main");
  const [brandColor, setBrandColor] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    posterImageUrl: string;
    copywriting: { title: string; subtitle: string; sellingPoints: string[] };
  } | null>(null);

  const pp = t.ecommercePage.posterPage;

  const templateOptions: { id: PosterTemplate; label: string; desc: string; color: string }[] = [
    { id: "promotion", label: pp.posterTemplate, desc: pp.promotionDesc, color: "from-red-500 to-orange-500" },
    { id: "new_product", label: pp.posterTemplate, desc: pp.newProductDesc, color: "from-blue-500 to-purple-500" },
    { id: "daily", label: pp.posterTemplate, desc: pp.dailyDesc, color: "from-green-500 to-teal-500" },
    { id: "festival", label: pp.posterTemplate, desc: pp.festivalDesc, color: "from-pink-500 to-rose-500" },
  ];

  const sizeOptions: { id: PosterSize; label: string; desc: string }[] = [
    { id: "taobao_main", label: pp.taobaoMain, desc: "800x800" },
    { id: "detail_header", label: pp.detailHeader, desc: "790x950" },
    { id: "social_media", label: pp.socialMedia, desc: "1080x1080" },
    { id: "wechat", label: pp.wechatMoment, desc: "900x383" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError(pp.errorUploadImage);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(pp.errorFileSize);
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

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError(pp.errorUploadFirst);
      return;
    }
    if (!productName.trim()) {
      setError(pp.errorProductName);
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
      const response = await fetch("/api/poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          productImageUrl: uploadedImage,
          template,
          size,
          brandColor: brandColor || undefined,
          userTier: "free",
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || pp.errorGenerate);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setResult(data);
    } catch (err) {
      clearInterval(progressInterval);
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.posterImageUrl) return;
    const link = document.createElement("a");
    link.href = result.posterImageUrl;
    link.download = `poster-${Date.now()}.png`;
    link.click();
  };

  const handleClear = () => {
    setUploadedImage(null);
    setResult(null);
    setError(null);
    setProductName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{pp.title}</h1>
              <p className="text-xs text-gray-400">{pp.subtitle}</p>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {pp.aiPowered}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {pp.title}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {pp.generatorDesc}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {pp.uploadProduct}
                </h3>
              </div>
              <div className="p-6">
                {!uploadedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-500/10 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-10 h-10 text-orange-400" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">
                      {pp.clickOrDrag}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {pp.supportedFormats}
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
                    <Palette className="w-5 h-5" />
                    {pp.settings}
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      {pp.productName}
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder={pp.productNamePlaceholder}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4" />
                      {pp.posterTemplate}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {templateOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setTemplate(option.id)}
                          className={`p-3 rounded-xl text-left transition-all ${
                            template === option.id
                              ? "bg-orange-600 text-white ring-2 ring-orange-400"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs mt-1 opacity-70">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block flex items-center gap-2">
                      <Maximize className="w-4 h-4" />
                      {pp.posterSize}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {sizeOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSize(option.id)}
                          className={`p-3 rounded-xl text-left transition-all ${
                            size === option.id
                              ? "bg-orange-600 text-white ring-2 ring-orange-400"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs mt-1 opacity-70">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      {pp.brandColorOptional}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColor || "#FF6B00"}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        placeholder="#FF6B00"
                        className="flex-1 px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      {brandColor && (
                        <button
                          onClick={() => setBrandColor("")}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing || !productName.trim()}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                      isProcessing || !productName.trim()
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02]"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {pp.processing}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {pp.generatePoster}
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
                  <div className="relative bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-6 overflow-hidden border border-orange-500/20">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-shimmer" />
                    <div className="relative text-center">
                      <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-30" />
                        <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {pp.processing}
                      </h4>
                      <p className="text-sm text-gray-400 mb-4">
                        {pp.generatingCopy}
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-300 ease-out"
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
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      {pp.complete}
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="relative bg-gray-700 rounded-xl overflow-hidden mb-6">
                      <Image
                        src={result.posterImageUrl}
                        alt="Generated Poster"
                        width={800}
                        height={600}
                        className="w-full h-auto object-contain"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:from-orange-500 hover:to-red-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                      >
                        <Download className="w-5 h-5" />
                        {pp.downloadPoster}
                      </button>
                      <button
                        onClick={handleClear}
                        className="px-4 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                      >
                        {pp.regenerate}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {pp.aiCopy}
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{pp.titleLabel}</p>
                      <p className="text-white font-medium">{result.copywriting.title}</p>
                    </div>
                    {result.copywriting.subtitle && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{pp.subtitleLabel}</p>
                        <p className="text-gray-300">{result.copywriting.subtitle}</p>
                      </div>
                    )}
                    {result.copywriting.sellingPoints.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">{pp.sellingPointsLabel}</p>
                        <ul className="space-y-1">
                          {result.copywriting.sellingPoints.map((point, i) => (
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
                    <LayoutTemplate className="w-10 h-10 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-400 mb-2">
                    {pp.waiting}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {pp.waitingDesc}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{pp.tips}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {pp.tip1}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {pp.tip2}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {pp.tip3}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {pp.tip4}
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
