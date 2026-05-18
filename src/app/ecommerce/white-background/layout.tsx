import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product White Background Generator | PixelMill",
  description: "Generate professional product photos with white background. Perfect for Taobao, JD, and Pinduoduo listings.",
};

export default function WhiteBackgroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
