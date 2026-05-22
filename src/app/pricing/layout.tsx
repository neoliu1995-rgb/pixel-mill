import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - PixelMill | Affordable AI Image Generation Plans",
  description: "Choose the perfect AI image generation plan. Free tier with 10 images/day, Pro at $7.99/mo with FLUX.2 Pro, Business with unlimited features.",
  keywords: ["PixelMill pricing", "AI image generation plans", "affordable AI art", "AI credits", "Pro plan", "Business plan", "subscription"],
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
