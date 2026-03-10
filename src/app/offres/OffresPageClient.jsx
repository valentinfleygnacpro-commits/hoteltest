"use client";

import Link from "next/link";
import AppButton from "@/components/ui/app-button";
import { useLanguage } from "@/components/LanguageProvider";

export default function OffresPageClient({ offers }) {
  const { language } = useLanguage();
  const isEnglish = language === "EN";

  return (
    <main className="container page-shell offers-page-shell">
      <section className="offers-page-head">
        <div>
          <p className="contact-info-kicker">{isEnglish ? "Signature stays" : "Sejours signatures"}</p>
          <h1>{isEnglish ? "Special offers" : "Offres speciales"}</h1>
          <p className="page-lead">
            {isEnglish
              ? "Take advantage of our seasonal offers and build your ideal stay."
              : "Profitez de nos offres saisonnieres et composez votre sejour ideal."}
          </p>
        </div>
        <div className="offers-page-summary">
          <strong>{isEnglish ? "3 packages" : "3 formules"}</strong>
          <p>
            {isEnglish
              ? "Escapes designed for wellness, gastronomy and business stays."
              : "Des escapades pensees pour le bien-etre, la gastronomie et les sejours professionnels."}
          </p>
        </div>
      </section>

      <div className="offers-grid section-top">
        {offers.map((offer) => (
          <article key={offer.title}>
            <h2>{offer.title}</h2>
            <p>{offer.details}</p>
            <span className="offers-price">{isEnglish ? "From" : "A partir de"} {offer.price}</span>
          </article>
        ))}
      </div>

      <section className="offers-page-cta section-top">
        <div>
          <h2>{isEnglish ? "Check availability" : "Verifier les disponibilites"}</h2>
          <p>
            {isEnglish
              ? "Choose your dates and find the package best suited to your stay."
              : "Choisissez vos dates et retrouvez la formule la plus adaptee a votre sejour."}
          </p>
        </div>
        <AppButton asChild tone="primary">
          <Link href="/disponibilites">{isEnglish ? "View availability" : "Decouvrir les disponibilites"}</Link>
        </AppButton>
      </section>
    </main>
  );
}
