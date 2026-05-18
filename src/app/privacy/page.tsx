"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/components/LanguageProvider";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.privacy.title}</h1>
        
        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.privacy.infoCollected.title}</h2>
            <p className="text-gray-600">{t.privacy.infoCollected.text}</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              {(t.privacy.infoCollected.items as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.privacy.howWeUse.title}</h2>
            <p className="text-gray-600">{t.privacy.howWeUse.text}</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              {(t.privacy.howWeUse.items as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.privacy.dataRetention.title}</h2>
            <p className="text-gray-600">{t.privacy.dataRetention.text}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.privacy.thirdPartyServices.title}</h2>
            <p className="text-gray-600">{t.privacy.thirdPartyServices.text}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.privacy.cookies.title}</h2>
            <p className="text-gray-600">{t.privacy.cookies.text}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.privacy.yourRights.title}</h2>
            <p className="text-gray-600">{t.privacy.yourRights.text}</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              {(t.privacy.yourRights.items as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.privacy.contact.title}</h2>
            <p className="text-gray-600">{t.privacy.contact.text}</p>
          </section>

          <p className="text-sm text-gray-400 mt-8">
            {t.privacy.lastUpdated} {new Date().toLocaleDateString()}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
