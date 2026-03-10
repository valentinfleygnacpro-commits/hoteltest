"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppButton from "@/components/ui/app-button";
import { useLanguage } from "@/components/LanguageProvider";

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const navRef = useRef(null);
  const isAdminInterne = pathname?.startsWith("/admin-interne");
  const { language, setLanguage } = useLanguage();
  const copy = language === "EN"
    ? {
        brandSub: "Boutique Resort on Ile de Re",
        rooms: "Rooms",
        services: "Services",
        offers: "Offers",
        contact: "Contact",
        changeLanguage: "Change language",
        french: "French",
        english: "English",
        book: "Book",
        adminBack: "Back to site",
        logout: "Log out",
      }
    : {
        brandSub: "Boutique Resort sur l'ile de Re",
        rooms: "Chambres",
        services: "Services",
        offers: "Offres",
        contact: "Contact",
        changeLanguage: "Changer la langue",
        french: "Francais",
        english: "English",
        book: "Reserver",
        adminBack: "Retour au site",
        logout: "Deconnexion",
      };

  useEffect(() => {
    function onDocumentClick(event) {
      if (!navRef.current?.contains(event.target)) {
        setMobileNavOpen(false);
        setLanguageMenuOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        setLanguageMenuOpen(false);
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

  function selectLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setLanguageMenuOpen(false);
  }

  if (isAdminInterne) {
    return (
      <header className="site-header">
        <nav className="navbar container" aria-label="Navigation admin interne">
          <div className="brand">
            <span className="brand-mark">A</span>
            <div>
              <p className="brand-title">Admin Interne</p>
              <p className="brand-sub">Gestion des reservations</p>
            </div>
          </div>
          <div className="hero-cta">
            <AppButton asChild tone="ghost">
              <Link href="/">{copy.adminBack}</Link>
            </AppButton>
            <AppButton asChild tone="light">
              <Link href="/admin-interne">{copy.logout}</Link>
            </AppButton>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="site-header">
      <nav ref={navRef} className="navbar container" aria-label="Navigation principale">
        <Link href="/" className="brand" onClick={() => setMobileNavOpen(false)}>
          <span className="brand-mark">A</span>
          <div>
            <p className="brand-title">Hotel Atlas</p>
            <p className="brand-sub">{copy.brandSub}</p>
          </div>
        </Link>
        <AppButton
          tone="ghost"
          className="nav-toggle"
          aria-label="Ouvrir le menu"
          aria-expanded={mobileNavOpen}
          aria-controls="primary-navigation"
          onClick={() => setMobileNavOpen((prev) => !prev)}
        >
          <span className="nav-toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="nav-toggle-label">{mobileNavOpen ? "Close" : "Menu"}</span>
        </AppButton>
        <ul id="primary-navigation" className={`nav-links ${mobileNavOpen ? "open" : ""}`}>
          <li><Link href="/disponibilites" onClick={() => setMobileNavOpen(false)}>{copy.rooms}</Link></li>
          <li><Link href="/services" onClick={() => setMobileNavOpen(false)}>{copy.services}</Link></li>
          <li><Link href="/offres" onClick={() => setMobileNavOpen(false)}>{copy.offers}</Link></li>
          <li><Link href="/contact" onClick={() => setMobileNavOpen(false)}>{copy.contact}</Link></li>
        </ul>
        <div className="header-actions">
          <div className="language-switcher">
            <button
              type="button"
              className="language-button"
              aria-label={copy.changeLanguage}
              aria-expanded={languageMenuOpen}
              aria-controls="language-menu"
              onClick={() => setLanguageMenuOpen((prev) => !prev)}
            >
              <span className="language-button-label">{language}</span>
              <span className="language-button-caret" aria-hidden="true">▼</span>
            </button>
            {languageMenuOpen ? (
              <div id="language-menu" className="language-menu" role="menu" aria-label="Choix de langue">
                <button
                  type="button"
                  className={`language-option ${language === "FR" ? "is-active" : ""}`}
                  onClick={() => selectLanguage("FR")}
                  role="menuitem"
                >
                  {copy.french}
                </button>
                <button
                  type="button"
                  className={`language-option ${language === "EN" ? "is-active" : ""}`}
                  onClick={() => selectLanguage("EN")}
                  role="menuitem"
                >
                  English
                </button>
              </div>
            ) : null}
          </div>
          <AppButton asChild tone="primary" className="hero-book-cta navbar-book-cta">
            <Link href="/disponibilites" data-track="header-reserver">{copy.book}</Link>
          </AppButton>
        </div>
      </nav>
    </header>
  );
}
