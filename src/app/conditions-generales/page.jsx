export const metadata = {
  title: "Conditions générales",
  description: "Conditions générales de vente et d’utilisation de l’Hotel Atlas.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ConditionsGeneralesPage() {
  return (
    <main className="container page-shell">
      <h1>Conditions générales</h1>
      <p className="page-lead">Règles de réservation, paiement, annulation et séjour.</p>
      <section className="section-top">
        <p>
          Les réservations sont confirmées après validation de la demande et émission d’un e-mail de confirmation.
        </p>
        <p>
          L’annulation est gratuite jusqu’à 48h avant l’arrivée. Des frais peuvent s’appliquer au-delà.
        </p>
        <p>
          L’établissement se réserve le droit d’ajuster la réservation en cas d’indisponibilité exceptionnelle, avec
          proposition équivalente ou remboursement.
        </p>
      </section>
    </main>
  );
}
