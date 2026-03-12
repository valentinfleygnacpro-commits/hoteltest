async function sendWithResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from || !to) {
    return { sent: false, reason: "missing_email_config" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return { sent: false, reason: "provider_error", details };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: "provider_unreachable",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

module.exports = {
  sendWithResend,
};
