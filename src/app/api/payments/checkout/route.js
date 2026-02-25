import { NextResponse } from "next/server";
import dbLib from "../../../../lib/db";
import stripeLib from "../../../../lib/stripe";

const { getBookingById, updateBooking } = dbLib;
const { getStripe, getSiteUrl } = stripeLib;

export async function POST(request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 500 });
    }

    const body = await request.json();
    const bookingId = String(body?.bookingId || "").trim();
    if (!bookingId) {
      return NextResponse.json({ ok: false, error: "missing_booking_id" }, { status: 400 });
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ ok: false, error: "booking_not_found" }, { status: 404 });
    }

    const amount = Math.max(0, Math.round(Number(booking.estimate?.total || 0)));
    if (!amount) {
      return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
    }

    const siteUrl = getSiteUrl().replace(/\/$/, "");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.payload?.email || undefined,
      metadata: {
        bookingId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            product_data: {
              name: `Réservation Hotel Atlas - ${booking.payload?.roomType || "séjour"}`,
              description: `${booking.payload?.checkIn || ""} -> ${booking.payload?.checkOut || ""}`,
            },
            unit_amount: amount * 100,
          },
        },
      ],
      success_url: `${siteUrl}/paiement/succes?session_id={CHECKOUT_SESSION_ID}&bookingId=${encodeURIComponent(
        bookingId
      )}`,
      cancel_url: `${siteUrl}/paiement/annule?bookingId=${encodeURIComponent(bookingId)}`,
    });

    await updateBooking(bookingId, (prev) => ({
      ...prev,
      paymentStatus: "pending",
      stripeCheckoutSessionId: session.id,
    }));

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("api key")) {
      return NextResponse.json({ ok: false, error: "stripe_invalid_key" }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
