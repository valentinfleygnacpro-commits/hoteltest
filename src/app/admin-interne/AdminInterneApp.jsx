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
  CircularProgress,
  Container,
  CssBaseline,
  FormControl,
  GlobalStyles,
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

export default function AdminInterneApp({ token, initialFilters, initialData }) {
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
      <GlobalStyles styles={{ body: { backgroundColor: "#f3f4f6", backgroundImage: "none" } }} />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Admin Interne</Typography>
            <Typography color="text.secondary">
              Gestion des reservations, filtres et mise a jour de statut.
            </Typography>
          </Box>

          {message ? <Alert severity={messageType}>{message}</Alert> : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <StatCard title="Reservations" value={totals.bookings || 0} icon={<BookOutlinedIcon color="primary" />} bg="#eff6ff" />
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
                            disabled={savingId === item.id}
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
