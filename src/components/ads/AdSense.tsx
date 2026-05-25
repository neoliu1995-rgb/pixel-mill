"use client";

import { useEffect, useRef } from "react";

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
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;

    const pushAd = () => {
      try {
        if (typeof window !== "undefined") {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch (err) {
        console.error("AdSense push error:", err);
      }
    };

    pushAd();

    if (!pushed.current) {
      const interval = setInterval(() => {
        if (window.adsbygoogle) {
          pushAd();
          if (pushed.current) clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div ref={adRef} className={`${className} ads-container`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
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
