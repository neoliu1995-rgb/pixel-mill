import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Copywriting Generator - PixelMill | E-commerce Product Descriptions",
  description: "Generate product descriptions, titles, and marketing copy for Taobao, JD, Amazon, Shopify, Xiaohongshu. AI-powered, multi-platform, multi-style.",
  keywords: ["AI copywriting", "product description generator", "e-commerce copywriting", "AI writing tool", "Taobao description", "Amazon listing", "PixelMill copywriting"],
};

export default function CopywritingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
