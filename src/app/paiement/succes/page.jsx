import { Suspense } from "react";
import PaiementSuccessClient from "./success-client";

export const metadata = {
  title: "Paiement réussi",
  description: "Confirmation de paiement Stripe",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaiementSuccesPage() {
  return (
    <Suspense fallback={null}>
      <PaiementSuccessClient />
    </Suspense>
  );
}
