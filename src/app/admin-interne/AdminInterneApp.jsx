"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";

function formatDate(iso) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function statusColor(status) {
  if (status === "confirmed") return "success";
  if (status === "cancelled") return "error";
  return "warning";
}

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1f4b99" },
    secondary: { main: "#0f766e" },
    background: { default: "#f6f8fb" },
  },
  shape: { borderRadius: 12 },
});

export default function AdminInterneApp({ token, initialFilters, initialData }) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [bookings, setBookings] = useState(initialData.recent.bookings || []);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const totals = initialData.totals || {};

  const exportLink = useMemo(() => {
    const params = new URLSearchParams({
      token: token || "",
      q: filters.q || "",
      status: filters.status || "all",
      dateFrom: filters.dateFrom || "",
      dateTo: filters.dateTo || "",
    });
    return `/api/admin/export?${params.toString()}`;
  }, [filters, token]);

  function updateFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (filters.q) params.set("q", filters.q);
    if (filters.status) params.set("status", filters.status);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    router.push(`/admin-interne?${params.toString()}`);
  }

  function resetFilters() {
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    router.push(`/admin-interne?${params.toString()}`);
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Admin Interne</Typography>
            <Typography color="text.secondary">
              Gestion des reservations, filtres et mise a jour de statut.
            </Typography>
          </Box>

          {message ? <Alert severity={messageType}>{message}</Alert> : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Card sx={{ minWidth: 180 }}><CardContent><Typography variant="body2">Reservations</Typography><Typography variant="h5">{totals.bookings || 0}</Typography></CardContent></Card>
            <Card sx={{ minWidth: 180 }}><CardContent><Typography variant="body2">Resultats filtres</Typography><Typography variant="h5">{totals.filteredBookings || 0}</Typography></CardContent></Card>
            <Card sx={{ minWidth: 180 }}><CardContent><Typography variant="body2">Contacts</Typography><Typography variant="h5">{totals.contacts || 0}</Typography></CardContent></Card>
            <Card sx={{ minWidth: 180 }}><CardContent><Typography variant="body2">Newsletter</Typography><Typography variant="h5">{totals.newsletter || 0}</Typography></CardContent></Card>
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
                  <MenuItem value="new">Nouvelle</MenuItem>
                  <MenuItem value="confirmed">Confirmee</MenuItem>
                  <MenuItem value="cancelled">Annulee</MenuItem>
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
              <Button variant="contained" onClick={applyFilters}>Appliquer</Button>
              <Button variant="outlined" onClick={resetFilters}>Reset</Button>
              <Button variant="text" href={exportLink}>Exporter CSV</Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 0 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Sejour</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Paiement</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((item) => (
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
                          label={item.status || "new"}
                          color={statusColor(item.status || "new")}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={item.status || "new"}
                            disabled={savingId === item.id}
                            onChange={(event) => updateStatus(item.id, event.target.value)}
                          >
                            <MenuItem value="new">Nouvelle</MenuItem>
                            <MenuItem value="confirmed">Confirmee</MenuItem>
                            <MenuItem value="cancelled">Annulee</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>Aucune reservation.</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
