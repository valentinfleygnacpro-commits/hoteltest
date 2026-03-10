import { NextResponse } from "next/server";
import dbLib from "../../../../../lib/db";
import adminAuthLib from "../../../../../lib/adminAuth";

const { deleteRoomClosure, appendRecord } = dbLib;
const { resolveAdminRole, hasRoleAtLeast } = adminAuthLib;

export async function POST(request) {
  try {
    const token = request.headers.get("x-admin-token") || "";
    const role = resolveAdminRole(token);
    if (!role || !hasRoleAtLeast(role, "operator")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids.map((id) => String(id || "").trim()).filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ ok: false, error: "missing_ids" }, { status: 400 });
    }

    let deletedCount = 0;
    for (const id of ids) {
      const deleted = await deleteRoomClosure(id);
      if (deleted) {
        deletedCount += 1;
        await appendRecord("roomClosureEvents", {
          id: `RCE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          action: "delete",
          role,
          roomClosureId: id,
          meta: "bulk",
        });
      }
    }

    return NextResponse.json({ ok: true, deletedCount });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

