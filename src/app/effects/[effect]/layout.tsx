import type { Metadata } from "next";

const effectNames: Record<string, string> = {
  chibi: "Chibi Figure Style",
  caricature: "AI Caricature",
  "retro-film": "Retro Film",
  "time-travel": "Time Travel",
  "pet-human": "Pet to Human",
};

const effectDescriptions: Record<string, string> = {
  chibi: "Transform yourself into an adorable Q-version collectible toy figure with AI.",
  caricature: "Turn your photo into an exaggerated, vibrant comic-book character with AI.",
  "retro-film": "Apply 1990s Polaroid style with heavy film grain and nostalgic warm tones.",
  "time-travel": "Place yourself in a historical era with period-appropriate clothing and lighting.",
  "pet-human": "Transform your pet into a human character while keeping their personality traits.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ effect: string }>;
}): Promise<Metadata> {
  const { effect } = await params;
  const name = effectNames[effect] || "AI Magic Effect";
  const description = effectDescriptions[effect] || "Transform your photos with viral AI effects.";

  return {
    title: `${name} | PixelMill`,
    description,
  };
}

export default function EffectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
