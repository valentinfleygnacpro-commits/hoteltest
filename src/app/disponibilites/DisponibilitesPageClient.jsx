"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import AvailabilityForm from "./AvailabilityForm";

export default function DisponibilitesPageClient({ today }) {
  const { language } = useLanguage();
  const isEnglish = language === "EN";

  return (
    <main className="container page-shell availability-shell">
      <Link className="availability-back-link" href="/">
        {isEnglish ? "Back to home" : "Retour a l'accueil"}
      </Link>
      <section className="availability-head">
        <p className="chambres-kicker">{isEnglish ? "Step 1" : "Etape 1"}</p>
        <h1>{isEnglish ? "Start with your dates" : "Commencez par vos dates"}</h1>
        <p className="page-lead">
          {isEnglish
            ? "Enter arrival, departure and number of guests. We will then show matching rooms."
            : "Renseignez votre arrivee, depart et nombre de voyageurs. Nous afficherons ensuite les chambres adaptees."}
        </p>
      </section>
      <p className="availability-rating section-top-xs">{isEnglish ? "Rated 4.8/5 - 324 guest reviews" : "Note 4,8/5 - 324 avis clients"}</p>

      <section className="availability-card section-top">
        <AvailabilityForm today={today} />
      </section>

      <section className="availability-trust section-top-xs" aria-label={isEnglish ? "Booking guarantees" : "Garanties reservation"}>
        <p>{isEnglish ? "Free cancellation up to 48h" : "Annulation gratuite jusqu'a 48h"}</p>
        <p>{isEnglish ? "Secure payment" : "Paiement securise"}</p>
        <p>{isEnglish ? "Instant confirmation" : "Confirmation instantanee"}</p>
        <small className="availability-value-line">{isEnglish ? "Best rate guaranteed on our official website" : "Meilleur tarif garanti sur notre site officiel"}</small>
      </section>
    </main>
  );
}
