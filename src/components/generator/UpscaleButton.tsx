"use client";

import { useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { upscaleImage } from "@/lib/upscale";

interface UpscaleButtonProps {
  imageUrl: string;
  onUpscale: (upscaledUrl: string) => void;
}

export default function UpscaleButton({ imageUrl, onUpscale }: UpscaleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(2);

  const handleUpscale = async () => {
    setIsLoading(true);
    try {
      const result = await upscaleImage(imageUrl, scale);
      if (result.success) {
        onUpscale(result.imageUrl);
      }
    } catch (error) {
      console.error("Upscale failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <select
        value={scale}
        onChange={(e) => setScale(Number(e.target.value))}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
        <option value={3}>3x</option>
        <option value={4}>4x</option>
      </select>
      <button
        onClick={handleUpscale}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>放大中...</span>
          </>
        ) : (
          <>
            <ArrowUp className="w-4 h-4" />
            <span>高清放大</span>
          </>
        )}
      </button>
    </div>
  );
}
