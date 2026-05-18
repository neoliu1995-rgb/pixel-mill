"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { DEFAULT_NEGATIVE_PROMPT } from "@/lib/promptEnhancer";

interface NegativePromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NegativePromptInput({ value, onChange }: NegativePromptInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const commonNegativeTerms = [
    "ugly",
    "blurry",
    "low quality",
    "distorted",
    "watermark",
    "text",
    "bad anatomy",
    "cartoon",
    "anime",
    "manga",
    "pixelated",
    "grainy",
  ];

  const addTerm = (term: string) => {
    const currentTerms = value ? value.split(",").map((t) => t.trim()) : [];
    if (!currentTerms.includes(term)) {
      currentTerms.push(term);
      onChange(currentTerms.join(", "));
    }
  };

  const clearAll = () => {
    onChange("");
  };

  const useDefault = () => {
    onChange(DEFAULT_NEGATIVE_PROMPT);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">负向提示词</span>
          {value && (
            <span className="text-xs text-gray-500">
              ({value.split(",").length}项)
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 快捷标签 */}
          <div className="flex flex-wrap gap-2">
            {commonNegativeTerms.map((term) => (
              <button
                key={term}
                onClick={() => addTerm(term)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  value?.includes(term)
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {term}
              </button>
            ))}
          </div>

          {/* 输入框 */}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="输入要排除的元素，用逗号分隔..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
          />

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={useDefault}
              className="flex-1 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              使用默认
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              清空
            </button>
          </div>

          <p className="text-xs text-gray-400">
            负向提示词可以帮助排除不想要的元素，提升生成质量
          </p>
        </div>
      )}
    </div>
  );
}
