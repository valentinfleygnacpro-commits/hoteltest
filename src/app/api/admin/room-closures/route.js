import { NextResponse } from "next/server";
import dbLib from "../../../../lib/db";
import availabilityLib from "../../../../lib/availability";
import adminAuthLib from "../../../../lib/adminAuth";

const { getRoomClosures, addRoomClosure, appendRecord, getDbSnapshot } = dbLib;
const { INVENTORY } = availabilityLib;
const { resolveAdminRole, hasRoleAtLeast } = adminAuthLib;
const ROOM_TYPES = new Set(["classic", "deluxe", "suite"]);

function isValidDate(value) {
  const date = new Date(value || "");
  return !Number.isNaN(date.getTime());
}

function isAuthorized(request) {
  const token = request.headers.get("x-admin-token") || "";
  return resolveAdminRole(token);
}

function rangesOverlap(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
}

function getConfirmedConflicts(bookings, closurePayloads) {
  const conflicts = [];
  for (const closure of closurePayloads) {
    for (const booking of bookings || []) {
      if ((booking.status || "new") !== "confirmed") continue;
      if (booking.payload?.roomType !== closure.roomType) continue;
      if (!booking.payload?.checkIn || !booking.payload?.checkOut) continue;
      if (
        rangesOverlap(
          closure.checkIn,
          closure.checkOut,
          booking.payload.checkIn,
          booking.payload.checkOut
        )
      ) {
        conflicts.push({
          bookingId: booking.id,
          roomType: closure.roomType,
          guest: booking.payload?.fullName || "-",
          checkIn: booking.payload?.checkIn || "",
          checkOut: booking.payload?.checkOut || "",
        });
      }
    }
  }
  return conflicts;
}

export async function GET(request) {
  try {
    const role = isAuthorized(request);
    if (!role || !hasRoleAtLeast(role, "readonly")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const roomClosures = await getRoomClosures();
    return NextResponse.json({ ok: true, roomClosures });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const role = isAuthorized(request);
    if (!role || !hasRoleAtLeast(role, "operator")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const roomType = String(body?.roomType || "").trim();
    const applyToAllTypes = Boolean(body?.applyToAllTypes);
    const checkIn = String(body?.checkIn || "").trim();
    const checkOut = String(body?.checkOut || "").trim();
    const reason = String(body?.reason || "").trim();
    const force = Boolean(body?.force);
    const repeatWeeks = Math.max(0, Math.min(8, Number.parseInt(String(body?.repeatWeeks || "0"), 10) || 0));
    const requested = Math.max(1, Number.parseInt(String(body?.quantity || "0"), 10) || 0);

    if (!applyToAllTypes && !ROOM_TYPES.has(roomType)) {
      return NextResponse.json({ ok: false, error: "invalid_room_type" }, { status: 400 });
    }
    if (!isValidDate(checkIn) || !isValidDate(checkOut) || new Date(checkOut) <= new Date(checkIn)) {
      return NextResponse.json({ ok: false, error: "invalid_dates" }, { status: 400 });
    }
    const roomTypesToBlock = applyToAllTypes ? Array.from(ROOM_TYPES) : [roomType];
    const closurePayloads = [];
    for (let week = 0; week <= repeatWeeks; week += 1) {
      const shiftDays = week * 7;
      const shiftedCheckIn = new Date(checkIn);
      shiftedCheckIn.setDate(shiftedCheckIn.getDate() + shiftDays);
      const shiftedCheckOut = new Date(checkOut);
      shiftedCheckOut.setDate(shiftedCheckOut.getDate() + shiftDays);
      const shiftedIn = shiftedCheckIn.toISOString().slice(0, 10);
      const shiftedOut = shiftedCheckOut.toISOString().slice(0, 10);

      for (const type of roomTypesToBlock) {
        const maxByType = Number(INVENTORY?.[type] || 1);
        if (!applyToAllTypes && requested > maxByType) {
          return NextResponse.json({ ok: false, error: "invalid_quantity" }, { status: 400 });
        }
        const quantity = applyToAllTypes ? maxByType : Math.max(1, requested || maxByType);
        closurePayloads.push({
          roomType: type,
          checkIn: shiftedIn,
          checkOut: shiftedOut,
          quantity,
        });
      }
    }

    const snapshot = await getDbSnapshot();
    const conflicts = getConfirmedConflicts(snapshot.bookings, closurePayloads);
    if (conflicts.length && !force) {
      return NextResponse.json({ ok: false, error: "conflicts_detected", conflicts }, { status: 409 });
    }

    const created = [];
    for (const payload of closurePayloads) {
      const closure = {
        id: `RCL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        roomType: payload.roomType,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        quantity: payload.quantity,
        reason: reason.slice(0, 240),
      };
      await addRoomClosure(closure);
      created.push(closure);
      await appendRecord("roomClosureEvents", {
        id: `RCE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        action: "create",
        role,
        roomClosureId: closure.id,
        roomType: closure.roomType,
        checkIn: closure.checkIn,
        checkOut: closure.checkOut,
        quantity: closure.quantity,
        reason: closure.reason || "",
      });
    }
    return NextResponse.json({ ok: true, roomClosure: created[0], roomClosures: created, conflicts });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
