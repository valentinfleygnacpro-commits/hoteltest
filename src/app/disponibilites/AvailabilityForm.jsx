"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import pricingLib from "../../lib/pricing";

const { getSeasonForDate, isWeekendDate, WEEKEND_SURCHARGE, parseLocalDate } = pricingLib;

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
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [error, setError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => toMonthISO(today));
  const currentMonth = useMemo(() => toMonthISO(today), [today]);
  const canGoPrevMonth = visibleMonth > currentMonth;
  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);

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
      setError("Merci de choisir une date d'arrivee et de depart.");
      return;
    }
    if (checkOut <= checkIn) {
      setError("La date de depart doit etre apres la date d'arrivee.");
      return;
    }

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests,
    });
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
    if (checkIn) return `${checkIn} -> choisir depart`;
    return "Choisir vos dates";
  }, [checkIn, checkOut]);

  return (
    <form className="availability-form" onSubmit={onSubmit}>
      <div className="field availability-calendar-field">
        <Label htmlFor="availabilityCheckIn" className="availability-calendar-label">
          <span className="availability-calendar-icon" aria-hidden="true">Cal</span>
          Arrivee / Depart
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
                aria-label="Mois suivant"
              >
                <span className="calendar-nav-icon" aria-hidden="true">{">"}</span>
              </AppButton>
            </div>
            <div className="booking-calendar" role="group" aria-label="Calendrier de disponibilite">
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
                        aria-label={`Choisir le ${cell.iso}`}
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
        <Label htmlFor="availability-guests">Voyageurs</Label>
        <Input type="hidden" name="guests" value={guests} />
        <Select value={guests} onValueChange={setGuests}>
          <SelectTrigger id="availability-guests">
            <SelectValue placeholder="Voyageurs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 personne</SelectItem>
            <SelectItem value="2">2 personnes</SelectItem>
            <SelectItem value="3">3 personnes</SelectItem>
            <SelectItem value="4">4 personnes</SelectItem>
          </SelectContent>
        </Select>
      </label>

      <AppButton tone="primary" type="submit">
        Voir les chambres disponibles {"->"}
      </AppButton>

      {error ? <p className="form-error availability-error" role="alert">{error}</p> : null}
    </form>
  );
}
