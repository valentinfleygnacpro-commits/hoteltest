import { NextResponse } from "next/server";
import mailerLib from "../../../lib/mailer";
import dbLib from "../../../lib/db";
import emailTemplatesLib from "../../../lib/emailTemplates";
import rateLimitLib from "../../../lib/rateLimit";

const { sendWithResend } = mailerLib;
const { appendRecord } = dbLib;
const { contactAdminTemplate, contactClientTemplate } = emailTemplatesLib;
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
    if (enforceRateLimit(request, "contact", 10, 60_000)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const body = await request.json();
    const website = String(body?.website || "").trim();
    if (website) {
      return NextResponse.json({ ok: false, error: "spam_detected" }, { status: 400 });
    }

    const name = (body?.name || "").trim();
    const email = (body?.email || "").trim();
    const message = (body?.message || "").trim();

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !isEmailValid || !message) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    await appendRecord("contacts", {
      id: `CNT-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      name,
      email,
      message,
    });

    const recipient = process.env.CONTACT_RECIPIENT_EMAIL || process.env.RESEND_FROM || "";
    const adminResult = await sendWithResend({
      to: recipient,
      subject: "Nouveau message de contact - Hotel Atlas",
      html: contactAdminTemplate({
        name: escapeHtml(name),
        email: escapeHtml(email),
        message: escapeHtml(message),
      }),
    });
    const clientResult = await sendWithResend({
      to: email,
      subject: "Nous avons bien re\u00e7u votre message",
      html: contactClientTemplate({ name: escapeHtml(name) }),
    });

    if (!adminResult.sent && !clientResult.sent) {
      return NextResponse.json(
        {
          ok: false,
          error: adminResult.reason || clientResult.reason || "email_send_failed",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      emailAdminSent: adminResult.sent,
      emailClientSent: clientResult.sent,
      emailStatus: adminResult.reason || "sent",
    });
  } catch (error) {
    console.error("contact_api_error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "server_error",
        details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined,
      },
      { status: 500 }
    );
  }
}
