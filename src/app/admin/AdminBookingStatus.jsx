"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OPTIONS = [
  { value: "new", label: "Nouvelle" },
  { value: "confirmed", label: "Confirmée" },
  { value: "cancelled", label: "Annulée" },
];

export default function AdminBookingStatus({ bookingId, currentStatus, token }) {
  const [status, setStatus] = useState(currentStatus || "new");
  const [saving, setSaving] = useState(false);

  async function updateStatus(next) {
    setStatus(next);
    setSaving(true);
    try {
      await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ status: next }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-status">
      <Select value={status} onValueChange={updateStatus} disabled={saving}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving ? <small>...</small> : null}
    </div>
  );
}
