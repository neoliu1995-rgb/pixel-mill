"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface EffectCardProps {
  name: string;
  description: string;
  effectId: string;
  previewPrompt: string;
}

export default function EffectCard({ name, description, effectId, previewPrompt }: EffectCardProps) {
  const { t } = useLanguage();
  const previewUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(previewPrompt)}&image_size=square_hd`;

  return (
    <Link href={`/effects/${effectId}`}>
      <div className="group relative bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer">
        <div className="relative aspect-square overflow-hidden bg-gray-900">
          <Image
            src={previewUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              {t.effects.tryNow}
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
            {name}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {description}
          </p>
          <div className="mt-4 flex items-center gap-2 text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">
            <span>{t.effects.tryNow}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
