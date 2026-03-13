import { NextResponse } from "next/server";
import dbLib from "../../../../lib/db";
import stripeLib from "../../../../lib/stripe";

const { appendRecord, createToken } = dbLib;
const { getStripe, getSiteUrl } = stripeLib;

export async function POST(request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 500 });
    }

    const body = await request.json();
    const name = String(body?.name || "").trim().slice(0, 120);
    const email = String(body?.email || "").trim();
    const source = "conference-ia-gratuite";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const registrationId = `NWS-${Date.now().toString().slice(-8)}`;
    const cancelToken = createToken(16);
    const siteUrl = getSiteUrl().replace(/\/$/, "");

    await appendRecord("newsletter", {
      id: registrationId,
      createdAt: new Date().toISOString(),
      email,
      name,
      source,
      tier: "premium",
      status: "pending_payment",
      paymentStatus: "pending",
      cancelToken,
      cancelledAt: null,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email || undefined,
      metadata: {
        registrationId,
        source,
        tier: "premium",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            product_data: {
              name: "Place premium - Conference IA",
              description: "Acces premium a la conference IA du 26 octobre 2026",
            },
            unit_amount: 1500,
          },
        },
      ],
      success_url: `${siteUrl}/conference/premium/succes?session_id={CHECKOUT_SESSION_ID}&registrationId=${encodeURIComponent(
        registrationId
      )}`,
      cancel_url: `${siteUrl}/conference/premium/annule?registrationId=${encodeURIComponent(registrationId)}`,
    });

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id, registrationId });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.toLowerCase().includes("api key")) {
      return NextResponse.json({ ok: false, error: "stripe_invalid_key" }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: message || "server_error" }, { status: 500 });
  }
}
