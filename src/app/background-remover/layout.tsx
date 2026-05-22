import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Background Remover - PixelMill | Free Transparent Background",
  description: "Remove image backgrounds instantly with AI. Get transparent, white, or custom color backgrounds. Free, no sign-up required.",
  keywords: ["AI background remover", "remove background", "transparent background", "white background", "free background removal", "PixelMill"],
};

export default function BackgroundRemoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
