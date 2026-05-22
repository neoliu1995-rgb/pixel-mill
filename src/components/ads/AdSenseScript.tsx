export function AdSenseScriptServer() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client || client === "ca-pub-XXXXXXXXXX") return null;
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
