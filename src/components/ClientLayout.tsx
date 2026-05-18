"use client";

import { LanguageProvider } from "@/components/LanguageProvider";
import AuthProvider from "@/components/auth/AuthProvider";
import MobileNav from "@/components/layout/MobileNav";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LanguageProvider>
        {children}
        <MobileNav />
      </LanguageProvider>
    </AuthProvider>
  );
}
