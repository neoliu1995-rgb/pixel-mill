"use client";

import AdSense from "./AdSense";
import { useLanguage } from "@/components/LanguageProvider";

export function BannerAd() {
  const { t } = useLanguage();
  return (
    <div className="my-8 rounded-xl overflow-hidden bg-gray-800/30 border border-gray-700/50">
      <div className="text-center text-[10px] text-gray-500 py-1.5 bg-gray-800/50 uppercase tracking-wider">{t.ads.advertisement}</div>
      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT || "8036591087"}
        format="auto"
        className="w-full min-h-[90px]"
      />
    </div>
  );
}

export function InArticleAd() {
  const { t } = useLanguage();
  return (
    <div className="my-6 rounded-xl overflow-hidden bg-gray-800/30 border border-gray-700/50">
      <div className="text-center text-[10px] text-gray-500 py-1.5 bg-gray-800/50 uppercase tracking-wider">{t.ads.advertisement}</div>
      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE || "1930347738"}
        format="fluid"
        layout="in-article"
        className="w-full min-h-[250px]"
      />
    </div>
  );
}
