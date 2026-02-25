import { NextResponse } from "next/server";
import pricingLib from "../../../lib/pricing";
import mailerLib from "../../../lib/mailer";
import dbLib from "../../../lib/db";
import emailTemplatesLib from "../../../lib/emailTemplates";
import rateLimitLib from "../../../lib/rateLimit";
import availabilityLib from "../../../lib/availability";

const { calculateEstimate } = pricingLib;
const { sendWithResend } = mailerLib;
const { appendRecord, getDbSnapshot } = dbLib;
const { bookingAdminTemplate, bookingClientTemplate } = emailTemplatesLib;
const { enforceRateLimit } = rateLimitLib;
const { getAvailabilityByRoom } = availabilityLib;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeAddons(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (!value) return [];
  return [String(value).trim()];
}

export async function POST(request) {
  try {
    if (enforceRateLimit(request, "booking", 10, 60_000)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const body = await request.json();
    const website = String(body?.website || "").trim();
    if (website) {
      return NextResponse.json({ ok: false, error: "spam_detected" }, { status: 400 });
    }

    const fullName = String(body?.fullName || "").trim();
    const email = String(body?.email || "").trim();
    const phone = String(body?.phone || "").trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const payload = {
      checkIn: body?.checkIn || "",
      checkOut: body?.checkOut || "",
      roomType: body?.roomType || "",
      guests: body?.guests || 1,
      addon: normalizeAddons(body?.addons),
      promoCode: body?.promo || "",
      fullName,
      email,
      phone,
    };

    if (!fullName || !emailValid) {
      return NextResponse.json({ ok: false, error: "invalid_customer" }, { status: 400 });
    }

    const estimate = calculateEstimate(payload);
    if (!estimate?.valid) {
      return NextResponse.json({ ok: false, error: "invalid_booking" }, { status: 400 });
    }

    const snapshot = await getDbSnapshot();
    const availability = getAvailabilityByRoom(snapshot.bookings, payload.checkIn, payload.checkOut);
    if (!availability || (availability[payload.roomType] ?? 0) <= 0) {
      return NextResponse.json({ ok: false, error: "room_unavailable" }, { status: 409 });
    }

    const bookingId = `ATL-${Date.now().toString().slice(-8)}`;
    const createdAt = new Date().toISOString();
    await appendRecord("bookings", {
      id: bookingId,
      createdAt,
      status: "new",
      payload: {
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        roomType: payload.roomType,
        guests: payload.guests,
        addon: payload.addon,
        promoCode: payload.promoCode,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
      },
      estimate,
    });

    const recipient = process.env.BOOKING_RECIPIENT_EMAIL || process.env.RESEND_FROM || "";
    const adminResult = await sendWithResend({
      to: recipient,
      subject: `Nouvelle réservation ${bookingId} - Hotel Atlas`,
      html: bookingAdminTemplate({
        bookingId: escapeHtml(bookingId),
        payload: {
          ...payload,
          fullName: escapeHtml(payload.fullName),
          email: escapeHtml(payload.email),
          phone: escapeHtml(payload.phone),
          checkIn: escapeHtml(payload.checkIn),
          checkOut: escapeHtml(payload.checkOut),
          roomType: escapeHtml(payload.roomType),
          guests: escapeHtml(payload.guests),
          addon: escapeHtml(payload.addon.join(", ")),
        },
        estimate,
      }),
    });

    const customerResult = await sendWithResend({
      to: payload.email,
      subject: `Confirmation de réservation ${bookingId}`,
      html: bookingClientTemplate({
        bookingId: escapeHtml(bookingId),
        payload: {
          ...payload,
          fullName: escapeHtml(payload.fullName),
          checkIn: escapeHtml(payload.checkIn),
          checkOut: escapeHtml(payload.checkOut),
        },
        estimate,
      }),
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      estimate,
      emailAdminSent: adminResult.sent,
      emailClientSent: customerResult.sent,
      emailStatus: adminResult.reason || "sent",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
