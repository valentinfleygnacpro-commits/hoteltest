"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  FormControl,
  FormControlLabel,
  GlobalStyles,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Checkbox as MuiCheckbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

function formatDate(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function toTimeValue(iso) {
  const value = new Date(iso || "").getTime();
  return Number.isNaN(value) ? 0 : value;
}

function statusLabel(status) {
  if (status === "confirmed") return "Confirmee";
  if (status === "cancelled") return "Annulee";
  return "En attente";
}

function statusColor(status) {
  if (status === "confirmed") return "success";
  if (status === "cancelled") return "error";
  return "warning";
}

function compareValues(a, b, order) {
  if (a === b) return 0;
  if (order === "asc") return a > b ? 1 : -1;
  return a > b ? -1 : 1;
}

function roomTypeLabel(roomType) {
  if (roomType === "classic") return "Classique";
  if (roomType === "deluxe") return "Deluxe";
  if (roomType === "suite") return "Suite";
  return roomType || "-";
}

const ROOM_CAPACITY = {
  classic: 14,
  deluxe: 10,
  suite: 6,
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
    success: { main: "#15803d" },
    secondary: { main: "#7c3aed" },
    background: { default: "#f3f4f6" },
  },
  shape: { borderRadius: 12 },
  typography: {
    h4: { fontWeight: 700 },
  },
});

function StatCard({ title, value, icon, bg }) {
  return (
    <Card sx={{ minWidth: 200, background: bg }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          {icon}
        </Stack>
        <Typography variant="h4" sx={{ mt: 1 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function AdminInterneApp({ token, role, initialFilters, initialData }) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [bookings, setBookings] = useState(initialData.recent.bookings || []);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [isApplying, setIsApplying] = useState(false);
  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roomClosures, setRoomClosures] = useState(initialData.recent.roomClosures || []);
  const [roomClosureEvents] = useState(initialData.recent.roomClosureEvents || []);
  const [roomClosureSaving, setRoomClosureSaving] = useState(false);
  const [deletingClosureId, setDeletingClosureId] = useState("");
  const [selectedClosureIds, setSelectedClosureIds] = useState([]);
  const [closureConflicts, setClosureConflicts] = useState([]);
  const [pendingClosurePayload, setPendingClosurePayload] = useState(null);
  const [calendarRows, setCalendarRows] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [roomClosureForm, setRoomClosureForm] = useState({
    roomType: "classic",
    checkIn: "",
    checkOut: "",
    quantity: ROOM_CAPACITY.classic,
    reason: "",
    applyToAllTypes: false,
    repeatWeeks: 0,
  });
  const canEdit = role === "admin" || role === "operator";

  const totals = initialData.totals || {};

  const exportLink = useMemo(() => {
    const params = new URLSearchParams({
      token: token || "",
      q: filters.q || "",
      status: filters.status || "all",
      paymentStatus: filters.paymentStatus || "all",
      dateFrom: filters.dateFrom || "",
      dateTo: filters.dateTo || "",
    });
    return `/api/admin/export?${params.toString()}`;
  }, [filters, token]);

  const sortedBookings = useMemo(() => {
    const list = [...bookings];
    list.sort((left, right) => {
      if (orderBy === "createdAt") {
        return compareValues(toTimeValue(left.createdAt), toTimeValue(right.createdAt), order);
      }
      if (orderBy === "total") {
        return compareValues(
          Math.round(left.estimate?.total || 0),
          Math.round(right.estimate?.total || 0),
          order
        );
      }
      if (orderBy === "status") {
        return compareValues(statusLabel(left.status || "new"), statusLabel(right.status || "new"), order);
      }
      return 0;
    });
    return list;
  }, [bookings, order, orderBy]);

  const pagedBookings = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedBookings.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, sortedBookings]);

  function updateFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function applyFilters() {
    setIsApplying(true);
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (filters.q) params.set("q", filters.q);
    if (filters.status) params.set("status", filters.status);
    if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    router.push(`/admin-interne?${params.toString()}`);
  }

  function resetFilters() {
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    router.push(`/admin-interne?${params.toString()}`);
  }

  function handleSort(column) {
    if (orderBy === column) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setOrderBy(column);
    setOrder("desc");
  }

  function updateRoomClosureForm(field, value) {
    setRoomClosureForm((prev) => {
      if (field === "roomType") {
        return {
          ...prev,
          roomType: value,
          quantity: ROOM_CAPACITY[value] || 1,
        };
      }
      if (field === "applyToAllTypes") {
        return { ...prev, applyToAllTypes: Boolean(value) };
      }
      if (field === "repeatWeeks") {
        const parsed = Number.parseInt(String(value || "0"), 10) || 0;
        return { ...prev, repeatWeeks: Math.max(0, Math.min(8, parsed)) };
      }
      if (field === "quantity") {
        const max = ROOM_CAPACITY[prev.roomType] || 1;
        const parsed = Number.parseInt(String(value || "1"), 10) || 1;
        return { ...prev, quantity: Math.max(1, Math.min(max, parsed)) };
      }
      return { ...prev, [field]: value };
    });
  }

  async function updateStatus(bookingId, nextStatus) {
    setSavingId(bookingId);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error("status_update_failed");

      setBookings((prev) =>
        prev.map((item) => (item.id === bookingId ? { ...item, status: nextStatus } : item))
      );
      setMessageType("success");
      setMessage("Statut mis a jour.");
    } catch {
      setMessageType("error");
      setMessage("Echec de la mise a jour du statut.");
    } finally {
      setSavingId("");
    }
  }

  async function createRoomClosure() {
    if (!canEdit) return;
    setRoomClosureSaving(true);
    setMessage("");
    setClosureConflicts([]);
    setPendingClosurePayload(null);
    try {
      const response = await fetch("/api/admin/room-closures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(roomClosureForm),
      });
      const payload = await response.json();
      if (response.status === 409 && payload?.error === "conflicts_detected") {
        setClosureConflicts(payload.conflicts || []);
        setPendingClosurePayload(roomClosureForm);
        setMessageType("warning");
        setMessage("Des reservations confirmees sont en conflit avec ce blocage.");
        return;
      }
      if (!response.ok || !payload?.ok) throw new Error("room_closure_create_failed");
      const createdList = payload.roomClosures || (payload.roomClosure ? [payload.roomClosure] : []);
      setRoomClosures((prev) => [...createdList, ...prev]);
      setRoomClosureForm((prev) => ({ ...prev, reason: "" }));
      setMessageType("success");
      setMessage(`Fermeture enregistree (${createdList.length || 1}).`);
      await refreshCalendar();
    } catch {
      setMessageType("error");
      setMessage("Echec de l'enregistrement de la fermeture.");
    } finally {
      setRoomClosureSaving(false);
    }
  }

  async function removeRoomClosure(id) {
    if (!canEdit) return;
    setDeletingClosureId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/room-closures/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": token,
        },
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error("room_closure_delete_failed");
      setRoomClosures((prev) => prev.filter((item) => item.id !== id));
      setSelectedClosureIds((prev) => prev.filter((item) => item !== id));
      setMessageType("success");
      setMessage("Fermeture supprimee.");
      await refreshCalendar();
    } catch {
      setMessageType("error");
      setMessage("Echec de la suppression.");
    } finally {
      setDeletingClosureId("");
    }
  }

  async function forceCreateRoomClosure() {
    if (!pendingClosurePayload || !canEdit) return;
    setRoomClosureSaving(true);
    try {
      const response = await fetch("/api/admin/room-closures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ ...pendingClosurePayload, force: true }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error("room_closure_force_failed");
      const createdList = payload.roomClosures || (payload.roomClosure ? [payload.roomClosure] : []);
      setRoomClosures((prev) => [...createdList, ...prev]);
      setClosureConflicts([]);
      setPendingClosurePayload(null);
      setMessageType("success");
      setMessage(`Blocage force applique (${createdList.length || 1}).`);
      await refreshCalendar();
    } catch {
      setMessageType("error");
      setMessage("Echec du blocage force.");
    } finally {
      setRoomClosureSaving(false);
    }
  }

  async function deleteSelectedClosures() {
    if (!selectedClosureIds.length || !canEdit) return;
    setMessage("");
    try {
      const response = await fetch("/api/admin/room-closures/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ ids: selectedClosureIds }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error("bulk_delete_failed");
      setRoomClosures((prev) => prev.filter((item) => !selectedClosureIds.includes(item.id)));
      setSelectedClosureIds([]);
      setMessageType("success");
      setMessage(`Suppression en lot terminee (${payload.deletedCount || 0}).`);
      await refreshCalendar();
    } catch {
      setMessageType("error");
      setMessage("Echec de la suppression en lot.");
    }
  }

  function toggleSelectClosure(id) {
    setSelectedClosureIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function applyTodayPreset() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    updateRoomClosureForm("checkIn", today);
    updateRoomClosureForm("checkOut", tomorrow.toISOString().slice(0, 10));
  }

  function applyWeekendPreset() {
    const now = new Date();
    const day = now.getDay();
    const deltaToFriday = ((5 - day + 7) % 7) || 7;
    const friday = new Date(now);
    friday.setDate(now.getDate() + deltaToFriday);
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    updateRoomClosureForm("checkIn", friday.toISOString().slice(0, 10));
    updateRoomClosureForm("checkOut", sunday.toISOString().slice(0, 10));
  }

  async function refreshCalendar() {
    setCalendarLoading(true);
    try {
      const start = new Date().toISOString().slice(0, 10);
      const response = await fetch(`/api/admin/availability-calendar?start=${start}&days=14`, {
        headers: {
          "x-admin-token": token,
        },
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error("calendar_failed");
      setCalendarRows(payload.rows || []);
    } catch {
      setCalendarRows([]);
    } finally {
      setCalendarLoading(false);
    }
  }

  useEffect(() => {
    refreshCalendar();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{ body: { backgroundColor: "#f3f4f6", backgroundImage: "none" } }} />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Admin Interne</Typography>
            <Typography color="text.secondary">
              Gestion des reservations, filtres et mise a jour de statut.
            </Typography>
            <Chip
              size="small"
              sx={{ mt: 1 }}
              color={role === "admin" ? "primary" : role === "operator" ? "success" : "default"}
              label={`Role: ${role}`}
            />
          </Box>

          {message ? <Alert severity={messageType}>{message}</Alert> : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <StatCard title="Reservations" value={totals.bookings || 0} icon={<BookOutlinedIcon color="primary" />} bg="#eff6ff" />
            <StatCard title="Fermetures chambres" value={totals.roomClosures || 0} icon={<FilterAltOutlinedIcon color="action" />} bg="#fff7ed" />
            <StatCard title="Audit actions" value={totals.roomClosureEvents || 0} icon={<FilterAltOutlinedIcon color="action" />} bg="#fef3c7" />
            <StatCard title="Resultats filtres" value={totals.filteredBookings || 0} icon={<FilterAltOutlinedIcon color="primary" />} bg="#eef2ff" />
            <StatCard title="Contacts" value={totals.contacts || 0} icon={<ContactsOutlinedIcon color="success" />} bg="#ecfdf5" />
            <StatCard title="Newsletter" value={totals.newsletter || 0} icon={<EmailOutlinedIcon color="secondary" />} bg="#f5f3ff" />
            <StatCard title="Analytics" value={totals.analytics || 0} icon={<QueryStatsOutlinedIcon color="action" />} bg="#f9fafb" />
          </Stack>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Filtres</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Recherche"
                value={filters.q || ""}
                onChange={(event) => updateFilter("q", event.target.value)}
                fullWidth
              />
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="status-filter">Statut</InputLabel>
                <Select
                  labelId="status-filter"
                  label="Statut"
                  value={filters.status || "all"}
                  onChange={(event) => updateFilter("status", event.target.value)}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="new">En attente</MenuItem>
                  <MenuItem value="confirmed">Confirmee</MenuItem>
                  <MenuItem value="cancelled">Annulee</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="payment-filter">Paiement</InputLabel>
                <Select
                  labelId="payment-filter"
                  label="Paiement"
                  value={filters.paymentStatus || "all"}
                  onChange={(event) => updateFilter("paymentStatus", event.target.value)}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="paid">Paye</MenuItem>
                  <MenuItem value="unpaid">Impayee</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Du"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.dateFrom || ""}
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
              />
              <TextField
                label="Au"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.dateTo || ""}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
              />
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, gap: 2, flexWrap: "wrap" }}>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={applyFilters} disabled={isApplying} startIcon={isApplying ? <CircularProgress size={16} color="inherit" /> : null}>
                  {isApplying ? "Application..." : "Appliquer"}
                </Button>
                <Button variant="outlined" onClick={resetFilters}>Reset</Button>
              </Stack>
              <Button variant="text" href={exportLink}>Exporter CSV</Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Gestion des chambres disponibles</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" onClick={applyTodayPreset} disabled={!canEdit}>Preset: aujourd&apos;hui</Button>
              <Button variant="outlined" onClick={applyWeekendPreset} disabled={!canEdit}>Preset: week-end</Button>
              <Button
                variant="outlined"
                color="warning"
                disabled={!canEdit}
                onClick={() => updateRoomClosureForm("applyToAllTypes", !roomClosureForm.applyToAllTypes)}
              >
                {roomClosureForm.applyToAllTypes ? "Blocage global actif" : "Bloquer tout l'hotel"}
              </Button>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="closure-room-type">Type de chambre</InputLabel>
                <Select
                  labelId="closure-room-type"
                  label="Type de chambre"
                  value={roomClosureForm.roomType}
                  onChange={(event) => updateRoomClosureForm("roomType", event.target.value)}
                >
                  <MenuItem value="classic">Classique</MenuItem>
                  <MenuItem value="deluxe">Deluxe</MenuItem>
                  <MenuItem value="suite">Suite</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Du"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={roomClosureForm.checkIn}
                onChange={(event) => updateRoomClosureForm("checkIn", event.target.value)}
                disabled={!canEdit}
              />
              <TextField
                label="Au"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={roomClosureForm.checkOut}
                onChange={(event) => updateRoomClosureForm("checkOut", event.target.value)}
                disabled={!canEdit}
              />
              <TextField
                label="Nb chambres a fermer"
                type="number"
                inputProps={{ min: 1, max: ROOM_CAPACITY[roomClosureForm.roomType] || 1 }}
                value={roomClosureForm.quantity}
                onChange={(event) => updateRoomClosureForm("quantity", event.target.value)}
                helperText={`Max ${ROOM_CAPACITY[roomClosureForm.roomType] || 1} (${roomTypeLabel(roomClosureForm.roomType)})`}
                disabled={!canEdit || roomClosureForm.applyToAllTypes}
              />
              <TextField
                label="Repetition hebdo"
                type="number"
                inputProps={{ min: 0, max: 8 }}
                value={roomClosureForm.repeatWeeks}
                onChange={(event) => updateRoomClosureForm("repeatWeeks", event.target.value)}
                helperText="0 = une seule periode"
                disabled={!canEdit}
              />
              <TextField
                label="Motif (optionnel)"
                value={roomClosureForm.reason}
                onChange={(event) => updateRoomClosureForm("reason", event.target.value)}
                fullWidth
                disabled={!canEdit}
              />
              <Button
                variant="outlined"
                onClick={() =>
                  updateRoomClosureForm(
                    "quantity",
                    ROOM_CAPACITY[roomClosureForm.roomType] || 1
                  )
                }
                disabled={!canEdit || roomClosureForm.applyToAllTypes}
              >
                Tout bloquer
              </Button>
              <Button variant="contained" disabled={roomClosureSaving || !canEdit} onClick={createRoomClosure}>
                {roomClosureSaving ? "Enregistrement..." : "Bloquer"}
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Une fermeture retire des chambres de la vente sur la periode choisie. Pour rendre un type totalement indisponible, utilisez "Tout bloquer".
            </Typography>
            {closureConflicts.length ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography sx={{ mb: 1 }}>
                  {closureConflicts.length} reservation(s) confirmee(s) en conflit detectee(s).
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  color="warning"
                  onClick={forceCreateRoomClosure}
                  disabled={!canEdit || roomClosureSaving}
                >
                  Forcer le blocage
                </Button>
              </Alert>
            ) : null}
            <Stack direction="row" sx={{ mt: 2 }} justifyContent="space-between">
              <Typography variant="subtitle2">Fermetures actives</Typography>
              <Button
                variant="outlined"
                color="error"
                disabled={!selectedClosureIds.length || !canEdit}
                onClick={deleteSelectedClosures}
              >
                Supprimer la selection ({selectedClosureIds.length})
              </Button>
            </Stack>
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <MuiCheckbox
                        size="small"
                        checked={roomClosures.length > 0 && selectedClosureIds.length === roomClosures.length}
                        indeterminate={selectedClosureIds.length > 0 && selectedClosureIds.length < roomClosures.length}
                        onChange={() =>
                          setSelectedClosureIds(
                            selectedClosureIds.length === roomClosures.length ? [] : roomClosures.map((item) => item.id)
                          )
                        }
                        disabled={!canEdit}
                      />
                    </TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Periode</TableCell>
                    <TableCell>Quantite</TableCell>
                    <TableCell>Motif</TableCell>
                    <TableCell>Creation</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomClosures.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell padding="checkbox">
                        <MuiCheckbox
                          size="small"
                          checked={selectedClosureIds.includes(item.id)}
                          onChange={() => toggleSelectClosure(item.id)}
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>{roomTypeLabel(item.roomType)}</TableCell>
                      <TableCell>{item.checkIn} - {item.checkOut}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.reason || "-"}</TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="Supprimer fermeture"
                          onClick={() => removeRoomClosure(item.id)}
                          disabled={deletingClosureId === item.id || !canEdit}
                          size="small"
                          color="error"
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {roomClosures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography color="text.secondary">Aucune fermeture active.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Calendrier disponibilite (14 jours)</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Classique</TableCell>
                    <TableCell>Deluxe</TableCell>
                    <TableCell>Suite</TableCell>
                    <TableCell>Occupation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calendarRows.map((row) => (
                    <TableRow key={row.date} hover>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.availability?.classic ?? "-"}</TableCell>
                      <TableCell>{row.availability?.deluxe ?? "-"}</TableCell>
                      <TableCell>{row.availability?.suite ?? "-"}</TableCell>
                      <TableCell>{row.occupiedRate}%</TableCell>
                    </TableRow>
                  ))}
                  {calendarLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color="text.secondary">Chargement...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Historique des actions (audit)</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Fermeture</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roomClosureEvents.slice(0, 50).map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>{formatDate(event.createdAt)}</TableCell>
                      <TableCell>{event.action}</TableCell>
                      <TableCell>{event.role || "-"}</TableCell>
                      <TableCell>{event.roomClosureId || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {roomClosureEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">Aucun evenement.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 0 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell sortDirection={orderBy === "createdAt" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "createdAt"}
                        direction={orderBy === "createdAt" ? order : "desc"}
                        onClick={() => handleSort("createdAt")}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Sejour</TableCell>
                    <TableCell sortDirection={orderBy === "total" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "total"}
                        direction={orderBy === "total" ? order : "desc"}
                        onClick={() => handleSort("total")}
                      >
                        Total
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Paiement</TableCell>
                    <TableCell sortDirection={orderBy === "status" ? order : false}>
                      <TableSortLabel
                        active={orderBy === "status"}
                        direction={orderBy === "status" ? order : "desc"}
                        onClick={() => handleSort("status")}
                      >
                        Statut
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedBookings.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>{item.payload?.fullName || "-"}</TableCell>
                      <TableCell>{item.payload?.email || "-"}</TableCell>
                      <TableCell>{item.payload?.checkIn} - {item.payload?.checkOut}</TableCell>
                      <TableCell>{Math.round(item.estimate?.total || 0)} EUR</TableCell>
                      <TableCell>{item.paymentStatus || "unpaid"}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabel(item.status || "new")}
                          color={statusColor(item.status || "new")}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={item.status || "new"}
                            disabled={savingId === item.id || !canEdit}
                            onChange={(event) => updateStatus(item.id, event.target.value)}
                          >
                            <MenuItem value="new">En attente</MenuItem>
                            <MenuItem value="confirmed">Confirmee</MenuItem>
                            <MenuItem value="cancelled">Annulee</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Stack alignItems="center" spacing={1} sx={{ py: 5 }}>
                          <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.secondary" }} />
                          <Typography variant="h6">Aucune reservation pour le moment</Typography>
                          <Typography color="text.secondary">Commencez par ajouter une reservation.</Typography>
                          <Button variant="contained" href="/reservation">Creer une reservation</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={sortedBookings.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Lignes"
            />
          </Paper>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
