import { NextResponse } from "next/server";
import dbLib from "../../../../lib/db";

const { getBookingsForExport } = dbLib;

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
    const expected = process.env.ADMIN_DASHBOARD_TOKEN || "";
    if (expected && token !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const filters = {
      q: searchParams.get("q") || "",
      status: searchParams.get("status") || "all",
      dateFrom: searchParams.get("dateFrom") || "",
      dateTo: searchParams.get("dateTo") || "",
    };

    const bookings = await getBookingsForExport(filters);
    const header = [
      "id",
      "createdAt",
      "status",
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
    ];

    const rows = bookings.map((item) =>
      [
        item.id,
        item.createdAt,
        item.status || "new",
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
      ].map(escapeCsv)
    );

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
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
