import { NextResponse } from "next/server";
import mailerLib from "../../../lib/mailer";
import dbLib from "../../../lib/db";
import emailTemplatesLib from "../../../lib/emailTemplates";
import rateLimitLib from "../../../lib/rateLimit";

const { sendWithResend } = mailerLib;
const { appendRecord, createToken } = dbLib;
const { conferenceRegistrationTemplate, newsletterWelcomeTemplate } = emailTemplatesLib;
const { enforceRateLimit } = rateLimitLib;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request) {
  try {
    if (enforceRateLimit(request, "newsletter", 20, 60_000)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const body = await request.json();
    const website = String(body?.website || "").trim();
    if (website) {
      return NextResponse.json({ ok: false, error: "spam_detected" }, { status: 400 });
    }

    const email = (body?.email || "").trim();
    const name = String(body?.name || "").trim().slice(0, 120);
    const source = String(body?.source || "newsletter").trim().slice(0, 80);
    const isConferenceSignup = source === "conference-ia-gratuite";
    const cancelToken = createToken(16);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
    const cancelUrl = `${siteUrl}/conference/annulation?token=${encodeURIComponent(cancelToken)}`;
    const donateUrl = process.env.CONFERENCE_DONATION_URL || `${siteUrl}/contact`;

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    await appendRecord("newsletter", {
      id: `NWS-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      email,
      name,
      source,
      status: "active",
      cancelToken,
      cancelledAt: null,
    });

    const recipient = process.env.NEWSLETTER_RECIPIENT_EMAIL || process.env.RESEND_FROM || "";
    const adminResult = await sendWithResend({
      to: recipient,
      subject: "Nouvelle inscription newsletter - Hotel Atlas",
      html: `<p>Nouvelle inscription: <strong>${escapeHtml(email)}</strong></p>
        <p>Nom: <strong>${escapeHtml(name || "-")}</strong></p>
        <p>Source: <strong>${escapeHtml(source)}</strong></p>`,
    });
    const clientResult = await sendWithResend({
      to: email,
      subject: isConferenceSignup
        ? "Confirmation d'inscription - Conference IA"
        : "Bienvenue a la newsletter Hotel Atlas",
      html: isConferenceSignup
        ? conferenceRegistrationTemplate({
            name: escapeHtml(name || email),
            cancelUrl,
            donateUrl,
          })
        : newsletterWelcomeTemplate(escapeHtml(email)),
    });

    return NextResponse.json({
      ok: true,
      cancelUrl,
      donateUrl,
      emailAdminSent: adminResult.sent,
      emailClientSent: clientResult.sent,
      emailStatus: adminResult.reason || "sent",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
