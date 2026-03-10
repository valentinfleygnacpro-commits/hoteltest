"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AppButton from "@/components/ui/app-button";
import HomeIntroOverlay from "@/components/HomeIntroOverlay";
import { useLanguage } from "@/components/LanguageProvider";
import { Accessibility, BedDouble, CalendarDays, Car, Snowflake, Star, Trees, UtensilsCrossed, Wifi, Wine } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import pricingLib from "../lib/pricing";
import siteContentLib from "../lib/siteContent";

const { ROOM_PRICES, addDaysISO, calculateEstimate, calculateNights, getTodayLocalISO } = pricingLib;
const { ADDON_OPTIONS, FAQ_ITEMS, ROOM_OPTIONS, TESTIMONIALS } = siteContentLib;

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

const SCARCITY_LABEL = "Suites Signature disponibles en nombre limite";
const FLEXIBLE_BOOKING_LABEL = "Reservation flexible jusqu'a 48h";

const HOME_HERO_IMAGES = ["/page-daccueil-02.jpg"];
const HERO_ARCHIVE_IMAGES = [
  "/bob.jpg",
  "/bob4.jpg",
  "/page-daccueil-04.jpg",
  "/bob1.jpg",
  "/bob3.jpg",
];
const HERO_ARCHIVE_COUNT = HERO_ARCHIVE_IMAGES.length;

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function ServiceIcon({ type }) {
  const props = { size: 42, strokeWidth: 1.8 };
  if (type === "bar") return <Wine {...props} />;
  if (type === "wifi") return <Wifi {...props} />;
  if (type === "ac") return <Snowflake {...props} />;
  if (type === "pmr") return <Accessibility {...props} />;
  if (type === "parking") return <Car {...props} />;
  return <UtensilsCrossed {...props} />;
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
  const { language } = useLanguage();
  const today = useMemo(() => getTodayLocalISO(), []);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingError, setBookingError] = useState("");
  const [activeFaq, setActiveFaq] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const [bookingSummary, setBookingSummary] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [archiveImageIndex, setArchiveImageIndex] = useState(0);
  const closeModalRef = useRef(null);
  const modalContentRef = useRef(null);
  const bookingSectionRef = useRef(null);
  const heroCheckInRef = useRef(null);
  const heroCheckOutRef = useRef(null);
  const isEnglish = language === "EN";
  const roomShowcaseItems = isEnglish
    ? [
        {
          id: "classic",
          kicker: "Classic room",
          title: "Classic comfort and soft natural light.",
          text: "A peaceful room with premium bedding, refined materials and all essential amenities for a relaxing stay.",
          points: ["20-24 m2", "1-2 guests", "Rain shower"],
          image: "/chambre1.webp",
          featured: false,
        },
        {
          id: "deluxe",
          kicker: "Deluxe room",
          title: "More space, more elegance, same serenity.",
          text: "A generous layout with lounge corner and warm details, ideal for longer stays or elevated weekend escapes.",
          points: ["26-32 m2", "Lounge corner", "Garden or sea view"],
          image: "/chdeluxe1.webp",
          featured: false,
        },
        {
          id: "suite",
          kicker: "Signature suite",
          title: "Sea-facing suite with premium atmosphere.",
          text: "Our most exclusive category, designed for privacy and comfort with a distinctive seaside character.",
          points: ["35-45 m2", "Living area", "Premium amenities"],
          image: "/chsup1.webp",
          featured: true,
        },
      ]
    : [
        {
          id: "classic",
          kicker: "Chambre classique",
          title: "Un confort essentiel dans une ambiance lumineuse.",
          text: "Une chambre apaisante avec literie premium, materiaux soignes et tous les services utiles pour un sejour reposant.",
          points: ["20-24 m2", "1-2 personnes", "Douche a effet pluie"],
          image: "/chambre1.webp",
          featured: false,
        },
        {
          id: "deluxe",
          kicker: "Chambre deluxe",
          title: "Plus d'espace, plus d'elegance, meme serenite.",
          text: "Un format genereux avec coin salon et finitions chaleureuses, ideal pour les longs sejours ou les week-ends haut de gamme.",
          points: ["26-32 m2", "Coin salon", "Vue jardin ou mer"],
          image: "/chdeluxe1.webp",
          featured: false,
        },
        {
          id: "suite",
          kicker: "Suite signature",
          title: "Une suite vue mer au positionnement premium.",
          text: "Notre categorie la plus exclusive, pensee pour l'intimite et le confort avec une atmosphere bord de mer distinguee.",
          points: ["35-45 m2", "Espace salon", "Amenities premium"],
          image: "/chsup1.webp",
          featured: true,
        },
      ];
  const hotelServicesHighlights = isEnglish
    ? [
        { id: "bar", label: "Brasserie cafe bar lounge" },
        { id: "wifi", label: "Free high-speed fiber Wi-Fi" },
        { id: "ac", label: "Air conditioning" },
        { id: "pmr", label: "Accessible PMR" },
        { id: "parking", label: "Private secured parking" },
        { id: "restaurant", label: "Restaurant" },
      ]
    : [
        { id: "bar", label: "Brasserie cafe bar salon de the" },
        { id: "wifi", label: "WiFi gratuit haut debit fibre optique" },
        { id: "ac", label: "Air conditionne" },
        { id: "pmr", label: "Accessible PMR" },
        { id: "parking", label: "Parking payant prive et securise" },
        { id: "restaurant", label: "Restaurant" },
      ];

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
    if (HOME_HERO_IMAGES.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % HOME_HERO_IMAGES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (HERO_ARCHIVE_COUNT <= 1) return undefined;
    const timer = window.setInterval(() => {
      setArchiveImageIndex((prev) => (prev >= HERO_ARCHIVE_COUNT - 1 ? 0 : prev + 1));
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setArchiveImageIndex((prev) => ((prev % HERO_ARCHIVE_COUNT) + HERO_ARCHIVE_COUNT) % HERO_ARCHIVE_COUNT);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(document.querySelectorAll("[data-scroll-reveal]"));
    if (!elements.length) return undefined;

    if (reduceMotion) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -18% 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
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
        const url = `/api/availability?checkIn=${encodeURIComponent(form.checkIn)}&checkOut=${encodeURIComponent(form.checkOut)}`;
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

  function openNativeDatePicker(input) {
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {}
    }
  }

  function handleHeroAvailabilitySubmit(event) {
    event.preventDefault();
    setBookingError("");

    if (!form.checkIn || !form.checkOut) {
      setBookingError("Choisis une date d'arrivee et de depart.");
      return;
    }
    if (calculateNights(form.checkIn, form.checkOut) <= 0) {
      setBookingError("Les dates selectionnees sont invalides.");
      return;
    }

    const params = new URLSearchParams({
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: String(form.guests || 2),
    });
    window.location.href = `/chambres?${params.toString()}`;
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
      setNewsletterStatus(isEnglish ? "Subscription confirmed. Thank you." : "Inscription confirmee. Merci.");
      event.currentTarget.reset();
      trackEvent("newsletter_submit", "success");
    } catch {
      setNewsletterStatus(isEnglish ? "Subscription failed. Please try again." : "Echec de l'inscription. Merci de reessayer.");
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
      <HomeIntroOverlay />
      <a className="skip-link" href="/disponibilites">{isEnglish ? "Go to booking" : "Aller a la reservation"}</a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

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
              <p>{isEnglish ? "Hotel & Spa" : "Hotel & Spa"}</p>
              <h2>HOTEL ATLAS</h2>
            </div>
            <div className="hero-message-overlay" data-scroll-reveal>
              <p>{isEnglish ? "A HIDDEN ADDRESS BETWEEN SEA AND NATURE" : "UNE ADRESSE CONFIDENTIELLE ENTRE MER ET NATURE"}</p>
              <div className="hero-message-title">
                {isEnglish ? "Your oceanfront retreat on Ile de Re." : "Votre refuge face a l'ocean sur l'ile de Re."}
              </div>
              <div className="hero-message-subtitle">
                {isEnglish ? "Bright suites, mineral spa, local cuisine and 24/7 service." : "Suites lumineuses, spa mineral, gastronomie locale et service 24/7."}
              </div>
              <form className="hero-booking-bar" onSubmit={handleHeroAvailabilitySubmit}>
                <label className="hero-booking-field">
                  <span>{isEnglish ? "Arrival" : "Arrivee"}</span>
                  <Input
                    ref={heroCheckInRef}
                    type="date"
                    name="heroCheckIn"
                    min={today}
                    value={form.checkIn}
                    onChange={(event) => updateField("checkIn", event.target.value)}
                    onClick={() => openNativeDatePicker(heroCheckInRef.current)}
                    onFocus={() => openNativeDatePicker(heroCheckInRef.current)}
                    required
                  />
                </label>
                <label className="hero-booking-field">
                  <span>{isEnglish ? "Departure" : "Depart"}</span>
                  <Input
                    ref={heroCheckOutRef}
                    type="date"
                    name="heroCheckOut"
                    min={checkOutMin}
                    value={form.checkOut}
                    onChange={(event) => updateField("checkOut", event.target.value)}
                    onClick={() => openNativeDatePicker(heroCheckOutRef.current)}
                    onFocus={() => openNativeDatePicker(heroCheckOutRef.current)}
                    required
                  />
                </label>
                <label className="hero-booking-field hero-booking-guests">
                  <span>{isEnglish ? "Guests" : "Voyageurs"}</span>
                  <Select value={String(form.guests)} onValueChange={(value) => updateField("guests", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={isEnglish ? "Guests" : "Voyageurs"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{isEnglish ? "1 guest" : "1 personne"}</SelectItem>
                      <SelectItem value="2">{isEnglish ? "2 guests" : "2 personnes"}</SelectItem>
                      <SelectItem value="3">{isEnglish ? "3 guests" : "3 personnes"}</SelectItem>
                      <SelectItem value="4">{isEnglish ? "4 guests" : "4 personnes"}</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <AppButton tone="primary" type="submit" className="hero-booking-submit">
                  {isEnglish ? "View availability" : "Voir les disponibilites"}
                </AppButton>
              </form>
            </div>
            {HOME_HERO_IMAGES.length > 1 ? (
              <>
                <AppButton className="hero-carousel-btn prev" type="button" aria-label="Image precedente" onClick={showPrevHeroImage}>
                  ‹
                </AppButton>
                <AppButton className="hero-carousel-btn next" type="button" aria-label="Image suivante" onClick={showNextHeroImage}>
                  ›
                </AppButton>
              </>
            ) : null}
          </div>
        </section>

        <section className="hero-archive section-top">
          <div className="container hero-archive-grid">
            <aside className="hero-archive-copy" data-scroll-reveal>
              <p className="hero-archive-kicker">{isEnglish ? "4-star seaside hotel" : "Hotel 4 etoiles en bord de mer"}</p>
              <h2>{isEnglish ? "A calm address by the ocean." : "Une adresse de caractere au bord de l'ocean."}</h2>
              <p className="hero-archive-description">
                {isEnglish
                  ? "Bright rooms, premium bedding and discreet service for stays focused on comfort."
                  : "Des chambres lumineuses, une literie premium et un service discret pour un sejour axe sur le confort."}
              </p>
              <p className="hero-archive-description">
                {isEnglish
                  ? "From sea-view suites to quiet cocoon rooms, each space is designed for rest, privacy and a smooth hotel experience."
                  : "Des suites vue mer aux chambres cocon, chaque espace est pense pour le repos, l'intimite et une experience hoteliere fluide."}
              </p>
              <p className="hero-archive-description">
                {isEnglish
                  ? "Natural materials, generous light and tailored hospitality create a warm atmosphere from arrival to checkout."
                  : "Materiaux naturels, lumiere genereuse et accueil sur mesure creent une atmosphere chaleureuse de l'arrivee au depart."}
              </p>
            </aside>
            <div className="hero-archive-gallery" aria-label={isEnglish ? "Hotel photo gallery" : "Galerie photos hotel"}>
              <div
                className="hero-archive-track"
                style={{ transform: `translateX(-${archiveImageIndex * 100}%)` }}
              >
                {HERO_ARCHIVE_IMAGES.map((src, index) => (
                  <figure key={src} className="hero-archive-item">
                    <Image
                      src={src}
                      alt={`${isEnglish ? "Hotel Atlas photo" : "Photo Hotel Atlas"} ${index + 1}`}
                      width={900}
                      height={620}
                      sizes="(max-width: 900px) 100vw, 50vw"
                    />
                  </figure>
                ))}
              </div>
              {HERO_ARCHIVE_IMAGES.length > 1 ? (
                <div className="hero-archive-dots" role="tablist" aria-label={isEnglish ? "Image pagination" : "Pagination des images"}>
                  {HERO_ARCHIVE_IMAGES.map((_, index) => (
                    <button
                      key={`hero-archive-dot-${index}`}
                      type="button"
                      className={`hero-archive-dot ${archiveImageIndex === index ? "is-active" : ""}`}
                      aria-label={`${isEnglish ? "Go to image" : "Aller a l'image"} ${index + 1}`}
                      aria-selected={archiveImageIndex === index}
                      onClick={() => setArchiveImageIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rooms-showcase section-top">
          <div className="container rooms-showcase-head" data-scroll-reveal>
            <p className="rooms-showcase-kicker">{isEnglish ? "Room categories" : "Nos categories de chambres"}</p>
            <h2>{isEnglish ? "Three atmospheres, one level of comfort." : "Trois atmospheres, un meme niveau de confort."}</h2>
          </div>
          <div className="container rooms-showcase-list">
            {roomShowcaseItems.map((room, index) => (
              <article key={room.id} className={`room-showcase-card ${index % 2 === 1 ? "is-reverse" : ""} ${room.featured ? "is-featured" : ""}`}>
                <aside className="room-showcase-copy" data-scroll-reveal>
                  {room.featured ? (
                    <span className="room-showcase-badge">{isEnglish ? "Signature Suite" : "Suite Signature"}</span>
                  ) : null}
                  <p className="room-showcase-kicker">{room.kicker}</p>
                  <h3>{room.title}</h3>
                  <p className="room-showcase-description">{room.text}</p>
                  <ul className="room-showcase-points">
                    {room.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <AppButton asChild tone="ghost" className="room-showcase-cta">
                    <Link href={`/disponibilites?room=${room.id}`}>{isEnglish ? "View room" : "Voir la chambre"}</Link>
                  </AppButton>
                </aside>
                <div className="room-showcase-media">
                  <Image
                    src={room.image}
                    alt={room.title}
                    width={1200}
                    height={760}
                    sizes="(max-width: 900px) 100vw, 60vw"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hotel-services section-top">
          <div className="container hotel-services-showcase">
            <div className="hotel-services-photo">
              <Image
                src="/restaurant-terrasse.jpg"
                alt={isEnglish ? "Restaurant terrace facing the sea" : "Terrasse du restaurant face a la mer"}
                width={1360}
                height={907}
                sizes="(max-width: 900px) 100vw, 56vw"
              />
            </div>
            <div className="hotel-services-panel" data-scroll-reveal>
              <p className="hotel-services-panel-kicker">{isEnglish ? "Hotel services" : "Services de l'hotel"}</p>
              <h2>{isEnglish ? "Amenities" : "Equipements"}</h2>
              <div className="hotel-services-highlights">
                {hotelServicesHighlights.map((item) => (
                  <article key={item.id} className="hotel-service-highlight-card">
                    <ServiceIcon type={item.id} />
                    <h3>{item.label}</h3>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-top">
          <div className="container location-grid">
            <aside className="hero-copy" data-scroll-reveal>
              <p className="eyebrow">{isEnglish ? "A HIDDEN ADDRESS BETWEEN SEA AND NATURE" : "UNE ADRESSE CONFIDENTIELLE ENTRE MER ET NATURE"}</p>
              <h1 className="location-title">{isEnglish ? "A refined retreat between sea and nature." : "Un refuge de caractere entre mer et nature."}</h1>
              <p className="hero-lead location-description">{isEnglish ? "Bright suites, mineral spa and discreet service just steps from the beach." : "Suites lumineuses, spa mineral et service discret a quelques pas de la plage."}</p>
              <div className="hero-stats">
                <div className="hero-stat-item">
                  <span className="hero-stat-icon" aria-hidden="true"><Star size={16} strokeWidth={2.2} /></span>
                  <strong>4.9/5</strong>
                  <span>{isEnglish ? "Verified guest rating" : "Note clients verifiee"}</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-icon" aria-hidden="true"><BedDouble size={16} strokeWidth={2.2} /></span>
                  <strong>38</strong>
                  <span>{isEnglish ? "Rooms and suites" : "Suites et chambres"}</span>
                </div>
                <div className="hero-stat-item beach-stat">
                  <span className="hero-stat-icon" aria-hidden="true"><Trees size={16} strokeWidth={2.2} /></span>
                  <strong>2 min</strong>
                  <span>{isEnglish ? "From the beach" : "De la plage"}</span>
                </div>
              </div>
            </aside>
            <div className="hero-card hero-map-card" id="home-map" data-scroll-reveal>
              <p className="hero-map-kicker">{isEnglish ? "Quick access" : "Acces rapide"}</p>
              <h2>Hotel Atlas - Ile de Re</h2>
              <p className="hero-map-lead">{isEnglish ? "Just 2 minutes from the beach and a few minutes from Saint-Martin-de-Re." : "A 2 min de la plage et a quelques minutes de Saint-Martin-de-Re."}</p>
              <div className="hero-map-visual" aria-hidden="true">
                <iframe
                  className="hero-map-frame"
                  title="Carte Hotel Atlas"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=12+Avenue+des+Dunes%2C+17340+Ile+de+Re%2C+France&z=14&output=embed"
                />
              </div>
              <AppButton asChild tone="light">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=12+Avenue+des+Dunes%2C+17340+Ile+de+Re%2C+France"
                  target="_blank"
                  rel="noreferrer"
                  data-track="hero-map-itineraire"
                >
                  {isEnglish ? "Get directions" : "Decouvrir l'itineraire"}
                </a>
              </AppButton>
            </div>
          </div>
        </section>

        <section id="booking" className="booking" ref={bookingSectionRef}>
          <div className="container">
            <div className="section-head" data-scroll-reveal>
              <h2>{isEnglish ? "Book your stay" : "Reserver votre sejour"}</h2>
              <p>{isEnglish ? "Real-time availability, instant confirmation." : "Disponibilites en temps reel, confirmation immediate."}</p>
            </div>
            <div className="stepper" role="list" aria-label="Etapes de reservation">
              {BOOKING_STEPS.map((step, index) => (
                <div key={step.id} className={`step-item ${bookingStep >= step.id ? "active" : ""}`} role="listitem">
                  <span>{step.id}</span>
                  <small>{isEnglish ? ["Dates", "Room", "Options"][index] : step.label}</small>
                </div>
              ))}
            </div>
            <form id="bookingForm" className="booking-form" onSubmit={handleBookingSubmit}>
              {bookingStep === 1 ? (
                <>
                  <Input type="text" name="website" className="hp-field" tabIndex="-1" autoComplete="off" />
                  <div className="field">
                    <Label htmlFor="checkIn">Arrivee</Label>
                    <Input
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
                    <Label htmlFor="checkOut">Depart</Label>
                    <Input
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
                    <Label htmlFor="roomType">Type de chambre</Label>
                    <Input type="hidden" name="roomType" value={form.roomType} />
                    <Select value={form.roomType} onValueChange={(value) => updateField("roomType", value)} required>
                      <SelectTrigger id="roomType">
                        <SelectValue placeholder="Selectionnez une chambre" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value || "empty"}
                            value={option.value || "_empty"}
                            disabled={!option.value || (availability ? (availability[option.value] || 0) <= 0 : false)}
                          >
                            {option.label}
                            {option.value && availability ? ` (${availability[option.value]} dispo)` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availabilityLoading ? <small>Verification des disponibilites...</small> : null}
                  </div>
                  <div className="field">
                    <Label htmlFor="guests">Voyageurs</Label>
                    <Input
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
                    <Label htmlFor="fullName">Nom complet</Label>
                    <Input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <Label htmlFor="bookingEmail">Email</Label>
                    <Input
                      type="email"
                      id="bookingEmail"
                      name="bookingEmail"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <Label htmlFor="phone">Telephone (optionnel)</Label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <Label htmlFor="promo">Code promo</Label>
                    <Input
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
                          <Checkbox
                            checked={form.addons.includes(option.value)}
                            onCheckedChange={() => toggleAddon(option.value)}
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
                  <Label htmlFor="totalPrice">{isEnglish ? "Estimated total" : "Total estime"}</Label>
                  <div className="price" id="totalPrice" aria-live="polite">{totalPriceLabel}</div>
                  <small>{isEnglish ? "Taxes included. Adjusted to your dates." : "Taxes incluses. Ajuste selon vos dates."}</small>
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
                  <AppButton tone="ghost" type="button" onClick={prevStep}>
                    {isEnglish ? "Back" : "Retour"}
                  </AppButton>
                ) : null}
                {bookingStep < 3 ? (
                  <AppButton tone="primary" type="button" onClick={nextStep}>
                    {isEnglish ? "Continue" : "Continuer"}
                  </AppButton>
                ) : (
                  <AppButton tone="primary" type="submit" disabled={!estimate?.valid || bookingSubmitting}>
                    {bookingSubmitting ? (isEnglish ? "Redirecting to payment..." : "Redirection paiement...") : (isEnglish ? "Confirm and pay" : "Confirmer et payer")}
                  </AppButton>
                )}
              </div>
            </form>

            {hasSelectedRoom ? (
              <>
                <div className="booking-sticky">
                  <span>Total: {totalPriceLabel}</span>
                  <AppButton asChild tone="primary">
                    <a href="#bookingForm" data-track="mobile-finaliser">Finaliser</a>
                  </AppButton>
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
            <div className="section-head" data-scroll-reveal>
              <h2>{isEnglish ? "Rooms and suites" : "Chambres et suites"}</h2>
              <p>{isEnglish ? "Natural light, noble textures, absolute calm." : "Lumiere naturelle, textures nobles, silence absolu."}</p>
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
                    <AppButton
                      tone="ghost"
                      type="button"
                      onClick={() => handleRoomQuickSelect(room.value)}
                      disabled={availability ? (availability[room.value] || 0) <= 0 : false}
                    >
                      {isEnglish ? "Book" : "Reserver"}
                    </AppButton>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="testimonials">
          <div className="container">
            <div className="section-head" data-scroll-reveal>
              <h2>{isEnglish ? "Guest reviews" : "Ils en parlent"}</h2>
              <p>{isEnglish ? "Experiences published on verified platforms." : "Experiences vecues et publiees sur des plateformes verifiees."}</p>
            </div>
            <div className="reviews-spotlight" aria-label="Mise en avant des avis" data-scroll-reveal>
              <div className="reviews-score">
                <span className="reviews-stars" aria-hidden="true">★★★★★</span>
                <strong>4.9/5</strong>
                <p>{isEnglish ? "An exceptional guest score that supports direct booking." : "Une note client exceptionnelle qui soutient la reservation directe."}</p>
              </div>
              <div className="reviews-copy">
                <p>{isEnglish ? "Verified reviews, premium stay, consistent service and strong suite demand." : "Avis verifies, sejour premium, service tres regulier et forte demande sur les suites."}</p>
                <div className="reviews-platforms" aria-label={isEnglish ? "Review platforms" : "Plateformes d'avis"}>
                  <span>{isEnglish ? "★★★★★ Google Review" : "★★★★★ Google Review"}</span>
                  <span>{isEnglish ? "★★★★½ Booking Guest Score" : "★★★★½ Booking Guest Score"}</span>
                </div>
                <div className="reviews-tags">
                  <span>{SCARCITY_LABEL}</span>
                  <span>{isEnglish ? "Flexible booking up to 48h" : FLEXIBLE_BOOKING_LABEL}</span>
                </div>
              </div>
              <AppButton asChild tone="primary" className="reviews-cta">
                <Link href="/disponibilites" data-track="reviews-reserver">
                  <CalendarDays size={18} strokeWidth={2} aria-hidden="true" />
                  {isEnglish ? "View availability" : "Voir les disponibilites"}
                </Link>
              </AppButton>
            </div>
            <div className="testimonial-grid" data-scroll-reveal>
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
            <div className="section-head" data-scroll-reveal>
              <h2>{isEnglish ? "Frequently asked questions" : "Questions frequentes"}</h2>
              <p>{isEnglish ? "Everything you need to know before arriving." : "Tout ce qu'il faut savoir avant d'arriver."}</p>
            </div>
            <div className="faq-list" data-scroll-reveal>
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = activeFaq === index;
                const buttonId = `faq-button-${index}`;
                const panelId = `faq-panel-${index}`;
                return (
                  <div key={item.question}>
                    <AppButton
                      id={buttonId}
                      tone="ghost"
                      className="faq-item"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setActiveFaq((prev) => (prev === index ? -1 : index))}
                    >
                      <span>{item.question}</span>
                      <span className="faq-icon">{isOpen ? "-" : "+"}</span>
                    </AppButton>
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

      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h3>Hotel Atlas</h3>
            <p>{isEnglish ? "A refined retreat between sea and nature." : "Un refuge de caractere entre mer et nature."}</p>
          </div>
          <div>
            <h3>{isEnglish ? "Information" : "Informations"}</h3>
            <ul>
              <li><Link href="/disponibilites">{isEnglish ? "Rooms" : "Chambres"}</Link></li>
              <li><Link href="/spa">Spa</Link></li>
              <li><Link href="/restaurant">Restaurant</Link></li>
              <li><Link href="/contact">{isEnglish ? "Contact" : "Contact"}</Link></li>
              <li><Link href="/mentions-legales">{isEnglish ? "Legal notice" : "Mentions legales"}</Link></li>
              <li><Link href="/politique-confidentialite">{isEnglish ? "Privacy" : "Confidentialite"}</Link></li>
            </ul>
            <ul className="footer-secondary-links">
              <li><Link href="/conditions-generales">{isEnglish ? "Terms and conditions" : "Conditions generales"}</Link></li>
              <li><Link href="/hotel-spa-ile-de-re">{isEnglish ? "Spa hotel Ile de Re" : "Hotel spa Ile de Re"}</Link></li>
              <li><Link href="/hotel-bord-de-mer-ile-de-re">{isEnglish ? "Seaside hotel Ile de Re" : "Hotel bord de mer Ile de Re"}</Link></li>
              <li><Link href="/admin">Admin</Link></li>
            </ul>
          </div>
          <div>
            <h3>{isEnglish ? "Newsletter" : "Newsletter"}</h3>
            <p>{isEnglish ? "Receive our private offers and travel inspiration." : "Recevez nos offres privees et inspirations voyage."}</p>
            <p className="newsletter-note">{isEnglish ? "No spam. Only our private offers." : "Pas de spam. Seulement nos offres privees."}</p>
            <form className="newsletter" onSubmit={handleNewsletterSubmit}>
              <Input type="text" name="website" className="hp-field" tabIndex="-1" autoComplete="off" />
              <Input type="email" placeholder={isEnglish ? "Your email" : "Votre email"} name="newsletterEmail" aria-label={isEnglish ? "Your email" : "Votre email"} required />
              <AppButton tone="light" type="submit" className="newsletter-submit" disabled={newsletterSubmitting}>
                {newsletterSubmitting ? "..." : (isEnglish ? "Sign up" : "S'inscrire")}
              </AppButton>
            </form>
            {newsletterStatus ? <p className="form-status" role="status">{newsletterStatus}</p> : null}
          </div>
        </div>
        <p className="footer-bottom">{isEnglish ? "(c) 2026 Hotel Atlas. All rights reserved." : "(c) 2026 Hotel Atlas. Tous droits reserves."}</p>
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
          <h2 id="booking-modal-title">{isEnglish ? "Booking confirmed" : "Reservation confirmee"}</h2>
          <p>{bookingSummary}</p>
          <AppButton ref={closeModalRef} tone="primary" type="button" onClick={() => setModalOpen(false)}>
            {isEnglish ? "Close" : "Fermer"}
          </AppButton>
        </div>
      </div>
    </>
  );
}


