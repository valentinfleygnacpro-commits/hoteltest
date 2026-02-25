"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaiementSuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const bookingId = params.get("bookingId") || "";
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!sessionId || !bookingId) {
      setStatus("error");
      return;
    }

    async function confirm() {
      try {
        const response = await fetch(
          `/api/payments/confirm?session_id=${encodeURIComponent(sessionId)}&bookingId=${encodeURIComponent(
            bookingId
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
  }, [bookingId, sessionId]);

  return (
    <main className="container page-shell payment-success">
      <h1>Paiement</h1>
      {status === "loading" ? <p className="page-lead">Vérification du paiement en cours...</p> : null}
      {status === "paid" ? (
        <>
          <p className="page-lead">Paiement confirmé. Votre réservation est finalisée.</p>
          <p>Référence réservation: {bookingId}</p>
        </>
      ) : null}
      {status === "pending" ? (
        <p className="page-lead">
          Paiement enregistré mais en attente de confirmation finale. Notre équipe revient vers vous rapidement.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="page-lead">
          Impossible de confirmer le paiement automatiquement. Contactez-nous avec votre référence.
        </p>
      ) : null}
      <div className="section-top">
        <Link className="btn primary" href="/">Retour à l’accueil</Link>
      </div>
    </main>
  );
}
