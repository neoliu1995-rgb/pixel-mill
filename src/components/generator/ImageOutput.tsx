"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Download, Share2, RotateCcw, Loader2, Sparkles, ChevronDown, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import UpscaleButton from "./UpscaleButton";
import ImageEditor from "./ImageEditor";
import { useLanguage } from "@/components/LanguageProvider";

interface ImageOutputProps {
  imageUrl: string | null;
  isLoading: boolean;
  progress?: number;
  progressMessage?: string;
  onReset: () => void;
  prompt: string;
}

export default function ImageOutput({ imageUrl, isLoading, progress = 0, progressMessage, onReset, prompt }: ImageOutputProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = async (format: "png" | "jpg" | "webp" = "png") => {
    if (!displayUrl && !imageUrl) return;
    try {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });
      
      img.src = displayUrl || imageUrl || "";
      await loadPromise;

      // 创建画布并绘制图片
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");
      ctx.drawImage(img, 0, 0);

      // 根据格式导出
      let mimeType: string;
      let quality: number;
      
      switch (format) {
        case "jpg":
          mimeType = "image/jpeg";
          quality = 0.95;
          break;
        case "webp":
          mimeType = "image/webp";
          quality = 0.95;
          break;
        default:
          mimeType = "image/png";
          quality = 1;
      }

      const dataUrl = canvas.toDataURL(mimeType, quality);
      
      // 下载
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `pixelmill-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(dataUrl);
      document.body.removeChild(a);
      
      setShowDownloadMenu(false);
    } catch (error) {
      console.error("Download failed:", error);
      alert(t.error.downloadFailed || "Download failed, please try again");
    }
  };

  const handleShare = () => {
    if (!imageUrl) return;
    if (navigator.share) {
      navigator.share({
        title: t.share.title || "Check out this AI-generated image!",
        text: prompt,
        url: imageUrl,
      });
    } else {
      navigator.clipboard.writeText(imageUrl);
      alert(t.share.copied || "Image URL copied to clipboard!");
    }
  };

  const handleEdit = () => {
    setShowEditor(true);
  };

  const handleEditorSave = (editedUrl: string) => {
    setDisplayUrl(editedUrl);
    setShowEditor(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-purple-200 rounded-full flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
        <p className="text-gray-600 font-medium mb-2">{progressMessage || "Generating your masterpiece..."}</p>
        <div className="w-64 bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {Math.round(progress)}% complete
        </p>
        <p className="text-xs text-gray-400 mt-1">This usually takes 10-30 seconds</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-5xl">🎨</span>
          </div>
          <p className="text-gray-600 font-medium">Your generated image will appear here</p>
          <p className="text-sm text-gray-400 mt-2">Enter a prompt and click Generate to start</p>
        </div>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-2xl border-2 border-dashed border-red-200">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <p className="text-gray-600 font-medium">Failed to load image</p>
          <p className="text-sm text-gray-400 mt-2">Please try again</p>
          <button
            onClick={onReset}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
          </div>
        )}
        <Image
          src={displayUrl || imageUrl}
          alt="Generated image"
          width={800}
          height={600}
          className={cn(
            "w-full h-auto transition-all duration-500",
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{ minHeight: "400px", objectFit: "contain", maxHeight: "600px" }}
        />
        {imageLoaded && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-xs rounded-full">
            Generated
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <UpscaleButton 
            imageUrl={displayUrl || imageUrl || ""} 
            onUpscale={setDisplayUrl}
          />
          <button
            onClick={handleEdit}
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-4 rounded-xl",
              "border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
            )}
            title="编辑图片"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">编辑</span>
          </button>
          <button
            onClick={onReset}
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-4 rounded-xl",
              "border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            )}
            title="Generate again"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">重新生成</span>
          </button>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative" ref={downloadMenuRef}>
            <button
              onClick={() => handleDownload("png")}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl",
                "bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 transition-all",
                "font-medium shadow-md hover:shadow-lg"
              )}
            >
              <Download className="h-4 w-4" />
              下载
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDownloadMenu(!showDownloadMenu);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            {showDownloadMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload("png");
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <span className="font-medium text-gray-900">PNG</span>
                  <span className="text-xs text-gray-500 ml-2">{t.download.lossless || "Lossless"}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload("jpg");
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <span className="font-medium text-gray-900">JPG</span>
                  <span className="text-xs text-gray-500 ml-2">{t.download.compressed || "Compressed"}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload("webp");
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">WebP</span>
                  <span className="text-xs text-gray-500 ml-2">{t.download.modern || "Modern"}</span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleShare}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl",
              "bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors",
              "font-medium"
            )}
          >
            <Share2 className="h-4 w-4" />
            分享
          </button>
        </div>
      </div>

      {showEditor && (
        <ImageEditor
          imageUrl={displayUrl || imageUrl || ""}
          onSave={handleEditorSave}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
