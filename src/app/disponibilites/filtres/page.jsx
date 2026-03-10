import Link from "next/link";
import FiltersClient from "./FiltersClient";

function getStringParam(params, key) {
  const value = params?.[key];
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

export const metadata = {
  title: "Filtres chambres",
  description: "Affinez votre recherche par categorie, vue et amenagements.",
};

export default async function DisponibilitesFiltresPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const checkIn = getStringParam(resolvedSearchParams, "checkIn");
  const checkOut = getStringParam(resolvedSearchParams, "checkOut");
  const guests = getStringParam(resolvedSearchParams, "guests");
  const roomCategory = getStringParam(resolvedSearchParams, "roomCategory");
  const roomView = getStringParam(resolvedSearchParams, "roomView");
  const amenities = getStringParam(resolvedSearchParams, "amenities");
  const backParams = new URLSearchParams();
  if (checkIn) backParams.set("checkIn", checkIn);
  if (checkOut) backParams.set("checkOut", checkOut);
  if (guests) backParams.set("guests", guests);
  const backHref = backParams.toString() ? `/disponibilites?${backParams.toString()}` : "/disponibilites";

  return (
    <main className="container page-shell availability-shell filters-page-shell">
      <Link className="availability-back-link" href={backHref}>
        Retour aux dates
      </Link>
      <section className="availability-head">
        <p className="chambres-kicker">Etape 2</p>
        <h1>Affinez votre recherche</h1>
        <p className="page-lead">
          Filtrez les chambres selon la categorie, la vue et les amenagements qui comptent pour votre sejour.
        </p>
      </section>

      <section className="availability-card section-top">
        <FiltersClient
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
          initialRoomCategory={roomCategory}
          initialRoomView={roomView}
          initialAmenities={amenities}
        />
      </section>
    </main>
  );
}
