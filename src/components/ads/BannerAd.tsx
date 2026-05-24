"use client";

import AdSense from "./AdSense";

export function BannerAd() {
  return (
    <div className="my-8 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50/50">
      <div className="text-center text-xs text-gray-400 py-1 bg-gray-100">Advertisement</div>
      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT || "8036591087"}
        format="auto"
        className="w-full min-h-[90px]"
      />
    </div>
  );
}

export function InArticleAd() {
  return (
    <div className="my-6 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50/50">
      <div className="text-center text-xs text-gray-400 py-1 bg-gray-100">Advertisement</div>
      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE || "1930347738"}
        format="fluid"
        layout="in-article"
        className="w-full min-h-[250px]"
      />
    </div>
  );
}
