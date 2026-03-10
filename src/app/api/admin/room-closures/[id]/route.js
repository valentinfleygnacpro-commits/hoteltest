import { NextResponse } from "next/server";
import dbLib from "../../../../../lib/db";
import adminAuthLib from "../../../../../lib/adminAuth";

const { deleteRoomClosure, appendRecord } = dbLib;
const { resolveAdminRole, hasRoleAtLeast } = adminAuthLib;

function isAuthorized(request) {
  const token = request.headers.get("x-admin-token") || "";
  return resolveAdminRole(token);
}

export async function DELETE(request, { params }) {
  try {
    const role = isAuthorized(request);
    if (!role || !hasRoleAtLeast(role, "operator")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    const deleted = await deleteRoomClosure(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    await appendRecord("roomClosureEvents", {
      id: `RCE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      action: "delete",
      role,
      roomClosureId: id,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
