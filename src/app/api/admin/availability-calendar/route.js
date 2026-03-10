import { NextResponse } from "next/server";
import dbLib from "../../../../lib/db";
import availabilityLib from "../../../../lib/availability";
import adminAuthLib from "../../../../lib/adminAuth";

const { getDbSnapshot } = dbLib;
const { INVENTORY, getAvailabilityByRoomWithClosures } = availabilityLib;
const { resolveAdminRole, hasRoleAtLeast } = adminAuthLib;

function addDaysIso(iso, amount) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export async function GET(request) {
  try {
    const token = request.headers.get("x-admin-token") || "";
    const role = resolveAdminRole(token);
    if (!role || !hasRoleAtLeast(role, "readonly")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start") || new Date().toISOString().slice(0, 10);
    const days = Math.max(1, Math.min(60, Number.parseInt(searchParams.get("days") || "14", 10) || 14));
    const db = await getDbSnapshot();

    const rows = [];
    for (let i = 0; i < days; i += 1) {
      const day = addDaysIso(start, i);
      const nextDay = addDaysIso(day, 1);
      const availability = getAvailabilityByRoomWithClosures(db.bookings, db.roomClosures, day, nextDay);
      if (!availability) continue;
      const totalInventory = INVENTORY.classic + INVENTORY.deluxe + INVENTORY.suite;
      const availableTotal = availability.classic + availability.deluxe + availability.suite;
      const occupiedRate = Math.round(((totalInventory - availableTotal) / totalInventory) * 100);
      rows.push({
        date: day,
        availability,
        occupiedRate,
      });
    }

    return NextResponse.json({ ok: true, start, days, rows });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

