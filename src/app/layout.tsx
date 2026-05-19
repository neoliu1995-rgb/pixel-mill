import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import ClientLayout from "@/components/ClientLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7c3aed",
};

export const metadata: Metadata = {
  title: "PixelMill - Free AI Image Generator | Create Stunning Images with AI",
  description: "Create stunning AI-generated images for free. No sign-up required. Powered by Gemini. Features include text-to-image, background removal, AI copywriting, viral effects, and e-commerce tools.",
  keywords: "AI image generator, free image generation, background removal, AI copywriting, e-commerce tools, Gemini, FLUX",
  openGraph: {
    title: "PixelMill - Free AI Image Generator | Create Stunning Images with AI",
    description: "Create stunning AI-generated images for free. No sign-up required. Powered by Gemini. Features include text-to-image, background removal, AI copywriting, viral effects, and e-commerce tools.",
    url: "https://pixelmill.ai",
    siteName: "PixelMill",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelMill - Free AI Image Generator | Create Stunning Images with AI",
    description: "Create stunning AI-generated images for free. No sign-up required. Powered by Gemini. Features include text-to-image, background removal, AI copywriting, viral effects, and e-commerce tools.",
  },
  alternates: {
    languages: {
      en: "/",
      zh: "/zh",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
      </body>
    </html>
  );
}
