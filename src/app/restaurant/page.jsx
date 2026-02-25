import Link from "next/link";

export const metadata = {
  title: "Restaurant Atelier",
  description: "Cuisine locale, carte saisonnière et expériences gastronomiques.",
};

export default function RestaurantPage() {
  return (
    <main className="container page-shell">
      <h1>Restaurant Atelier</h1>
      <p className="page-lead">
        Produits locaux, carte courte et menu dégustation en 5 temps.
      </p>
      <div className="offers-grid section-top">
        <article>
          <h2>Menu Découverte</h2>
          <p>3 plats, accords sans alcool.</p>
          <span>75 EUR</span>
        </article>
        <article>
          <h2>Menu Dégustation</h2>
          <p>5 plats, accords mets & vins.</p>
          <span>120 EUR</span>
        </article>
        <article>
          <h2>Brunch du dimanche</h2>
          <p>Buffet local et créations du chef.</p>
          <span>55 EUR</span>
        </article>
      </div>
      <div className="section-top">
        <Link className="btn primary" href="/#contact">Contacter le restaurant</Link>
      </div>
    </main>
  );
}
