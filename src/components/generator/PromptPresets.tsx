"use client";

import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { promptPresets, presetCategories, getPresetsByCategory } from "@/lib/promptPresets";
import { useLanguage } from "@/components/LanguageProvider";

interface PromptPresetsProps {
  onSelect: (prompt: string) => void;
}

export default function PromptPresets({ onSelect }: PromptPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { t } = useLanguage();

  const filteredPresets = getPresetsByCategory(selectedCategory);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">{t.homePage.promptPresets}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {/* 分类标签 */}
          <div className="flex flex-wrap gap-2 p-3 border-b border-gray-100">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.gallery.categories.all}
            </button>
            {presetCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === category
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 预设列表 */}
          <div className="max-h-80 overflow-y-auto">
            {filteredPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onSelect(preset.prompt);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="font-medium text-gray-800 mb-1">{preset.name}</div>
                <div className="text-xs text-gray-500 line-clamp-2">{preset.prompt}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
