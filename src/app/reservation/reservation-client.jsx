"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppButton from "@/components/ui/app-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import pricingLib from "../../lib/pricing";
import siteContentLib from "../../lib/siteContent";

const {
  ROOM_PRICES,
  calculateEstimate,
  calculateNights,
  getNightlyRate,
  getSeasonForDate,
  getTodayLocalISO,
  isWeekendDate,
  parseLocalDate,
} = pricingLib;
const { ADDON_OPTIONS, ROOM_OPTIONS } = siteContentLib;

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

function sanitizeGuests(value) {
  return Math.max(1, Math.min(4, Number.parseInt(value || "2", 10) || 2));
}

function normalizeQueryDate(value) {
  if (!value) return "";
  const parsed = parseLocalDate(value);
  if (!parsed) return "";
  return value;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

const WEEK_DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthISO(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(monthIso, delta) {
  const [year, month] = monthIso.split("-").map(Number);
  if (!year || !month) return monthIso;
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthIso) {
  const [year, month] = monthIso.split("-").map(Number);
  if (!year || !month) return "";
  return MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

function buildMonthCells(monthIso) {
  const [year, month] = monthIso.split("-").map(Number);
  if (!year || !month) return [];
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlank = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < leadingBlank; i += 1) {
    cells.push({ key: `empty-${monthIso}-${i}`, empty: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const iso = toISODate(date);
    cells.push({
      key: iso,
      empty: false,
      iso,
      day,
    });
  }

  return cells;
}

function shouldSuggestNextMonth(isoDate) {
  const date = parseLocalDate(isoDate);
  if (!date) return false;
  const day = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return day >= daysInMonth - 4;
}

export default function ReservationClient() {
  const searchParams = useSearchParams();
  const roomFromQueryRaw = searchParams.get("room") || "";
  const roomFromQuery = ROOM_OPTIONS.some((item) => item.value === roomFromQueryRaw) ? roomFromQueryRaw : "";
  const checkInFromQuery = normalizeQueryDate(searchParams.get("checkIn") || "");
  const checkOutFromQueryRaw = normalizeQueryDate(searchParams.get("checkOut") || "");
  const checkOutFromQuery = checkInFromQuery && checkOutFromQueryRaw > checkInFromQuery ? checkOutFromQueryRaw : "";
  const guestsFromQuery = sanitizeGuests(searchParams.get("guests") || "2");
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    roomType: roomFromQuery,
    checkIn: checkInFromQuery,
    checkOut: checkOutFromQuery,
    guests: guestsFromQuery,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("");
  const today = useMemo(() => getTodayLocalISO(), []);
  const currentMonth = useMemo(() => toMonthISO(today), [today]);
  const [visibleMonth, setVisibleMonth] = useState(() => toMonthISO(getTodayLocalISO()));
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!roomFromQuery && !checkInFromQuery && !checkOutFromQuery && !guestsFromQuery) return;

    setForm((prev) => {
      const next = { ...prev };
      let changed = false;

      if (roomFromQuery && !prev.roomType) {
        next.roomType = roomFromQuery;
        changed = true;
      }
      if (checkInFromQuery && !prev.checkIn) {
        next.checkIn = checkInFromQuery;
        changed = true;
      }
      if (checkOutFromQuery && !prev.checkOut) {
        next.checkOut = checkOutFromQuery;
        changed = true;
      }
      if (guestsFromQuery && (!prev.guests || prev.guests === DEFAULT_FORM.guests)) {
        next.guests = guestsFromQuery;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [roomFromQuery, checkInFromQuery, checkOutFromQuery, guestsFromQuery]);

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

  useEffect(() => {
    if (!form.checkIn || !form.checkOut || calculateNights(form.checkIn, form.checkOut) <= 0) {
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
        } else if (!ignore) {
          setAvailability(null);
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
  }, [form.checkIn, form.checkOut]);

  const totalPriceLabel = estimate?.valid ? formatCurrency(estimate.total || 0) : "-";
  const selectedRoom = ROOM_OPTIONS.find((item) => item.value === form.roomType);
  const selectedAddons = ADDON_OPTIONS.filter((item) => form.addons.includes(item.value)).map((item) => item.label);
  const prefilledFromList = Boolean(roomFromQuery || checkInFromQuery || checkOutFromQuery || searchParams.get("guests"));
  const canGoPrevMonth = visibleMonth > currentMonth;
  const firstMonthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);

  function updateField(field, value) {
    setError("");
    setFallbackMessage("");
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

  function selectDate(isoDate) {
    if (!isoDate || isoDate < today) return;
    setError("");
    setFallbackMessage("");
    let selectedAsCheckIn = false;
    let selectedAsCheckOut = false;
    setForm((prev) => {
      if (!prev.checkIn || prev.checkOut) {
        selectedAsCheckIn = true;
        return { ...prev, checkIn: isoDate, checkOut: "" };
      }
      if (isoDate <= prev.checkIn) {
        selectedAsCheckIn = true;
        return { ...prev, checkIn: isoDate, checkOut: "" };
      }
      selectedAsCheckOut = true;
      return { ...prev, checkOut: isoDate };
    });
    if (selectedAsCheckIn && shouldSuggestNextMonth(isoDate)) {
      setVisibleMonth(addMonths(toMonthISO(isoDate), 1));
    }
    if (selectedAsCheckOut) {
      setCalendarOpen(false);
    }
  }

  function openCalendar() {
    if (form.checkIn) {
      setVisibleMonth(toMonthISO(form.checkIn));
    }
    setCalendarOpen(true);
  }

  const calendarTriggerLabel = useMemo(() => {
    if (form.checkIn && form.checkOut) return `${form.checkIn} -> ${form.checkOut}`;
    if (form.checkIn) return `${form.checkIn} -> choisir depart`;
    return "Choisir vos dates";
  }, [form.checkIn, form.checkOut]);

  function getCellState(isoDate) {
    if (!isoDate) return "";
    const classes = [];
    if (isoDate < today) classes.push("is-disabled");
    if (isoDate === today) classes.push("is-today");
    if (form.checkIn === isoDate) classes.push("is-checkin");
    if (form.checkOut === isoDate) classes.push("is-checkout");
    if (form.checkIn && form.checkOut && isoDate > form.checkIn && isoDate < form.checkOut) classes.push("is-in-range");
    const season = getSeasonForDate(isoDate);
    if (season) classes.push(`season-${season.id}`);
    if (isWeekendDate(isoDate)) classes.push("is-weekend");
    return classes.join(" ");
  }

  function getCellTitle(isoDate) {
    const season = getSeasonForDate(isoDate);
    const weekendLabel = isWeekendDate(isoDate) ? " - week-end" : "";
    const priceLabel = form.roomType ? ` - ${formatCurrency(getNightlyRate(isoDate, form.roomType))}/nuit` : "";
    return `${isoDate} - ${season?.label || "Saison"}${weekendLabel}${priceLabel}`;
  }

  function renderCalendarMonth(monthIso, cells) {
    return (
      <div className="calendar-month" key={monthIso}>
        <p className="calendar-month-title">{monthLabel(monthIso)}</p>
        <div className="calendar-grid calendar-grid-head" aria-hidden="true">
          {WEEK_DAY_LABELS.map((label) => (
            <span key={`${monthIso}-${label}`} className="calendar-weekday">
              {label}
            </span>
          ))}
        </div>
        <div className="calendar-grid">
          {cells.map((cell) =>
            cell.empty ? (
              <span key={cell.key} className="calendar-empty" />
            ) : (
              <AppButton
                key={cell.key}
                type="button"
                tone="ghost"
                className={`calendar-day ${getCellState(cell.iso)}`}
                disabled={cell.iso < today}
                onClick={() => selectDate(cell.iso)}
                aria-label={`Choisir le ${cell.iso}`}
                title={getCellTitle(cell.iso)}
              >
                {isWeekendDate(cell.iso) ? <span className="weekend-marker" aria-hidden="true" /> : null}
                <span className="day-number">{cell.day}</span>
              </AppButton>
            )
          )}
        </div>
      </div>
    );
  }

  function validateForm() {
    if (!form.checkIn || !form.checkOut) return "Choisissez vos dates d'arrivee et de depart.";
    if (calculateNights(form.checkIn, form.checkOut) <= 0) return "Les dates selectionnees sont invalides.";
    if (!form.roomType || !ROOM_PRICES[form.roomType]) return "Selectionnez une chambre.";
    if (!form.guests || Number(form.guests) < 1) return "Le nombre de voyageurs est invalide.";
    if (!estimate?.valid) return "Le panier n'est pas valide.";
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || "");
    if (!form.fullName.trim() || !validEmail) return "Renseignez votre nom complet et un email valide.";
    return "";
  }

  async function onSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setFallbackMessage("");

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

      const checkoutResponse = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: payload.bookingId }),
      });
      const checkoutPayload = await checkoutResponse.json();
      if (checkoutResponse.ok && checkoutPayload.ok && checkoutPayload.url) {
        window.location.href = checkoutPayload.url;
        return;
      }
      if (checkoutPayload?.error === "stripe_invalid_key") {
        setError("Configuration Stripe invalide: utilisez une cle secrete STRIPE (sk_test_...).");
      } else if (checkoutPayload?.error === "stripe_not_configured") {
        setError("Paiement Stripe non configure. Ajoutez STRIPE_SECRET_KEY dans .env.local.");
      } else {
        setFallbackMessage("Reservation enregistree, mais le paiement en ligne est indisponible pour le moment.");
      }
    } catch (submitError) {
      if (submitError.message === "room_unavailable") {
        setError("Cette chambre n'est plus disponible sur ces dates.");
      } else {
        setError("Impossible de confirmer pour le moment. Merci de reessayer.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section-top">
      {prefilledFromList ? (
        <div className="reservation-prefill-note">
          Votre selection a ete pre-remplie. Verifiez le recapitulatif puis confirmez votre reservation.
        </div>
      ) : null}
      <form className="booking-form" onSubmit={onSubmit}>
        <Input type="text" name="website" className="hp-field" tabIndex="-1" autoComplete="off" />
        <div className="field calendar-field">
          <Label htmlFor="checkIn">Arrivee / Depart</Label>
          <Input type="hidden" id="checkIn" name="checkIn" value={form.checkIn} />
          <Input type="hidden" id="checkOut" name="checkOut" value={form.checkOut} />
          <div className="calendar-toggle-bar">
            <AppButton
              type="button"
              tone="ghost"
              className={`calendar-inline-trigger ${calendarOpen ? "is-open" : ""}`}
              onClick={() => {
                if (calendarOpen) {
                  setCalendarOpen(false);
                } else {
                  openCalendar();
                }
              }}
              aria-expanded={calendarOpen}
              aria-controls="booking-calendar-panel"
            >
              <span>{calendarTriggerLabel}</span>
              <span className="calendar-inline-caret" aria-hidden="true">{calendarOpen ? "^" : "v"}</span>
            </AppButton>
          </div>
          {calendarOpen ? (
            <div className="calendar-panel" id="booking-calendar-panel">
              <div className="calendar-toolbar">
                <AppButton
                  type="button"
                  tone="ghost"
                  className="calendar-nav"
                  onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))}
                  disabled={!canGoPrevMonth}
                  aria-label="Mois precedent"
                >
                  {"<"}
                </AppButton>
                <p className="calendar-range-label">
                  {monthLabel(visibleMonth)}
                </p>
                <AppButton
                  type="button"
                  tone="ghost"
                  className="calendar-nav"
                  onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
                  aria-label="Mois suivant"
                >
                  {">"}
                </AppButton>
              </div>
              <div className="booking-calendar" role="group" aria-label="Calendrier de reservation">
                {renderCalendarMonth(visibleMonth, firstMonthCells)}
              </div>
            </div>
          ) : null}
          <div className="selected-dates">
            <small>
              Arrivee: <strong>{form.checkIn || "-"}</strong>
            </small>
            <small>
              Depart: <strong>{form.checkOut || "-"}</strong>
            </small>
          </div>
          {!form.checkOut && form.checkIn ? <small>Selectionnez maintenant votre date de depart.</small> : null}
        </div>
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
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            name="email"
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
          <Label htmlFor="promo">Code promo (optionnel)</Label>
          <Input
            type="text"
            id="promo"
            name="promo"
            placeholder="ATLAS24"
            value={form.promo}
            onChange={(e) => updateField("promo", e.target.value)}
          />
        </div>
        <fieldset className="field summary">
          <legend>Options</legend>
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

        <div className="field summary">
          <Label htmlFor="reservationTotal">Total estime</Label>
          <div className="price" id="reservationTotal">{totalPriceLabel}</div>
          <small>Taxes incluses. Ajuste selon vos dates.</small>
          {estimate?.valid ? (
            <div className="price-breakdown">
              <span>{estimate.nights} nuit(s)</span>
              <span>Sous-total: {formatCurrency(estimate.subtotal)}</span>
              {estimate.discount > 0 ? <span>Reduction: -{formatCurrency(estimate.discount)}</span> : null}
            </div>
          ) : null}
        </div>
        <div className="field summary">
          <Label>Recapitulatif</Label>
          <div className="reservation-recap">
            <p><strong>Chambre:</strong> {selectedRoom ? selectedRoom.label.split(" - ")[0] : "-"}</p>
            <p><strong>Sejour:</strong> {form.checkIn || "-"} au {form.checkOut || "-"}</p>
            <p><strong>Voyageurs:</strong> {form.guests || "-"}</p>
            <p><strong>Options:</strong> {selectedAddons.length ? selectedAddons.join(", ") : "Aucune"}</p>
            <p><strong>Total estime:</strong> {totalPriceLabel}</p>
          </div>
        </div>

        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {fallbackMessage ? <p className="form-status" role="status">{fallbackMessage}</p> : null}

        <div className="booking-actions">
          <AppButton asChild tone="ghost">
            <Link href="/disponibilites">Modifier les dates</Link>
          </AppButton>
          <AppButton tone="primary" type="submit" disabled={!estimate?.valid || submitting}>
            {submitting ? "Redirection paiement..." : "Confirmer et payer"}
          </AppButton>
        </div>
      </form>
    </section>
  );
}
