"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/ui/app-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROOM_FILTER_OPTIONS } from "../../chambres/roomData";

function parseAmenities(value) {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function FiltersClient({ initialCheckIn, initialCheckOut, initialGuests, initialRoomCategory, initialRoomView, initialAmenities }) {
  const router = useRouter();
  const [roomCategory, setRoomCategory] = useState(initialRoomCategory || "all");
  const [roomView, setRoomView] = useState(initialRoomView || "all");
  const [amenities, setAmenities] = useState(() => parseAmenities(initialAmenities));
  const backParams = new URLSearchParams();
  if (initialCheckIn) backParams.set("checkIn", initialCheckIn);
  if (initialCheckOut) backParams.set("checkOut", initialCheckOut);
  if (initialGuests) backParams.set("guests", initialGuests);
  const backHref = backParams.toString() ? `/disponibilites?${backParams.toString()}` : "/disponibilites";

  function toggleAmenity(value) {
    setAmenities((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function applyFilters(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (initialCheckIn) params.set("checkIn", initialCheckIn);
    if (initialCheckOut) params.set("checkOut", initialCheckOut);
    if (initialGuests) params.set("guests", initialGuests);
    if (roomCategory !== "all") params.set("roomCategory", roomCategory);
    if (roomView !== "all") params.set("roomView", roomView);
    if (amenities.length) params.set("amenities", amenities.join(","));
    router.push(`/chambres?${params.toString()}`);
  }

  return (
    <form className="filters-page-form section-top" onSubmit={applyFilters}>
      <div className="filters-page-summary">
        <p className="filters-page-kicker">Filtres chambres</p>
        <p>
          Recherche actuelle: <strong>{initialCheckIn || "--"}</strong> au <strong>{initialCheckOut || "--"}</strong>
          {" - "}
          <strong>{initialGuests || "2"}</strong> voyageur(s)
        </p>
      </div>

      <div className="filters-page-grid">
        <label className="field" htmlFor="filters-room-category">
          <Label htmlFor="filters-room-category">Categorie de chambre</Label>
          <Input type="hidden" name="roomCategory" value={roomCategory} />
          <Select value={roomCategory} onValueChange={setRoomCategory}>
            <SelectTrigger id="filters-room-category">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_FILTER_OPTIONS.categories.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="field" htmlFor="filters-room-view">
          <Label htmlFor="filters-room-view">Type de vue</Label>
          <Input type="hidden" name="roomView" value={roomView} />
          <Select value={roomView} onValueChange={setRoomView}>
            <SelectTrigger id="filters-room-view">
              <SelectValue placeholder="Vue" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_FILTER_OPTIONS.views.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <fieldset className="field filters-page-amenities">
        <legend>Amenagements</legend>
        <div className="availability-amenities-list">
          {ROOM_FILTER_OPTIONS.amenities.map((option) => (
            <label key={option.value} className="availability-amenity-chip">
              <Checkbox
                checked={amenities.includes(option.value)}
                onCheckedChange={() => toggleAmenity(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="filters-page-actions">
        <AppButton asChild tone="ghost">
          <Link href={backHref}>Retour aux dates</Link>
        </AppButton>
        <AppButton tone="primary" type="submit">
          Decouvrir les chambres disponibles {"->"}
        </AppButton>
      </div>
    </form>
  );
}
