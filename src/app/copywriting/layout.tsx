import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Copywriting Generator | PixelMill",
  description: "Generate professional e-commerce copywriting with AI. Product titles, bullet points, descriptions, social media copy, and ad slogans.",
};

export default function CopywritingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
