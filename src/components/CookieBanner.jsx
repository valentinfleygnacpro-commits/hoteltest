"use client";

import { useEffect, useState } from "react";
import AppButton from "@/components/ui/app-button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/components/LanguageProvider";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const { language } = useLanguage();
  const copy = language === "EN"
    ? {
        title: "Cookie preferences",
        text: "We use essential cookies and, with your consent, analytics cookies.",
        stats: "Allow analytics",
        reject: "Reject",
        save: "Save",
        acceptAll: "Accept all",
      }
    : {
        title: "Preferences cookies",
        text: "Nous utilisons des cookies essentiels et, avec votre accord, des cookies de mesure d'audience.",
        stats: "Autoriser les statistiques",
        reject: "Refuser",
        save: "Enregistrer",
        acceptAll: "Tout accepter",
      };

  useEffect(() => {
    const raw = localStorage.getItem("cookie_preferences");
    if (!raw) {
      setVisible(true);
      return;
    }
    try {
      const prefs = JSON.parse(raw);
      setAnalytics(Boolean(prefs.analytics));
    } catch {
      setVisible(true);
    }
  }, []);

  function savePrefs(next) {
    localStorage.setItem("cookie_preferences", JSON.stringify(next));
    setVisible(false);
    setAnalytics(Boolean(next.analytics));
  }

  if (!visible) return null;

  return (
    <aside className="cookie-banner" role="dialog" aria-label="Preferences cookies" aria-live="polite">
      <p className="cookie-title">{copy.title}</p>
      <p className="cookie-text">{copy.text}</p>
      <div className="cookie-controls">
        <label className="inline-flex items-center gap-2">
          <Checkbox checked={analytics} onCheckedChange={(checked) => setAnalytics(Boolean(checked))} />
          {copy.stats}
        </label>
      </div>
      <div className="cookie-actions">
        <AppButton tone="ghost" type="button" onClick={() => savePrefs({ essential: true, analytics: false })}>
          {copy.reject}
        </AppButton>
        <AppButton tone="primary" type="button" onClick={() => savePrefs({ essential: true, analytics })}>
          {copy.save}
        </AppButton>
        <AppButton tone="light" type="button" onClick={() => savePrefs({ essential: true, analytics: true })}>
          {copy.acceptAll}
        </AppButton>
      </div>
    </aside>
  );
}
