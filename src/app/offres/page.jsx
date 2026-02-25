import Link from "next/link";
import siteContentLib from "../../lib/siteContent";
import pricingLib from "../../lib/pricing";

const { OFFER_ITEMS } = siteContentLib;
const { formatPrice } = pricingLib;

export const metadata = {
  title: "Offres",
  description: "Offres speciales et sejours signatures de l'Hotel Atlas.",
};

function formatCurrency(value) {
  if (typeof formatPrice === "function") return formatPrice(value);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export default function OffresPage() {
  return (
    <main className="container page-shell">
      <h1>Offres speciales</h1>
      <p className="page-lead">
        Profitez de nos offres saisonnieres et composez votre sejour ideal.
      </p>

      <div className="offers-grid section-top">
        {OFFER_ITEMS.map((offer) => (
          <article key={offer.title}>
            <h2>{offer.title}</h2>
            <p>{offer.details}</p>
            <span>A partir de {formatCurrency(offer.priceFrom)}</span>
          </article>
        ))}
      </div>

      <div className="section-top">
        <Link className="btn primary" href="/disponibilites">Voir les disponibilites</Link>
      </div>
    </main>
  );
}
