import { NextResponse } from "next/server";
import dbLib from "../../../../lib/db";
import adminAuthLib from "../../../../lib/adminAuth";

const { getBookingsForExport, getDbSnapshot } = dbLib;
const { resolveAdminRole, hasRoleAtLeast } = adminAuthLib;

function escapeCsv(value) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";
    const role = resolveAdminRole(token);
    if (!role || !hasRoleAtLeast(role, "readonly")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const filters = {
      q: searchParams.get("q") || "",
      status: searchParams.get("status") || "all",
      paymentStatus: searchParams.get("paymentStatus") || "all",
      dateFrom: searchParams.get("dateFrom") || "",
      dateTo: searchParams.get("dateTo") || "",
    };

    const bookings = await getBookingsForExport(filters);
    const db = await getDbSnapshot();
    const closures = db.roomClosures || [];
    const header = [
      "id",
      "createdAt",
      "status",
      "paymentStatus",
      "fullName",
      "email",
      "phone",
      "checkIn",
      "checkOut",
      "roomType",
      "guests",
      "addon",
      "promoCode",
      "total",
      "closureOverlapCount",
    ];

    const rows = bookings.map((item) => ({
        ...item,
        overlapClosures: closures.filter((closure) => {
          if (closure.roomType !== item.payload?.roomType) return false;
          if (!item.payload?.checkIn || !item.payload?.checkOut) return false;
          return closure.checkIn < item.payload.checkOut && item.payload.checkIn < closure.checkOut;
        }).length,
      })
    ).map((item) =>
      [
        item.id,
        item.createdAt,
        item.status || "new",
        item.paymentStatus || "unpaid",
        item.payload?.fullName || "",
        item.payload?.email || "",
        item.payload?.phone || "",
        item.payload?.checkIn || "",
        item.payload?.checkOut || "",
        item.payload?.roomType || "",
        item.payload?.guests || "",
        item.payload?.addon || "",
        item.payload?.promoCode || "",
        Math.round(item.estimate?.total || 0),
        item.overlapClosures || 0,
      ].map(escapeCsv)
    );

    const totalRevenue = bookings.reduce((sum, item) => sum + Math.round(item.estimate?.total || 0), 0);
    const summaryRows = [
      [],
      ["summary_key", "summary_value"],
      ["bookings_count", bookings.length],
      ["room_closures_count", closures.length],
      ["total_revenue_eur", totalRevenue],
    ];
    const csv = [header.join(","), ...rows.map((row) => row.join(",")), ...summaryRows.map((row) => row.join(","))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=bookings-export.csv",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
