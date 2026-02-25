import Link from "next/link";

export const metadata = {
  title: "Paiement annulé",
  description: "Paiement Stripe annulé",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaiementAnnulePage() {
  return (
    <main className="container page-shell">
      <h1>Paiement annulé</h1>
      <p className="page-lead">
        Le paiement a été annulé. Votre demande de réservation n’a pas été finalisée.
      </p>
      <div className="section-top">
        <Link className="btn primary" href="/disponibilites">Revenir à la réservation</Link>
      </div>
    </main>
  );
}
