import Link from "next/link";
import pricingLib from "../../lib/pricing";
import AvailabilityForm from "./AvailabilityForm";

const { getTodayLocalISO } = pricingLib;

export const metadata = {
  title: "Verifier les disponibilites",
  description: "Choisissez vos dates et le nombre de voyageurs avant de selectionner votre chambre.",
};

export default function DisponibilitesPage() {
  const today = getTodayLocalISO();

  return (
    <main className="container page-shell availability-shell">
      <Link className="availability-back-link" href="/">
        Retour a l&apos;accueil
      </Link>
      <section className="availability-head">
        <p className="chambres-kicker">Etape 1</p>
        <h1>Commencez par vos dates</h1>
        <p className="page-lead">
          Renseignez votre arrivee, depart et nombre de voyageurs. Nous afficherons ensuite les chambres adaptees.
        </p>
      </section>
      <p className="availability-rating section-top-xs">Noté 4,8/5 - 324 avis clients</p>

      <section className="availability-card section-top">
        <AvailabilityForm today={today} />
      </section>

      <section className="availability-trust section-top-xs" aria-label="Garanties reservation">
        <p>✔ Annulation gratuite jusqu&apos;a 48h</p>
        <p>✔ Paiement securise</p>
        <p>✔ Confirmation instantanee</p>
        <small className="availability-value-line">Meilleur tarif garanti sur notre site officiel</small>
      </section>
    </main>
  );
}
