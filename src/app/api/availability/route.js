import { NextResponse } from "next/server";
import dbLib from "../../../lib/db";
import availabilityLib from "../../../lib/availability";

const { getDbSnapshot } = dbLib;
const { getAvailabilityByRoom } = availabilityLib;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn") || "";
    const checkOut = searchParams.get("checkOut") || "";

    const db = await getDbSnapshot();
    const availability = getAvailabilityByRoom(db.bookings, checkIn, checkOut);
    if (!availability) {
      return NextResponse.json({ ok: false, error: "invalid_dates" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, availability });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
