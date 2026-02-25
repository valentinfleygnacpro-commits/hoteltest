import ReservationClient from "./reservation-client";

export const metadata = {
  title: "Reservation",
  description: "Reservez votre sejour a l'Hotel Atlas en quelques etapes.",
};

export default function ReservationPage() {
  return (
    <main className="container page-shell">
      <h1>Reserver votre sejour</h1>
      <p className="page-lead">
        Selectionnez vos dates, votre chambre et confirmez votre paiement en ligne.
      </p>
      <ReservationClient />
    </main>
  );
}
