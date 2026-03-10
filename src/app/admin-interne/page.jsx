import dbLib from "../../lib/db";
import adminAuthLib from "../../lib/adminAuth";
import AdminInterneApp from "./AdminInterneApp";

const { getDashboardDataFiltered } = dbLib;
const { resolveAdminRole } = adminAuthLib;

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
  const paymentStatus = params?.paymentStatus || "all";
  const dateFrom = params?.dateFrom || "";
  const dateTo = params?.dateTo || "";

  const role = resolveAdminRole(token);
  if (!role) {
    return (
      <main className="container page-shell">
        <h1>Acces refuse</h1>
        <p className="page-lead">Utilisez /admin-interne?token=VOTRE_TOKEN (admin, operator ou readonly)</p>
      </main>
    );
  }

  const data = await getDashboardDataFiltered({ q, status, paymentStatus, dateFrom, dateTo });

  return (
    <AdminInterneApp
      token={token}
      role={role}
      initialFilters={{ q, status, paymentStatus, dateFrom, dateTo }}
      initialData={data}
    />
  );
}
