import Link from "next/link";

export const metadata = {
  title: "Hôtel Spa Île de Ré",
  description: "Séjour bien-être à l'Île de Ré avec spa, suites premium et réservation en ligne.",
};

export default function HotelSpaIleDeRePage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "/" },
      { "@type": "ListItem", position: 2, name: "Hôtel Spa Île de Ré", item: "/hotel-spa-ile-de-re" },
    ],
  };

  return (
    <main className="container page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <h1>Hôtel spa à l’Île de Ré</h1>
      <p className="page-lead">
        Hotel Atlas propose une expérience bien-être complète: spa minéral, soins personnalisés et chambres haut de
        gamme.
      </p>
      <section className="section-top">
        <p>
          Situé à proximité de la plage, notre hôtel spa à l’Île de Ré combine détente, gastronomie locale et
          conciergerie dédiée.
        </p>
      </section>
      <div className="section-top">
        <Link className="btn primary" href="/disponibilites">Vérifier les disponibilités</Link>
      </div>
    </main>
  );
}
