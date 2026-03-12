const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { Pool } = require("pg");

const COLLECTIONS = [
  "bookings",
  "roomClosures",
  "roomClosureEvents",
  "contacts",
  "newsletter",
  "analytics",
];

const DEFAULT_DB = {
  bookings: [],
  roomClosures: [],
  roomClosureEvents: [],
  contacts: [],
  newsletter: [],
  analytics: [],
};

const RECORD_LIMIT = 5000;
const usePostgres = Boolean(process.env.DATABASE_URL);

let writeQueue = Promise.resolve();
let pool;
let schemaPromise;

function resolveDbDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "hoteltest-data");
  }
  return path.join(process.cwd(), "data");
}

const DB_DIR = resolveDbDir();
const DB_FILE = path.join(DB_DIR, "hotel-db.json");

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

async function ensurePostgresSchema() {
  if (!usePostgres) return;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const client = await getPool().connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS app_records (
            collection TEXT NOT NULL,
            id TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            record JSONB NOT NULL,
            PRIMARY KEY (collection, id)
          );
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS app_records_collection_created_at_idx
          ON app_records (collection, created_at DESC);
        `);
      } finally {
        client.release();
      }
    })();
  }
  return schemaPromise;
}

async function ensureDbFile() {
  await fs.mkdir(DB_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
  }
}

async function readJsonDb() {
  await ensureDbFile();
  const raw = await fs.readFile(DB_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    return {
      bookings: parsed.bookings || [],
      roomClosures: parsed.roomClosures || [],
      roomClosureEvents: parsed.roomClosureEvents || [],
      contacts: parsed.contacts || [],
      newsletter: parsed.newsletter || [],
      analytics: parsed.analytics || [],
    };
  } catch {
    return { ...DEFAULT_DB };
  }
}

async function writeJsonDb(nextDb) {
  await ensureDbFile();
  await fs.writeFile(DB_FILE, JSON.stringify(nextDb, null, 2), "utf-8");
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

function compareDateStringsDesc(left, right) {
  return String(right || "").localeCompare(String(left || ""));
}

function getNormalizedRoomClosures(roomClosures) {
  return Array.isArray(roomClosures) ? roomClosures : [];
}

function withTimestamps(record) {
  const createdAt = record.createdAt || new Date().toISOString();
  return {
    ...record,
    createdAt,
    updatedAt: record.updatedAt || createdAt,
  };
}

function getRecordId(collection, record) {
  if (record?.id) return String(record.id);
  return `${collection}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createToken(size = 24) {
  return crypto.randomBytes(size).toString("hex");
}

async function trimPostgresCollection(client, collection) {
  await client.query(
    `
      DELETE FROM app_records
      WHERE collection = $1
        AND id IN (
          SELECT id
          FROM app_records
          WHERE collection = $1
          ORDER BY created_at DESC
          OFFSET $2
        );
    `,
    [collection, RECORD_LIMIT]
  );
}

async function getPostgresCollection(collection, limit) {
  await ensurePostgresSchema();
  const params = [collection];
  const limitClause = typeof limit === "number" ? ` LIMIT $${params.push(limit)}` : "";
  const result = await getPool().query(
    `SELECT record FROM app_records WHERE collection = $1 ORDER BY created_at DESC${limitClause};`,
    params
  );
  return result.rows.map((row) => row.record);
}

async function appendRecordPostgres(collection, record) {
  await ensurePostgresSchema();
  const nextRecord = withTimestamps({ ...record, id: getRecordId(collection, record) });
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO app_records (collection, id, created_at, updated_at, record)
        VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5::jsonb)
        ON CONFLICT (collection, id)
        DO UPDATE SET
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at,
          record = EXCLUDED.record;
      `,
      [
        collection,
        nextRecord.id,
        nextRecord.createdAt,
        nextRecord.updatedAt,
        JSON.stringify(nextRecord),
      ]
    );
    await trimPostgresCollection(client, collection);
    await client.query("COMMIT");
    return nextRecord;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getPostgresRecordById(collection, id) {
  await ensurePostgresSchema();
  const result = await getPool().query(
    `SELECT record FROM app_records WHERE collection = $1 AND id = $2 LIMIT 1;`,
    [collection, id]
  );
  return result.rows[0]?.record || null;
}

async function updatePostgresRecord(collection, id, updater) {
  await ensurePostgresSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      `SELECT record FROM app_records WHERE collection = $1 AND id = $2 LIMIT 1;`,
      [collection, id]
    );
    const current = currentResult.rows[0]?.record || null;
    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }
    const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
    const nextRecord = {
      ...next,
      id: current.id || id,
      createdAt: current.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await client.query(
      `
        UPDATE app_records
        SET updated_at = $3::timestamptz, record = $4::jsonb
        WHERE collection = $1 AND id = $2;
      `,
      [collection, id, nextRecord.updatedAt, JSON.stringify(nextRecord)]
    );
    await client.query("COMMIT");
    return nextRecord;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deletePostgresRecord(collection, id) {
  await ensurePostgresSchema();
  const result = await getPool().query(
    `DELETE FROM app_records WHERE collection = $1 AND id = $2 RETURNING id;`,
    [collection, id]
  );
  return result.rowCount ? result.rows[0].id : null;
}

function appendRecordJson(collection, record) {
  writeQueue = writeQueue.then(async () => {
    const db = await readJsonDb();
    const current = Array.isArray(db[collection]) ? db[collection] : [];
    const nextRecord = withTimestamps({ ...record, id: getRecordId(collection, record) });
    db[collection] = [nextRecord, ...current].slice(0, RECORD_LIMIT);
    await writeJsonDb(db);
    return nextRecord;
  });
  return writeQueue;
}

function appendRecord(collection, record) {
  if (usePostgres) {
    writeQueue = writeQueue.then(() => appendRecordPostgres(collection, record));
    return writeQueue;
  }
  return appendRecordJson(collection, record);
}

async function getDbSnapshot() {
  if (usePostgres) {
    const results = await Promise.all(COLLECTIONS.map((collection) => getPostgresCollection(collection)));
    return COLLECTIONS.reduce((acc, collection, index) => {
      acc[collection] = results[index];
      return acc;
    }, {});
  }
  return readJsonDb();
}

async function getDashboardData() {
  const db = await getDbSnapshot();
  return {
    totals: {
      bookings: db.bookings.length,
      roomClosures: db.roomClosures.length,
      roomClosureEvents: db.roomClosureEvents.length,
      contacts: db.contacts.length,
      newsletter: db.newsletter.length,
      analytics: db.analytics.length,
    },
    recent: {
      bookings: db.bookings.slice(0, 20),
      roomClosures: db.roomClosures.slice(0, 50),
      roomClosureEvents: db.roomClosureEvents.slice(0, 100),
      contacts: db.contacts.slice(0, 20),
      newsletter: db.newsletter.slice(0, 20),
      analytics: db.analytics.slice(0, 30),
    },
  };
}

async function getDashboardDataFiltered(filters = {}) {
  const db = await getDbSnapshot();
  const query = normalizeText(filters.q);
  const status = normalizeText(filters.status);
  const paymentStatus = normalizeText(filters.paymentStatus);
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
    if (paymentStatus && paymentStatus !== "all") {
      const recordPayment = normalizeText(item.paymentStatus || "unpaid");
      if (recordPayment !== paymentStatus) return false;
    }
    if (!filterByDate(item.createdAt, dateFrom, dateTo)) return false;
    return true;
  });

  return {
    totals: {
      bookings: db.bookings.length,
      roomClosures: db.roomClosures.length,
      roomClosureEvents: db.roomClosureEvents.length,
      contacts: db.contacts.length,
      newsletter: db.newsletter.length,
      analytics: db.analytics.length,
      filteredBookings: filteredBookings.length,
    },
    recent: {
      bookings: filteredBookings.slice(0, 100),
      roomClosures: db.roomClosures.slice(0, 100),
      roomClosureEvents: db.roomClosureEvents.slice(0, 200),
      contacts: db.contacts.slice(0, 20),
      newsletter: db.newsletter.slice(0, 20),
      analytics: db.analytics.slice(0, 30),
    },
  };
}

async function getRoomClosures() {
  const db = await getDbSnapshot();
  return getNormalizedRoomClosures(db.roomClosures).sort((a, b) =>
    compareDateStringsDesc(a.createdAt, b.createdAt)
  );
}

function addRoomClosure(closure) {
  return appendRecord("roomClosures", closure);
}

function deleteRoomClosure(id) {
  if (usePostgres) {
    writeQueue = writeQueue.then(() => deletePostgresRecord("roomClosures", id));
    return writeQueue;
  }
  writeQueue = writeQueue.then(async () => {
    const db = await readJsonDb();
    const current = getNormalizedRoomClosures(db.roomClosures);
    const before = current.length;
    db.roomClosures = current.filter((item) => item.id !== id);
    if (db.roomClosures.length === before) return null;
    await writeJsonDb(db);
    return id;
  });
  return writeQueue;
}

function updateBookingStatus(id, status) {
  return updateBooking(id, (current) => ({
    ...current,
    status,
  }));
}

function updateBooking(id, updater) {
  if (usePostgres) {
    writeQueue = writeQueue.then(() => updatePostgresRecord("bookings", id, updater));
    return writeQueue;
  }
  writeQueue = writeQueue.then(async () => {
    const db = await readJsonDb();
    const index = db.bookings.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const current = db.bookings[index];
    const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
    db.bookings[index] = {
      ...next,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonDb(db);
    return db.bookings[index];
  });
  return writeQueue;
}

async function getBookingById(id) {
  if (usePostgres) {
    return getPostgresRecordById("bookings", id);
  }
  const db = await readJsonDb();
  return db.bookings.find((item) => item.id === id) || null;
}

async function getBookingsForExport(filters = {}) {
  const data = await getDashboardDataFiltered(filters);
  return data.recent.bookings;
}

async function findNewsletterRegistrationByCancelToken(token) {
  if (!token) return null;
  const db = await getDbSnapshot();
  return (db.newsletter || []).find((item) => item.cancelToken === token) || null;
}

function cancelNewsletterRegistration(token) {
  if (!token) return Promise.resolve(null);
  writeQueue = writeQueue.then(async () => {
    const existing = await findNewsletterRegistrationByCancelToken(token);
    if (!existing) return null;
    const nextStatus = existing.status === "cancelled" ? existing : {
      ...existing,
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    };

    if (usePostgres) {
      return updatePostgresRecord("newsletter", existing.id, nextStatus);
    }

    const db = await readJsonDb();
    const index = db.newsletter.findIndex((item) => item.id === existing.id);
    if (index === -1) return null;
    db.newsletter[index] = {
      ...nextStatus,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonDb(db);
    return db.newsletter[index];
  });
  return writeQueue;
}

module.exports = {
  appendRecord,
  cancelNewsletterRegistration,
  createToken,
  findNewsletterRegistrationByCancelToken,
  getDbSnapshot,
  getDashboardData,
  getDashboardDataFiltered,
  updateBookingStatus,
  updateBooking,
  getBookingById,
  getBookingsForExport,
  getRoomClosures,
  addRoomClosure,
  deleteRoomClosure,
};
