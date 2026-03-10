"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppButton from "@/components/ui/app-button";
import { useLanguage } from "@/components/LanguageProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import pricingLib from "../../lib/pricing";
import { ROOM_FILTER_OPTIONS } from "../chambres/roomData";
import siteContentLib from "../../lib/siteContent";

const { getSeasonForDate, isWeekendDate, WEEKEND_SURCHARGE, parseLocalDate } = pricingLib;
const { ROOM_OPTIONS } = siteContentLib;

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

export default function AvailabilityForm({ today }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [error, setError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [roomCategories, setRoomCategories] = useState([]);
  const [roomViews, setRoomViews] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [visibleMonth, setVisibleMonth] = useState(() => toMonthISO(today));
  const currentMonth = useMemo(() => toMonthISO(today), [today]);
  const canGoPrevMonth = visibleMonth > currentMonth;
  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const activeFilterCount = roomCategories.length + roomViews.length + amenities.length;
  const isEnglish = language === "EN";
  const requestedRoomRaw = searchParams.get("room") || "";
  const requestedRoom = ROOM_OPTIONS.some((item) => item.value === requestedRoomRaw) ? requestedRoomRaw : "";
  const requestedRoomLabel = ROOM_OPTIONS.find((item) => item.value === requestedRoom)?.label || "";

  useEffect(() => {
    if (!filtersOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setFiltersOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filtersOpen]);

  function toggleSelection(value, setter) {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function selectDate(isoDate) {
    if (!isoDate || isoDate < today) return;
    setError("");

    if (!checkIn || checkOut) {
      setCheckIn(isoDate);
      setCheckOut("");
      return;
    }

    if (isoDate <= checkIn) {
      setCheckIn(isoDate);
      setCheckOut("");
      return;
    }

    setCheckOut(isoDate);
    setCalendarOpen(false);
  }

  function onSubmit(event) {
    event.preventDefault();
    setError("");

    if (!checkIn || !checkOut) {
      setError(isEnglish ? "Please choose an arrival and departure date." : "Merci de choisir une date d'arrivee et de depart.");
      return;
    }
    if (checkOut <= checkIn) {
      setError(isEnglish ? "Departure must be after arrival." : "La date de depart doit etre apres la date d'arrivee.");
      return;
    }

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests,
    });
    if (requestedRoom) params.set("room", requestedRoom);
    if (roomCategories.length) params.set("roomCategory", roomCategories.join(","));
    if (roomViews.length) params.set("roomView", roomViews.join(","));
    if (amenities.length) params.set("amenities", amenities.join(","));
    router.push(`/chambres?${params.toString()}`);
  }

  function getCellState(isoDate) {
    if (!isoDate) return "";
    const classes = [];
    if (isoDate < today) classes.push("is-disabled");
    if (checkIn === isoDate) classes.push("is-checkin");
    if (checkOut === isoDate) classes.push("is-checkout");
    if (checkIn && checkOut && isoDate > checkIn && isoDate < checkOut) classes.push("is-in-range");
    const season = getSeasonForDate(isoDate);
    if (season) classes.push(`season-${season.id}`);
    if (isWeekendDate(isoDate)) classes.push("is-weekend");
    return classes.join(" ");
  }

  function getCellTitle(isoDate) {
    const season = getSeasonForDate(isoDate);
    const weekend = isWeekendDate(isoDate);
    const weekendLabel = weekend ? ` | Week-end +${Math.round(WEEKEND_SURCHARGE * 100)}%` : "";
    return `${isoDate} | ${season?.label || "Saison"}${weekendLabel}`;
  }

  const calendarTriggerLabel = useMemo(() => {
    if (checkIn && checkOut) return `${checkIn} -> ${checkOut}`;
    if (checkIn) return `${checkIn} -> ${isEnglish ? "choose departure" : "choisir depart"}`;
    return isEnglish ? "Choose your dates" : "Choisir vos dates";
  }, [checkIn, checkOut, isEnglish]);

  function clearFilters() {
    setRoomCategories([]);
    setRoomViews([]);
    setAmenities([]);
  }

  return (
    <>
      <form className="availability-form" onSubmit={onSubmit}>
        {requestedRoom ? (
          <div className="reservation-prefill-note">
            {isEnglish
              ? `Selected room: ${requestedRoomLabel}. Enter your dates and we will book it automatically if available.`
              : `Chambre selectionnee : ${requestedRoomLabel}. Renseignez vos dates et nous la selectionnerons automatiquement si elle est disponible.`}
          </div>
        ) : null}
        <div className="field availability-calendar-field">
          <Label htmlFor="availabilityCheckIn" className="availability-calendar-label">
            <span className="availability-calendar-icon" aria-hidden="true">Cal</span>
            {isEnglish ? "Arrival / Departure" : "Arrivee / Depart"}
          </Label>
          <Input type="hidden" id="availabilityCheckIn" name="checkIn" value={checkIn} />
          <Input type="hidden" id="availabilityCheckOut" name="checkOut" value={checkOut} />
          <div className="calendar-toggle-bar">
            <AppButton
              type="button"
              tone="ghost"
              className={`calendar-inline-trigger ${calendarOpen ? "is-open" : ""}`}
              onClick={() => {
                if (!calendarOpen && checkIn) setVisibleMonth(toMonthISO(checkIn));
                setCalendarOpen((prev) => !prev);
              }}
              aria-expanded={calendarOpen}
              aria-controls="availability-calendar-panel"
            >
              <span>{calendarTriggerLabel}</span>
              <span className="calendar-inline-caret" aria-hidden="true">{calendarOpen ? "^" : "v"}</span>
            </AppButton>
          </div>
          {calendarOpen ? (
            <div className="calendar-panel" id="availability-calendar-panel">
              <div className="calendar-toolbar">
                <AppButton
                  type="button"
                  tone="ghost"
                  className="calendar-nav"
                  onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))}
                  disabled={!canGoPrevMonth}
                  aria-label="Mois precedent"
                >
                  <span className="calendar-nav-icon" aria-hidden="true">{"<"}</span>
                </AppButton>
                <p className="calendar-range-label">{monthLabel(visibleMonth)}</p>
                <AppButton
                  type="button"
                  tone="ghost"
                  className="calendar-nav"
                  onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
                aria-label={isEnglish ? "Next month" : "Mois suivant"}
                >
                  <span className="calendar-nav-icon" aria-hidden="true">{">"}</span>
                </AppButton>
              </div>
              <div className="booking-calendar" role="group" aria-label={isEnglish ? "Availability calendar" : "Calendrier de disponibilite"}>
                <div className="calendar-month">
                  <div className="calendar-grid calendar-grid-head" aria-hidden="true">
                    {WEEK_DAY_LABELS.map((label) => (
                      <span key={`${visibleMonth}-${label}`} className="calendar-weekday">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {monthCells.map((cell) =>
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
                          aria-label={isEnglish ? `Choose ${cell.iso}` : `Choisir le ${cell.iso}`}
                          title={getCellTitle(cell.iso)}
                        >
                          <span className="day-number">{cell.day}</span>
                        </AppButton>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <label className="field" htmlFor="availability-guests">
          <Label htmlFor="availability-guests">{isEnglish ? "Guests" : "Voyageurs"}</Label>
          <Input type="hidden" name="guests" value={guests} />
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger id="availability-guests">
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

        <div className="availability-filter-toggle">
          <AppButton
            type="button"
            tone="ghost"
            className="availability-filter-button"
            onClick={() => setFiltersOpen(true)}
          >
            {isEnglish ? `Filter (${activeFilterCount})` : `Filtrer (${activeFilterCount})`}
          </AppButton>
        </div>

        <AppButton tone="primary" type="submit">
          {isEnglish ? "See available rooms" : "Decouvrir les chambres disponibles"} {"->"}
        </AppButton>

        {error ? <p className="form-error availability-error" role="alert">{error}</p> : null}
      </form>

      {filtersOpen ? (
        <div className="availability-filter-modal" role="dialog" aria-modal="true" aria-labelledby="availability-filters-title">
          <button
            type="button"
            className="availability-filter-backdrop"
            aria-label={isEnglish ? "Close filters" : "Fermer les filtres"}
            onClick={() => setFiltersOpen(false)}
          />
          <div className="availability-filter-drawer">
            <div className="availability-filter-header">
              <h2 id="availability-filters-title">{isEnglish ? "Filter results" : "Filtrer les resultats"}</h2>
              <button
                type="button"
                className="availability-filter-close"
                aria-label={isEnglish ? "Close" : "Fermer"}
                onClick={() => setFiltersOpen(false)}
              >
                x
              </button>
            </div>

            <div className="availability-filter-body">
              <section className="availability-filter-section">
                <h3>{isEnglish ? "Room type" : "Type de chambre"}</h3>
                <div className="availability-filter-checklist">
                  {ROOM_FILTER_OPTIONS.categories.filter((option) => option.value !== "all").map((option) => (
                    <label
                      key={option.value}
                      className={`availability-filter-item ${roomCategories.includes(option.value) ? "is-selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="availability-filter-checkbox"
                        checked={roomCategories.includes(option.value)}
                        onChange={() => toggleSelection(option.value, setRoomCategories)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="availability-filter-section">
                <h3>{isEnglish ? "View type" : "Type de vue"}</h3>
                <div className="availability-filter-checklist">
                  {ROOM_FILTER_OPTIONS.views.filter((option) => option.value !== "all").map((option) => (
                    <label
                      key={option.value}
                      className={`availability-filter-item ${roomViews.includes(option.value) ? "is-selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="availability-filter-checkbox"
                        checked={roomViews.includes(option.value)}
                        onChange={() => toggleSelection(option.value, setRoomViews)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="availability-filter-section">
                <h3>{isEnglish ? "Amenities" : "Amenagements"}</h3>
                <div className="availability-filter-checklist">
                  {ROOM_FILTER_OPTIONS.amenities.map((option) => (
                    <label
                      key={option.value}
                      className={`availability-filter-item ${amenities.includes(option.value) ? "is-selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="availability-filter-checkbox"
                        checked={amenities.includes(option.value)}
                        onChange={() => toggleSelection(option.value, setAmenities)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="availability-filter-footer">
              <AppButton type="button" tone="ghost" className="availability-filter-reset" onClick={clearFilters}>
                {isEnglish ? "Clear" : "Effacer"}
              </AppButton>
              <AppButton type="button" tone="primary" className="availability-filter-apply" onClick={() => setFiltersOpen(false)}>
                {isEnglish ? "Apply" : "Appliquer"}
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
