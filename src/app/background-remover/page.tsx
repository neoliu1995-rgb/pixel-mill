"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import {
  Upload,
  Scissors,
  Image as ImageIcon,
  Loader2,
  Download,
  X,
  Check,
  Sparkles,
  ArrowRight,
  Palette,
  Wand2
} from "lucide-react";

export default function BackgroundRemoverPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<"remove-bg" | "white-bg" | "custom-bg" | null>(null);
  const [customColor, setCustomColor] = useState("#FFFFFF");
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError(t.bgRemover.error.invalidFile);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t.bgRemover.error.fileTooLarge);
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

  const processImage = async (toolType: "remove-bg" | "white-bg" | "custom-bg", color?: string) => {
    if (!uploadedImage) {
      setError(t.bgRemover.error.pleaseUpload);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setActiveTool(toolType);
    setShowAnimation(true);
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      let apiUrl = "/api/remove-background";
      let body: { imageUrl: string; bgColor?: string } = { imageUrl: uploadedImage };

      if (toolType === "white-bg") {
        apiUrl = "/api/white-background";
      } else if (toolType === "custom-bg" && color) {
        apiUrl = "/api/white-background";
        body.bgColor = color;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.needsApiKey) {
          setError("AI抠图功能需要配置API密钥，即将上线！");
        } else {
          throw new Error(data.error || t.bgRemover.error.processingFailed);
        }
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessedImage(data.imageUrl);
      setShowAnimation(false);
    } catch (err) {
      clearInterval(progressInterval);
      const message = (err as Error).message;
      if (message.includes("均不可用") || message.includes("API")) {
        setError("AI抠图功能需要配置API密钥，即将上线！");
      } else {
        setError(message);
      }
      setShowAnimation(false);
    } finally {
      setIsProcessing(false);
      setActiveTool(null);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `background-removed-${Date.now()}.png`;
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

  const presetColors = [
    "#FFFFFF", "#000000", "#FF6B6B", "#4ECDC4", "#45B7D1",
    "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t.bgRemover.title}</h1>
              <p className="text-xs text-gray-400">{t.bgRemover.subtitle}</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">
              {t.bgRemover.backToHome}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t.bgRemover.heroTitle}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.bgRemover.heroSubtitle}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t.bgRemover.heroDescription}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {t.bgRemover.uploadSection}
                </h3>
              </div>
              <div className="p-6">
                {!uploadedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-10 h-10 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">
                      {t.bgRemover.clickOrDrop}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {t.bgRemover.supportedFormats}
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
                  id="bg-remover-upload"
                />
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  {t.bgRemover.toolsSection}
                </h3>
              </div>
              <div className="p-6">
                {uploadedImage ? (
                  <div className="space-y-6">
                    {/* Tool Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => processImage("remove-bg")}
                        disabled={isProcessing}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                          activeTool === "remove-bg" 
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105" 
                            : "bg-gray-700 text-gray-300 hover:bg-purple-600/50 hover:shadow-md"
                        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <Scissors className="w-8 h-8" />
                        <span className="text-sm font-medium">{t.bgRemover.transparentBg}</span>
                        {activeTool === "remove-bg" && isProcessing && (
                          <Loader2 className="absolute top-2 right-2 w-4 h-4 animate-spin" />
                        )}
                      </button>

                      <button
                        onClick={() => processImage("white-bg")}
                        disabled={isProcessing}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                          activeTool === "white-bg" 
                            ? "bg-green-600 text-white shadow-lg shadow-green-600/30 scale-105" 
                            : "bg-gray-700 text-gray-300 hover:bg-green-600/50 hover:shadow-md"
                        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-sm font-medium">{t.bgRemover.whiteBg}</span>
                        {activeTool === "white-bg" && isProcessing && (
                          <Loader2 className="absolute top-2 right-2 w-4 h-4 animate-spin" />
                        )}
                      </button>

                      <button
                        onClick={() => processImage("custom-bg", customColor)}
                        disabled={isProcessing}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                          activeTool === "custom-bg" 
                            ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-105" 
                            : "bg-gray-700 text-gray-300 hover:bg-orange-600/50 hover:shadow-md"
                        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <Palette className="w-8 h-8" />
                        <span className="text-sm font-medium">{t.bgRemover.customBg}</span>
                        {activeTool === "custom-bg" && isProcessing && (
                          <Loader2 className="absolute top-2 right-2 w-4 h-4 animate-spin" />
                        )}
                      </button>
                    </div>

                    {/* Custom Color Picker */}
                    <div className="bg-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">{t.bgRemover.selectBgColor}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg text-center"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {presetColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setCustomColor(color)}
                            className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                              customColor === color ? "ring-2 ring-offset-2 ring-purple-500" : ""
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Processing Animation */}
                    {isProcessing && showAnimation && (
                      <div className="relative bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 overflow-hidden border border-purple-500/20">
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-shimmer" />
                        <div className="relative text-center">
                          <div className="w-16 h-16 mx-auto mb-4 relative">
                            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-30" />
                            <div className="absolute inset-0 bg-purple-600 rounded-full animate-ping opacity-20 delay-100" />
                            <div className="absolute inset-0 bg-purple-700 rounded-full animate-ping opacity-10 delay-200" />
                            <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {t.bgRemover.processing}
                          </h4>
                          <p className="text-sm text-gray-400 mb-4">
                            {t.bgRemover.identifying}
                          </p>
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${processingProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {Math.round(processingProgress)}%
                          </p>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className={`p-4 rounded-xl border ${
                        error.includes("即将上线")
                          ? "bg-amber-500/20 border-amber-500/30"
                          : "bg-red-500/20 border-red-500/30"
                      }`}>
                        <p className={`text-sm ${
                          error.includes("即将上线") ? "text-amber-400" : "text-red-400"
                        }`}>{error}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400">{t.bgRemover.pleaseUpload}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Result Section */}
            {processedImage && (
              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {t.bgRemover.processingComplete}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSIyIiBmaWxsPSIjZmZmIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkZGRkIi8+PC9zdmc+')] rounded-xl overflow-hidden mb-4">
                    <Image
                      src={processedImage}
                      alt="Processed"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Download className="w-5 h-5" />
                      {t.bgRemover.downloadImage}
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-4 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                    >
                      {t.bgRemover.processNewImage}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { key: "fast", icon: "⚡" },
            { key: "accurate", icon: "🎯" },
            { key: "multiple", icon: "🎨" },
            { key: "privacy", icon: "🔒" },
          ].map((feature, i) => (
            <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1 border border-gray-700">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h4 className="font-semibold text-white mb-1">{t.bgRemover.features[feature.key as keyof typeof t.bgRemover.features]}</h4>
              <p className="text-sm text-gray-400">{t.bgRemover.features[`${feature.key}Desc` as keyof typeof t.bgRemover.features]}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-16 bg-gray-800/50 backdrop-blur-md border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-gray-400">
            {t.bgRemover.footer}
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
