const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../study_room.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency read/write
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT', -- 'STUDENT' | 'ADMIN'
    student_id TEXT,
    department TEXT,
    phone TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    floor INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE' | 'MAINTENANCE'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL, -- e.g. "07:30"
    end_time TEXT NOT NULL,   -- e.g. "09:30"
    slot_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    booking_date TEXT NOT NULL, -- "YYYY-MM-DD"
    slot_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED' | 'CANCELLED'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cancelled_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(room_id) REFERENCES rooms(id),
    FOREIGN KEY(slot_id) REFERENCES slots(id)
  );

  -- Index & Unique constraint to guarantee NO OVERLAPPING BOOKING at DB level
  CREATE UNIQUE INDEX IF NOT EXISTS idx_active_room_booking 
  ON bookings (room_id, booking_date, slot_id) 
  WHERE status = 'CONFIRMED';

  CREATE INDEX IF NOT EXISTS idx_booking_user ON bookings(user_id);
  CREATE INDEX IF NOT EXISTS idx_booking_date_slot ON bookings(booking_date, slot_id);
`);

module.exports = db;
