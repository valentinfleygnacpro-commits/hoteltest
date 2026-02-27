import Link from "next/link";
import { redirect } from "next/navigation";
import AppButton from "@/components/ui/app-button";
import RoomGallery from "./RoomGallery";
import siteContentLib from "../../lib/siteContent";
import pricingLib from "../../lib/pricing";
import dbLib from "../../lib/db";
import availabilityLib from "../../lib/availability";
import { ROOM_GUARANTEES, ROOM_IMAGE_SETS, ROOM_REVIEW_ITEMS } from "./roomData";

const { ROOM_OPTIONS } = siteContentLib;
const { ROOM_PRICES, parseLocalDate } = pricingLib;
const { getDbSnapshot } = dbLib;
const { getAvailabilityByRoom } = availabilityLib;

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chambres et suites",
  description: "Decouvrez les chambres et suites de l'Hotel Atlas a l'Ile de Re.",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function getStringParam(params, key) {
  const value = params?.[key];
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function hasWeekdayNight(checkIn, checkOut) {
  const inDate = parseLocalDate(checkIn);
  const outDate = parseLocalDate(checkOut);
  if (!inDate || !outDate || outDate <= inDate) return false;

  let cursor = new Date(inDate);
  while (cursor < outDate) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) return true;
    cursor = addDays(cursor, 1);
  }
  return false;
}

export default async function ChambresPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const visibleRooms = ROOM_OPTIONS.filter((item) => item.value);
  const checkIn = getStringParam(resolvedSearchParams, "checkIn");
  const checkOut = getStringParam(resolvedSearchParams, "checkOut");
  const guests = getStringParam(resolvedSearchParams, "guests");
  const weekdayInStay = hasWeekdayNight(checkIn, checkOut);
  const inDate = parseLocalDate(checkIn);
  const outDate = parseLocalDate(checkOut);
  const hasValidCriteria = Boolean(inDate && outDate && outDate > inDate);

  if (!hasValidCriteria) {
    redirect("/disponibilites");
  }

  let availability = null;
  if (hasValidCriteria) {
    const db = await getDbSnapshot();
    availability = getAvailabilityByRoom(db.bookings, checkIn, checkOut);
  }

  const roomsToDisplay =
    hasValidCriteria
      ? availability
        ? visibleRooms.filter((room) => {
            if (room.value === "classic" && weekdayInStay) return false;
            return (availability[room.value] || 0) > 0;
          })
        : []
      : visibleRooms;

  const criteriaParams = new URLSearchParams();
  if (checkIn) criteriaParams.set("checkIn", checkIn);
  if (checkOut) criteriaParams.set("checkOut", checkOut);
  if (guests) criteriaParams.set("guests", guests);
  const criteriaQuery = criteriaParams.toString();
  const criteriaSuffix = criteriaQuery ? `?${criteriaQuery}` : "";

  function buildReservationLink(roomValue) {
    const params = new URLSearchParams(criteriaParams);
    params.set("room", roomValue);
    return `/reservation?${params.toString()}`;
  }

  return (
    <main className="container page-shell chambres-shell">
      <section className="chambres-head">
        <p className="chambres-kicker">Collection 2026</p>
        <h1>Chambres et suites</h1>
        <p className="page-lead">
          Des espaces lumineux concus pour le repos, le travail et l&apos;evasion.
        </p>
      </section>

      <section className="chambres-selection-banner section-top">
        <p>
          Selection: <strong>{checkIn}</strong> au <strong>{checkOut}</strong>
          {guests ? (
            <>
              {" "}
              - <strong>{guests}</strong> voyageur(s)
            </>
          ) : null}
        </p>
        <AppButton asChild tone="ghost">
          <Link href="/disponibilites">Modifier les dates</Link>
        </AppButton>
      </section>

      {roomsToDisplay.length === 0 ? (
        <section className="chambres-selection-banner section-top">
          <p>Aucune chambre disponible sur ces dates. Essayez une autre periode.</p>
          <AppButton asChild tone="primary">
            <Link href="/disponibilites">Changer mes dates</Link>
          </AppButton>
        </section>
      ) : null}

      <section className="rooms-grid chambres-grid section-top">
        {roomsToDisplay.map((room) => {
          const roomName = room.label.split(" - ")[0];

          return (
            <article key={room.value} className="room-card chambres-card">
              <RoomGallery images={ROOM_IMAGE_SETS[room.value] || ["/chambre1.webp"]} title={roomName} />
              <div className="chambres-card-body">
                <h2 className="section-top-sm">{roomName}</h2>
                <div className="chambres-meta">
                  <span>{room.area}</span>
                  <span>{room.capacity}</span>
                </div>
                <p className="chambres-price">A partir de {formatCurrency(ROOM_PRICES[room.value])}/nuit</p>
                <div className="chambres-card-actions">
                  <AppButton asChild tone="primary">
                    <Link href={buildReservationLink(room.value)}>Choisir cette chambre</Link>
                  </AppButton>
                  <AppButton asChild tone="ghost">
                    <Link href={`/chambres/${room.value}${criteriaSuffix}`}>Voir le detail</Link>
                  </AppButton>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="section-top chambres-proof-grid">
        <div className="chambres-reviews">
          <h2>Avis clients recents</h2>
          <div className="chambres-reviews-list section-top-sm">
            {ROOM_REVIEW_ITEMS.map((item) => (
              <blockquote key={`${item.author}-${item.source}`} className="chambres-review-item">
                <p>&quot;{item.quote}&quot;</p>
                <cite>
                  {item.author} - {item.source}
                </cite>
              </blockquote>
            ))}
          </div>
        </div>
        <aside className="chambres-guarantees">
          <h2>Garanties reservation directe</h2>
          <ul className="section-top-sm">
            {ROOM_GUARANTEES.map((guarantee) => (
              <li key={guarantee}>{guarantee}</li>
            ))}
          </ul>
        </aside>
      </section>

      <div className="section-top chambres-bottom-cta">
        <AppButton asChild tone="primary">
          <Link href="/disponibilites">Modifier ma recherche</Link>
        </AppButton>
      </div>
    </main>
  );
}
