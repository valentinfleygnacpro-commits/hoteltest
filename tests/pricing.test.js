const test = require("node:test");
const assert = require("node:assert/strict");
const {
  addDaysISO,
  calculateEstimate,
  calculateNights,
  getNightlyRate,
  getSeasonForDate,
  getTodayLocalISO,
  parseLocalDate,
} = require("../src/lib/pricing");

test("parseLocalDate parses YYYY-MM-DD without timezone drift", () => {
  const date = parseLocalDate("2026-02-11");
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 1);
  assert.equal(date.getDate(), 11);
});

test("calculateNights returns positive nights only", () => {
  assert.equal(calculateNights("2026-02-10", "2026-02-12"), 2);
  assert.equal(calculateNights("2026-02-12", "2026-02-12"), 0);
  assert.equal(calculateNights("2026-02-12", "2026-02-11"), 0);
});

test("addDaysISO returns next local day", () => {
  assert.equal(addDaysISO("2026-02-28", 1), "2026-03-01");
});

test("calculateEstimate includes promo and per-person addons", () => {
  const estimate = calculateEstimate({
    checkIn: "2026-03-10",
    checkOut: "2026-03-12",
    roomType: "deluxe",
    guests: 2,
    addon: "spa",
    promoCode: "atlas24",
  });

  assert.equal(estimate.valid, true);
  assert.equal(estimate.nights, 2);
  assert.equal(estimate.total, 405);
});

test("calculateEstimate supports multiple addons", () => {
  const estimate = calculateEstimate({
    checkIn: "2026-03-10",
    checkOut: "2026-03-12",
    roomType: "classic",
    guests: 2,
    addon: ["spa", "transfer"],
    promoCode: "",
  });

  // base: 140*2=280, spa: 35*2=70, transfer: 55 => 405
  assert.equal(estimate.valid, true);
  assert.equal(estimate.total, 405);
});

test("season helpers return the expected season and nightly rate", () => {
  const highSeason = getSeasonForDate("2026-07-10");
  assert.equal(highSeason.id, "high");
  assert.equal(getNightlyRate("2026-07-10", "classic"), 203);
  assert.equal(getNightlyRate("2026-07-11", "classic"), 223);
});

test("date ranges map to requested low and mid seasons in september", () => {
  assert.equal(getSeasonForDate("2026-09-10").id, "mid");
  assert.equal(getSeasonForDate("2026-09-20").id, "low");
});

test("ascension bridge is mapped as high season", () => {
  assert.equal(getSeasonForDate("2026-05-15").id, "high");
});

test("calculateEstimate applies seasonal room pricing", () => {
  const estimate = calculateEstimate({
    checkIn: "2026-07-10",
    checkOut: "2026-07-12",
    roomType: "classic",
    guests: 2,
    addon: [],
    promoCode: "",
  });

  // classic: 203 + 223 (week-end) = 426
  assert.equal(estimate.valid, true);
  assert.equal(estimate.nights, 2);
  assert.equal(estimate.subtotal, 426);
  assert.equal(estimate.total, 426);
});

test("today helper returns ISO local format", () => {
  const today = getTodayLocalISO();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
});
