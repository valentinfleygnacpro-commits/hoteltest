const ROOM_PRICES = {
  classic: 140,
  deluxe: 190,
  suite: 280,
};

const SEASON_RULES = [
  {
    id: "low",
    label: "Basse saison",
    multiplier: 1,
  },
  {
    id: "mid",
    label: "Moyenne saison",
    multiplier: 1.2,
  },
  {
    id: "high",
    label: "Haute saison",
    multiplier: 1.45,
  },
];

const ADDON_PRICES = {
  none: 0,
  breakfast: 18,
  spa: 35,
  transfer: 55,
};

const PROMO_CODES = {
  ATLAS24: 0.1,
};

const WEEKEND_SURCHARGE = 0.1;
const SEASON_BY_ID = Object.fromEntries(SEASON_RULES.map((season) => [season.id, season]));

function parseLocalDate(dateString) {
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeISODate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDaysDate(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isISOInRange(value, start, end) {
  return value >= start && value <= end;
}

// Anonymous Gregorian algorithm.
function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getSeasonRanges(year) {
  const easterSunday = getEasterSunday(year);
  const ascension = addDaysDate(easterSunday, 39);
  const pentecostMonday = addDaysDate(easterSunday, 50);

  return {
    high: [
      { start: makeISODate(year, 7, 1), end: makeISODate(year, 8, 31) },
      { start: toISODate(addDaysDate(ascension, -1)), end: toISODate(addDaysDate(ascension, 3)) },
      { start: toISODate(addDaysDate(pentecostMonday, -2)), end: toISODate(addDaysDate(pentecostMonday, 1)) },
    ],
    low: [
      { start: makeISODate(year, 1, 1), end: makeISODate(year, 4, 5) },
      { start: makeISODate(year, 9, 15), end: makeISODate(year, 10, 15) },
      { start: makeISODate(year, 11, 3), end: makeISODate(year, 12, 15) },
    ],
    mid: [
      { start: makeISODate(year, 4, 6), end: makeISODate(year, 6, 30) },
      { start: makeISODate(year, 9, 1), end: makeISODate(year, 9, 30) },
      { start: makeISODate(year, 10, 18), end: makeISODate(year, 11, 2) },
    ],
  };
}

function getTodayLocalISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysISO(dateString, days) {
  const date = parseLocalDate(dateString);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateNights(checkIn, checkOut) {
  const inDate = parseLocalDate(checkIn);
  const outDate = parseLocalDate(checkOut);
  if (!inDate || !outDate) return 0;
  const diff = outDate - inDate;
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

function getSeasonForDate(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return null;
  const iso = toISODate(date);
  const year = date.getFullYear();
  const ranges = getSeasonRanges(year);

  if (ranges.high.some((range) => isISOInRange(iso, range.start, range.end))) return SEASON_BY_ID.high;
  if (ranges.low.some((range) => isISOInRange(iso, range.start, range.end))) return SEASON_BY_ID.low;
  if (ranges.mid.some((range) => isISOInRange(iso, range.start, range.end))) return SEASON_BY_ID.mid;
  return SEASON_BY_ID.mid;
}

function isWeekendDate(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return false;
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getNightlyRate(dateString, roomType) {
  if (!ROOM_PRICES[roomType]) return 0;
  const season = getSeasonForDate(dateString);
  if (!season) return 0;
  const weekendMultiplier = isWeekendDate(dateString) ? 1 + WEEKEND_SURCHARGE : 1;
  return Math.round(ROOM_PRICES[roomType] * season.multiplier * weekendMultiplier);
}

function getNightBreakdown(checkIn, checkOut, roomType) {
  const nights = calculateNights(checkIn, checkOut);
  if (!nights || !ROOM_PRICES[roomType]) return [];

  const entries = [];
  for (let i = 0; i < nights; i += 1) {
    const date = addDaysISO(checkIn, i);
    const season = getSeasonForDate(date);
    entries.push({
      date,
      seasonId: season.id,
      seasonLabel: season.label,
      weekend: isWeekendDate(date),
      rate: getNightlyRate(date, roomType),
    });
  }
  return entries;
}

function calculateEstimate({ checkIn, checkOut, roomType, guests, addon, promoCode }) {
  if (!checkIn || !checkOut || !roomType || !ROOM_PRICES[roomType]) {
    return null;
  }

  const nights = calculateNights(checkIn, checkOut);
  if (!nights) {
    return { valid: false, nights: 0 };
  }

  const guestsCount = Math.max(1, Number(guests) || 1);
  const nightBreakdown = getNightBreakdown(checkIn, checkOut, roomType);
  const base = nightBreakdown.reduce((sum, night) => sum + night.rate, 0);
  const selectedAddons = Array.isArray(addon)
    ? addon.filter((item) => item in ADDON_PRICES && item !== "none")
    : addon && addon !== "none" && addon in ADDON_PRICES
      ? [addon]
      : [];
  const uniqueAddons = [...new Set(selectedAddons)];
  const addonTotal = uniqueAddons.reduce((sum, item) => {
    const addonPrice = ADDON_PRICES[item] ?? 0;
    return sum + (item === "transfer" ? addonPrice : addonPrice * guestsCount);
  }, 0);
  const subtotal = base + addonTotal;
  const discountRate = PROMO_CODES[(promoCode || "").trim().toUpperCase()] || 0;
  const discount = subtotal * discountRate;
  const total = subtotal - discount;

  return {
    valid: true,
    nights,
    nightBreakdown,
    subtotal,
    discount,
    total,
  };
}

module.exports = {
  ROOM_PRICES,
  SEASON_RULES,
  ADDON_PRICES,
  PROMO_CODES,
  parseLocalDate,
  getTodayLocalISO,
  addDaysISO,
  calculateNights,
  getSeasonForDate,
  isWeekendDate,
  WEEKEND_SURCHARGE,
  getNightlyRate,
  getNightBreakdown,
  calculateEstimate,
};
