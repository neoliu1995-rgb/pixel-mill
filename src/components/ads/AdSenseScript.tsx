import Script from "next/script";

export function AdSenseScriptServer() {
  return (
    <Script
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-XXXXXXXXXX"}`}
      crossOrigin="anonymous"
    />
  );
}
