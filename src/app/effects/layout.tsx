import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Magic Effects | PixelMill",
  description: "Transform your photos with viral AI effects. Chibi figure, AI caricature, retro film, time travel, and pet humanization.",
};

export default function EffectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
