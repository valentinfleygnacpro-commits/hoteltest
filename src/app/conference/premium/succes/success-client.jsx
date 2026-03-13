"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppButton from "@/components/ui/app-button";

export default function ConferencePremiumSuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const registrationId = params.get("registrationId") || "";
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!sessionId || !registrationId) {
      setStatus("error");
      return;
    }

    async function confirm() {
      try {
        const response = await fetch(
          `/api/conference/confirm?session_id=${encodeURIComponent(sessionId)}&registrationId=${encodeURIComponent(
            registrationId
          )}`
        );
        const payload = await response.json();
        if (response.ok && payload?.ok && payload?.paid) {
          setStatus("paid");
          return;
        }
        setStatus("pending");
      } catch {
        setStatus("error");
      }
    }

    confirm();
  }, [registrationId, sessionId]);

  return (
    <main className="container page-shell payment-success">
      <h1>Conference IA</h1>
      {status === "loading" ? <p className="page-lead">Verification du paiement en cours...</p> : null}
      {status === "paid" ? (
        <p className="page-lead">Paiement confirme. Votre place premium est finalisee.</p>
      ) : null}
      {status === "pending" ? (
        <p className="page-lead">Paiement enregistre mais en attente de confirmation finale.</p>
      ) : null}
      {status === "error" ? (
        <p className="page-lead">Impossible de confirmer le paiement automatiquement. Contactez-nous si besoin.</p>
      ) : null}
      <div className="section-top">
        <AppButton asChild tone="primary">
          <Link href="/">Retour a l'accueil</Link>
        </AppButton>
      </div>
    </main>
  );
}
