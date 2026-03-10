import { NextResponse } from "next/server";
import dbLib from "../../../../../../lib/db";
import adminAuthLib from "../../../../../../lib/adminAuth";

const { updateBookingStatus } = dbLib;
const { resolveAdminRole, hasRoleAtLeast } = adminAuthLib;
const ALLOWED = new Set(["new", "confirmed", "cancelled"]);

export async function PATCH(request, { params }) {
  try {
    const token = request.headers.get("x-admin-token") || "";
    const role = resolveAdminRole(token);
    if (!role || !hasRoleAtLeast(role, "operator")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const status = String(body?.status || "").trim();
    if (!ALLOWED.has(status)) {
      return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
    }

    const updated = await updateBookingStatus(params.id, status);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, booking: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
