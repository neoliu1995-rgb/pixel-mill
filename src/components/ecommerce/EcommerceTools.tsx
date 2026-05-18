"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useLanguage } from "../LanguageProvider";
import { Upload, Scissors, Image as ImageIcon, Loader2, Download, X, AlertCircle } from "lucide-react";

interface EcommerceToolsProps {
  generatedImage?: string | null;
}

export default function EcommerceTools({ generatedImage }: EcommerceToolsProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<"remove-bg" | "white-bg" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError(t.eCommerce?.errorInvalidFile || "Please upload an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t.eCommerce?.errorFileTooLarge || "File size must be less than 10MB");
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

  const handleRemoveBackground = async () => {
    const imageToProcess = uploadedImage || generatedImage;
    if (!imageToProcess) {
      setError(t.eCommerce?.errorNoImage || "No image to process");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setActiveTool("remove-bg");

    try {
      const response = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageToProcess }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to remove background");
      }

      setProcessedImage(data.imageUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
      setActiveTool(null);
    }
  };

  const handleWhiteBackground = async () => {
    const imageToProcess = uploadedImage || generatedImage;
    if (!imageToProcess) return;

    setIsProcessing(true);
    setError(null);
    setActiveTool("white-bg");

    try {
      const response = await fetch("/api/white-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageToProcess }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create white background");
      }

      setProcessedImage(data.imageUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
      setActiveTool(null);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `processed-${Date.now()}.png`;
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

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Scissors className="w-5 h-5 text-purple-600" />
        {t.eCommerce?.title || "E-commerce Tools"}
      </h3>

      {/* Notice about limitations */}
      {showNotice && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            图像处理功能使用AI生成模型，结果可能与原图有差异。如需精确的背景移除效果，建议使用专业工具如Photoshop或Remove.bg。
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="ecommerce-upload"
      />

      {!uploadedImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            {t.eCommerce?.uploadPrompt || "Click or drag image to upload"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {t.eCommerce?.supportedFormats || "Supports JPG, PNG, WebP (max 10MB)"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <Image
              src={uploadedImage}
              alt="Uploaded"
              fill
              className="object-contain"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRemoveBackground}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing && activeTool === "remove-bg" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Scissors className="w-4 h-4" />
              )}
              {t.eCommerce?.removeBg || "Remove Background"}
            </button>

            <button
              onClick={handleWhiteBackground}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing && activeTool === "white-bg" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              {t.eCommerce?.whiteBg || "White Background"}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}

      {processedImage && (
        <div className="mt-6 space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSIyIiBmaWxsPSIjZmZmIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkZGRkIi8+PC9zdmc+')]">
            <Image
              src={processedImage}
              alt="Processed"
              fill
              className="object-contain"
            />
          </div>
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t.eCommerce?.download || "Download Image"}
          </button>
        </div>
      )}

      {generatedImage && !uploadedImage && !processedImage && (
        <div className="mt-4 p-4 bg-purple-50 rounded-xl">
          <p className="text-sm text-purple-700 mb-3">
            {t.eCommerce?.useGenerated || "Use your generated image for e-commerce processing:"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRemoveBackground}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Scissors className="w-4 h-4" />
              )}
              {t.eCommerce?.removeBg || "Remove Background"}
            </button>
            <button
              onClick={handleWhiteBackground}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              {t.eCommerce?.whiteBg || "White Background"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
