"use client";

import Link from "next/link";
import AppButton from "@/components/ui/app-button";
import { useLanguage } from "@/components/LanguageProvider";
import RoomGallery from "./RoomGallery";

export default function ChambresPageClient({
  checkIn,
  checkOut,
  guests,
  activeFilterLabels,
  roomsToDisplay,
  roomPrices,
  criteriaSuffix,
  reviewItems,
  guarantees,
  requestedRoomLabel,
}) {
  const { language } = useLanguage();
  const isEnglish = language === "EN";

  function formatCurrency(value) {
    return new Intl.NumberFormat(isEnglish ? "en-US" : "fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  }

  return (
    <main className="container page-shell chambres-shell">
      <section className="chambres-head">
        <p className="chambres-kicker">Collection 2026</p>
        <h1>{isEnglish ? "Rooms and suites" : "Chambres et suites"}</h1>
        <p className="page-lead">
          {isEnglish
            ? "Bright spaces designed for rest, work and escape."
            : "Des espaces lumineux concus pour le repos, le travail et l'evasion."}
        </p>
      </section>

      <section className="chambres-selection-banner section-top">
        <p>
          {isEnglish ? "Selection" : "Selection"}: <strong>{checkIn}</strong> {isEnglish ? "to" : "au"} <strong>{checkOut}</strong>
          {guests ? <> - <strong>{guests}</strong> {isEnglish ? "guest(s)" : "voyageur(s)"}</> : null}
          {activeFilterLabels.length ? <> - {isEnglish ? "Filters" : "Filtres"}: <strong>{activeFilterLabels.join(", ")}</strong></> : null}
        </p>
        <AppButton asChild tone="ghost">
          <Link href="/disponibilites">{isEnglish ? "Edit dates" : "Modifier les dates"}</Link>
        </AppButton>
      </section>

      {requestedRoomLabel ? (
        <section className="chambres-selection-banner section-top">
          <p>
            {isEnglish
              ? `${requestedRoomLabel} is not available for these dates. Here are the available alternatives.`
              : `${requestedRoomLabel} n'est pas disponible sur ces dates. Voici les alternatives disponibles.`}
          </p>
        </section>
      ) : null}

      {roomsToDisplay.length === 0 ? (
        <section className="chambres-selection-banner section-top">
          <p>{isEnglish ? "No room available for these dates. Try another period." : "Aucune chambre disponible sur ces dates. Essayez une autre periode."}</p>
          <AppButton asChild tone="primary">
            <Link href="/disponibilites">{isEnglish ? "Change my dates" : "Changer mes dates"}</Link>
          </AppButton>
        </section>
      ) : null}

      <section className="rooms-grid chambres-grid section-top">
        {roomsToDisplay.map((room) => {
          const roomName = room.label.split(" - ")[0];

          return (
            <article key={room.value} className="room-card chambres-card">
              <RoomGallery images={room.images} title={roomName} />
              <div className="chambres-card-body">
                <h2 className="section-top-sm">{roomName}</h2>
                <div className="chambres-meta">
                  <span>{room.area}</span>
                  <span>{room.capacity}</span>
                </div>
                <p className="chambres-price">{isEnglish ? "From" : "A partir de"} {formatCurrency(roomPrices[room.value])}/{isEnglish ? "night" : "nuit"}</p>
                <div className="chambres-card-actions">
                  <AppButton asChild tone="primary">
                    <Link href={`/reservation?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&room=${room.value}`}>{isEnglish ? "Choose this room" : "Choisir cette chambre"}</Link>
                  </AppButton>
                  <AppButton asChild tone="ghost">
                    <Link href={`/chambres/${room.value}${criteriaSuffix}`}>{isEnglish ? "View details" : "Decouvrir le detail"}</Link>
                  </AppButton>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="section-top chambres-proof-grid">
        <div className="chambres-reviews">
          <h2>{isEnglish ? "Recent guest reviews" : "Avis clients recents"}</h2>
          <div className="chambres-reviews-list section-top-sm">
            {reviewItems.map((item) => (
              <blockquote key={`${item.author}-${item.source}`} className="chambres-review-item">
                <p>&quot;{item.quote}&quot;</p>
                <cite>{item.author} - {item.source}</cite>
              </blockquote>
            ))}
          </div>
        </div>
        <aside className="chambres-guarantees">
          <h2>{isEnglish ? "Direct booking guarantees" : "Garanties reservation directe"}</h2>
          <ul className="section-top-sm">
            {guarantees.map((guarantee) => (
              <li key={guarantee}>{guarantee}</li>
            ))}
          </ul>
        </aside>
      </section>

      <div className="section-top chambres-bottom-cta">
        <AppButton asChild tone="primary">
          <Link href="/disponibilites">{isEnglish ? "Edit my search" : "Modifier ma recherche"}</Link>
        </AppButton>
      </div>
    </main>
  );
}
