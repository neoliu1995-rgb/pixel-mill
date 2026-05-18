"use client";

import { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  prompt: string;
  icon: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "portrait",
    name: "人像摄影",
    category: "摄影",
    prompt: "professional portrait photography, {subject}, studio lighting, sharp focus, high detail, DSLR quality, modern",
    icon: "📷",
  },
  {
    id: "product",
    name: "产品展示",
    category: "商业",
    prompt: "product photography of {product}, clean white background, professional lighting, commercial quality, e-commerce style",
    icon: "📦",
  },
  {
    id: "landscape",
    name: "风景大片",
    category: "自然",
    prompt: "breathtaking landscape photography, {scene}, golden hour lighting, wide angle, professional quality, National Geographic style",
    icon: "🏔️",
  },
  {
    id: "anime",
    name: "动漫风格",
    category: "艺术",
    prompt: "beautiful anime artwork, {character}, vibrant colors, detailed illustration, studio quality, trending on pixiv",
    icon: "🎨",
  },
  {
    id: "cyberpunk",
    name: "赛博朋克",
    category: "风格",
    prompt: "cyberpunk cityscape, neon lights, futuristic, rain-soaked streets, holographic advertisements, cinematic lighting",
    icon: "🌃",
  },
  {
    id: "fantasy",
    name: "奇幻魔法",
    category: "艺术",
    prompt: "fantasy art, magical {creature}, epic scene, detailed illustration, digital painting, artstation trending, dramatic lighting",
    icon: "🐉",
  },
  {
    id: "fashion",
    name: "时尚大片",
    category: "时尚",
    prompt: "fashion photography, model wearing {outfit}, editorial style, high fashion magazine, professional studio lighting",
    icon: "👗",
  },
  {
    id: "architecture",
    name: "建筑摄影",
    category: "建筑",
    prompt: "architectural photography of {building}, clean lines, modern design, professional quality, wide angle lens",
    icon: "🏛️",
  },
  {
    id: "food",
    name: "美食摄影",
    category: "商业",
    prompt: "professional food photography, {dish}, top-down angle, natural lighting, food blog quality, appetizing presentation",
    icon: "🍜",
  },
  {
    id: "pet",
    name: "宠物肖像",
    category: "动物",
    prompt: "adorable pet portrait, {pet_type}, soft natural lighting, shallow depth of field, professional pet photography",
    icon: "🐕",
  },
  {
    id: "抽象艺术",
    name: "Abstract Art",
    category: "art",
    prompt: "abstract art, flowing colors, {color_palette} palette, geometric shapes, modern art style, gallery exhibition",
    icon: "🎭",
  },
  {
    id: "水下世界",
    name: "Underwater",
    category: "nature",
    prompt: "underwater scene, {sea_creature}, crystal clear water, sun rays, marine life photography, documentary style",
    icon: "🐠",
  },
];

const CATEGORIES = ["全部", "摄影", "商业", "艺术", "风格", "时尚", "建筑", "自然", "动物"];

interface PromptTemplatesProps {
  onSelect: (prompt: string) => void;
}

export default function PromptTemplates({ onSelect }: PromptTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = selectedCategory === "全部"
    ? PROMPT_TEMPLATES
    : PROMPT_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleTemplateClick = (template: PromptTemplate) => {
    const prompt = template.prompt.replace(/\{[^}]+\}/g, "");
    onSelect(prompt);
  };

  const handleCopy = async (template: PromptTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = template.prompt.replace(/\{[^}]+\}/g, "");
    await navigator.clipboard.writeText(prompt);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">提示词模板</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-all",
              selectedCategory === category
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className={cn(
              "relative p-3 rounded-xl border text-left transition-all",
              "hover:shadow-md hover:border-purple-300 hover:bg-purple-50",
              "group"
            )}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">{template.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{template.name}</div>
                <div className="text-xs text-gray-500">{template.category}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600 line-clamp-2">
              {template.prompt.substring(0, 60)}...
            </p>
            <button
              onClick={(e) => handleCopy(template, e)}
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded-lg transition-all",
                "opacity-0 group-hover:opacity-100",
                copiedId === template.id
                  ? "bg-green-100 text-green-600"
                  : "bg-white text-gray-500 hover:text-purple-600"
              )}
            >
              {copiedId === template.id ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}