"use client";

import { useState, useRef, useCallback } from "react";
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
  Palette,
  Wand2,
  Zap,
} from "lucide-react";

type ToolType = "remove-bg" | "white-bg" | "custom-bg";

export default function BackgroundRemoverPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [transparentImage, setTransparentImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [customColor, setCustomColor] = useState("#FFFFFF");
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);

  const handleFile = useCallback((file: File) => {
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
      setTransparentImage(null);
      setError(null);
      setModelLoaded(false);
    };
    reader.readAsDataURL(file);
  }, [t.bgRemover.error.invalidFile, t.bgRemover.error.fileTooLarge]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeBackground = async (imageSrc: string): Promise<string> => {
    const { removeBackground } = await import("@imgly/background-removal");
    const blob = await removeBackground(imageSrc, {
      progress: (key: string, current: number, total: number) => {
        if (key === "compute:inference") {
          const pct = Math.round((current / total) * 100);
          setProcessingProgress(30 + pct * 0.6);
        }
      },
    });
    return URL.createObjectURL(blob);
  };

  const applyBackgroundColor = (transparentSrc: string, color: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;

        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = transparentSrc;
    });
  };

  const processImage = async (toolType: ToolType, color?: string) => {
    if (!uploadedImage) {
      setError(t.bgRemover.error.pleaseUpload);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setActiveTool(toolType);
    setProcessingProgress(5);

    try {
      let transparent = transparentImage;

      if (!transparent) {
        setProcessingProgress(10);
        transparent = await removeBackground(uploadedImage);
        setTransparentImage(transparent);
        setModelLoaded(true);
      }

      setProcessingProgress(90);

      if (toolType === "remove-bg") {
        const response = await fetch(transparent);
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        setProcessedImage(dataUrl);
      } else {
        const bgColor = toolType === "white-bg" ? "#FFFFFF" : (color || "#FFFFFF");
        const result = await applyBackgroundColor(transparent, bgColor);
        setProcessedImage(result);
      }

      setProcessingProgress(100);
    } catch (err) {
      const message = (err as Error).message;
      setError(message || t.bgRemover.error.processingFailed);
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
    setTransparentImage(null);
    setError(null);
    setModelLoaded(false);
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
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{t.bgRemover.title}</h1>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3" />Client-side
                </span>
              </div>
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium mb-4">
            <Wand2 className="w-4 h-4" />
            {t.bgRemover.heroTitle}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.bgRemover.heroSubtitle}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t.bgRemover.heroDescription}
          </p>
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
              <Zap className="w-4 h-4 text-green-400" />
              <p className="text-sm text-green-300">
                100% client-side processing — your images never leave your browser!
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
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

                    {modelLoaded && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <Check className="w-4 h-4 text-green-400" />
                        <p className="text-xs text-green-300">
                          AI model loaded — switching backgrounds is instant now!
                        </p>
                      </div>
                    )}

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

                    {isProcessing && (
                      <div className="relative bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 overflow-hidden border border-purple-500/20">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 relative">
                            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-30" />
                            <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {t.bgRemover.processing}
                          </h4>
                          <p className="text-sm text-gray-400 mb-4">
                            {!modelLoaded
                              ? "Loading AI model (first time only)..."
                              : t.bgRemover.identifying}
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
                      <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                        <p className="text-sm text-red-400">{error}</p>
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
    </div>
  );
}
