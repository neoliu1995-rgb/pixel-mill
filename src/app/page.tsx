"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PromptInput from "@/components/generator/PromptInput";
import StyleOptions from "@/components/generator/StyleOptions";
import GenerateButton from "@/components/generator/GenerateButton";
import ImageOutput from "@/components/generator/ImageOutput";
import GenerationHistory, { HistoryItem } from "@/components/generator/GenerationHistory";
import NegativePromptInput from "@/components/generator/NegativePromptInput";
import { useLanguage } from "@/components/LanguageProvider";
import { ASPECT_RATIOS } from "@/lib/utils";
import { enhancePrompt } from "@/lib/promptEnhancer";
import Image from "next/image";
import { Upload, X, Sparkles, Wand2, Check, Layers, DollarSign, Zap, LogIn, Infinity } from "lucide-react";
import Link from "next/link";
import PromptPresets from "@/components/generator/PromptPresets";
import ModelSelector from "@/components/generator/ModelSelector";
import type { ModelType } from "@/components/generator/ModelSelector";
import type { UserTier } from "@/lib/providers/router";

const InspirationGallery = dynamic(() => import("@/components/gallery/InspirationGallery"), { ssr: false });
const BatchGenerator = dynamic(() => import("@/components/generator/BatchGenerator"), { ssr: false });
const SocialProof = dynamic(() => import("@/components/social/SocialProof"), { ssr: false });
const BannerAd = dynamic(() => import("@/components/ads/BannerAd").then(m => ({ default: m.BannerAd })), { ssr: false });
const InArticleAd = dynamic(() => import("@/components/ads/BannerAd").then(m => ({ default: m.InArticleAd })), { ssr: false });

export default function HomePage() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [showGallery, setShowGallery] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showBatchGenerator, setShowBatchGenerator] = useState(false);
  const [selectedColor, setSelectedColor] = useState("none");
  const [selectedLighting, setSelectedLighting] = useState("none");
  const [selectedComposition, setSelectedComposition] = useState("none");
  const [selectedModel, setSelectedModel] = useState<ModelType>("auto");
  const [userTier] = useState<UserTier>("free");
  const [quotaInfo, setQuotaInfo] = useState<{ dailyUsed: number; dailyLimit: number; monthlyUsed: number; monthlyLimit: number } | null>(null);

  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam) {
      setPrompt(decodeURIComponent(promptParam));
    }
  }, [searchParams]);

  // 进度动画
  useEffect(() => {
    if (!isLoading) {
      setGenerationProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError(t.home.errorInvalidFile);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t.home.errorFileTooLarge);
        return;
      }
      
      const img = document.createElement("img");
      const reader = new FileReader();
      
      reader.onload = (event) => {
        img.src = event.target?.result as string;
        img.onload = () => {
          const maxWidth = 512;
          const maxHeight = 512;
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
            console.log("Compressed image size:", compressedDataUrl.length);
            setReferenceImage(compressedDataUrl);
            setError(null);
          }
        };
        img.onerror = () => {
          setError(t.home.errorImageLoad);
        };
      };
      
      reader.onerror = () => {
        setError(t.home.errorFileRead);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleClearReference = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAutoEnhance = () => {
    const enhanced = enhancePrompt(prompt, selectedStyle);
    setPrompt(enhanced);
    setIsEnhanced(true);
    
    setTimeout(() => {
      setIsEnhanced(false);
    }, 3000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setImageUrl(null);
    setError(null);
    setShowGallery(false);
    setGenerationProgress(0);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          width: aspectRatio.width,
          height: aspectRatio.height,
          style: selectedStyle,
          color: selectedColor,
          lighting: selectedLighting,
          composition: selectedComposition,
          model: selectedModel,
          image: referenceImage,
          negativePrompt: negativePrompt || undefined,
          userTier: userTier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429 && errorData.needAuth) {
          throw new Error("FREE_LIMIT_REACHED");
        }
        if (response.status === 429) {
          throw new Error(errorData.error || "生成次数已达上限");
        }
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);

      const dailyLimit = response.headers.get("X-RateLimit-Limit-Daily");
      const dailyRemaining = response.headers.get("X-RateLimit-Remaining-Daily");
      const monthlyLimit = response.headers.get("X-RateLimit-Limit-Monthly");
      const monthlyRemaining = response.headers.get("X-RateLimit-Remaining-Monthly");

      if (dailyLimit && dailyRemaining && monthlyLimit && monthlyRemaining) {
        setQuotaInfo({
          dailyUsed: parseInt(dailyLimit) - parseInt(dailyRemaining),
          dailyLimit: parseInt(dailyLimit),
          monthlyUsed: parseInt(monthlyLimit) - parseInt(monthlyRemaining),
          monthlyLimit: parseInt(monthlyLimit),
        });
      }
      console.log("Generation successful! Provider:", data.provider);
      
      // 添加到历史记录
      if ((window as unknown as Record<string, unknown>).addToGenerationHistory) {
        ((window as unknown as Record<string, unknown>).addToGenerationHistory as (data: { prompt: string; imageUrl: string; model: string }) => void)({
          prompt: prompt,
          imageUrl: data.imageUrl,
          model: data.modelName || selectedModel,
        });
      }
    } catch (error) {
      console.error("Generation failed:", error);
      if (error instanceof Error && error.message === "FREE_LIMIT_REACHED") {
        setError("DAILY_LIMIT_SIGNIN");
      } else {
        setError(t.error.generation || "生成图片失败，请重试。");
      }
    } finally {
      setIsLoading(false);
      setGenerationProgress(100);
    }
  };

  const handleReset = () => {
    setImageUrl(null);
    setError(null);
    setShowGallery(true);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setImageUrl(item.imageUrl);
    setShowGallery(false);
  };

  const handleTryPrompt = (newPrompt: string) => {
    setPrompt(newPrompt);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentMessage = t.progressMessages[Math.floor(generationProgress / 20)] || t.progressMessages[t.progressMessages.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-white">
      <Header />

      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-3 sm:mb-4">
            {t.hero.title}
          </h1>
          <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto px-2">
            {t.hero.subtitle}
          </p>
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <DollarSign className="w-3.5 h-3.5" />
              {t.homePage.hundredPercentFree}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <Zap className="w-3.5 h-3.5" />
              {t.homePage.poweredByGemini}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              <LogIn className="w-3.5 h-3.5" />
              {t.homePage.noLoginRequired}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
              <Infinity className="w-3.5 h-3.5" />
              {t.homePage.unlimitedGenerations}
            </span>
          </div>
          <div className="mt-4 flex justify-center">
            <GenerationHistory onSelect={handleHistorySelect} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-12">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Reference Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="reference-upload"
              />

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative w-full sm:w-20 h-16 sm:h-20 flex-shrink-0">
                  {referenceImage ? (
                    <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-purple-500 bg-purple-50">
                      <Image
                        src={referenceImage}
                        alt="Reference"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={handleClearReference}
                        className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                        <span className="text-xs text-white">{t.referenceImage}</span>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="reference-upload"
                      className="flex flex-row sm:flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all group"
                    >
                      <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-purple-500" />
                      <span className="text-xs text-gray-500 sm:mt-1 ml-2 sm:ml-0">{t.homePage.uploadReference}</span>
                    </label>
                  )}
                </div>

                {/* Prompt Input */}
                <div className="flex-1 relative">
                  <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    disabled={isLoading}
                    placeholder={t.prompt.placeholder}
                  />
                  {prompt && !isLoading && (
                    <button
                      onClick={handleAutoEnhance}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                      title={t.homePage.autoEnhance}
                    >
                      {isEnhanced ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Settings Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-100 overflow-x-auto -mx-1 px-1">
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-gray-400 mr-1">{t.homePage.ratio}</span>
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.label}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all min-h-[32px] ${
                        aspectRatio.label === ratio.label
                          ? "bg-purple-100 text-purple-700 font-medium"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>

                <span className="text-gray-300 hidden sm:inline">|</span>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-gray-400 mr-1">{t.homePage.styleLabel || "Style"}</span>
                  {[
                    { id: "none", label: t.homePage.styleNone },
                    { id: "photographic", label: t.homePage.stylePhotographic },
                    { id: "anime", label: t.homePage.styleAnime },
                    { id: "digital-art", label: t.homePage.styleDigitalArt },
                    { id: "cinematic", label: t.homePage.styleCinematic },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all min-h-[32px] ${
                        selectedStyle === style.id
                          ? "bg-purple-100 text-purple-700 font-medium"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setShowStyleOptions(!showStyleOptions)}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 min-h-[44px]"
                >
                  {showStyleOptions ? t.style.hide : t.style.show}
                  <span className="text-xs text-gray-400">{t.advancedOptions}</span>
                </button>
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt("")}
                    className="text-sm text-gray-500 hover:text-gray-700 min-h-[44px] flex items-center"
                  >
                    {t.clear}
                  </button>
                )}
              </div>

              {showStyleOptions && (
                <div className="mt-4 space-y-4">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    userTier={userTier}
                  />
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <StyleOptions
                      aspectRatio={aspectRatio}
                      onAspectRatioChange={setAspectRatio}
                      selectedStyle={selectedStyle}
                      onStyleChange={setSelectedStyle}
                      selectedColor={selectedColor}
                      onColorChange={setSelectedColor}
                      selectedLighting={selectedLighting}
                      onLightingChange={setSelectedLighting}
                      selectedComposition={selectedComposition}
                      onCompositionChange={setSelectedComposition}
                      disabled={isLoading}
                    />
                  </div>
                  <NegativePromptInput
                    value={negativePrompt}
                    onChange={setNegativePrompt}
                  />
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">{t.homePage.promptPresets}</span>
                      <span className="text-xs text-gray-500">{t.homePage.clickToUsePreset}</span>
                    </div>
                    <PromptPresets onSelect={setPrompt} />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  {error === "DAILY_LIMIT_SIGNIN" ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-red-600">免费体验次数已用完，登录获取更多次数！</p>
                      <Link
                        href="/auth/signin"
                        className="ml-3 px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                      >
                        <LogIn className="w-3 h-3 inline mr-1" />
                        登录
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <div className="mt-6 space-y-3">
                <GenerateButton
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  isLoading={isLoading}
                  text={isLoading ? currentMessage : t.generate}
                  progress={isLoading ? generationProgress : 0}
                />
                <button
                  onClick={() => setShowBatchGenerator(true)}
                  disabled={!prompt.trim() || isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  <Layers className="w-4 h-4" />
                  <span className="font-medium">{t.batchGenerate} {t.batchSelect}</span>
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-gray-400">
                {isLoading 
                  ? (userTier === "free" 
                    ? `🎨 ${t.homePage.generatingProgress} ${Math.round(generationProgress)}% — 免费用户排队中，升级套餐享优先生成` 
                    : `${t.homePage.generatingProgress} ${Math.round(generationProgress)}%`)
                  : t.homePage.freeGenerationNote}
              </p>

              {quotaInfo && (
                <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                    {t.homePage.todayQuota} {quotaInfo.dailyUsed}/{quotaInfo.dailyLimit} {t.homePage.generations}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {t.homePage.monthlyQuota} {quotaInfo.monthlyUsed}/{quotaInfo.monthlyLimit} {t.homePage.generations}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <ImageOutput
              imageUrl={imageUrl}
              isLoading={isLoading}
              progress={generationProgress}
              progressMessage={currentMessage}
              onReset={handleReset}
              prompt={prompt}
            />
          </div>
        </div>

        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t.homePage.tryViralEffects}
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              {t.homePage.transformPhotos}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Link href="/effects/chibi" className="group">
              <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 duration-300">
                <div className="relative h-36 sm:h-48 overflow-hidden bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600">
                  <Image
                    src={`https://image.pollinations.ai/prompt/A%20cute%20chibi-style%20anime%20girl%20with%20big%20sparkling%20eyes,%20pastel%20pink%20and%20purple%20colors,%20adorable%20kawaii%20art%20style,%20soft%20lighting,%20white%20background,%20high%20quality%20illustration?width=512&height=384&nologo=true&seed=chibi1`}
                    alt="Chibi Effect"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-pink-500/90 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                    ✨ {t.homePage.badgeChibi}
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold text-white mb-1">{t.effects.chibi}</h3>
                  <p className="text-sm text-gray-400 mb-3">{t.effects.chibiDesc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                    {t.homePage.tryNow}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </div>
            </Link>
            <Link href="/effects/caricature" className="group">
              <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 duration-300">
                <div className="relative h-36 sm:h-48 overflow-hidden bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500">
                  <Image
                    src={`https://image.pollinations.ai/prompt/A%20humorous%20colorful%20caricature%20portrait%20of%20a%20person%20with%20exaggerated%20facial%20features,%20vibrant%20cartoon%20style,%20fun%20and%20playful,%20detailed%20illustration,%20white%20background?width=512&height=384&nologo=true&seed=caricature1`}
                    alt="Caricature Effect"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500/90 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                    🎨 {t.homePage.badgeCaricature}
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold text-white mb-1">{t.effects.caricature}</h3>
                  <p className="text-sm text-gray-400 mb-3">{t.effects.caricatureDesc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                    {t.homePage.tryNow}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </div>
            </Link>
            <Link href="/effects/retro-film" className="group">
              <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 duration-300">
                <div className="relative h-36 sm:h-48 overflow-hidden bg-gradient-to-br from-amber-600 via-yellow-700 to-stone-800">
                  <Image
                    src={`https://image.pollinations.ai/prompt/Vintage%2035mm%20film%20photograph%20of%20a%20beautiful%20landscape,%20light%20leaks,%20film%20grain%20texture,%20warm%20golden%20tones,%20nostalgic%201970s%20retro%20aesthetic,%20faded%20colors,%20cinematic?width=512&height=384&nologo=true&seed=retrofilm1`}
                    alt="Retro Film Effect"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-600/90 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                    📽️ {t.homePage.badgeRetroFilm}
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold text-white mb-1">{t.effects.retroFilm}</h3>
                  <p className="text-sm text-gray-400 mb-3">{t.effects.retroFilmDesc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                    {t.homePage.tryNow}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Inspiration Gallery */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                {t.inspiration.title}
              </h3>
              <button
                onClick={() => setShowGallery(!showGallery)}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                {showGallery ? t.inspiration.hide : t.inspiration.show}
              </button>
            </div>
            {showGallery && (
              <InspirationGallery onTryPrompt={handleTryPrompt} />
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "💰", ...t.features.free },
            { icon: "🔓", ...t.features.noSignUp },
            { icon: "⚡", ...t.features.fast },
            { icon: "🔒", ...t.features.private },
          ].map((feature, i) => (
            <div key={i} className="text-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>

        <BannerAd />

        {/* FAQ */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t.faq.title}
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              {t.faq.subtitle}
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: t.faq.questions.free, a: t.faq.questions.freeAnswer },
              { q: t.faq.questions.commercial, a: t.faq.questions.commercialAnswer },
              { q: t.faq.questions.languages, a: t.faq.questions.languagesAnswer },
              { q: t.faq.questions.quality, a: t.faq.questions.qualityAnswer },
              { q: t.faq.questions.modelChoice, a: t.faq.questions.modelChoiceAnswer },
              { q: t.faq.questions.commercialPro, a: t.faq.questions.commercialProAnswer },
            ].map((faq, i) => (
              <details key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                  <span>{faq.q}</span>
                  <span className="ml-4 flex-shrink-0 text-purple-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-12">
          <SocialProof />
        </div>

        <InArticleAd />

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            {t.cta.title}
          </h2>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            {t.cta.subtitle}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg min-h-[44px]"
          >
            <Sparkles className="w-5 h-5" />
            {t.cta.button}
          </button>
        </div>
      </main>

      <Footer />

      {/* Batch Generator Modal */}
      {showBatchGenerator && (
        <BatchGenerator
          prompt={prompt}
          width={aspectRatio.width}
          height={aspectRatio.height}
          style={selectedStyle}
          negativePrompt={negativePrompt}
          referenceImage={referenceImage || undefined}
          onSelect={setImageUrl}
          onClose={() => setShowBatchGenerator(false)}
        />
      )}
    </div>
  );
}
