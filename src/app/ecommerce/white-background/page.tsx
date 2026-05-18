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
  Palette,
  Sun,
  Maximize,
} from "lucide-react";

type ShadowType = "natural" | "reflection" | "none";
type OutputSize = "800x800" | "1200x1200" | "custom";

export default function WhiteBackgroundPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);

  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [shadowType, setShadowType] = useState<ShadowType>("natural");
  const [outputSize, setOutputSize] = useState<OutputSize>("800x800");
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(800);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError(t.ecommercePage.whiteBgPage.errorUploadImage);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t.ecommercePage.whiteBgPage.errorFileSize);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImage(result);
        setProcessedImage(null);
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
        const result = event.target?.result as string;
        setUploadedImage(result);
        setProcessedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError(t.ecommercePage.whiteBgPage.errorUploadFirst);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setShowAnimation(true);
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const response = await fetch("/api/white-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          bgColor,
          userTier: "free",
        }),
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.needsApiKey) {
          setError(t.ecommercePage.whiteBgPage.errorApiKey);
        } else {
          throw new Error(data.error || "Error");
        }
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setProcessedImage(data.imageUrl);
      setShowAnimation(false);
    } catch (err) {
      clearInterval(progressInterval);
      const message = (err as Error).message;
      if (message.includes("均不可用") || message.includes("API")) {
        setError(t.ecommercePage.whiteBgPage.errorApiKey);
      } else {
        setError(message);
      }
      setShowAnimation(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `white-background-${Date.now()}.png`;
    link.click();
  };

  const handleClear = () => {
    setUploadedImage(null);
    setProcessedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const wb = t.ecommercePage.whiteBgPage;

  const shadowOptions: { id: ShadowType; label: string; desc: string }[] = [
    { id: "natural", label: wb.naturalShadow, desc: wb.naturalShadowDesc },
    { id: "reflection", label: wb.reflection, desc: wb.reflectionDesc },
    { id: "none", label: wb.noShadow, desc: wb.noShadowDesc },
  ];

  const sizeOptions: { id: OutputSize; label: string; desc: string }[] = [
    { id: "800x800", label: "800x800", desc: wb.size800 },
    { id: "1200x1200", label: "1200x1200", desc: wb.size1200 },
    { id: "custom", label: wb.customSize, desc: "" },
  ];

  const presetBgColors = [
    { color: "#FFFFFF", label: wb.white },
    { color: "#F5F5F5", label: wb.lightGray },
    { color: "#E8E8E8", label: wb.gray },
    { color: "#FFF8F0", label: wb.warmWhite },
    { color: "#F0F8FF", label: wb.coolWhite },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{wb.title}</h1>
              <p className="text-xs text-gray-400">{wb.subtitle}</p>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {wb.aiPowered}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {wb.generatorTitle}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {wb.generatorDesc}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {wb.uploadProduct}
                </h3>
              </div>
              <div className="p-6">
                {!uploadedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-10 h-10 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">
                      {wb.clickOrDrag}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {wb.supportedFormats}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden">
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
                    {wb.settings}
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      {wb.bgColor}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {presetBgColors.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => setBgColor(preset.color)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                            bgColor === preset.color
                              ? "bg-blue-600 text-white ring-2 ring-blue-400"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded border border-gray-500"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span className="text-sm">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-24 px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      {wb.shadowEffect}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {shadowOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setShadowType(option.id)}
                          className={`p-3 rounded-xl text-center transition-all ${
                            shadowType === option.id
                              ? "bg-blue-600 text-white ring-2 ring-blue-400"
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
                      {wb.outputSize}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {sizeOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setOutputSize(option.id)}
                          className={`p-3 rounded-xl text-center transition-all ${
                            outputSize === option.id
                              ? "bg-blue-600 text-white ring-2 ring-blue-400"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs mt-1 opacity-70">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                    {outputSize === "custom" && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={customWidth}
                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                            className="w-20 px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
                            min={100}
                            max={4000}
                          />
                          <span className="text-gray-400">x</span>
                          <input
                            type="number"
                            value={customHeight}
                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                            className="w-20 px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
                            min={100}
                            max={4000}
                          />
                        </div>
                        <span className="text-xs text-gray-500">px</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                      isProcessing
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02]"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {wb.processing}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {wb.generateWhiteBg}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {isProcessing && showAnimation && (
              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-8">
                  <div className="relative bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-6 overflow-hidden border border-blue-500/20">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-shimmer" />
                    <div className="relative text-center">
                      <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30" />
                        <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {wb.processing}
                      </h4>
                      <p className="text-sm text-gray-400 mb-4">
                        {wb.removingBg}
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {Math.round(processingProgress)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                className={`p-4 rounded-xl border ${
                  error.includes(t.ecommercePage.whiteBgPage.errorApiKey) || error.includes("API")
                    ? "bg-amber-500/20 border-amber-500/30"
                    : "bg-red-500/20 border-red-500/30"
                }`}
              >
                <p
                  className={`text-sm ${
                    error.includes(t.ecommercePage.whiteBgPage.errorApiKey) || error.includes("API")
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {error}
                </p>
              </div>
            )}

            {processedImage && (
              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {wb.complete}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-400 mb-2 text-center">{wb.original}</p>
                      <div className="relative aspect-square bg-gray-700 rounded-xl overflow-hidden">
                        <Image
                          src={uploadedImage!}
                          alt="Original"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2 text-center">{wb.whiteBgResult}</p>
                      <div
                        className="relative aspect-square rounded-xl overflow-hidden"
                        style={{ backgroundColor: bgColor }}
                      >
                        <Image
                          src={processedImage}
                          alt="Processed"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-500 hover:to-cyan-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Download className="w-5 h-5" />
                      {wb.downloadWhiteBg}
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-4 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                    >
                      {wb.processNew}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!processedImage && !isProcessing && !error && (
              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-400 mb-2">
                    {wb.waiting}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {wb.waitingDesc}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{wb.tips}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {wb.tip1}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {wb.tip2}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {wb.tip3}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {wb.tip4}
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
