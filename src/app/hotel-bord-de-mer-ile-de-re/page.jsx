import Link from "next/link";
import AppButton from "@/components/ui/app-button";

export const metadata = {
  title: "Hotel Bord de Mer Ile de Re",
  description: "Hotel en bord de mer a l'Ile de Re avec chambres elegantes et services premium.",
};

export default function HotelBordDeMerIleDeRePage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "/" },
      { "@type": "ListItem", position: 2, name: "Hotel Bord de Mer Ile de Re", item: "/hotel-bord-de-mer-ile-de-re" },
    ],
  };

  return (
    <main className="container page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <h1>Hotel bord de mer a l'Ile de Re</h1>
      <p className="page-lead">
        Profitez d'un sejour face a l'ocean avec suites lumineuses, service discret et acces rapide aux plages.
      </p>
      <section className="section-top">
        <p>
          Ideal pour un week-end romantique, des vacances familiales ou une parenthese detente en toute saison.
        </p>
      </section>
      <div className="section-top">
        <AppButton asChild tone="primary">
          <Link href="/disponibilites">Reserver votre sejour</Link>
        </AppButton>
      </div>
    </main>
  );
}
