"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SAMPLE_PROMPTS } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

export default function GalleryPage() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            {t.gallery.title}
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            {t.gallery.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {Object.entries(t.gallery.categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label as string}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_PROMPTS.map((prompt, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={`https://picsum.photos/seed/${index + 100}/512/512`}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {prompt}
                </p>
                <Link
                  href={`/?prompt=${encodeURIComponent(prompt)}`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t.gallery.tryPrompt}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t.gallery.readyToCreate}
          </h2>
          <p className="text-gray-600 mb-6">
            {t.gallery.startCreating}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            {t.gallery.startCreatingButton}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
