import { NextResponse } from "next/server";
import dbLib from "../../../../lib/db";
import stripeLib from "../../../../lib/stripe";

const { getBookingById, updateBooking } = dbLib;
const { getStripe } = stripeLib;

export async function GET(request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id") || "";
    const bookingId = searchParams.get("bookingId") || "";
    if (!sessionId || !bookingId) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ ok: false, error: "booking_not_found" }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";

    if (paid) {
      await updateBooking(bookingId, (prev) => ({
        ...prev,
        paymentStatus: "paid",
        status: prev.status === "cancelled" ? prev.status : "confirmed",
        stripeCheckoutSessionId: session.id,
      }));
    }

    return NextResponse.json({ ok: true, paid, paymentStatus: session.payment_status });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
