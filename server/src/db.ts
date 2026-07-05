import { createClient } from '@libsql/client';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../db.sqlite');

// @libsql/client with file:// scheme uses libsql (SQLite-compatible)
// Works on Windows, macOS, and Linux with no native compilation
export const db = createClient({
  url: `file:${DB_PATH}`,
});

/** Run schema migrations — call this once at startup. */
export async function initDb(): Promise<void> {
  await db.executeMultiple(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS users (
      id         TEXT    PRIMARY KEY,
      email      TEXT    UNIQUE NOT NULL,
      name       TEXT,
      avatar_url TEXT,
      status     TEXT    NOT NULL DEFAULT 'pending',
      is_admin   INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS user_data (
      user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      timetable   TEXT NOT NULL DEFAULT '[]',
      day_records TEXT NOT NULL DEFAULT '{}',
      preferences TEXT NOT NULL DEFAULT '{}',
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
  console.log(`[db] SQLite ready → ${DB_PATH}`);
}
