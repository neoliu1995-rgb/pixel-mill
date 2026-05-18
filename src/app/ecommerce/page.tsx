"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import {
  Image,
  PenTool,
  LayoutTemplate,
  FileText,
  ArrowRight,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export default function EcommercePage() {
  const { t } = useLanguage();

  const tools = [
    {
      id: "white-background",
      name: t.ecommerce.whiteBg,
      description: t.ecommerce.whiteBgDesc,
      icon: Image,
      href: "/ecommerce/white-background",
      available: true,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400",
    },
    {
      id: "copywriting",
      name: t.ecommerce.copywriting,
      description: t.ecommerce.copywritingDesc,
      icon: PenTool,
      href: "/copywriting",
      available: true,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-400",
    },
    {
      id: "poster",
      name: t.ecommerce.poster,
      description: t.ecommerce.posterDesc,
      icon: LayoutTemplate,
      href: "/ecommerce/poster",
      available: true,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-400",
    },
    {
      id: "detail-page",
      name: t.ecommerce.detailPage,
      description: t.ecommerce.detailPageDesc,
      icon: FileText,
      href: "/ecommerce/detail-page",
      available: true,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      textColor: "text-green-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t.ecommerce.title}</h1>
              <p className="text-xs text-gray-400">{t.ecommerce.subtitle}</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">
              {t.nav.backToHome}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t.ecommercePage.aiPowered}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.ecommerce.title}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t.ecommercePage.oneStopDesc}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const content = (
              <div
                className={`relative bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full ${
                  tool.available
                    ? "hover:border-gray-600 cursor-pointer group"
                    : "opacity-70 cursor-not-allowed"
                }`}
              >
                <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${tool.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${tool.textColor}`} />
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tool.available
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-600/50 text-gray-400"
                      }`}
                    >
                      {tool.available ? t.ecommercePage.available : t.ecommercePage.moreToolsComing}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {tool.description}
                  </p>
                  {tool.available && (
                    <div className="flex items-center gap-1 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                      {t.ecommercePage.useNow}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              </div>
            );

            if (tool.available) {
              return (
                <Link key={tool.id} href={tool.href}>
                  {content}
                </Link>
              );
            }
            return <div key={tool.id}>{content}</div>;
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {t.ecommercePage.moreToolsComing}
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            {t.ecommercePage.moreToolsDesc}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            {t.ecommercePage.backToGenerate}
          </Link>
        </div>
      </main>

      <footer className="mt-16 bg-gray-800/50 backdrop-blur-md border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-gray-400">
            {t.ecommercePage.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
