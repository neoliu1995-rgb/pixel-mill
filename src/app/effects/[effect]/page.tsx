"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import EffectTool from "@/components/effects/EffectTool";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";

export default function EffectPage() {
  const params = useParams();
  const { t } = useLanguage();
  const effectId = params.effect as string;

  const effectConfig: Record<
    string,
    { name: string; description: string; prompt: string }
  > = {
    chibi: {
      name: t.effects.chibi,
      description: t.effects.chibiDesc,
      prompt:
        "Transform this person into a 3D Chibi-style collectible toy figure with oversized expressive eyes, inside a retail blister packaging with a colorful backing card, neon cyberpunk styling, plastic sheen texture, toy aisle lighting",
    },
    caricature: {
      name: t.effects.caricature,
      description: t.effects.caricatureDesc,
      prompt:
        "Create a vibrant caricature of this person in a bold comic-book style, with exaggerated facial features, dynamic pose, colorful background, humorous and expressive",
    },
    "retro-film": {
      name: t.effects.retroFilm,
      description: t.effects.retroFilmDesc,
      prompt:
        "Transform this photo into a 1990s Polaroid style image with heavy film grain, slight blur around the edges, faded colors, faint yellow light leak from the corner, nostalgic warm tones",
    },
    "time-travel": {
      name: t.effects.timeTravel,
      description: t.effects.timeTravelDesc,
      prompt:
        "Place this person in a 1920s Great Gatsby style ballroom, change outfit to period-appropriate elegant clothing, adjust lighting to warm golden glow of vintage chandeliers, cinematic composition",
    },
    "pet-human": {
      name: t.effects.petHuman,
      description: t.effects.petHumanDesc,
      prompt:
        "Transform this pet into a human character version, maintaining the pet's distinctive features and personality as human traits, portrait style, detailed and expressive",
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

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{config.name}</h1>
              <p className="text-xs text-gray-400">{t.effectsPage.aiMagicEffect}</p>
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
            <Sparkles className="w-4 h-4" />
            {t.effectsPage.aiMagicEffect}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {config.name}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {config.description}
          </p>
        </div>

        <EffectTool
          effectId={effectId}
          effectName={config.name}
          effectPrompt={config.prompt}
        />
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
