import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact",
  description: "Contactez l'Hotel Atlas pour vos réservations et demandes spéciales.",
};

export default function ContactPage() {
  return (
    <main className="container page-shell">
      <h1>Contact</h1>
      <p className="page-lead">
        Notre équipe est disponible 7j/7 pour vos réservations, transferts et demandes sur mesure.
      </p>
      <section className="contact section-top" aria-label="Contact et acces">
        <div className="contact-grid">
          <ContactClient />
          <div className="contact-info">
            <div>
              <strong>Adresse</strong>
              <p>12 Avenue des Dunes, 17340 Ile de Re</p>
            </div>
            <div>
              <strong>Telephone</strong>
              <p>+33 5 00 00 00 00</p>
            </div>
            <div>
              <strong>Email</strong>
              <p>bonjour@hotel-atlas.fr</p>
            </div>
            <a
              className="map-placeholder"
              href="https://www.google.com/maps/dir/?api=1&destination=12+Avenue+des+Dunes%2C+17340+Ile+de+Re%2C+France"
              target="_blank"
              rel="noreferrer"
            >
              Voir l&apos;itineraire
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
