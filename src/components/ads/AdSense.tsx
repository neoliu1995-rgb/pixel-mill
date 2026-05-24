"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
    googletag: {
      cmd: Array<() => void>;
    };
  }
}

interface AdSenseProps {
  slot: string;
  format?: string;
  layout?: string;
  layoutKey?: string;
  className?: string;
}

export default function AdSense({
  slot,
  format = "auto",
  layout,
  layoutKey,
  className = "w-full h-auto",
}: AdSenseProps) {
  useEffect(() => {
    const pushAd = () => {
      try {
        if (typeof window !== "undefined" && window.adsbygoogle) {
          window.adsbygoogle.push({});
        }
      } catch (err) {
        console.error("AdSense error:", err);
      }
    };

    if (document.readyState === "complete") {
      pushAd();
    } else {
      window.addEventListener("load", pushAd);
      return () => window.removeEventListener("load", pushAd);
    }
  }, []);

  return (
    <div className={`${className} ads-container`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "auto" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-XXXXXXXXXX"}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout && { "data-ad-layout": layout })}
        {...(layoutKey && { "data-ad-layout-key": layoutKey })}
      />
    </div>
  );
}
