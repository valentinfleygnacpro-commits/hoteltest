"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import ContactClient from "./ContactClient";

export default function ContactPageClient() {
  const { language } = useLanguage();
  const isEnglish = language === "EN";

  return (
    <main className="container page-shell contact-page-shell">
      <h1>Contact</h1>
      <p className="page-lead">
        {isEnglish
          ? "Our team is available 7 days a week for reservations, transfers and tailored requests."
          : "Notre equipe est disponible 7j/7 pour vos reservations, transferts et demandes sur mesure."}
      </p>
      <section className="contact section-top" aria-label={isEnglish ? "Contact and access" : "Contact et acces"}>
        <div className="contact-grid">
          <ContactClient />
          <div className="contact-info">
            <div className="contact-info-head">
              <p className="contact-info-kicker">Hotel Atlas</p>
              <h2>{isEnglish ? "Contact details" : "Coordonnees"}</h2>
              <p>
                {isEnglish
                  ? "We reply quickly to any stay, transfer or special occasion request."
                  : "Nous vous repondons rapidement pour toute demande de sejour, transfert ou occasion speciale."}
              </p>
            </div>
            <Link href="/#home-map" className="contact-info-item contact-info-address">
              <span className="contact-info-icon" aria-hidden="true">
                <MapPin size={16} strokeWidth={2} />
              </span>
              <strong>{isEnglish ? "Address" : "Adresse"}</strong>
              <p>12 Avenue des Dunes, 17340 Ile de Re</p>
              <span className="contact-info-link">{isEnglish ? "View map" : "Decouvrir sur la carte"}</span>
            </Link>
            <div className="contact-info-item contact-info-phone">
              <span className="contact-info-icon" aria-hidden="true">
                <Phone size={16} strokeWidth={2} />
              </span>
              <strong>{isEnglish ? "Phone" : "Telephone"}</strong>
              <p>+33 5 00 00 00 00</p>
            </div>
            <div className="contact-info-item contact-info-email">
              <span className="contact-info-icon" aria-hidden="true">
                <Mail size={16} strokeWidth={2} />
              </span>
              <strong>Email</strong>
              <p>bonjour@hotel-atlas.fr</p>
            </div>
            <a
              className="map-placeholder"
              href="https://www.google.com/maps/dir/?api=1&destination=12+Avenue+des+Dunes%2C+17340+Ile+de+Re%2C+France"
              target="_blank"
              rel="noreferrer"
            >
              {isEnglish ? "Get directions" : "Decouvrir l'itineraire"}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
