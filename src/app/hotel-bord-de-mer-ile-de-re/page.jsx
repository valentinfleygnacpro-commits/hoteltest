import Link from "next/link";

export const metadata = {
  title: "Hôtel Bord de Mer Île de Ré",
  description: "Hôtel en bord de mer à l'Île de Ré avec chambres élégantes et services premium.",
};

export default function HotelBordDeMerIleDeRePage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "/" },
      { "@type": "ListItem", position: 2, name: "Hôtel Bord de Mer Île de Ré", item: "/hotel-bord-de-mer-ile-de-re" },
    ],
  };

  return (
    <main className="container page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <h1>Hôtel bord de mer à l’Île de Ré</h1>
      <p className="page-lead">
        Profitez d’un séjour face à l’océan avec suites lumineuses, service discret et accès rapide aux plages.
      </p>
      <section className="section-top">
        <p>
          Idéal pour un week-end romantique, des vacances familiales ou une parenthèse détente en toute saison.
        </p>
      </section>
      <div className="section-top">
        <Link className="btn primary" href="/disponibilites">Réserver votre séjour</Link>
      </div>
    </main>
  );
}
