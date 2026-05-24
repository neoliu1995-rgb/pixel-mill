"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, Zap } from "lucide-react";
import EffectTool from "@/components/effects/EffectTool";
import FilterEffectTool from "@/components/effects/FilterEffectTool";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import { isFilterEffect } from "@/lib/imageFilters";

type EffectMode = "ai" | "filter";

interface EffectConfig {
  name: string;
  description: string;
  prompt?: string;
  mode: EffectMode;
  badge?: string;
}

export default function EffectPage() {
  const params = useParams();
  const { t } = useLanguage();
  const effectId = params.effect as string;

  const effectConfig: Record<string, EffectConfig> = {
    chibi: {
      name: t.effects.chibi,
      description: t.effects.chibiDesc,
      prompt:
        "Transform this person into a 3D Chibi-style collectible toy figure with oversized expressive eyes, inside a retail blister packaging with a colorful backing card, neon cyberpunk styling, plastic sheen texture, toy aisle lighting",
      mode: "ai",
      badge: "AI",
    },
    caricature: {
      name: t.effects.caricature,
      description: t.effects.caricatureDesc,
      mode: "filter",
      badge: "Instant",
    },
    "retro-film": {
      name: t.effects.retroFilm,
      description: t.effects.retroFilmDesc,
      mode: "filter",
      badge: "Instant",
    },
  };

  const config = effectConfig[effectId];

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {t.effectsPage.effectNotFound}
          </h1>
          <p className="text-gray-400 mb-6">
            {t.effectsPage.effectNotFoundDesc}
          </p>
          <Link
            href="/effects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.nav.backToEffects}
          </Link>
        </div>
      </div>
    );
  }

  const isFilter = config.mode === "filter" || isFilterEffect(effectId);

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{config.name}</h1>
                {config.badge && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    config.badge === "Instant"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  }`}>
                    {config.badge === "Instant" ? (
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{config.badge}</span>
                    ) : (
                      config.badge
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {isFilter ? "Instant Photo Filter" : t.effectsPage.aiMagicEffect}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher variant="dark" />
            <Link
              href="/effects"
              className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.effectsPage.allEffects}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium mb-4">
            {isFilter ? (
              <>
                <Zap className="w-4 h-4" />
                Instant Filter
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t.effectsPage.aiMagicEffect}
              </>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {config.name}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {config.description}
          </p>
        </div>

        {isFilter ? (
          <FilterEffectTool
            effectId={effectId}
            effectName={config.name}
          />
        ) : (
          <EffectTool
            effectId={effectId}
            effectName={config.name}
            effectPrompt={config.prompt || ""}
          />
        )}
      </main>

      <footer className="mt-16 bg-gray-800/50 backdrop-blur-md border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-gray-400">
            {t.effectsPage.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
