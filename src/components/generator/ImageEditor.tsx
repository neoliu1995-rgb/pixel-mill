"use client";

import { useState, useRef } from "react";
import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Palette,
  Wand2,
  Check,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [scale, setScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);

  const loadImage = () => {
    if (!imageRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        applyEdits();
      };
      img.src = imageUrl;
    } else {
      applyEdits();
    }
  };

  const applyEdits = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.filter = filter;

    ctx.drawImage(img, 0, 0);
    ctx.restore();

    setEditedUrl(canvas.toDataURL("image/png"));
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setScale(1);
    loadImage();
  };

  const handleApply = () => {
    if (editedUrl) {
      onSave(editedUrl);
    }
  };

  const quickAdjust = (type: "brightness" | "contrast" | "saturation", value: number) => {
    switch (type) {
      case "brightness":
        setBrightness(value);
        break;
      case "contrast":
        setContrast(value);
        break;
      case "saturation":
        setSaturation(value);
        break;
    }
    loadImage();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Wand2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI 图片编辑器</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              重置
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-gray-100 flex items-center justify-center p-4 overflow-auto">
            <div className="relative">
              {!imageRef.current && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Original"
                  className="hidden"
                  ref={(img) => {
                    if (img && !imageRef.current) {
                      img.onload = () => {
                        imageRef.current = img;
                        loadImage();
                      };
                    }
                  }}
                />
              )}
              <canvas 
                ref={canvasRef} 
                className="max-w-full max-h-[60vh] object-contain shadow-lg"
                style={{ minHeight: "300px" }}
                onLoad={loadImage}
              />
            </div>
          </div>

          <div className="w-80 bg-gray-50 p-4 overflow-y-auto border-l border-gray-200">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  亮度
                </h3>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => {
                    setBrightness(Number(e.target.value));
                    loadImage();
                  }}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>暗</span>
                  <span>{brightness}%</span>
                  <span>亮</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => quickAdjust("brightness", 80)}
                    className="flex-1 py-1 px-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    变暗
                  </button>
                  <button
                    onClick={() => quickAdjust("brightness", 120)}
                    className="flex-1 py-1 px-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    变亮
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Contrast className="w-4 h-4" />
                  对比度
                </h3>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => {
                    setContrast(Number(e.target.value));
                    loadImage();
                  }}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>低</span>
                  <span>{contrast}%</span>
                  <span>高</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => quickAdjust("contrast", 80)}
                    className="flex-1 py-1 px-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    降低
                  </button>
                  <button
                    onClick={() => quickAdjust("contrast", 120)}
                    className="flex-1 py-1 px-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    提高
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  饱和度
                </h3>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => {
                    setSaturation(Number(e.target.value));
                    loadImage();
                  }}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>黑白</span>
                  <span>{saturation}%</span>
                  <span>鲜艳</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => quickAdjust("saturation", 0)}
                    className="flex-1 py-1 px-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    黑白
                  </button>
                  <button
                    onClick={() => quickAdjust("saturation", 130)}
                    className="flex-1 py-1 px-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    增强
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  旋转 & 翻转
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      setRotation((r) => r - 90);
                      setTimeout(loadImage, 0);
                    }}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    title="向左旋转"
                  >
                    <RotateCw className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => {
                      setRotation((r) => r + 90);
                      setTimeout(loadImage, 0);
                    }}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    title="向右旋转"
                  >
                    <RotateCw className="w-4 h-4 mx-auto transform scale-x-[-1]" />
                  </button>
                  <button
                    onClick={() => {
                      setFlipH(!flipH);
                      setTimeout(loadImage, 0);
                    }}
                    className={cn(
                      "p-2 rounded-lg border",
                      flipH ? "bg-purple-100 border-purple-300 text-purple-600" : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                    title="水平翻转"
                  >
                    <FlipHorizontal className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => {
                      setFlipV(!flipV);
                      setTimeout(loadImage, 0);
                    }}
                    className={cn(
                      "p-2 rounded-lg border",
                      flipV ? "bg-purple-100 border-purple-300 text-purple-600" : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                    title="垂直翻转"
                  >
                    <FlipVertical className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  缩放
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setScale((s) => Math.max(0.5, s - 0.1));
                      setTimeout(loadImage, 0);
                    }}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={scale * 100}
                    onChange={(e) => {
                      setScale(Number(e.target.value) / 100);
                      loadImage();
                    }}
                    className="flex-1 accent-purple-600"
                  />
                  <button
                    onClick={() => {
                      setScale((s) => Math.min(2, s + 0.1));
                      setTimeout(loadImage, 0);
                    }}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center text-xs text-gray-500 mt-1">
                  {Math.round(scale * 100)}%
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={handleApply}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2",
                    "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
                    "hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
                  )}
                >
                  <Check className="w-4 h-4" />
                  应用编辑
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
