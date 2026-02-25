"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function sendEvent(payload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics", blob);
    return;
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function canTrackAnalytics() {
  try {
    const raw = localStorage.getItem("cookie_preferences");
    if (!raw) return false;
    const prefs = JSON.parse(raw);
    return Boolean(prefs?.analytics);
  } catch {
    return false;
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!canTrackAnalytics()) return;
    sendEvent({ event: "page_view", path: pathname, label: "route" });
  }, [pathname]);

  useEffect(() => {
    function onClick(event) {
      if (!canTrackAnalytics()) return;
      const target = event.target?.closest?.("[data-track]");
      if (!target) return;
      const label = target.getAttribute("data-track") || "unknown";
      sendEvent({ event: "cta_click", path: pathname, label });
    }

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [pathname]);

  return null;
}
