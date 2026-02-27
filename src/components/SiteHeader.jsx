"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppButton from "@/components/ui/app-button";

export default function SiteHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    function onDocumentClick(event) {
      if (!mobileNavOpen) return;
      if (!navRef.current?.contains(event.target)) {
        setMobileNavOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 900) setMobileNavOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="site-header">
      <nav ref={navRef} className="navbar container" aria-label="Navigation principale">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <p className="brand-title">Hotel Atlas</p>
            <p className="brand-sub">Boutique Resort - Bord de mer</p>
          </div>
        </div>
        <AppButton
          tone="ghost"
          className="nav-toggle"
          aria-label="Ouvrir le menu"
          aria-expanded={mobileNavOpen}
          aria-controls="primary-navigation"
          onClick={() => setMobileNavOpen((prev) => !prev)}
        >
          Menu
        </AppButton>
        <ul id="primary-navigation" className={`nav-links ${mobileNavOpen ? "open" : ""}`}>
          <li><Link href="/disponibilites" onClick={() => setMobileNavOpen(false)}>Chambres</Link></li>
          <li><Link href="/services" onClick={() => setMobileNavOpen(false)}>Services</Link></li>
          <li><Link href="/offres" onClick={() => setMobileNavOpen(false)}>Offres</Link></li>
          <li><Link href="/contact" onClick={() => setMobileNavOpen(false)}>Contact</Link></li>
        </ul>
        <AppButton asChild tone="primary">
          <Link href="/disponibilites" data-track="header-reserver">Reserver</Link>
        </AppButton>
      </nav>
    </header>
  );
}
