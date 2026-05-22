import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - PixelMill",
  description: "PixelMill privacy policy. Learn how we collect, use, and protect your personal information and data.",
  keywords: ["privacy policy", "data protection", "PixelMill privacy", "user data", "information security"],
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
