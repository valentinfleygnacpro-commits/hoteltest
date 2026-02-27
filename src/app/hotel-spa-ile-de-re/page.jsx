import Link from "next/link";
import AppButton from "@/components/ui/app-button";

export const metadata = {
  title: "Hotel Spa Ile de Re",
  description: "Sejour bien-etre a l'Ile de Re avec spa, suites premium et reservation en ligne.",
};

export default function HotelSpaIleDeRePage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "/" },
      { "@type": "ListItem", position: 2, name: "Hotel Spa Ile de Re", item: "/hotel-spa-ile-de-re" },
    ],
  };

  return (
    <main className="container page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <h1>Hotel spa a l'Ile de Re</h1>
      <p className="page-lead">
        Hotel Atlas propose une experience bien-etre complete: spa mineral, soins personnalises et chambres haut de
        gamme.
      </p>
      <section className="section-top">
        <p>
          Situe a proximite de la plage, notre hotel spa a l'Ile de Re combine detente, gastronomie locale et
          conciergerie dediee.
        </p>
      </section>
      <div className="section-top">
        <AppButton asChild tone="primary">
          <Link href="/disponibilites">Verifier les disponibilites</Link>
        </AppButton>
      </div>
    </main>
  );
}
