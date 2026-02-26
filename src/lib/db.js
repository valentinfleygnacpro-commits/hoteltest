const fs = require("node:fs/promises");
const path = require("node:path");

function resolveDbDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "hoteltest-data");
  }
  return path.join(process.cwd(), "data");
}

const DB_DIR = resolveDbDir();
const DB_FILE = path.join(DB_DIR, "hotel-db.json");

const DEFAULT_DB = {
  bookings: [],
  contacts: [],
  newsletter: [],
  analytics: [],
};

let writeQueue = Promise.resolve();

async function ensureDbFile() {
  await fs.mkdir(DB_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
  }
}

async function readDb() {
  await ensureDbFile();
  const raw = await fs.readFile(DB_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    return {
      bookings: parsed.bookings || [],
      contacts: parsed.contacts || [],
      newsletter: parsed.newsletter || [],
      analytics: parsed.analytics || [],
    };
  } catch {
    return { ...DEFAULT_DB };
  }
}

async function writeDb(nextDb) {
  await ensureDbFile();
  await fs.writeFile(DB_FILE, JSON.stringify(nextDb, null, 2), "utf-8");
}

function appendRecord(collection, record) {
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    const current = Array.isArray(db[collection]) ? db[collection] : [];
    db[collection] = [record, ...current].slice(0, 5000);
    await writeDb(db);
    return record;
  });
  return writeQueue;
}

async function getDbSnapshot() {
  return readDb();
}

async function getDashboardData() {
  const db = await readDb();
  return {
    totals: {
      bookings: db.bookings.length,
      contacts: db.contacts.length,
      newsletter: db.newsletter.length,
      analytics: db.analytics.length,
    },
    recent: {
      bookings: db.bookings.slice(0, 20),
      contacts: db.contacts.slice(0, 20),
      newsletter: db.newsletter.slice(0, 20),
      analytics: db.analytics.slice(0, 30),
    },
  };
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function filterByDate(value, from, to) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (from && date < new Date(from)) return false;
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (date > end) return false;
  }
  return true;
}

async function getDashboardDataFiltered(filters = {}) {
  const db = await readDb();
  const query = normalizeText(filters.q);
  const status = normalizeText(filters.status);
  const dateFrom = filters.dateFrom || "";
  const dateTo = filters.dateTo || "";

  const filteredBookings = db.bookings.filter((item) => {
    const recordStatus = normalizeText(item.status || "new");
    const haystack = normalizeText(
      `${item.id} ${item.payload?.fullName || ""} ${item.payload?.email || ""} ${item.payload?.checkIn || ""} ${
        item.payload?.checkOut || ""
      }`
    );
    if (query && !haystack.includes(query)) return false;
    if (status && status !== "all" && recordStatus !== status) return false;
    if (!filterByDate(item.createdAt, dateFrom, dateTo)) return false;
    return true;
  });

  return {
    totals: {
      bookings: db.bookings.length,
      contacts: db.contacts.length,
      newsletter: db.newsletter.length,
      analytics: db.analytics.length,
      filteredBookings: filteredBookings.length,
    },
    recent: {
      bookings: filteredBookings.slice(0, 100),
      contacts: db.contacts.slice(0, 20),
      newsletter: db.newsletter.slice(0, 20),
      analytics: db.analytics.slice(0, 30),
    },
  };
}

function updateBookingStatus(id, status) {
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    const index = db.bookings.findIndex((item) => item.id === id);
    if (index === -1) return null;
    db.bookings[index] = {
      ...db.bookings[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.bookings[index];
  });
  return writeQueue;
}

function updateBooking(id, updater) {
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    const index = db.bookings.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const current = db.bookings[index];
    const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
    db.bookings[index] = {
      ...next,
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.bookings[index];
  });
  return writeQueue;
}

async function getBookingById(id) {
  const db = await readDb();
  return db.bookings.find((item) => item.id === id) || null;
}

async function getBookingsForExport(filters = {}) {
  const data = await getDashboardDataFiltered(filters);
  return data.recent.bookings;
}

module.exports = {
  appendRecord,
  getDbSnapshot,
  getDashboardData,
  getDashboardDataFiltered,
  updateBookingStatus,
  updateBooking,
  getBookingById,
  getBookingsForExport,
};
