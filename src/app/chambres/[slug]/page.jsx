import Link from "next/link";
import { notFound } from "next/navigation";
import RoomGallery from "../RoomGallery";
import pricingLib from "../../../lib/pricing";
import { ROOM_DETAILS, ROOM_IMAGE_SETS } from "../roomData";

const { ROOM_PRICES } = pricingLib;

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

export function generateStaticParams() {
  return Object.keys(ROOM_DETAILS).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const room = ROOM_DETAILS[params.slug];
  if (!room) {
    return {
      title: "Chambre introuvable",
    };
  }

  return {
    title: `${room.name} - Chambres et suites`,
    description: `${room.name} a l'Hotel Atlas: galerie photos, equipements et conditions de reservation.`,
  };
}

export default async function RoomDetailPage({ params, searchParams }) {
  const resolvedSearchParams = await searchParams;
  const room = ROOM_DETAILS[params.slug];
  const checkIn = getStringParam(resolvedSearchParams, "checkIn");
  const checkOut = getStringParam(resolvedSearchParams, "checkOut");
  const guests = getStringParam(resolvedSearchParams, "guests");

  if (!room) {
    notFound();
  }

  const criteriaParams = new URLSearchParams();
  if (checkIn) criteriaParams.set("checkIn", checkIn);
  if (checkOut) criteriaParams.set("checkOut", checkOut);
  if (guests) criteriaParams.set("guests", guests);

  const backQuery = criteriaParams.toString();
  const backSuffix = backQuery ? `?${backQuery}` : "";
  criteriaParams.set("room", room.slug);
  const reservationHref = `/reservation?${criteriaParams.toString()}`;

  return (
    <main className="container page-shell room-detail-shell">
      <section className="room-detail-head">
        <p className="chambres-kicker">Detail chambre</p>
        <h1>{room.name}</h1>
        <p className="page-lead">{room.tagline}</p>
      </section>

      <section className="room-detail-grid section-top">
        <div className="room-detail-gallery-wrap">
          <RoomGallery images={ROOM_IMAGE_SETS[room.slug] || ["/chambre1.webp"]} title={room.name} />
        </div>

        <div className="room-detail-side">
          <p className="room-detail-price">A partir de {formatCurrency(ROOM_PRICES[room.slug])}/nuit</p>
          <div className="chambres-meta room-detail-meta">
            <span>{room.surface}</span>
            <span>{room.guests}</span>
            <span>{room.bed}</span>
          </div>
          <div className="room-detail-actions">
            <Link className="btn primary" href={reservationHref}>
              Choisir cette chambre
            </Link>
            <Link className="btn ghost" href={`/chambres${backSuffix}`}>
              Retour aux chambres
            </Link>
          </div>
        </div>
      </section>

      <section className="room-detail-sections section-top">
        <article className="room-detail-card">
          <h2>Equipements</h2>
          <ul className="section-top-xs">
            {room.amenities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="room-detail-card">
          <h2>Conditions</h2>
          <ul className="section-top-xs">
            {room.conditions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
