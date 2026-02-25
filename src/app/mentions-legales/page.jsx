export const metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Hotel Atlas.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function MentionsLegalesPage() {
  return (
    <main className="container page-shell">
      <h1>Mentions légales</h1>
      <p className="page-lead">Informations légales et éditeur du site Hotel Atlas.</p>
      <section className="section-top">
        <p><strong>Éditeur:</strong> Hotel Atlas, 12 Avenue des Dunes, 17340 Île de Ré.</p>
        <p><strong>Contact:</strong> bonjour@hotel-atlas.fr - +33 5 00 00 00 00</p>
        <p><strong>Directeur de publication:</strong> Direction Hotel Atlas.</p>
        <p><strong>Hébergement:</strong> Infrastructure cloud sécurisée (UE).</p>
      </section>
    </main>
  );
}
