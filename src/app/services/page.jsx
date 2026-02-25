import Link from "next/link";

export const metadata = {
  title: "Services",
  description: "Services premium de l'Hotel Atlas: spa, restauration et conciergerie.",
};

export default function ServicesPage() {
  return (
    <main className="container page-shell">
      <h1>Services</h1>
      <p className="page-lead">
        Decouvrez nos services pour un sejour confortable: spa, restauration et experiences sur mesure.
      </p>

      <div className="amenities-grid section-top">
        <article className="amenity">
          <h2>Spa & bien-etre</h2>
          <p>Massages, hammam, sauna et rituels relaxants.</p>
          <Link href="/spa">Voir la page spa</Link>
        </article>

        <article className="amenity">
          <h2>Restaurant Atelier</h2>
          <p>Cuisine locale, produits frais et menus degustation.</p>
          <Link href="/restaurant">Voir la page restaurant</Link>
        </article>

        <article className="amenity">
          <h2>Conciergerie</h2>
          <p>Organisation de transferts, excursions et activites privees.</p>
        </article>
      </div>

      <div className="section-top">
        <Link className="btn primary" href="/disponibilites">Reserver un sejour</Link>
      </div>
    </main>
  );
}
