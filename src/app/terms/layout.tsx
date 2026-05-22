import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - PixelMill",
  description: "PixelMill terms of service. Read our terms and conditions for using the AI image generation platform.",
  keywords: ["terms of service", "terms and conditions", "PixelMill terms", "user agreement", "acceptable use policy"],
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
