"use client";

import { cn } from "@/lib/utils";
import { ASPECT_RATIOS } from "@/lib/utils";
import { Sun, Palette, Grid3X3, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface StyleOptionsProps {
  aspectRatio: { label: string; width: number; height: number; description: string };
  onAspectRatioChange: (ratio: { label: string; width: number; height: number; description: string }) => void;
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  selectedLighting?: string;
  onLightingChange?: (lighting: string) => void;
  selectedComposition?: string;
  onCompositionChange?: (composition: string) => void;
  disabled?: boolean;
}

export default function StyleOptions({
  aspectRatio,
  onAspectRatioChange,
  selectedStyle,
  onStyleChange,
  selectedColor = "none",
  onColorChange,
  selectedLighting = "none",
  onLightingChange,
  selectedComposition = "none",
  onCompositionChange,
  disabled,
}: StyleOptionsProps) {
  const { t } = useLanguage();

  const STYLE_OPTIONS = [
    { id: "none", label: t.styleOptions.none || "None", emoji: "➖" },
    { id: "realistic", label: t.styleOptions.realistic || "Realistic", emoji: "📷" },
    { id: "photographic", label: t.styleOptions.photographic || "Photographic", emoji: "🎞️" },
    { id: "anime", label: t.styleOptions.anime || "Anime", emoji: "🌸" },
    { id: "digital_art", label: t.styleOptions.digitalArt || "Digital Art", emoji: "💻" },
    { id: "oil_painting", label: t.styleOptions.oilPainting || "Oil Painting", emoji: "🖼️" },
    { id: "watercolor", label: t.styleOptions.watercolor || "Watercolor", emoji: "🎨" },
    { id: "cyberpunk", label: t.styleOptions.cyberpunk || "Cyberpunk", emoji: "🤖" },
    { id: "fantasy", label: t.styleOptions.fantasy || "Fantasy", emoji: "🧙" },
    { id: "cinematic", label: t.styleOptions.cinematic || "Cinematic", emoji: "🎬" },
    { id: "vintage", label: t.styleOptions.vintage || "Vintage", emoji: "📺" },
  ];

  const COLOR_OPTIONS = [
    { id: "none", label: t.styleOptions.none || "None", emoji: "➖" },
    { id: "vibrant", label: t.colorOptions.vibrant || "Vibrant", emoji: "🌈" },
    { id: "muted", label: t.colorOptions.muted || "Muted", emoji: "🎀" },
    { id: "monochrome", label: t.colorOptions.monochrome || "Monochrome", emoji: "⬛" },
    { id: "warm", label: t.colorOptions.warm || "Warm", emoji: "🍂" },
    { id: "cool", label: t.colorOptions.cool || "Cool", emoji: "❄️" },
    { id: "pastel", label: t.colorOptions.pastel || "Pastel", emoji: "🧁" },
    { id: "neon", label: t.colorOptions.neon || "Neon", emoji: "💡" },
  ];

  const LIGHTING_OPTIONS = [
    { id: "none", label: t.styleOptions.none || "None", emoji: "➖" },
    { id: "natural", label: t.lightingOptions.natural || "Natural Light", emoji: "☀️" },
    { id: "studio", label: t.lightingOptions.studio || "Studio", emoji: "💡" },
    { id: "dramatic", label: t.lightingOptions.dramatic || "Dramatic", emoji: "🎭" },
    { id: "sunset", label: t.lightingOptions.sunset || "Sunset", emoji: "🌅" },
    { id: "night", label: t.lightingOptions.night || "Night", emoji: "🌙" },
    { id: "neon", label: t.lightingOptions.neon || "Neon", emoji: "💫" },
    { id: "backlit", label: t.lightingOptions.backlit || "Backlit", emoji: "✨" },
  ];

  const COMPOSITION_OPTIONS = [
    { id: "none", label: t.styleOptions.none || "None", emoji: "➖" },
    { id: "centered", label: t.compositionOptions.centered || "Centered", emoji: "🎯" },
    { id: "rule_of_thirds", label: t.compositionOptions.ruleOfThirds || "Rule of Thirds", emoji: "📐" },
    { id: "leading_lines", label: t.compositionOptions.leadingLines || "Leading Lines", emoji: "📊" },
    { id: "negative_space", label: t.compositionOptions.negativeSpace || "Negative Space", emoji: "⬜" },
    { id: "symmetrical", label: t.compositionOptions.symmetrical || "Symmetrical", emoji: "🪞" },
    { id: "dynamic", label: t.compositionOptions.dynamic || "Dynamic", emoji: "⚡" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <Grid3X3 className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-gray-700">{t.advancedOptions}</span>
      </div>

      {/* Aspect Ratio */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            {t.aspectRatio}
          </label>
          <span className="text-xs text-gray-500">{aspectRatio.label}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.label}
              type="button"
              onClick={() => onAspectRatioChange(ratio)}
              disabled={disabled}
              className={cn(
                "flex items-center justify-center px-3 py-2 rounded-lg border transition-all text-sm",
                aspectRatio.label === ratio.label
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            {t.styleLabel}
          </label>
          <span className="text-xs text-gray-500">
            {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label || t.styleOptions.none}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onStyleChange(style.id)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all",
                selectedStyle === style.id
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span>{style.emoji}</span>
              <span className="truncate">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      {onColorChange && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-500" />
              {t.colorLabel}
            </label>
            <span className="text-xs text-gray-500">
              {COLOR_OPTIONS.find(c => c.id === selectedColor)?.label || t.styleOptions.none}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => onColorChange(color.id)}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all",
                  selectedColor === color.id
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span>{color.emoji}</span>
                <span className="truncate">{color.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lighting */}
      {onLightingChange && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-purple-500" />
              {t.lightingLabel}
            </label>
            <span className="text-xs text-gray-500">
              {LIGHTING_OPTIONS.find(l => l.id === selectedLighting)?.label || t.styleOptions.none}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {LIGHTING_OPTIONS.map((lighting) => (
              <button
                key={lighting.id}
                type="button"
                onClick={() => onLightingChange(lighting.id)}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all",
                  selectedLighting === lighting.id
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span>{lighting.emoji}</span>
                <span className="truncate">{lighting.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composition */}
      {onCompositionChange && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Grid3X3 className="w-3.5 h-3.5 text-purple-500" />
              {t.compositionLabel}
            </label>
            <span className="text-xs text-gray-500">
              {COMPOSITION_OPTIONS.find(c => c.id === selectedComposition)?.label || t.styleOptions.none}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {COMPOSITION_OPTIONS.map((composition) => (
              <button
                key={composition.id}
                type="button"
                onClick={() => onCompositionChange(composition.id)}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all",
                  selectedComposition === composition.id
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span>{composition.emoji}</span>
                <span className="truncate">{composition.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}