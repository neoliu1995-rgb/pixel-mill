import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Background Remover | PixelMill",
  description: "Remove image backgrounds instantly with AI. Free and fast background removal tool.",
};

export default function BackgroundRemoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
