import { Suspense } from "react";
import ConferencePremiumSuccessClient from "./success-client";

export const metadata = {
  title: "Paiement premium confirme",
  description: "Confirmation de paiement Stripe pour la conference IA.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConferencePremiumSuccessPage() {
  return (
    <Suspense fallback={null}>
      <ConferencePremiumSuccessClient />
    </Suspense>
  );
}
