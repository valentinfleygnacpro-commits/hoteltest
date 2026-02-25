"use client";

import { useState } from "react";

async function trackContact(status) {
  try {
    const raw = localStorage.getItem("cookie_preferences");
    const prefs = raw ? JSON.parse(raw) : null;
    if (!prefs?.analytics) return;
  } catch {
    return;
  }
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "contact_submit",
        path: window.location.pathname,
        label: status,
      }),
    });
  } catch {}
}

export default function ContactClient() {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      message: String(formData.get("message") || ""),
      website: String(formData.get("website") || ""),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("contact_failed");
      setStatus("Message envoyé. Réponse sous 24h.");
      event.currentTarget.reset();
      trackContact("success");
    } catch {
      setStatus("Impossible d'envoyer pour le moment.");
      trackContact("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="contact-form page-contact-form" onSubmit={onSubmit}>
      <input type="text" name="website" className="hp-field" tabIndex="-1" autoComplete="off" />
      <div className="field">
        <label htmlFor="name">Nom complet</label>
        <input type="text" id="name" name="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" required />
      </div>
      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows="5" required></textarea>
      </div>
      <button className="btn primary" type="submit" disabled={submitting}>
        {submitting ? "Envoi..." : "Envoyer"}
      </button>
      {status ? <p className="form-status">{status}</p> : null}
    </form>
  );
}
