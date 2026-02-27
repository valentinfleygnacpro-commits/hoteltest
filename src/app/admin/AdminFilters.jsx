"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminFilters({ token, q, status, dateFrom, dateTo, exportLink }) {
  const router = useRouter();
  const [query, setQuery] = useState(q || "");
  const [selectedStatus, setSelectedStatus] = useState(status || "all");
  const [from, setFrom] = useState(dateFrom || "");
  const [to, setTo] = useState(dateTo || "");

  function onSubmit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (query) params.set("q", query);
    if (selectedStatus) params.set("status", selectedStatus);
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="admin-filters">
      <Input type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recherche client/email/id" />
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger>
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="new">Nouvelle</SelectItem>
          <SelectItem value="confirmed">Confirmee</SelectItem>
          <SelectItem value="cancelled">Annulee</SelectItem>
        </SelectContent>
      </Select>
      <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
      <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      <AppButton tone="primary" type="submit">Filtrer</AppButton>
      <AppButton asChild tone="ghost"><a href={`/admin?token=${encodeURIComponent(token || "")}`}>Reinitialiser</a></AppButton>
      <AppButton asChild tone="light"><a href={exportLink}>Exporter CSV</a></AppButton>
    </form>
  );
}
