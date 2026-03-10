import siteContentLib from "../../lib/siteContent";
import pricingLib from "../../lib/pricing";
import OffresPageClient from "./OffresPageClient";

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
  const offers = OFFER_ITEMS.map((offer) => ({
    ...offer,
    price: formatCurrency(offer.priceFrom),
  }));
  return <OffresPageClient offers={offers} />;
}
