const INVENTORY = {
  classic: 14,
  deluxe: 10,
  suite: 6,
};

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateRangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function isActiveStatus(status) {
  return status !== "cancelled";
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function hasWeekdayNight(checkInDate, checkOutDate) {
  let cursor = new Date(checkInDate);
  while (cursor < checkOutDate) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) return true;
    cursor = addDays(cursor, 1);
  }
  return false;
}

function getAvailabilityByRoom(bookings, checkIn, checkOut) {
  const inDate = parseDate(checkIn);
  const outDate = parseDate(checkOut);
  if (!inDate || !outDate || outDate <= inDate) return null;

  const activeBookings = (bookings || []).filter(
    (item) =>
      isActiveStatus(item.status) &&
      item.payload?.checkIn &&
      item.payload?.checkOut
  );

  const taken = {
    classic: 0,
    deluxe: 0,
    suite: 0,
  };

  for (const booking of activeBookings) {
    const roomType = booking.payload?.roomType;
    if (!roomType || !(roomType in INVENTORY)) continue;
    const bIn = parseDate(booking.payload.checkIn);
    const bOut = parseDate(booking.payload.checkOut);
    if (!bIn || !bOut) continue;
    if (dateRangesOverlap(inDate, outDate, bIn, bOut)) {
      taken[roomType] += 1;
    }
  }

  const availability = {
    classic: Math.max(0, INVENTORY.classic - taken.classic),
    deluxe: Math.max(0, INVENTORY.deluxe - taken.deluxe),
    suite: Math.max(0, INVENTORY.suite - taken.suite),
  };

  // Business rule: the Classic room is not sold during weekday nights.
  if (hasWeekdayNight(inDate, outDate)) {
    availability.classic = 0;
  }

  return availability;
}

module.exports = {
  INVENTORY,
  getAvailabilityByRoom,
};
