"use client";

import { useEffect, useState } from "react";
import AppButton from "@/components/ui/app-button";
import { Checkbox } from "@/components/ui/checkbox";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);

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
      <p className="cookie-title">Preferences cookies</p>
      <p className="cookie-text">
        Nous utilisons des cookies essentiels et, avec votre accord, des cookies de mesure d&apos;audience.
      </p>
      <div className="cookie-controls">
        <label className="inline-flex items-center gap-2">
          <Checkbox checked={analytics} onCheckedChange={(checked) => setAnalytics(Boolean(checked))} />
          Autoriser les statistiques
        </label>
      </div>
      <div className="cookie-actions">
        <AppButton tone="ghost" type="button" onClick={() => savePrefs({ essential: true, analytics: false })}>
          Refuser
        </AppButton>
        <AppButton tone="primary" type="button" onClick={() => savePrefs({ essential: true, analytics })}>
          Enregistrer
        </AppButton>
        <AppButton tone="light" type="button" onClick={() => savePrefs({ essential: true, analytics: true })}>
          Tout accepter
        </AppButton>
      </div>
    </aside>
  );
}
