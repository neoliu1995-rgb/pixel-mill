"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-bold tracking-tight">PixelMill</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 max-w-md">
              {t.footer.tagline}
            </p>
            <p className="mt-4 text-xs text-gray-400">
              {t.footer.poweredBy}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t.footer.product}</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  {typeof t.home === 'object' ? t.home.label : t.home}
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  {typeof t.gallery === 'object' ? t.gallery.title : t.gallery}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                   {t.pricing.label}
                 </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t.footer.legal}</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  {typeof t.privacy === 'object' ? t.privacy.title : t.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  {typeof t.terms === 'object' ? t.terms.title : t.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} PixelMill. {t.footer.allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
