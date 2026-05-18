import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "E-commerce AI Tools | PixelMill",
  description: "AI-powered e-commerce tools. Product white background, AI copywriting, poster generation, and detail page builder.",
};

export default function EcommerceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
