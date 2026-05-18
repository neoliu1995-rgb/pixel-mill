"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../LanguageProvider";
import { Sparkles, Zap, Crown, Camera, Palette, Star, Globe, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { getAvailableModels, ModelInfo } from "@/lib/imageGenerator";
import type { UserTier } from "@/lib/providers/router";

export type ModelType = string;

interface ModelSelectorProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  userTier?: UserTier;
}

const providerLabels: Record<string, { name: string; color: string }> = {
  siliconflow: { name: "SiliconFlow", color: "bg-blue-100 text-blue-700" },
  alibailian: { name: "阿里百炼", color: "bg-orange-100 text-orange-700" },
  pollinations: { name: "Pollinations", color: "bg-green-100 text-green-700" },
};

const tierConfig: Record<string, { label: string; color: string; icon: typeof Sparkles }> = {
  free: { label: "免费", color: "bg-green-100 text-green-700", icon: Zap },
  pro: { label: "专业", color: "bg-purple-100 text-purple-700", icon: Star },
  business: { label: "企业", color: "bg-amber-100 text-amber-700", icon: Crown },
};

const modelIconMap: Record<string, typeof Sparkles> = {
  "black-forest-labs/FLUX.2-pro": Sparkles,
  "black-forest-labs/FLUX.2-flex": Crown,
  "Zhihu-ai/Z-Image-Turbo": Zap,
  "wanx2.6-t2i": Camera,
  "wanx2.1-t2i-turbo": Palette,
  "flux-schnell": Zap,
};

const legacyModelIds = new Set([
  "flux-schnell", "flux-dev", "sdxl", "turbo", "realistic", "anime",
]);

function getEffectiveModelId(modelId: string): string {
  if (legacyModelIds.has(modelId)) return "auto";
  return modelId;
}

function getSelectedEffectiveModel(selectedModel: ModelType, models: ModelInfo[]): ModelInfo | null {
  const effectiveId = getEffectiveModelId(selectedModel);
  if (effectiveId === "auto") return null;
  return models.find((m) => m.id === effectiveId) || null;
}

export default function ModelSelector({ selectedModel, onModelChange, userTier = "free" }: ModelSelectorProps) {
  const { t } = useLanguage();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const available = getAvailableModels(userTier);
      setModels(available);
      const providers = new Set(available.map((m) => m.provider));
      setExpandedProviders(providers);
    } catch {
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  }, [userTier]);

  const effectiveSelected = getEffectiveModelId(selectedModel);
  const selectedModelInfo = getSelectedEffectiveModel(selectedModel, models);

  const groupedModels = models.reduce<Record<string, ModelInfo[]>>((acc, model) => {
    const provider = model.provider;
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {});

  const toggleProvider = (provider: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
  };

  const tierOrder: UserTier[] = ["free", "pro", "business"];

  const getAvailableTierIndex = (): number => {
    return tierOrder.indexOf(userTier);
  };

  const isModelAccessible = (model: ModelInfo): boolean => {
    const tierIndex = getAvailableTierIndex();
    const modelTierIndex = tierOrder.indexOf(model.type as UserTier);
    return modelTierIndex <= tierIndex;
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        {t?.model?.title || "AI Model"}
      </h3>

      <button
        onClick={() => handleModelSelect("auto")}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-3 ${
          effectiveSelected === "auto"
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>Auto</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ml-auto ${
          effectiveSelected === "auto" ? "bg-white/20" : "bg-green-100 text-green-700"
        }`}>
          Smart
        </span>
      </button>

      {isLoading ? (
        <div className="text-center py-4 text-sm text-gray-400">Loading models...</div>
      ) : models.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-400">No models available</div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedModels).map(([provider, providerModels]) => {
            const providerInfo = providerLabels[provider] || { name: provider, color: "bg-gray-100 text-gray-700" };
            const isExpanded = expandedProviders.has(provider);

            return (
              <div key={provider} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => toggleProvider(provider)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${providerInfo.color}`}>
                      {providerInfo.name}
                    </span>
                    <span className="text-xs text-gray-400">{providerModels.length} models</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {providerModels.map((model) => {
                      const Icon = modelIconMap[model.id] || Sparkles;
                      const tierInfo = tierConfig[model.type] || tierConfig.free;
                      const TierIcon = tierInfo.icon;
                      const accessible = isModelAccessible(model);

                      return (
                        <button
                          key={model.id}
                          onClick={() => handleModelSelect(model.id)}
                          disabled={!accessible}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-all duration-200 ${
                            effectiveSelected === model.id
                              ? "bg-purple-50 text-purple-700 border-l-2 border-purple-600"
                              : accessible
                                ? "text-gray-700 hover:bg-gray-50 border-l-2 border-transparent"
                                : "text-gray-400 bg-gray-50/50 cursor-not-allowed border-l-2 border-transparent"
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${accessible ? "" : "opacity-40"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`truncate ${accessible ? "" : "opacity-50"}`}>{model.name}</span>
                              {model.supportsChinese && (
                                <Globe className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tierInfo.color} flex items-center gap-0.5`}>
                                <TierIcon className="w-2.5 h-2.5" />
                                {tierInfo.label}
                              </span>
                              {!accessible && (
                                <Lock className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                          {model.bestFor.length > 0 && (
                            <span className={`text-xs truncate max-w-[120px] ${
                              effectiveSelected === model.id ? "text-purple-500" : "text-gray-400"
                            }`}>
                              {model.bestFor[0]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {effectiveSelected !== "auto" && selectedModelInfo && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <span>{selectedModelInfo.name}</span>
          <span className="text-gray-300">|</span>
          <span className={`px-1.5 py-0.5 rounded-full ${tierConfig[selectedModelInfo.type]?.color || "bg-gray-100 text-gray-600"}`}>
            {tierConfig[selectedModelInfo.type]?.label || selectedModelInfo.type}
          </span>
          {selectedModelInfo.supportsChinese && (
            <>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-0.5 text-blue-500">
                <Globe className="w-3 h-3" />
                中文
              </span>
            </>
          )}
          <span className="text-gray-300">|</span>
          <span>{selectedModelInfo.bestFor.join(", ")}</span>
        </div>
      )}

      {effectiveSelected === "auto" && (
        <p className="mt-3 text-xs text-gray-500">
          AI will automatically select the best model based on your prompt
        </p>
      )}
    </div>
  );
}
