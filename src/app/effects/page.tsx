"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import EffectCard from "@/components/effects/EffectCard";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";

export default function EffectsPage() {
  const { t } = useLanguage();

  const effects = [
    {
      id: "chibi",
      name: t.effects.chibi,
      description: t.effects.chibiDesc,
      previewPrompt:
        "A 3D Chibi-style collectible toy figure of a person with oversized expressive eyes, inside a retail blister packaging with a colorful backing card, neon cyberpunk styling, plastic sheen texture, toy aisle lighting, product photography",
    },
    {
      id: "caricature",
      name: t.effects.caricature,
      description: t.effects.caricatureDesc,
      previewPrompt:
        "A vibrant caricature of a person in a bold comic-book style, with exaggerated facial features, dynamic pose, colorful background, humorous and expressive, graphic novel art",
    },
    {
      id: "retro-film",
      name: t.effects.retroFilm,
      description: t.effects.retroFilmDesc,
      previewPrompt:
        "A 1990s Polaroid style portrait with heavy film grain, slight blur around the edges, faded colors, faint yellow light leak from the corner, nostalgic warm tones, vintage photography",
    },
    {
      id: "time-travel",
      name: t.effects.timeTravel,
      description: t.effects.timeTravelDesc,
      previewPrompt:
        "A person in a 1920s Great Gatsby style ballroom, wearing period-appropriate elegant clothing, warm golden glow of vintage chandeliers, cinematic composition, vintage photography",
    },
    {
      id: "pet-human",
      name: t.effects.petHuman,
      description: t.effects.petHumanDesc,
      previewPrompt:
        "A human character version of a cute pet, maintaining the pet's distinctive features and personality as human traits, portrait style, detailed and expressive, fantasy art",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t.effectsPage.aiMagicEffect}</h1>
              <p className="text-xs text-gray-400">{t.effects.subtitle}</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher variant="dark" />
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.nav.backToHome}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t.effectsPage.aiPowered}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t.effectsPage.aiMagicEffect}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            {t.effects.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {effects.map((effect) => (
            <EffectCard
              key={effect.id}
              name={effect.name}
              description={effect.description}
              effectId={effect.id}
              previewPrompt={effect.previewPrompt}
            />
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {t.effectsPage.moreEffectsComing}
          </h2>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            {t.effectsPage.moreEffectsDesc}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            {t.effectsPage.tryAiGenerator}
          </Link>
        </div>
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
