import { NextResponse } from "next/server";
import mailerLib from "../../../lib/mailer";
import dbLib from "../../../lib/db";
import emailTemplatesLib from "../../../lib/emailTemplates";
import rateLimitLib from "../../../lib/rateLimit";

const { sendWithResend } = mailerLib;
const { appendRecord } = dbLib;
const { newsletterWelcomeTemplate } = emailTemplatesLib;
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

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    await appendRecord("newsletter", {
      id: `NWS-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      email,
    });

    const recipient = process.env.NEWSLETTER_RECIPIENT_EMAIL || process.env.RESEND_FROM || "";
    const adminResult = await sendWithResend({
      to: recipient,
      subject: "Nouvelle inscription newsletter - Hotel Atlas",
      html: `<p>Nouvelle inscription: <strong>${escapeHtml(email)}</strong></p>`,
    });
    const clientResult = await sendWithResend({
      to: email,
      subject: "Bienvenue a la newsletter Hotel Atlas",
      html: newsletterWelcomeTemplate(escapeHtml(email)),
    });

    return NextResponse.json({
      ok: true,
      emailAdminSent: adminResult.sent,
      emailClientSent: clientResult.sent,
      emailStatus: adminResult.reason || "sent",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
