import { NextResponse } from "next/server";
import dbLib from "../../../../lib/db";
import stripeLib from "../../../../lib/stripe";
import mailerLib from "../../../../lib/mailer";
import emailTemplatesLib from "../../../../lib/emailTemplates";

const { getRecordById, updateRecord } = dbLib;
const { getStripe, getSiteUrl } = stripeLib;
const { sendWithResend } = mailerLib;
const { conferenceRegistrationTemplate } = emailTemplatesLib;

export async function GET(request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id") || "";
    const registrationId = searchParams.get("registrationId") || "";
    if (!sessionId || !registrationId) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    const registration = await getRecordById("newsletter", registrationId);
    if (!registration) {
      return NextResponse.json({ ok: false, error: "registration_not_found" }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    if (!paid) {
      return NextResponse.json({ ok: true, paid: false, paymentStatus: session.payment_status });
    }

    const updated = await updateRecord("newsletter", registrationId, (prev) => ({
      ...prev,
      status: prev.status === "cancelled" ? prev.status : "active",
      paymentStatus: "paid",
      stripeCheckoutSessionId: session.id,
    }));

    const siteUrl = getSiteUrl().replace(/\/$/, "");
    const cancelUrl = `${siteUrl}/conference/annulation?token=${encodeURIComponent(updated?.cancelToken || "")}`;
    const donateUrl = process.env.CONFERENCE_DONATION_URL || `${siteUrl}/contact`;

    const recipient = process.env.NEWSLETTER_RECIPIENT_EMAIL || process.env.RESEND_FROM || "";
    const adminResult = await sendWithResend({
      to: recipient,
      subject: "Nouvelle inscription premium - Conference IA",
      html: `<p>Nouvelle inscription premium: <strong>${registration.email}</strong></p>
        <p>Nom: <strong>${registration.name || "-"}</strong></p>
        <p>Montant regle: <strong>15 EUR</strong></p>`,
    });

    const clientResult = await sendWithResend({
      to: registration.email,
      subject: "Confirmation de votre place premium - Conference IA",
      html: conferenceRegistrationTemplate({
        name: registration.name || registration.email,
        cancelUrl,
        donateUrl,
        tier: "premium",
      }),
    });

    return NextResponse.json({
      ok: true,
      paid: true,
      paymentStatus: session.payment_status,
      emailAdminSent: adminResult.sent,
      emailClientSent: clientResult.sent,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
