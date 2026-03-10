"use client";

import Link from "next/link";
import AppButton from "@/components/ui/app-button";
import { useLanguage } from "@/components/LanguageProvider";

export default function ServicesPageClient() {
  const { language } = useLanguage();
  const isEnglish = language === "EN";

  return (
    <main className="container page-shell">
      <h1>{isEnglish ? "Services" : "Services"}</h1>
      <p className="page-lead">
        {isEnglish
          ? "Discover our services for a comfortable stay: spa, dining and tailored experiences."
          : "Decouvrez nos services pour un sejour confortable: spa, restauration et experiences sur mesure."}
      </p>

      <div className="amenities-grid section-top">
        <article className="amenity">
          <h2>{isEnglish ? "Spa & wellness" : "Spa & bien-etre"}</h2>
          <p>{isEnglish ? "Massages, hammam, sauna and relaxing rituals." : "Massages, hammam, sauna et rituels relaxants."}</p>
          <Link href="/spa">{isEnglish ? "View spa page" : "Decouvrir la page spa"}</Link>
        </article>

        <article className="amenity">
          <h2>Restaurant Atelier</h2>
          <p>{isEnglish ? "Local cuisine, fresh produce and tasting menus." : "Cuisine locale, produits frais et menus degustation."}</p>
          <Link href="/restaurant">{isEnglish ? "View restaurant page" : "Decouvrir la page restaurant"}</Link>
        </article>

        <article className="amenity">
          <h2>{isEnglish ? "Concierge" : "Conciergerie"}</h2>
          <p>{isEnglish ? "Transfers, excursions and private activities." : "Organisation de transferts, excursions et activites privees."}</p>
        </article>
      </div>

      <div className="section-top">
        <AppButton asChild tone="primary">
          <Link href="/disponibilites">{isEnglish ? "Book a stay" : "Reserver un sejour"}</Link>
        </AppButton>
      </div>
    </main>
  );
}
