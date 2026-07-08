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
      preferences TEXT NOT NULL DEFAULT '{}',
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS day_records (
      user_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date                  TEXT NOT NULL,
      tasks                 TEXT NOT NULL DEFAULT '[]',
      notes                 TEXT NOT NULL DEFAULT '',
      wins                  TEXT NOT NULL DEFAULT '',
      improvements          TEXT NOT NULL DEFAULT '',
      completion_percentage INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date)
    );
  `);

  // Migration from old schema if needed
  try {
    const tableInfo = await db.execute("PRAGMA table_info(user_data)");
    const hasOldDayRecordsColumn = tableInfo.rows.some(row => row.name === 'day_records');

    if (hasOldDayRecordsColumn) {
      console.log('[migration] Found legacy day_records column in user_data. Migrating...');
      const oldRows = await db.execute("SELECT user_id, day_records FROM user_data");
      
      for (const row of oldRows.rows) {
        const userId = row.user_id as string;
        const dayRecordsStr = row.day_records as string;
        if (!dayRecordsStr) continue;

        try {
          const dayRecordsObj = JSON.parse(dayRecordsStr);
          for (const [date, record] of Object.entries(dayRecordsObj)) {
            const rec = record as any;
            await db.execute({
              sql: `INSERT OR REPLACE INTO day_records (
                      user_id, date, tasks, notes, wins, improvements, completion_percentage
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              args: [
                userId,
                date,
                JSON.stringify(rec.tasks ?? []),
                rec.notes ?? '',
                rec.wins ?? '',
                rec.improvements ?? '',
                rec.completionPercentage ?? 0,
              ],
            });
          }
        } catch (parseErr) {
          console.error(`[migration] Failed to parse day_records for user ${userId}:`, parseErr);
        }
      }

      // Drop old column after successful migration
      await db.execute("ALTER TABLE user_data DROP COLUMN day_records");
      console.log('[migration] Migration completed successfully. Legacy column day_records dropped.');
    }
  } catch (migErr) {
    console.error('[migration] Migration failed:', migErr);
  }

  console.log(`[db] SQLite ready → ${DB_PATH}`);
}
