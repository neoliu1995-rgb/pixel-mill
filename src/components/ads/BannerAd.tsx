"use client";

import AdSense from "./AdSense";

export function BannerAd() {
  return (
    <div className="my-8">
      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT || "1234567890"}
        format="horizontal"
        className="w-full h-[90px] bg-gray-50 rounded-xl"
      />
    </div>
  );
}

export function InArticleAd() {
  return (
    <div className="my-6">
      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE || "1234567891"}
        format="in-article"
        className="w-full min-h-[250px] bg-gray-50 rounded-xl"
      />
    </div>
  );
}
