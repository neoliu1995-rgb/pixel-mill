"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/components/LanguageProvider";

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.terms.title}</h1>
        
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.terms.acceptance.title}</h2>
            <p className="text-gray-600">{t.terms.acceptance.text}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.terms.description.title}</h2>
            <p className="text-gray-600">{t.terms.description.text}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.terms.acceptableUse.title}</h2>
            <p className="text-gray-600">{t.terms.acceptableUse.text}</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              {(t.terms.acceptableUse.items as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.terms.contentOwnership.title}</h2>
            <p className="text-gray-600">{t.terms.contentOwnership.text}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.terms.serviceAvailability.title}</h2>
            <p className="text-gray-600">{t.terms.serviceAvailability.text}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.terms.limitationOfLiability.title}</h2>
            <p className="text-gray-600">{t.terms.limitationOfLiability.text}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.terms.changesToTerms.title}</h2>
            <p className="text-gray-600">{t.terms.changesToTerms.text}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.terms.contact.title}</h2>
            <p className="text-gray-600">{t.terms.contact.text}</p>
          </section>

          <p className="text-sm text-gray-400 mt-8">
            {t.terms.lastUpdated} {new Date().toLocaleDateString()}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
