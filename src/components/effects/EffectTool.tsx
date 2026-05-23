"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Sparkles,
  Loader2,
  Download,
  X,
  Share2,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface EffectToolProps {
  effectId: string;
  effectName: string;
  effectPrompt: string;
}

export default function EffectTool({ effectId, effectName, effectPrompt }: EffectToolProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t.effectsPage.errorInvalidFile);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t.effectsPage.errorFileTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImage(result);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t.effectsPage.errorInvalidFile);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t.effectsPage.errorFileTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImage(result);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    setError(null);
    setResultImage(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 8;
      });
    }, 400);

    try {
      let finalPrompt = effectPrompt;

      const analyzeResponse = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadedImage }),
      });

      if (analyzeResponse.ok) {
        const analyzeData = await analyzeResponse.json();
        if (analyzeData.description) {
          finalPrompt = `The uploaded image shows: ${analyzeData.description}. ${effectPrompt}`;
        }
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          image: uploadedImage,
          width: 1024,
          height: 1024,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.effectsPage.generationFailed);
      }

      const data = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 500));
      setResultImage(data.imageUrl);
    } catch (err) {
      clearInterval(progressInterval);
      setError((err as Error).message || t.effectsPage.generationFailed);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `${effectId}-effect-${Date.now()}.png`;
    link.click();
  };

  const handleShare = async () => {
    if (!resultImage) return;

    try {
      if (navigator.share) {
        const response = await fetch(resultImage);
        const blob = await response.blob();
        const file = new File([blob], `${effectId}-effect.png`, { type: blob.type });
        await navigator.share({
          title: `${effectName} - AI Magic Effect`,
          text: `Check out my ${effectName} AI effect!`,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setError(t.effectsPage.failedToShare);
      }
    }
  };

  const handleClear = () => {
    setUploadedImage(null);
    setResultImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {t.effectsPage.uploadYourPhoto}
            </h3>
          </div>
          <div className="p-6">
            {!uploadedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 group ${
                  isDragOver
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-gray-600 hover:border-purple-500 hover:bg-purple-500/10"
                }`}
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-purple-400" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">
                  {t.effectsPage.clickOrDrag}
                </h4>
                <p className="text-sm text-gray-400">
                  {t.effectsPage.supportsFormatsMax5}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden">
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

        <button
          onClick={handleGenerate}
          disabled={!uploadedImage || isProcessing}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
            !uploadedImage || isProcessing
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t.effectsPage.generatingEffect}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t.effectsPage.applyingEffect.replace("{name}", effectName)}
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {t.effectsPage.result}
            </h3>
          </div>
          <div className="p-6">
            {isProcessing ? (
              <div className="relative aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl overflow-hidden border border-purple-500/20 flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)] animate-[shimmer_2s_infinite]" />
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-30" />
                    <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {t.effectsPage.applyingEffect.replace("{name}", effectName)}
                  </h4>
                  <p className="text-sm text-gray-400 mb-4">
                    {t.effectsPage.aiWorkingMagic}
                  </p>
                  <div className="w-48 mx-auto bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>
            ) : resultImage ? (
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden">
                  <Image
                    src={resultImage}
                    alt="Result"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Download className="w-5 h-5" />
                    {t.effects.download}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-all duration-300"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        {t.effectsPage.copied}
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5" />
                        {t.effects.share}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gray-900 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400">
                    {t.effectsPage.uploadAndGenerate}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t.effectsPage.resultWillAppear}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
