import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | PixelMill",
  description: "Affordable AI image generation plans. Free tier, Pro at $7.99/mo, Business at $14.99/mo.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
