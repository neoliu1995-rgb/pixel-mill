"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Loader2, Check, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

interface BatchResult {
  id: number;
  imageUrl: string;
  status: "pending" | "generating" | "completed" | "error";
  error?: string;
}

interface BatchGeneratorProps {
  prompt: string;
  width: number;
  height: number;
  style: string;
  negativePrompt?: string;
  referenceImage?: string;
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
}

export default function BatchGenerator({
  prompt,
  width,
  height,
  style,
  negativePrompt,
  referenceImage,
  onSelect,
  onClose,
}: BatchGeneratorProps) {
  const { t } = useLanguage();
  const [count, setCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  const generateImages = useCallback(async () => {
    setIsGenerating(true);
    setCompletedCount(0);
    
    const initialResults: BatchResult[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      imageUrl: "",
      status: "pending",
    }));
    setResults(initialResults);

    // 逐个生成图片
    for (let i = 0; i < count; i++) {
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: "generating" } : r
      ));

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            width,
            height,
            style,
            model: "auto",
            image: referenceImage,
            negativePrompt: negativePrompt || undefined,
            userTier: "free",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate");
        }

        const data = await response.json();
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, imageUrl: data.imageUrl, status: "completed" } : r
        ));
      } catch (error) {
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: "error", error: error instanceof Error ? error.message : "Unknown error" } : r
        ));
      }

      setCompletedCount(prev => prev + 1);
      await new Promise(resolve => setTimeout(resolve, 500)); // 间隔生成
    }

    setIsGenerating(false);
  }, [prompt, width, height, style, negativePrompt, referenceImage, count]);

  const handleSelect = (imageUrl: string) => {
    onSelect(imageUrl);
    onClose();
  };

  const handleRegenerate = (id: number) => {
    setResults(prev => prev.map((r, idx) => 
      idx === id ? { ...r, status: "generating", imageUrl: "", error: undefined } : r
    ));

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        width,
        height,
        style,
        model: "auto",
        image: referenceImage,
        negativePrompt: negativePrompt || undefined,
        userTier: "free",
      }),
    })
    .then(response => response.json())
    .then(data => {
      setResults(prev => prev.map((r, idx) => 
        idx === id ? { ...r, imageUrl: data.imageUrl, status: "completed" } : r
      ));
    })
    .catch(error => {
      setResults(prev => prev.map((r, idx) => 
        idx === id ? { ...r, status: "error", error: error instanceof Error ? error.message : "Unknown error" } : r
      ));
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t.batchGenerate}</h2>
            <p className="text-sm text-gray-500 mt-1">{t.batchDescription}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Settings */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">生成数量:</span>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                disabled={isGenerating}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={2}>2 张</option>
                <option value={4}>4 张</option>
                <option value={6}>6 张</option>
                <option value={8}>8 张</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ImageIcon className="w-4 h-4" />
              <span>{width} × {height}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="px-6 py-4 bg-purple-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">正在生成...</span>
              <span className="text-sm font-medium text-purple-600">
                {completedCount} / {count}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / count) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {results.map((result) => (
              <div
                key={result.id}
                className={cn(
                  "relative rounded-xl overflow-hidden border-2 transition-all",
                  result.status === "completed" 
                    ? "border-gray-200 hover:border-purple-500 cursor-pointer" 
                    : "border-gray-100"
                )}
              >
                {/* Loading State */}
                {result.status === "pending" && (
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <div className="text-gray-400">等待中...</div>
                  </div>
                )}

                {/* Generating State */}
                {result.status === "generating" && (
                  <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <span className="text-xs text-gray-500 mt-2">生成中...</span>
                  </div>
                )}

                {/* Completed State */}
                {result.status === "completed" && result.imageUrl && (
                  <div 
                    className="aspect-square cursor-pointer"
                    onClick={() => handleSelect(result.imageUrl)}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={result.imageUrl}
                        alt={`Generated ${result.id + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}

                {/* Error State */}
                {result.status === "error" && (
                  <div className="aspect-square bg-red-50 flex flex-col items-center justify-center">
                    <X className="w-8 h-8 text-red-500" />
                    <span className="text-xs text-red-600 mt-2 text-center px-2">{result.error}</span>
                    <button
                      onClick={() => handleRegenerate(result.id)}
                      className="mt-2 px-3 py-1 text-xs bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      重试
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {results.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">{t.startBatch}</p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex gap-3">
            <button
              onClick={generateImages}
              disabled={isGenerating || results.length > 0}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium transition-all",
                isGenerating || results.length > 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              )}
            >
              {isGenerating ? "生成中..." : `生成 ${count} 张图片`}
            </button>
            {results.length > 0 && (
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
