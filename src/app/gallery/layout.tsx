import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Image Gallery - PixelMill | Inspiration & Prompts",
  description: "Browse stunning AI-generated images for inspiration. Copy prompts, explore styles, and create your own AI art with PixelMill.",
  keywords: ["AI image gallery", "AI art inspiration", "AI generated images", "prompt ideas", "creative AI", "PixelMill gallery"],
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
