import { NextResponse } from "next/server";
import dbLib from "../../../../lib/db";
import stripeLib from "../../../../lib/stripe";

const { updateBooking } = dbLib;
const { getStripe } = stripeLib;

export async function POST(request) {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!stripe || !webhookSecret) {
      return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 500 });
    }

    const signature = request.headers.get("stripe-signature") || "";
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId || "";
      if (bookingId) {
        await updateBooking(bookingId, (prev) => ({
          ...prev,
          paymentStatus: "paid",
          status: prev.status === "cancelled" ? prev.status : "confirmed",
          stripeCheckoutSessionId: session.id,
        }));
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId || "";
      if (bookingId) {
        await updateBooking(bookingId, (prev) => ({
          ...prev,
          paymentStatus: "expired",
          stripeCheckoutSessionId: session.id,
        }));
      }
    }

    return new NextResponse("ok", { status: 200 });
  } catch {
    return new NextResponse("invalid webhook", { status: 400 });
  }
}
