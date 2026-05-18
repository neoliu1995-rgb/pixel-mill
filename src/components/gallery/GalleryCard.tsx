"use client";

import Image from "next/image";
import { useState } from "react";
import { Image as ImageIcon, RefreshCw } from "lucide-react";

interface GalleryCardProps {
  prompt: string;
  seed: number;
  category: string;
  onTryPrompt: (prompt: string) => void;
}

export default function GalleryCard({ prompt, seed, category, onTryPrompt }: GalleryCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount(retryCount + 1);
        setImageError(false);
        setImageLoaded(false);
      }, 1000);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {!imageError && (
          <Image
            key={`${seed}-${retryCount}`}
            src={`https://picsum.photos/seed/${seed}/512/512`}
            alt={prompt}
            fill
            className={`object-cover transition-all duration-500 ${imageLoaded ? "group-hover:scale-110 opacity-100" : "opacity-0"}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
              <span className="text-xs">Loading...</span>
            </div>
          </div>
        )}

        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Failed to load image</p>
            <button
              onClick={() => {
                setRetryCount(retryCount + 1);
                setImageError(false);
                setImageLoaded(false);
              }}
              className="mt-2 flex items-center gap-1 px-3 py-1 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <button
            onClick={() => onTryPrompt(prompt)}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 px-4 py-2 bg-white text-gray-900 rounded-full text-sm font-medium shadow-lg hover:bg-gray-100"
          >
            Try This Prompt
          </button>
        </div>
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
            {category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 line-clamp-2" title={prompt}>
          {prompt}
        </p>
      </div>
    </div>
  );
}
