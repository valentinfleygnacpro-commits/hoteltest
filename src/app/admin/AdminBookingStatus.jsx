"use client";

import { useState } from "react";

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
      <select value={status} onChange={(event) => updateStatus(event.target.value)} disabled={saving}>
        {OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {saving ? <small>...</small> : null}
    </div>
  );
}
