import dbLib from "../../lib/db";
import AdminInterneApp from "./AdminInterneApp";

const { getDashboardDataFiltered } = dbLib;

export const metadata = {
  title: "Admin Interne",
  description: "Application interne de gestion des reservations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminInternePage({ searchParams }) {
  const params = await Promise.resolve(searchParams);
  const token = params?.token || "";
  const q = params?.q || "";
  const status = params?.status || "all";
  const dateFrom = params?.dateFrom || "";
  const dateTo = params?.dateTo || "";

  const expected = process.env.ADMIN_DASHBOARD_TOKEN || "";
  if (expected && token !== expected) {
    return (
      <main className="container page-shell">
        <h1>Acces refuse</h1>
        <p className="page-lead">Utilisez /admin-interne?token=VOTRE_TOKEN</p>
      </main>
    );
  }

  const data = await getDashboardDataFiltered({ q, status, dateFrom, dateTo });

  return (
    <AdminInterneApp
      token={token}
      initialFilters={{ q, status, dateFrom, dateTo }}
      initialData={data}
    />
  );
}
