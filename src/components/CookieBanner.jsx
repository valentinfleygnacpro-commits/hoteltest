"use client";

import { useEffect, useState } from "react";

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
        <label>
          <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
          Autoriser les statistiques
        </label>
      </div>
      <div className="cookie-actions">
        <button className="btn ghost" type="button" onClick={() => savePrefs({ essential: true, analytics: false })}>
          Refuser
        </button>
        <button className="btn primary" type="button" onClick={() => savePrefs({ essential: true, analytics })}>
          Enregistrer
        </button>
        <button className="btn light" type="button" onClick={() => savePrefs({ essential: true, analytics: true })}>
          Tout accepter
        </button>
      </div>
    </aside>
  );
}
