import Link from "next/link";
import AppButton from "@/components/ui/app-button";

export const metadata = {
  title: "Paiement premium annule",
  description: "Paiement Stripe annule pour la conference IA.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConferencePremiumCancelledPage() {
  return (
    <main className="container page-shell">
      <h1>Paiement annule</h1>
      <p className="page-lead">
        Le paiement de la place premium a ete annule. Vous pouvez revenir et relancer l'inscription si besoin.
      </p>
      <div className="section-top">
        <AppButton asChild tone="primary">
          <Link href="/">Retour a l'accueil</Link>
        </AppButton>
      </div>
    </main>
  );
}
