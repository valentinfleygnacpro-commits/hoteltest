"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

function getRouteLabel(pathname, isEnglish) {
  if (!pathname || pathname === "/") return isEnglish ? "Arrival" : "Accueil";
  if (pathname.startsWith("/disponibilites")) return isEnglish ? "Availability" : "Disponibilites";
  if (pathname.startsWith("/chambres")) return isEnglish ? "Rooms & Suites" : "Chambres & Suites";
  if (pathname.startsWith("/services")) return isEnglish ? "Services" : "Services";
  if (pathname.startsWith("/offres")) return isEnglish ? "Offers" : "Offres";
  if (pathname.startsWith("/contact")) return isEnglish ? "Contact" : "Contact";
  if (pathname.startsWith("/spa")) return "Spa";
  if (pathname.startsWith("/restaurant")) return isEnglish ? "Restaurant" : "Restaurant";
  if (pathname.startsWith("/reservation")) return isEnglish ? "Reservation" : "Reservation";
  return "Hotel Atlas";
}

export default function RouteTransitionOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isEnglish = language === "EN";
  const routeKey = `${pathname || ""}?${searchParams?.toString() || ""}`;
  const isFirstRender = useRef(true);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState("idle");
  const timeoutRef = useRef([]);

  const routeLabel = useMemo(() => getRouteLabel(pathname, isEnglish), [pathname, isEnglish]);

  function clearTimers() {
    timeoutRef.current.forEach((timer) => window.clearTimeout(timer));
    timeoutRef.current = [];
  }

  function showLoading() {
    setVisible(true);
    setPhase("loading");
  }

  useEffect(() => {
    function onDocumentClick(event) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let targetUrl;
      try {
        targetUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (targetUrl.origin !== window.location.origin) return;
      const nextKey = `${targetUrl.pathname}?${targetUrl.searchParams.toString()}`;
      const currentKey = `${window.location.pathname}?${window.location.search.replace(/^\?/, "")}`;
      if (nextKey === currentKey) return;

      clearTimers();
      showLoading();
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    clearTimers();

    if (!visible) {
      showLoading();
    }

    timeoutRef.current.push(
      window.setTimeout(() => {
        setPhase("reveal");
      }, reduceMotion ? 30 : 120)
    );

    timeoutRef.current.push(
      window.setTimeout(() => {
        setVisible(false);
        setPhase("idle");
      }, reduceMotion ? 420 : 1450)
    );

    return clearTimers;
  }, [routeKey]);

  useEffect(() => clearTimers, []);

  if (!visible) return null;

  return (
    <div className={`route-transition is-${phase}`} aria-hidden="true">
      <div className="route-transition-panel route-transition-image">
        <Image
          src="/page-daccueil-01.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="route-transition-panel route-transition-veil" />
      <div className="route-transition-panel route-transition-wash" />

      <div className="route-transition-center">
        <div className="route-transition-crest">
          <div className="route-transition-ring">
            <span className="route-transition-mark">A</span>
          </div>
          <div className="route-transition-rule left" />
          <div className="route-transition-rule right" />
        </div>
        <p className="route-transition-kicker">{isEnglish ? "Hotel Atlas" : "Hotel Atlas"}</p>
        <h2 className="route-transition-title">{routeLabel}</h2>
        <div className="route-transition-progress">
          <span />
        </div>
      </div>
    </div>
  );
}
