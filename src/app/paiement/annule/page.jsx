import Link from "next/link";
import AppButton from "@/components/ui/app-button";

export const metadata = {
  title: "Paiement annule",
  description: "Paiement Stripe annule",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaiementAnnulePage() {
  return (
    <main className="container page-shell">
      <h1>Paiement annule</h1>
      <p className="page-lead">
        Le paiement a ete annule. Votre demande de reservation n'a pas ete finalisee.
      </p>
      <div className="section-top">
        <AppButton asChild tone="primary">
          <Link href="/disponibilites">Revenir a la reservation</Link>
        </AppButton>
      </div>
    </main>
  );
}
