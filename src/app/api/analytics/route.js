import { NextResponse } from "next/server";
import dbLib from "../../../lib/db";
import rateLimitLib from "../../../lib/rateLimit";

const { appendRecord } = dbLib;
const { enforceRateLimit } = rateLimitLib;

const ALLOWED_EVENTS = new Set([
  "page_view",
  "cta_click",
  "booking_submit",
  "contact_submit",
  "newsletter_submit",
]);

export async function POST(request) {
  try {
    if (enforceRateLimit(request, "analytics", 120, 60_000)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const body = await request.json();
    const event = String(body?.event || "").trim();
    const path = String(body?.path || "").trim();
    const label = String(body?.label || "").trim();

    if (!ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
    }

    await appendRecord("analytics", {
      id: `EVT-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      event,
      path,
      label,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
