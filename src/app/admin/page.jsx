import dbLib from "../../lib/db";
import AdminBookingStatus from "./AdminBookingStatus";

const { getDashboardDataFiltered } = dbLib;

export const metadata = {
  title: "Dashboard Admin",
  description: "Suivi des réservations, contacts, newsletter et analytics.",
  robots: {
    index: false,
    follow: false,
  },
};

function formatDate(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function metricCard(label, value) {
  return (
    <article className="value-card">
      <p>{label}</p>
      <h2>{value}</h2>
    </article>
  );
}

export default async function AdminPage({ searchParams }) {
  const resolvedParams = await Promise.resolve(searchParams);
  const token = resolvedParams?.token || "";
  const q = resolvedParams?.q || "";
  const status = resolvedParams?.status || "all";
  const dateFrom = resolvedParams?.dateFrom || "";
  const dateTo = resolvedParams?.dateTo || "";
  const expected = process.env.ADMIN_DASHBOARD_TOKEN || "";
  if (expected && token !== expected) {
    return (
      <main className="container page-shell">
        <h1>Accès refusé</h1>
        <p className="page-lead">Ajoute le token dans l&apos;URL: /admin?token=VOTRE_TOKEN</p>
      </main>
    );
  }

  const data = await getDashboardDataFiltered({ q, status, dateFrom, dateTo });
  const exportLink = `/api/admin/export?token=${encodeURIComponent(token)}&q=${encodeURIComponent(
    q
  )}&status=${encodeURIComponent(status)}&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`;

  return (
    <main className="container page-shell">
      <h1>Dashboard admin</h1>
      <p className="page-lead">Vue rapide des leads et conversions du site.</p>

      <section className="value-grid section-top">
        {metricCard("Réservations", data.totals.bookings)}
        {metricCard("Résultats filtrés", data.totals.filteredBookings)}
        {metricCard("Contacts", data.totals.contacts)}
        {metricCard("Newsletter", data.totals.newsletter)}
        {metricCard("Événements analytics", data.totals.analytics)}
      </section>

      <section className="section-top">
        <h2>Filtres</h2>
        <form method="GET" className="admin-filters">
          <input type="hidden" name="token" value={token} />
          <input type="text" name="q" defaultValue={q} placeholder="Recherche client/email/id" />
          <select name="status" defaultValue={status}>
            <option value="all">Tous les statuts</option>
            <option value="new">Nouvelle</option>
            <option value="confirmed">Confirmée</option>
            <option value="cancelled">Annulée</option>
          </select>
          <input type="date" name="dateFrom" defaultValue={dateFrom} />
          <input type="date" name="dateTo" defaultValue={dateTo} />
          <button className="btn primary" type="submit">Filtrer</button>
          <a className="btn ghost" href={`/admin?token=${encodeURIComponent(token)}`}>Réinitialiser</a>
          <a className="btn light" href={exportLink}>Exporter CSV</a>
        </form>
      </section>

      <section className="section-top">
        <h2>Funnel de conversion</h2>
        <div className="value-grid section-top-sm">
          {metricCard(
            "CTA cliques",
            data.recent.analytics.filter((item) => item.event === "cta_click").length
          )}
          {metricCard(
            "Réservations soumises",
            data.recent.analytics.filter((item) => item.event === "booking_submit" && item.label === "success").length
          )}
          {metricCard(
            "Contacts envoyés",
            data.recent.analytics.filter((item) => item.event === "contact_submit" && item.label === "success").length
          )}
          {metricCard(
            "Newsletters confirmées",
            data.recent.analytics.filter((item) => item.event === "newsletter_submit" && item.label === "success").length
          )}
        </div>
      </section>

      <section className="section-top">
        <h2>Dernières réservations</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Client</th>
                <th>Email</th>
                <th>Séjour</th>
                <th>Total</th>
                <th>Paiement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.bookings.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{item.payload?.fullName || "-"}</td>
                  <td>{item.payload?.email || "-"}</td>
                  <td>{item.payload?.checkIn} - {item.payload?.checkOut}</td>
                  <td>{Math.round(item.estimate?.total || 0)} EUR</td>
                  <td>{item.paymentStatus || "unpaid"}</td>
                  <td>
                    <AdminBookingStatus bookingId={item.id} currentStatus={item.status || "new"} token={token} />
                  </td>
                </tr>
              ))}
              {data.recent.bookings.length === 0 ? (
                <tr>
                  <td colSpan={8}>Aucune réservation.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-top">
        <h2>Derniers messages contact</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.contacts.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.message}</td>
                </tr>
              ))}
              {data.recent.contacts.length === 0 ? (
                <tr>
                  <td colSpan={4}>Aucun message.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-top">
        <h2>Dernières conversions newsletter</h2>
        <ul className="faq-list">
          {data.recent.newsletter.map((item) => (
            <li key={item.id} className="faq-item">
              <span>{item.email}</span>
              <span>{formatDate(item.createdAt)}</span>
            </li>
          ))}
          {data.recent.newsletter.length === 0 ? <li className="faq-item">Aucune inscription.</li> : null}
        </ul>
      </section>

      <section className="section-top">
        <h2>Derniers événements analytics</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Path</th>
                <th>Label</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.analytics.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{item.event}</td>
                  <td>{item.path || "-"}</td>
                  <td>{item.label || "-"}</td>
                </tr>
              ))}
              {data.recent.analytics.length === 0 ? (
                <tr>
                  <td colSpan={4}>Aucun événement.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
