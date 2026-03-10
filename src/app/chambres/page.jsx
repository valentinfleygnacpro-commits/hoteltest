import { redirect } from "next/navigation";
import siteContentLib from "../../lib/siteContent";
import pricingLib from "../../lib/pricing";
import dbLib from "../../lib/db";
import availabilityLib from "../../lib/availability";
import { ROOM_DETAILS, ROOM_FILTER_OPTIONS, ROOM_GUARANTEES, ROOM_IMAGE_SETS, ROOM_REVIEW_ITEMS } from "./roomData";
import ChambresPageClient from "./ChambresPageClient";

const { ROOM_OPTIONS } = siteContentLib;
const { ROOM_PRICES, parseLocalDate } = pricingLib;
const { getDbSnapshot } = dbLib;
const { getAvailabilityByRoomWithClosures } = availabilityLib;

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chambres et suites",
  description: "Decouvrez les chambres et suites de l'Hotel Atlas a l'Ile de Re.",
};

function getStringParam(params, key) {
  const value = params?.[key];
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

function getList(value) {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function hasWeekdayNight(checkIn, checkOut) {
  const inDate = parseLocalDate(checkIn);
  const outDate = parseLocalDate(checkOut);
  if (!inDate || !outDate || outDate <= inDate) return false;

  let cursor = new Date(inDate);
  while (cursor < outDate) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) return true;
    cursor = addDays(cursor, 1);
  }
  return false;
}

export default async function ChambresPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const visibleRooms = ROOM_OPTIONS.filter((item) => item.value);
  const checkIn = getStringParam(resolvedSearchParams, "checkIn");
  const checkOut = getStringParam(resolvedSearchParams, "checkOut");
  const guests = getStringParam(resolvedSearchParams, "guests");
  const requestedRoom = getStringParam(resolvedSearchParams, "room");
  const roomCategory = getStringParam(resolvedSearchParams, "roomCategory");
  const roomView = getStringParam(resolvedSearchParams, "roomView");
  const selectedCategories = getList(roomCategory);
  const selectedViews = getList(roomView);
  const selectedAmenities = getList(getStringParam(resolvedSearchParams, "amenities"));
  const weekdayInStay = hasWeekdayNight(checkIn, checkOut);
  const inDate = parseLocalDate(checkIn);
  const outDate = parseLocalDate(checkOut);
  const hasValidCriteria = Boolean(inDate && outDate && outDate > inDate);

  if (!hasValidCriteria) {
    redirect("/disponibilites");
  }

  const db = await getDbSnapshot();
  const availability = getAvailabilityByRoomWithClosures(db.bookings, db.roomClosures, checkIn, checkOut);

  const roomsMatchingFilters = visibleRooms.filter((room) => {
    const details = ROOM_DETAILS[room.value];
    if (!details) return false;
    if (selectedCategories.length && !selectedCategories.includes(details.category)) return false;
    if (selectedViews.length && !selectedViews.includes(details.view)) return false;
    if (selectedAmenities.length && !selectedAmenities.every((item) => details.filterAmenities?.includes(item))) return false;
    return true;
  });

  const roomsToDisplay = roomsMatchingFilters
    .filter((room) => !(room.value === "classic" && weekdayInStay))
    .filter((room) => (availability[room.value] || 0) > 0)
    .map((room) => ({
      ...room,
      images: ROOM_IMAGE_SETS[room.value] || ["/chambre1.webp"],
    }));

  const requestedRoomOption = visibleRooms.find((room) => room.value === requestedRoom) || null;
  const requestedRoomAvailable = Boolean(
    requestedRoomOption &&
    roomsToDisplay.some((room) => room.value === requestedRoomOption.value)
  );

  if (requestedRoomAvailable) {
    const reservationParams = new URLSearchParams();
    if (checkIn) reservationParams.set("checkIn", checkIn);
    if (checkOut) reservationParams.set("checkOut", checkOut);
    if (guests) reservationParams.set("guests", guests);
    reservationParams.set("room", requestedRoomOption.value);
    redirect(`/reservation?${reservationParams.toString()}`);
  }

  const criteriaParams = new URLSearchParams();
  if (checkIn) criteriaParams.set("checkIn", checkIn);
  if (checkOut) criteriaParams.set("checkOut", checkOut);
  if (guests) criteriaParams.set("guests", guests);
  if (roomCategory) criteriaParams.set("roomCategory", roomCategory);
  if (roomView) criteriaParams.set("roomView", roomView);
  if (selectedAmenities.length) criteriaParams.set("amenities", selectedAmenities.join(","));
  const criteriaSuffix = criteriaParams.toString() ? `?${criteriaParams.toString()}` : "";

  const activeFilterLabels = [
    ...selectedCategories.map((item) => ROOM_FILTER_OPTIONS.categories.find((option) => option.value === item)?.label),
    ...selectedViews.map((item) => ROOM_FILTER_OPTIONS.views.find((option) => option.value === item)?.label),
    ...selectedAmenities.map((item) => ROOM_FILTER_OPTIONS.amenities.find((option) => option.value === item)?.label),
  ].filter(Boolean);

  return (
    <ChambresPageClient
      checkIn={checkIn}
      checkOut={checkOut}
      guests={guests}
      activeFilterLabels={activeFilterLabels}
      roomsToDisplay={roomsToDisplay}
      roomPrices={ROOM_PRICES}
      criteriaSuffix={criteriaSuffix}
      reviewItems={ROOM_REVIEW_ITEMS}
      guarantees={ROOM_GUARANTEES}
      requestedRoomLabel={requestedRoomOption?.label || ""}
    />
  );
}
