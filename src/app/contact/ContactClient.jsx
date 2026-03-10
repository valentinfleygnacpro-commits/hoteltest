"use client";

import { useState } from "react";
import AppButton from "@/components/ui/app-button";
import { useLanguage } from "@/components/LanguageProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const { language } = useLanguage();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEnglish = language === "EN";
  const isError = status.startsWith("Erreur:") || status === "Impossible d'envoyer pour le moment." || status === "Unable to send right now.";

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    const form = event.currentTarget;

    const formData = new FormData(form);
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
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.details || data?.error || "contact_failed");
      }

      setStatus(isEnglish ? "Message sent. Reply within 24h." : "Message envoye. Reponse sous 24h.");
      form.reset();
      trackContact("success");
    } catch (error) {
      const message = String(error?.message || "");
      setStatus(message && message !== "contact_failed" ? `Erreur: ${message}` : (isEnglish ? "Unable to send right now." : "Impossible d'envoyer pour le moment."));
      trackContact("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="contact-form page-contact-form" onSubmit={onSubmit}>
      <div className="contact-form-head">
        <p className="contact-info-kicker">{isEnglish ? "Write to the hotel" : "Ecrire a l'hotel"}</p>
        <h2>{isEnglish ? "Send your message" : "Envoyez votre message"}</h2>
        <p>{isEnglish ? "Reservations, transfers or special requests. Reply from our team within 24h." : "Reservations, transferts ou demandes particulieres. Reponse de notre equipe sous 24h."}</p>
      </div>
      <Input type="text" name="website" className="hp-field" tabIndex="-1" autoComplete="off" />
      <div className="field">
        <Label htmlFor="name">{isEnglish ? "Full name" : "Nom complet"}</Label>
        <Input type="text" id="name" name="name" required />
      </div>
      <div className="field">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" name="email" required />
      </div>
      <div className="field">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows="5" required />
      </div>
      <AppButton tone="primary" type="submit" className="contact-submit" disabled={submitting}>
        {submitting ? (isEnglish ? "Sending..." : "Envoi...") : (isEnglish ? "Send" : "Envoyer")}
      </AppButton>
      {status ? <p className={`form-status ${isError ? "is-error" : ""}`} role="status">{status}</p> : null}
    </form>
  );
}
