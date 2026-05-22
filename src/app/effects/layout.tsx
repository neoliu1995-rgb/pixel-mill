import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Photo Effects - PixelMill | Chibi, Retro Film & More",
  description: "Transform your photos with AI effects: Chibi figurine, Caricature, Retro Film, Time Travel, Pet Human. Free to try, no sign-up required.",
  keywords: ["AI photo effects", "Chibi effect", "retro film filter", "AI caricature", "time travel effect", "pet human AI", "PixelMill effects"],
};

export default function EffectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
