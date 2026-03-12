import Link from "next/link";
import dbLib from "../../../lib/db";

const { cancelNewsletterRegistration, findNewsletterRegistrationByCancelToken } = dbLib;

export const metadata = {
  title: "Annulation conference IA",
  description: "Annulez votre inscription a la conference IA.",
};

export default async function ConferenceCancellationPage({ searchParams }) {
  const params = await searchParams;
  const token = String(params?.token || "").trim();

  let status = "invalid";
  let email = "";

  if (token) {
    const existing = await findNewsletterRegistrationByCancelToken(token);
    if (existing) {
      email = existing.email || "";
      if (existing.status === "cancelled") {
        status = "already_cancelled";
      } else {
        const cancelled = await cancelNewsletterRegistration(token);
        status = cancelled ? "cancelled" : "error";
      }
    }
  }

  return (
    <main className="container page-shell" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fffdfa",
          border: "1px solid #e6d8c7",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 18px 44px rgba(34, 19, 10, 0.08)",
        }}
      >
        <p style={{ color: "#557b66", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Conference IA
        </p>
        <h1 style={{ marginTop: 8, marginBottom: 12 }}>
          {status === "cancelled" ? "Inscription annulee" : null}
          {status === "already_cancelled" ? "Inscription deja annulee" : null}
          {status === "invalid" ? "Lien d'annulation invalide" : null}
          {status === "error" ? "Impossible d'annuler l'inscription" : null}
        </h1>
        <p style={{ color: "#5e4a38", lineHeight: 1.6 }}>
          {status === "cancelled" ? `L'inscription associee a ${email || "votre email"} a bien ete annulee.` : null}
          {status === "already_cancelled" ? "Cette inscription avait deja ete annulee." : null}
          {status === "invalid" ? "Le lien est incomplet ou n'existe plus." : null}
          {status === "error" ? "Une erreur est survenue pendant l'annulation. Merci de reessayer plus tard." : null}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <Link href="/" style={{ color: "#4a3524", fontWeight: 700 }}>
            Retour a l'accueil
          </Link>
          <Link href="/contact" style={{ color: "#8f7255", fontWeight: 700 }}>
            Contacter l'equipe
          </Link>
        </div>
      </section>
    </main>
  );
}
