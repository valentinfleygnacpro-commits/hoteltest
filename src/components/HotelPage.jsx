"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import pricingLib from "../lib/pricing";
import siteContentLib from "../lib/siteContent";

const { ROOM_PRICES, addDaysISO, calculateEstimate, calculateNights, getTodayLocalISO } = pricingLib;
const { ADDON_OPTIONS, FAQ_ITEMS, OFFER_ITEMS, ROOM_OPTIONS, TESTIMONIALS } = siteContentLib;

const DEFAULT_FORM = {
  checkIn: "",
  checkOut: "",
  roomType: "",
  guests: 2,
  promo: "",
  addons: [],
  fullName: "",
  email: "",
  phone: "",
  website: "",
};

const ROOM_DETAILS = {
  classic: ["Douche a effet pluie", "Mini-bar signature", "Vue patio interieur"],
  deluxe: ["Machine a espresso", "Salon lounge", "Vue jardin et mer"],
  suite: ["Room service 24/7", "Coin bureau design", "Panorama sur la baie"],
};

const BOOKING_STEPS = [
  { id: 1, label: "Dates" },
  { id: 2, label: "Chambre" },
  { id: 3, label: "Options" },
];

const VALUE_POINTS = [
  {
    title: "Service de conciergerie premium",
    text: "Recommandations et reservations personnalisees avant votre arrivee.",
  },
  {
    title: "Emplacement privilegie",
    text: "Entre plage, nature preservee et adresses gastronomiques locales.",
  },
  {
    title: "Confort certifie",
    text: "Literie haut de gamme, insonorisation et controle de temperature sur-mesure.",
  },
  {
    title: "Experiences privees",
    text: "Spa, transferts et activites organises selon votre planning.",
  },
];

const TRUST_ITEMS = [
  "Paiement securise 3D Secure",
  "Note moyenne 4.9/5 sur plateformes verifiees",
  "Annulation flexible jusqu'a 48h",
  "Assistance conciergerie 24/7",
];

const HOME_HERO_IMAGES = [
  "/page-daccueil-01.jpg",
  "/page-daccueil-02.jpg",
  "/page-daccueil-04.jpg",
  "/page-daccueil-00.jpg",
];

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

async function trackEvent(event, label) {
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
        event,
        path: window.location.pathname,
        label,
      }),
    });
  } catch {}
}

export default function HotelPage() {
  const today = useMemo(() => getTodayLocalISO(), []);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingError, setBookingError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const [bookingSummary, setBookingSummary] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const closeModalRef = useRef(null);
  const modalContentRef = useRef(null);
  const bookingSectionRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
      closeModalRef.current.focus();
      return;
    }
    document.body.style.overflow = "";
  }, [modalOpen]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setModalOpen(false);
      }

      if (event.key === "Tab" && modalOpen && modalContentRef.current) {
        const focusables = modalContentRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    if (modalOpen) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  useEffect(() => {
    function onDocumentClick(event) {
      if (!mobileNavOpen) return;
      if (!navRef.current.contains(event.target)) {
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % HOME_HERO_IMAGES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  const checkOutMin = form.checkIn ? addDaysISO(form.checkIn, 1) : today;
  const estimate = useMemo(
    () =>
      calculateEstimate({
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        roomType: form.roomType,
        guests: form.guests,
        addon: form.addons,
        promoCode: form.promo,
      }),
    [form]
  );

  const totalPriceLabel = useMemo(() => {
    if (!form.checkIn || !form.checkOut || !form.roomType) return "-";
    if (!estimate?.valid) return "Dates invalides";
    return formatCurrency(estimate.total || 0);
  }, [estimate, form.checkIn, form.checkOut, form.roomType]);
  const hasSelectedRoom = Boolean(form.roomType);

  useEffect(() => {
    if (!form.checkIn || !form.checkOut || !estimate?.valid) {
      setAvailability(null);
      return;
    }

    let ignore = false;
    async function fetchAvailability() {
      setAvailabilityLoading(true);
      try {
        const url = `/api/availabilitycheckIn=${encodeURIComponent(form.checkIn)}&checkOut=${encodeURIComponent(form.checkOut)}`;
        const response = await fetch(url);
        const payload = await response.json();
        if (!ignore && response.ok && payload.ok) {
          setAvailability(payload.availability);
        }
      } catch {
        if (!ignore) setAvailability(null);
      } finally {
        if (!ignore) setAvailabilityLoading(false);
      }
    }

    fetchAvailability();
    return () => {
      ignore = true;
    };
  }, [estimate?.valid, form.checkIn, form.checkOut]);

  function updateField(field, value) {
    setBookingError("");
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "guests") {
        next.guests = Math.max(1, Math.min(4, Number.parseInt(value || "1", 10) || 1));
      }
      if (field === "checkIn" && next.checkOut && next.checkOut <= value) {
        next.checkOut = "";
      }
      return next;
    });
  }

  function toggleAddon(addonValue) {
    setForm((prev) => {
      const current = Array.isArray(prev.addons) ? prev.addons : [];
      const exists = current.includes(addonValue);
      return {
        ...prev,
        addons: exists ? current.filter((item) => item !== addonValue) : [...current, addonValue],
      };
    });
  }

  function validateStep(step) {
    if (step === 1) {
      if (!form.checkIn || !form.checkOut) return "Choisis une date d'arrivee et de depart.";
      if (calculateNights(form.checkIn, form.checkOut) <= 0) return "Les dates selectionnees sont invalides.";
    }
    if (step === 2) {
      if (!form.roomType) return "Selectionne un type de chambre.";
      if (!form.guests || Number(form.guests) < 1) return "Le nombre de voyageurs est invalide.";
    }
    if (step === 3) {
      if (!estimate?.valid) return "Le panier n'est pas valide.";
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || "");
      if (!form.fullName.trim() || !validEmail) return "Renseigne votre nom complet et un email valide.";
    }
    return "";
  }

  function nextStep() {
    const error = validateStep(bookingStep);
    if (error) {
      setBookingError(error);
      return;
    }
    setBookingStep((prev) => Math.min(3, prev + 1));
  }

  function prevStep() {
    setBookingError("");
    setBookingStep((prev) => Math.max(1, prev - 1));
  }

  function showPrevHeroImage() {
    setHeroImageIndex((prev) => (prev - 1 + HOME_HERO_IMAGES.length) % HOME_HERO_IMAGES.length);
  }

  function showNextHeroImage() {
    setHeroImageIndex((prev) => (prev + 1) % HOME_HERO_IMAGES.length);
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();
    const error = validateStep(3);
    if (error) {
      setBookingError(error);
      return;
    }

    setBookingSubmitting(true);
    setBookingError("");
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        if (payload.error === "room_unavailable") {
          throw new Error("room_unavailable");
        }
        throw new Error("booking_failed");
      }

      const roomLabel = ROOM_OPTIONS.find((opt) => opt.value === form.roomType).label || "";
      const summary = `Reservation ${payload.bookingId} - ${roomLabel} pour ${form.guests} personne(s), du ${form.checkIn} au ${form.checkOut} (${payload.estimate.nights} nuit(s)). Total estime : ${formatCurrency(payload.estimate.total)}.`;
      const checkoutResponse = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: payload.bookingId }),
      });
      const checkoutPayload = await checkoutResponse.json();
      if (checkoutResponse.ok && checkoutPayload.ok && checkoutPayload.url) {
        trackEvent("booking_submit", "success");
        window.location.href = checkoutPayload.url;
        return;
      }

      setBookingSummary(`${summary} Paiement en ligne indisponible pour le moment.`);
      setModalOpen(true);
      setForm(DEFAULT_FORM);
      setBookingStep(1);
      trackEvent("booking_submit", "success");
    } catch (error) {
      if (error.message === "room_unavailable") {
        setBookingError("Cette chambre n'est plus disponible sur ces dates. Choisis une autre option.");
      } else {
        setBookingError("Impossible de confirmer pour le moment. Merci de reessayer.");
      }
      trackEvent("booking_submit", "error");
    } finally {
      setBookingSubmitting(false);
    }
  }

  function handleRoomQuickSelect(room) {
    setForm((prev) => ({ ...prev, roomType: room }));
    setBookingStep(2);
    bookingSectionRef.current.scrollIntoView({ behavior: "smooth" });
  }

  async function handleNewsletterSubmit(event) {
    event.preventDefault();
    setNewsletterSubmitting(true);
    setNewsletterStatus("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("newsletterEmail") || ""),
      website: String(formData.get("website") || ""),
    };

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("newsletter_failed");
      setNewsletterStatus("Inscription confirmee. Merci.");
      event.currentTarget.reset();
      trackEvent("newsletter_submit", "success");
    } catch {
      setNewsletterStatus("Echec de l'inscription. Merci de reessayer.");
      trackEvent("newsletter_submit", "error");
    } finally {
      setNewsletterSubmitting(false);
    }
  }

  const hotelJsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: "Hotel Atlas",
    description: "Boutique resort en bord de mer avec reservation en ligne.",
    telephone: "+33 5 00 00 00 00",
    email: "bonjour@hotel-atlas.fr",
    address: {
      "@type": "PostalAddress",
      streetAddress: "12 Avenue des Dunes",
      addressLocality: "Ile de Re",
      postalCode: "17340",
      addressCountry: "FR",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <a className="skip-link" href="/disponibilites">Aller a la reservation</a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <header className="site-header">
        <nav ref={navRef} className="navbar container" aria-label="Navigation principale">
          <div className="brand">
            <span className="brand-mark">A</span>
            <div>
              <p className="brand-title">Hotel Atlas</p>
              <p className="brand-sub">Boutique Resort - Bord de mer</p>
            </div>
          </div>
          <button
            className="nav-toggle"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileNavOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            Menu
          </button>
          <ul id="primary-navigation" className={`nav-links ${mobileNavOpen ? "open" : ""}`}>
            <li><Link href="/disponibilites" onClick={() => setMobileNavOpen(false)}>Chambres</Link></li>
            <li><Link href="/services" onClick={() => setMobileNavOpen(false)}>Services</Link></li>
            <li><Link href="/offres" onClick={() => setMobileNavOpen(false)}>Offres</Link></li>
            <li><Link href="/contact" onClick={() => setMobileNavOpen(false)}>Contact</Link></li>
          </ul>
          <Link className="btn primary" href="/disponibilites" data-track="header-reserver">Reserver</Link>
        </nav>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-image">
            <Image
              src={HOME_HERO_IMAGES[heroImageIndex]}
              alt={`Vue de l'hotel Atlas ${heroImageIndex + 1}`}
              width={1920}
              height={1080}
              priority
              sizes="100vw"
            />
            <div className="hero-brand-overlay">
              <p>Hotel & Spa</p>
              <h2>HOTEL ATLAS</h2>
            </div>
            <button className="hero-carousel-btn prev" type="button" aria-label="Image precedente" onClick={showPrevHeroImage}>
              ‹
            </button>
            <button className="hero-carousel-btn next" type="button" aria-label="Image suivante" onClick={showNextHeroImage}>
              ›
            </button>
          </div>
          <div className="hero-overlay container">
            <div className="hero-copy">
              <p className="eyebrow">Une adresse confidentielle a 2 h de Paris</p>
              <h1>Votre sejour d&apos;exception, pense du detail a l&apos;emotion.</h1>
              <p className="hero-lead">Suites lumineuses, spa mineral, gastronomie locale et service 24/7.</p>
              <p className="beach-highlight">A seulement 2 min de la plage</p>
              <div className="hero-cta">
                <Link className="btn primary" href="/disponibilites" data-track="hero-disponibilites">Verifier les disponibilites</Link>
                <Link className="btn ghost" href="/disponibilites" data-track="hero-chambres">Voir les chambres</Link>
              </div>
              <div className="hero-stats">
                <div>
                  <strong>4.9/5</strong>
                  <span>Note clients verifiee</span>
                </div>
                <div>
                  <strong>38</strong>
                  <span>Suites et chambres</span>
                </div>
                <div className="beach-stat">
                  <strong>2 min</strong>
                  <span>De la plage</span>
                </div>
              </div>
            </div>
            <div className="hero-card hero-map-card">
              <p className="hero-map-kicker">Acces rapide</p>
              <h2>Hotel Atlas - Ile de Re</h2>
              <p className="hero-map-lead">A 2 min de la plage et a quelques minutes de Saint-Martin-de-Re.</p>
              <div className="hero-map-visual" aria-hidden="true">
                <iframe
                  className="hero-map-frame"
                  title="Carte Hotel Atlas"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=12+Avenue+des+Dunes%2C+17340+Ile+de+Re%2C+France&z=14&output=embed"
                />
              </div>
              <a
                className="btn light"
                href="https://www.google.com/maps/dir/?api=1&destination=12+Avenue+des+Dunes%2C+17340+Ile+de+Re%2C+France"
                target="_blank"
                rel="noreferrer"
                data-track="hero-map-itineraire"
              >
                Voir l&apos;itineraire
              </a>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Elements de confiance">
          <div className="container trust-strip-inner">
            {TRUST_ITEMS.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>

        <section className="value-section">
          <div className="container">
            <div className="section-head">
              <h2>Pourquoi choisir Hotel Atlas</h2>
              <p>Un positionnement boutique assume, avec des standards hoteliers eleves.</p>
            </div>
            <div className="value-grid">
              {VALUE_POINTS.map((item) => (
                <article key={item.title} className="value-card">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="booking" className="booking" ref={bookingSectionRef}>
          <div className="container">
            <div className="section-head">
              <h2>Reserver votre sejour</h2>
              <p>Disponibilites en temps reel, confirmation immediate.</p>
            </div>
            <div className="stepper" role="list" aria-label="Etapes de reservation">
              {BOOKING_STEPS.map((step) => (
                <div key={step.id} className={`step-item ${bookingStep >= step.id ? "active" : ""}`} role="listitem">
                  <span>{step.id}</span>
                  <small>{step.label}</small>
                </div>
              ))}
            </div>
            <form id="bookingForm" className="booking-form" onSubmit={handleBookingSubmit}>
              {bookingStep === 1 ? (
                <>
                  <input type="text" name="website" className="hp-field" tabIndex="-1" autoComplete="off" />
                  <div className="field">
                    <label htmlFor="checkIn">Arrivee</label>
                    <input
                      type="date"
                      id="checkIn"
                      name="checkIn"
                      min={today}
                      value={form.checkIn}
                      onChange={(e) => updateField("checkIn", e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="checkOut">Depart</label>
                    <input
                      type="date"
                      id="checkOut"
                      name="checkOut"
                      min={checkOutMin}
                      value={form.checkOut}
                      onChange={(e) => updateField("checkOut", e.target.value)}
                      required
                    />
                  </div>
                </>
              ) : null}

              {bookingStep === 2 ? (
                <>
                  <div className="field">
                    <label htmlFor="roomType">Type de chambre</label>
                    <select
                      id="roomType"
                      name="roomType"
                      value={form.roomType}
                      onChange={(e) => updateField("roomType", e.target.value)}
                      required
                    >
                      {ROOM_OPTIONS.map((option) => (
                        <option key={option.value || "empty"} value={option.value} disabled={option.value && availability ? (availability[option.value] || 0) <= 0 : false}>
                          {option.label}
                          {option.value && availability ? ` (${availability[option.value]} dispo)` : ""}
                        </option>
                      ))}
                    </select>
                    {availabilityLoading ? <small>Verification des disponibilites...</small> : null}
                  </div>
                  <div className="field">
                    <label htmlFor="guests">Voyageurs</label>
                    <input
                      type="number"
                      id="guests"
                      name="guests"
                      min="1"
                      max="4"
                      value={form.guests}
                      onChange={(e) => updateField("guests", e.target.value)}
                      required
                    />
                  </div>
                </>
              ) : null}

              {bookingStep === 3 ? (
                <>
                  <div className="field">
                    <label htmlFor="fullName">Nom complet</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="bookingEmail">Email</label>
                    <input
                      type="email"
                      id="bookingEmail"
                      name="bookingEmail"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Telephone (optionnel)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="promo">Code promo</label>
                    <input
                      type="text"
                      id="promo"
                      name="promo"
                      placeholder="ATLAS24"
                      value={form.promo}
                      onChange={(e) => updateField("promo", e.target.value)}
                    />
                  </div>
                  <fieldset className="field">
                    <legend>Options (cumulables)</legend>
                    <div className="addons-list">
                      {ADDON_OPTIONS.filter((option) => option.value !== "none").map((option) => (
                        <label key={option.value} className="addon-item">
                          <input
                            type="checkbox"
                            checked={form.addons.includes(option.value)}
                            onChange={() => toggleAddon(option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : null}

              {hasSelectedRoom ? (
                <div className="field summary">
                  <label htmlFor="totalPrice">Total estime</label>
                  <div className="price" id="totalPrice" aria-live="polite">{totalPriceLabel}</div>
                  <small>Taxes incluses. Ajuste selon vos dates.</small>
                  {estimate?.valid ? (
                    <div className="price-breakdown">
                      <span>{estimate.nights} nuit(s)</span>
                      <span>Sous-total: {formatCurrency(estimate.subtotal)}</span>
                      {estimate.discount > 0 ? <span>Reduction: -{formatCurrency(estimate.discount)}</span> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {bookingError ? <p className="form-error" role="alert">{bookingError}</p> : null}

              <div className="booking-actions">
                {bookingStep > 1 ? (
                  <button className="btn ghost" type="button" onClick={prevStep}>
                    Retour
                  </button>
                ) : null}
                {bookingStep < 3 ? (
                  <button className="btn primary" type="button" onClick={nextStep}>
                    Continuer
                  </button>
                ) : (
                  <button className="btn primary" type="submit" disabled={!estimate?.valid || bookingSubmitting}>
                    {bookingSubmitting ? "Redirection paiement..." : "Confirmer et payer"}
                  </button>
                )}
              </div>
            </form>

            {hasSelectedRoom ? (
              <>
                <div className="booking-sticky">
                  <span>Total: {totalPriceLabel}</span>
                  <a className="btn primary" href="#bookingForm" data-track="mobile-finaliser">Finaliser</a>
                </div>

                <div className="booking-note">
                  <div>
                    <strong>Annulation flexible</strong>
                    <span>Gratuite jusqu&apos;a 48h avant l&apos;arrivee.</span>
                  </div>
                  <div>
                    <strong>Paiement securise</strong>
                    <span>Visa, Mastercard, Amex, Apple Pay.</span>
                  </div>
                  <div>
                    <strong>Conciergerie 24/7</strong>
                    <span>Reservations et experiences sur-mesure.</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </section>

        <section id="rooms" className="rooms">
          <div className="container">
            <div className="section-head">
              <h2>Chambres et suites</h2>
              <p>Lumiere naturelle, textures nobles, silence absolu.</p>
            </div>
            <div className="rooms-grid">
              {ROOM_OPTIONS.filter((item) => item.value).map((room) => (
                <article key={room.value} className={`room-card ${room.value === "suite" ? "highlight" : ""}`}>
                  <div className="room-tag">{room.value}</div>
                  <h3>{room.label.split(" - ")[0]}</h3>
                  <p>{room.area} - {room.capacity}</p>
                  <ul className="room-features">
                    {ROOM_DETAILS[room.value].map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <div className="room-footer">
                    <span>{formatCurrency(ROOM_PRICES[room.value])}/nuit</span>
                    {availability ? (
                      <small className={`availability-pill ${(availability[room.value] || 0) > 0 ? "ok" : "low"}`}>
                        {(availability[room.value] || 0) > 0
                          ? `${availability[room.value]} dispo`
                          : "Complet"}
                      </small>
                    ) : null}
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => handleRoomQuickSelect(room.value)}
                      disabled={availability ? (availability[room.value] || 0) <= 0 : false}
                    >
                      Reserver
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="amenities" className="amenities">
          <div className="container">
            <div className="section-head">
              <h2>Services et experiences</h2>
              <p>Une equipe dediee pour orchestrer chaque moment.</p>
            </div>
            <div className="amenities-grid">
              <div className="amenity">
                <h3>Spa mineral</h3>
                <p>Sauna, hammam, soins holistiques et bassin chauffe.</p>
                <Link href="/spa">Voir le programme spa</Link>
              </div>
              <div className="amenity">
                <h3>Restaurant Atelier</h3>
                <p>Cuisine locale, carte saisonniere, terrasse ombragee.</p>
                <Link href="/restaurant">Voir la carte</Link>
              </div>
              <div className="amenity">
                <h3>Conciergerie</h3>
                <p>Excursions privees, reservations culturelles, transferts.</p>
              </div>
              <div className="amenity">
                <h3>Espace travail</h3>
                <p>Cabines calmes, Wi-Fi haut debit, salles de reunion.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="offers" className="offers">
          <div className="container">
            <div className="section-head">
              <h2>Offres speciales</h2>
              <p>Des sejours penses pour vous surprendre.</p>
            </div>
            <div className="offers-grid">
              {OFFER_ITEMS.map((offer) => (
                <article key={offer.title}>
                  <h3>{offer.title}</h3>
                  <p>{offer.details}</p>
                  <span>Des {formatCurrency(offer.priceFrom)}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="testimonials">
          <div className="container">
            <div className="section-head">
              <h2>Ils en parlent</h2>
              <p>Experiences vecues et publiees sur des plateformes verifiees.</p>
            </div>
            <div className="testimonial-grid">
              {TESTIMONIALS.map((item) => (
                <blockquote key={item.author}>
                  <span className="stars" aria-hidden="true">*****</span>
                  &quot;{item.quote}&quot;
                  <span>{item.author}</span>
                  <small>{item.source} - {item.date}</small>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="faq">
          <div className="container">
            <div className="section-head">
              <h2>Questions frequentes</h2>
              <p>Tout ce qu&apos;il faut savoir avant d&apos;arriver.</p>
            </div>
            <div className="faq-list">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = activeFaq === index;
                const buttonId = `faq-button-${index}`;
                const panelId = `faq-panel-${index}`;
                return (
                  <div key={item.question}>
                    <button
                      id={buttonId}
                      className="faq-item"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setActiveFaq((prev) => (prev === index ? -1 : index))}
                    >
                      <span>{item.question}</span>
                      <span className="faq-icon">{isOpen ? "-" : "+"}</span>
                    </button>
                    <div
                      id={panelId}
                      className="faq-panel"
                      role="region"
                      aria-labelledby={buttonId}
                      hidden={!isOpen}
                    >
                      {item.answer}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container final-cta-inner">
            <div>
              <h2>Prets a reserver votre prochaine escapade </h2>
              <p>Bloquez vos dates aujourd&apos;hui et profitez de la meilleure disponibilite.</p>
            </div>
            <Link className="btn primary" href="/disponibilites" data-track="final-cta-reserver">Reserver maintenant</Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h3>Hotel Atlas</h3>
            <p>Un refuge de caractere entre mer et nature.</p>
          </div>
          <div>
            <h3>Informations</h3>
            <ul>
              <li><Link href="/disponibilites">Chambres</Link></li>
              <li><Link href="/spa">Spa</Link></li>
              <li><Link href="/restaurant">Restaurant</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/mentions-legales">Mentions legales</Link></li>
              <li><Link href="/politique-confidentialite">Confidentialite</Link></li>
              <li><Link href="/conditions-generales">Conditions generales</Link></li>
              <li><Link href="/hotel-spa-ile-de-re">Hotel spa Ile de Re</Link></li>
              <li><Link href="/hotel-bord-de-mer-ile-de-re">Hotel bord de mer Ile de Re</Link></li>
              <li><Link href="/admin">Admin</Link></li>
            </ul>
          </div>
          <div>
            <h3>Newsletter</h3>
            <p>Recevez nos offres privees et inspirations voyage.</p>
            <form className="newsletter" onSubmit={handleNewsletterSubmit}>
              <input type="text" name="website" className="hp-field" tabIndex="-1" autoComplete="off" />
              <input type="email" placeholder="Votre email" name="newsletterEmail" aria-label="Votre email" required />
              <button className="btn light" type="submit" disabled={newsletterSubmitting}>
                {newsletterSubmitting ? "..." : "S'inscrire"}
              </button>
            </form>
            {newsletterStatus ? <p className="form-status" role="status">{newsletterStatus}</p> : null}
          </div>
        </div>
        <p className="footer-bottom">(c) 2026 Hotel Atlas. Tous droits reserves.</p>
      </footer>

      <div
        className={`modal ${modalOpen ? "open" : ""}`}
        id="bookingModal"
        aria-hidden={!modalOpen}
        onClick={(event) => {
          if (event.target.id === "bookingModal") setModalOpen(false);
        }}
      >
        <div
          ref={modalContentRef}
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          <h2 id="booking-modal-title">Reservation confirmee</h2>
          <p>{bookingSummary}</p>
          <button ref={closeModalRef} className="btn primary" type="button" onClick={() => setModalOpen(false)}>
            Fermer
          </button>
        </div>
      </div>
    </>
  );
}


