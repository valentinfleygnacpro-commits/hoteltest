import Link from "next/link";
import AppButton from "@/components/ui/app-button";

export const metadata = {
  title: "Restaurant Atelier",
  description: "Cuisine locale, carte saisonniere et experiences gastronomiques.",
};

export default function RestaurantPage() {
  return (
    <main className="container page-shell">
      <h1>Restaurant Atelier</h1>
      <p className="page-lead">
        Produits locaux, carte courte et menu degustation en 5 temps.
      </p>
      <div className="offers-grid section-top">
        <article>
          <h2>Menu Decouverte</h2>
          <p>3 plats, accords sans alcool.</p>
          <span>75 EUR</span>
        </article>
        <article>
          <h2>Menu Degustation</h2>
          <p>5 plats, accords mets & vins.</p>
          <span>120 EUR</span>
        </article>
        <article>
          <h2>Brunch du dimanche</h2>
          <p>Buffet local et creations du chef.</p>
          <span>55 EUR</span>
        </article>
      </div>
      <div className="section-top">
        <AppButton asChild tone="primary">
          <Link href="/#contact">Contacter le restaurant</Link>
        </AppButton>
      </div>
    </main>
  );
}
