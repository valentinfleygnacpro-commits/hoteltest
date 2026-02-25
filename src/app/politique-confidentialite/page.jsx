export const metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité et traitement des données Hotel Atlas.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="container page-shell">
      <h1>Politique de confidentialité</h1>
      <p className="page-lead">Traitement et protection de vos données personnelles.</p>
      <section className="section-top">
        <p>
          Les données saisies (réservation, contact, newsletter) sont utilisées uniquement pour traiter votre demande
          et améliorer le service client.
        </p>
        <p>
          Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données via
          bonjour@hotel-atlas.fr.
        </p>
        <p>
          Les informations techniques de navigation peuvent être mesurées à des fins d&apos;analyse d&apos;audience et
          de conversion.
        </p>
      </section>
    </main>
  );
}
