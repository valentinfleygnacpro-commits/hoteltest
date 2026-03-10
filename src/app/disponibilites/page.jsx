import { Suspense } from "react";
import pricingLib from "../../lib/pricing";
import DisponibilitesPageClient from "./DisponibilitesPageClient";

const { getTodayLocalISO } = pricingLib;

export const metadata = {
  title: "Verifier les disponibilites",
  description: "Choisissez vos dates et le nombre de voyageurs avant de selectionner votre chambre.",
};

export default function DisponibilitesPage() {
  const today = getTodayLocalISO();
  return (
    <Suspense fallback={null}>
      <DisponibilitesPageClient today={today} />
    </Suspense>
  );
}
